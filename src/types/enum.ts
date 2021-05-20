import endent from "endent"
import { snakeCase } from "snake-case"
import { generateAttributesCode } from "../utils"
import { Struct } from "./struct"
import { Field } from "../field/base"
import { FieldType } from "./base"
import { StructEnumVariantParserGenerator } from "../parser/enum"

export type ChoiceType = string | number

interface EnumVariant {
    name: string
    inlineParsable: boolean
    choice: ChoiceType
    definition(): string
    hasReference(): boolean
    parserInvocation(): string
    parserImplementation(enumName: string): string
}

export class StructEnumVariant extends Struct implements EnumVariant {
    inlineParsable: boolean = false

    constructor(
        readonly name: string,
        readonly fields: Field[],
        readonly choice: ChoiceType,
    ) {
        super(name, fields)
    }

    protected visibilitySpecifier() {
        return ``
    }

    definition() {
        return `${this.name} ${this.generateFields()}`
    }

    parserInvocation() {
        return this.parserFunctionName()
    }

    parserImplementation(enumName: string) {
        const gen = new StructEnumVariantParserGenerator(this, enumName)
        return gen.generateParser(false)
    }

}

export class StructEnum implements FieldType {

    constructor(
        readonly name: string,
        readonly variants: EnumVariant[],
        readonly choiceField: Field,
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

    isRef() {
        return this.hasReference()
    }

    private generateVariants() {
        const variants = this.variants.map((variant) => variant.definition())
        return endent`{
            ${variants.join(`,\n`)}
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
        const definition = `pub enum ${this.name} ${this.lifetimeSpecifier()} ${this.generateVariants()}`
        return [attributes, definition].join(`\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}
