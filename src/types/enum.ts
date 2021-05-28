import endent from "endent"
import { snakeCase } from "snake-case"
import { generateAttributesCode, removeDuplicateByKey } from "../utils"
import { Struct } from "./struct"
import { Field } from "../field/base"
import { FieldType } from "./base"
import { StructEnumParserGenerator, StructEnumVariantParserGenerator } from "../parser/enum"

export type ChoiceType = string | number

export interface EnumVariant {
    name: string
    hasParserImplementation: boolean
    choice: ChoiceType
    definition(): string
    hasReference(): boolean
    parserInvocation(): string
    parserImplementation?: (enumName: string) => string
}

export class EmptyVariant implements EnumVariant {
    hasParserImplementation: boolean = true
    name: string = 'Eof'

    constructor(
        // readonly name: string,
        readonly choice: ChoiceType,
    ) { }

    definition() {
        return `${this.name} {}`
    }

    hasReference() {
        return false
    }

    parserFunctionName(): string {
        return `parse_${snakeCase(this.name)}`
    }

    parserInvocation(): string {
        return `${this.parserFunctionName()}(input)`
    }

    parserImplementation(enumName: string) {
        const typeName = `${enumName}::${this.name}`
        const functionSignature = endent`fn ${this.parserFunctionName()}(input: &[u8]) -> IResult<&[u8], ${enumName}>`
        const parserBlock = endent`{
             let (input, _) = eof(input)?;
             Ok((
                 input,
                 ${typeName} {}
             ))
        }
        `
        return `${functionSignature} ${parserBlock}`
    }
}

export class AnonymousStructVariant extends Struct implements EnumVariant {
    hasParserImplementation: boolean = true

    constructor(
        readonly choice: ChoiceType,
        readonly name: string,
        readonly fields: Field[],
    ) {
        super(name, fields)
    }

    protected visibilitySpecifier() {
        return ``
    }

    definition() {
        return `${this.name} ${this.generateFields()}`
    }

    parserInvocation(): string {
        return `${this.parserFunctionName()}(input)`
    }

    parserImplementation(enumName: string) {
        const gen = new StructEnumVariantParserGenerator(this, enumName)
        return gen.generateParser(false)
    }

}

export class NamedStructVariant implements EnumVariant {
    hasParserImplementation: boolean = false

    constructor(
        readonly enumName: string,
        readonly choice: ChoiceType,
        readonly name: string,
        readonly struct: Struct,
    ) { }

    hasReference() {
        return this.struct.isRef()
    }

    definition() {
        if (this.hasReference()) {
            return `${this.name}(${this.name}<'a>)`
        }
        return `${this.name}(${this.name})`
    }

    parserInvocation() {
        const typeName = `${this.enumName}::${this.struct.name}`
        const parsed = this.struct.snakeCaseName()
        const parserBlock = endent`{
            let (input, ${parsed}) = ${this.struct.parserFunctionName()}(input)?;
            Ok((input, ${typeName}(${parsed})))
        }`
        return parserBlock
    }
}

export class NamedEnumVariant implements EnumVariant {
    hasParserImplementation: boolean = false

    constructor(
        readonly enumName: string,
        readonly choice: ChoiceType,
        readonly name: string,
        readonly struct: StructEnum,
    ) { }

    hasReference() {
        return this.struct.isRef()
    }

    definition() {
        if (this.hasReference()) {
            return `${this.name}(${this.name}<'a>)`
        }
        return `${this.name}(${this.name})`
    }

    parserInvocation() {
        const typeName = `${this.enumName}::${this.struct.name}`
        const parsed = this.struct.snakeCaseName()
        const parserBlock = endent`{
            let (input, ${parsed}) = ${this.struct.parserFunctionName()}(input, ${this.struct.choiceField.name})?;
            Ok((input, ${typeName}(${parsed})))
        }`
        return parserBlock
    }

    // parserFunctionSignature() {
    //     const functionName = `parse_${snakeCase(this.enumName)}_${this.struct.snakeCaseName()}`
    //     const choiceField = this.struct.choiceField
    //     const parameterList = `input: &[u8], ${choiceField.name}: ${choiceField.field.typeName()}`
    //     const returnType = `IResult<&[u8], ${this.enumName}>`
    //     return `fn ${functionName}(${parameterList}) -> ${returnType}`
}

export class ChoiceField {
    constructor(
        readonly field: Field,
        readonly matchTargetGenerator?: (choiceFieldName: string) => string
    ) { }

    get name() {
        return this.field.name
    }

    generateMatchTarget() {
        if (this.matchTargetGenerator === undefined) {
            return this.field.name
        }
        return this.matchTargetGenerator(this.field.name)
    }

}

export class StructEnum implements FieldType {

    constructor(
        readonly name: string,
        readonly variants: EnumVariant[],
        readonly choiceField: ChoiceField,
    ) { }

    typeName() {
        return this.name
    }

    isUserDefined() {
        return true
    }

    parserFunctionName() {
        return `parse_${this.snakeCaseName()}`
    }

    parserFunctionDefinition() {
        const gen = new StructEnumParserGenerator(this)
        return gen.generateParser()
    }

    isRef() {
        return this.hasReference()
    }

    private generateVariants() {
        const uniqueVariants = removeDuplicateByKey(
            this.variants,
            (v) => v.name
        ).map(v => v.definition())
        return endent`{
            ${uniqueVariants.join(`,\n`)}
        }`
    }

    private hasReference() {
        return this.variants.filter((variant) => variant.hasReference()).length !== 0
    }

    private lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    definition() {
        const attributes = generateAttributesCode()
        const definition = `pub enum ${this.name}${this.lifetimeSpecifier()} ${this.generateVariants()}`
        return [attributes, definition].join(`\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}
