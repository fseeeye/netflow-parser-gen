import endent from "endent"
import { snakeCase } from "snake-case"
import { Field } from "./field"
import { generateNomImport, StructParserGenerator } from "./parser"
import { generateAttributesCode, Struct } from "./struct"


export class StructEnumVariant extends Struct {

    protected visibilitySpecifier() {
        return ``
    }

    compile() {
        return `${this.name} ${this.generateFields()}`
    }

}

export class StructEnum {

    constructor(
        readonly name: string,
        readonly variants: StructEnumVariant[],
        readonly choiceField: Field,
        readonly variantMap: Map<number | string, StructEnumVariant>,
    ) {
        this.validateVariants()
    }

    private validateVariants(): void {
        const variantNames = this.variants.map((variant) => variant.name)
        for (const [_, variant] of this.variantMap) {
            if (variantNames.includes(variant.name) === false) {
                throw Error(`variant ${variant.name} not found!`)
            }
        }
    }

    private generateVariants() {
        const variants = this.variants.map((variant) => variant.compile())
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
        return `pub enum ${this.name} ${this.lifetimeSpecifier()} ${this.generateVariants()}`
    }

    compile() {
        const attributes = generateAttributesCode()
        const definition = this.definition()
        return [attributes, definition].join(`\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}

export class StructEnumVariantParserGenerator extends StructParserGenerator {
    constructor(
        readonly struct: StructEnumVariant,
        readonly enumName: string,
    ) {
        super(struct)
    }

    protected generateResultSection() {
        const variantType = `${this.enumName}::${this.struct.name}`
        const code = endent`
        Ok((
            input,
            ${variantType} {
                ${this.struct.fields.map((field) => field.name).join(',\n')}
            }
        ))
        `
        return code
    }

    protected generateFunctionSignature() {
        const name = this.generateParserName()
        return `fn ${name}(input: &[u8]) -> IResult<&[u8], ${this.enumName}>`
    }
}

function generateChoiceLiteral(value: number | string) {
    if (typeof value === 'number') {
        return `0x${value.toString(16)}`
    }
    return value
}

export class StructEnumParserGenerator {
    constructor(
        readonly structEnum: StructEnum,
    ) { }

    functionSignature() {
        const structEnum = this.structEnum
        const choiceParameter = `${structEnum.choiceField.name}: ${structEnum.choiceField.rustType()}`
        return `pub fn parse_${structEnum.snakeCaseName()}(input: &[u8], ${choiceParameter}) -> IResult<&[u8], ${structEnum.name}>`
    }

    protected generateErrorArm(errorKind: string = 'Verify') {
        return endent`
        _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::${errorKind}))),
        `
    }

    private generateMatchBlock() {
        const structEnum = this.structEnum
        // console.log(structEnum.variantMap)
        const choiceArms = Array.from(structEnum.variantMap.entries()).map(([choice, variant]) => {
            const variantParserName = StructParserGenerator.generateParserName(variant)
            const choiceLiteral = generateChoiceLiteral(choice)
            return endent`
            ${choiceLiteral} => ${variantParserName}(input),
            `
        })
        const parsedEnumVariable = structEnum.snakeCaseName()

        return endent`
        let (input, ${parsedEnumVariable}) = match ${structEnum.choiceField.name} {
            ${choiceArms.join('\n')}
            ${this.generateErrorArm()}
        }?;
        Ok((input, ${parsedEnumVariable}))
        `
    }

    generateVariantParsers() {
        const parsers = this.structEnum.variants.map((variant) => {
            const gen = new StructEnumVariantParserGenerator(variant, this.structEnum.name)
            return gen.generateParser(false)
        })

        return parsers.join(`\n\n`)
    }

    generateEnumParser() {
        const signature = this.functionSignature()
        const parserBlock = endent`{
            ${this.generateMatchBlock()}
        }`
        return endent`
        ${signature} ${parserBlock}
        `
    }

    compile() {
        const nomImports = generateNomImport()
        const enumDef = this.structEnum.compile()
        const variantParsers = this.generateVariantParsers()
        const enumParser = this.generateEnumParser()
        return [nomImports, enumDef, variantParsers, enumParser].join(`\n\n`)
    }

}
