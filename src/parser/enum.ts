import endent from "endent"
import { ChoiceType, StructEnum, StructEnumVariant } from "../types/enum"
import { StructParserGenerator } from "./struct"

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
        const name = this.struct.parserFunctionName()
        return `fn ${name}(input: &[u8]) -> IResult<&[u8], ${this.enumName}>`
    }
}

function calculateNumberHexLength(value: number) {
    let curr = value
    let len = 0
    while (curr > 0) {
        curr = curr >> 1
        len++
    }
    return Math.ceil(len / 8) * 2
}

function generateChoiceLiteral(value: ChoiceType) {
    if (typeof value === 'number') {
        const hexLen = calculateNumberHexLength(value)
        const hex = value.toString(16).padStart(hexLen, '0')
        return `0x${hex}`
    }
    return value
}

export class StructEnumParserGenerator {
    constructor(
        readonly structEnum: StructEnum,
    ) { }

    functionSignature() {
        const structEnum = this.structEnum
        const choiceParameter = `${structEnum.choiceField.name}: ${structEnum.choiceField.typeName()}`
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
        const choiceArms = structEnum.variants.map((variant) => {
            const variantParserName = variant.parserFunctionName()
            const choiceLiteral = generateChoiceLiteral(variant.choice)
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

    generateParser() {
        // const nomImports = generateNomImport()
        const enumDef = this.structEnum.definition()
        const variantParsers = this.generateVariantParsers()
        const enumParser = this.generateEnumParser()
        return [enumDef, variantParsers, enumParser].join(`\n\n`)
    }

}
