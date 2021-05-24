import endent from "endent"
import { ChoiceType, StructEnum, AnonymousStructEnumVariant, EnumVariant } from "../types/enum"
import { removeDuplicateByKey } from "../utils"
import { StructParserGenerator } from "./struct"

export class StructEnumVariantParserGenerator extends StructParserGenerator {
    constructor(
        readonly struct: AnonymousStructEnumVariant,
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
        const choiceField = this.structEnum.choiceField.field
        const choiceParameter = `${choiceField.name}: ${choiceField.typeName()}`
        return `pub fn parse_${structEnum.snakeCaseName()}(input: &[u8], ${choiceParameter}) -> IResult<&[u8], ${structEnum.name}>`
    }

    protected generateErrorArm(errorKind: string = 'Verify') {
        return endent`
        _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::${errorKind}))),
        `
    }

    private generateMatchArm(variant: EnumVariant) {
        const choiceLiteral = generateChoiceLiteral(variant.choice)

        return endent`
        ${choiceLiteral} => ${variant.parserInvocation()},
        `
    }

    private generateMatchBlock() {
        const structEnum = this.structEnum
        // console.log(structEnum.variantMap)
        const choiceArms = structEnum.variants.map((variant) => {
            // const variantParserName = variant.parserInvocation()
            // const choiceLiteral = generateChoiceLiteral(variant.choice)
            // return endent`
            // ${choiceLiteral} => ${variantParserName}(input),
            // `
            return this.generateMatchArm(variant)
        })
        const parsedEnumVariable = structEnum.snakeCaseName()

        return endent`
        let (input, ${parsedEnumVariable}) = match ${structEnum.choiceField.generateMatchTarget()} {
            ${choiceArms.join('\n')}
            ${this.generateErrorArm()}
        }?;
        Ok((input, ${parsedEnumVariable}))
        `
    }

    generateVariantParserFunctions() {
        // 按照 variant 的名字生成解析函数。需要去重，因为一个 variant （例如 Eof）可以对应多个 choice。
        // const variantsWithOwnParsers = this.structEnum.variants.filter(v => v.inlineParsable === false)
        // const variantNamesWithOwnParsers = variantsWithOwnParsers.map(v => v.name)
        // const uniqueVariantNamesWithOwnParsers = variantsWithOwnParsers.filter(({ name }, index) => variantNamesWithOwnParsers.includes(name, index + 1) === false)
        const uniqueVariantNamesWithOwnParsers = removeDuplicateByKey(
            this.structEnum.variants.filter(v => v.inlineParsable === false),
            (v) => v.name
        )
        const parsers = uniqueVariantNamesWithOwnParsers.map((variant) => {
            if (variant.parserImplementation === undefined) {
                throw Error(`variant has no parser implementation!: ${variant.name}`)
            }
            return variant.parserImplementation(this.structEnum.name)
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
        // const enumDef = this.structEnum.definition()
        const variantParsers = this.generateVariantParserFunctions()
        const enumParser = this.generateEnumParser()
        return [variantParsers, enumParser].join(`\n\n`)
    }

}
