import endent from "endent"
import { snakeCase } from "snake-case"
import { StructEnum, AnonymousStructVariant, EnumVariant, PayloadEnum, EmptyPayloadEnum, isEmptyPayloadEnum, PayloadEnumVariant } from "../types/enum"
import { removeDuplicateByKey } from "../utils"
import { StructParserGenerator } from "./struct"

export class StructEnumVariantParserGenerator extends StructParserGenerator {
    constructor(
        readonly struct: AnonymousStructVariant,
        readonly enumName: string,
    ) {
        super(struct)
    }

    protected generateResultSection(): string {
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

    protected generateFunctionSignature(): string {
        const name = this.struct.parserFunctionName()
        return `fn ${name}(input: &[u8]) -> IResult<&[u8], ${this.enumName}>`
    }
}

export class StructEnumParserGenerator {
    constructor(
        readonly structEnum: StructEnum,
    ) { }

    functionSignature(): string {
        const structEnum = this.structEnum
        const lifetimeSpecifier = structEnum.choiceField.isFieldRef() ? `<'a>` : ``
        const lifetimeRefSpecifier = structEnum.choiceField.isFieldRef() ? `'a ` : ``
        // 如果 Enum 类型带有生命周期标记，在返回值中需要标记()
        const returnType = (structEnum.choiceField.isFieldRef() && structEnum.isRef()) ? `${structEnum.name}${lifetimeSpecifier}` : structEnum.name

        if (this.structEnum.choiceField.isWithoutInput()) {
            return `pub fn parse_${structEnum.snakeCaseName()}${lifetimeSpecifier}(input: &${lifetimeRefSpecifier}[u8]) -> IResult<&${lifetimeRefSpecifier}[u8], ${returnType}>`
        } else {
            // 如果 choice 是用户自定义类型，就接受引用作为参数
            // const choiceParameterType = choiceField.isUserDefined() ? `&${choiceField.typeName()}` : choiceField.typeName()
            // const choiceParameter = `${choiceField.name}: ${choiceParameterType}`
            const choiceParameter = structEnum.choiceField.asEnumParserFunctionParameterSignature()

            return `pub fn parse_${structEnum.snakeCaseName()}${lifetimeSpecifier}(input: &${lifetimeRefSpecifier}[u8], ${choiceParameter}) -> IResult<&${lifetimeRefSpecifier}[u8], ${returnType}>`
        }
    }


    protected generateErrorArm(errorKind = 'Verify'): string {
        return endent`
        _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::${errorKind}))),
        `
    }

    private generateMatchArm(variant: EnumVariant) {
        const choiceLiteral = variant.generateChoiceLiteral()

        return endent`
        ${choiceLiteral} => ${variant.parserInvocation()},
        `
    }

    protected generateMatchBlock(): string {
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
        // 如果设置了default arm，那么将不会生成再生成error arm作为default arm
        if (structEnum.variants.filter((variant) => variant.generateChoiceLiteral() === '_').length === 0) {
            return endent`
            let (input, ${parsedEnumVariable}) = match ${structEnum.choiceField.asMatchTarget()} {
                ${choiceArms.join('\n')}
                ${this.generateErrorArm()}
            }?;
            Ok((input, ${parsedEnumVariable}))
            `
        } else {
            return endent`
            let (input, ${parsedEnumVariable}) = match ${structEnum.choiceField.asMatchTarget()} {
                ${choiceArms.join('\n')}
            }?;
            Ok((input, ${parsedEnumVariable}))
            `
        }
    }

    generateVariantParserFunctions(): string {
        // 按照 variant 的名字生成解析函数。需要去重，因为一个 variant （例如 Eof）可以对应多个 choice。
        // const variantsWithOwnParsers = this.structEnum.variants.filter(v => v.inlineParsable === false)
        // const variantNamesWithOwnParsers = variantsWithOwnParsers.map(v => v.name)
        // const uniqueVariantNamesWithOwnParsers = variantsWithOwnParsers.filter(({ name }, index) => variantNamesWithOwnParsers.includes(name, index + 1) === false)
        const uniqueVariantNamesWithOwnParsers = removeDuplicateByKey(
            this.structEnum.variants.filter(v => v.hasParserImplementation === true),
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

    private functionBody() {
        const choice = this.structEnum.choiceField
        const parseAheadStatement = (choice.isInline() && choice.generateParseAheadStatement !== undefined) ? choice.generateParseAheadStatement() : ``
        const matchBlock = this.generateMatchBlock()
        const statements = parseAheadStatement !== `` ? [parseAheadStatement, matchBlock] : [matchBlock]
        return statements.join(`\n`)
    }

    generateEnumParser(): string {
        const signature = this.functionSignature()
        const parserBlock = endent`{
            ${this.functionBody()}
        }`
        return endent`
        ${signature} ${parserBlock}
        `
    }

    generateParser(): string {
        // const nomImports = generateNomImport()
        // const enumDef = this.structEnum.definition()
        const variantParsers = this.generateVariantParserFunctions()
        const enumParser = this.generateEnumParser()
        return [variantParsers, enumParser].join(`\n\n`)
    }

}

export class PayloadEnumParserGenerator {
    constructor(
        readonly payloadEnum: (PayloadEnum|EmptyPayloadEnum),
    ) { }

    // 输出通配符`_`的match arm (`_ => xxx`)
    // 如果payloadEnum有定义额外的extraPayloadenum，wildcard arm内容就为extraPayloadEnum的match block
    private generateWildcardArm(payloadEnum: PayloadEnum): string {
        if (!isEmptyPayloadEnum(payloadEnum) && payloadEnum.extraPayloadEnum != undefined) {
            return endent`_ => ${this.generateMatchBlock(payloadEnum.extraPayloadEnum)}`
        } else {
            const layerStatement = `let ${snakeCase(payloadEnum.info.getLevelLayerName())} = ${this.payloadEnum.info.getLevelLayerName()}::${this.payloadEnum.info.name}(${this.payloadEnum.info.header.snakeCaseName()});`

            return endent`_ => {
                ${layerStatement}
                ${payloadEnum.info.returnLevelPacket()}
            }`
        }
    }

    // 输出除了`_`的所有match arm
    private generateMatchArm(variant: PayloadEnumVariant): string {
        const layerStatement = `let ${snakeCase(this.payloadEnum.info.getLevelLayerName())} = ${this.payloadEnum.info.getLevelLayerName()}::${this.payloadEnum.info.name}(${this.payloadEnum.info.header.snakeCaseName()});`

        const choiceLiteral = variant.generateChoiceLiteral()

        return endent`
        ${choiceLiteral} => {
            ${layerStatement}
            ${variant.parserInvocation()}${this.payloadEnum.info.getNextLayerArgs()}
        },
        `
    }

    private generateMatchBlock(payloadEnum: PayloadEnum): string {
        const choiceArms = payloadEnum.variants.map((variant) => {
            return this.generateMatchArm(variant)
        })

        return endent`match ${payloadEnum.choiceField.asMatchTarget()} {
            ${choiceArms.join('\n')}
            ${this.generateWildcardArm(payloadEnum)}
        }`
    }

    // 生成match部分的内容
    // 如果是EmptyPayloadEnum，wildcard arm直接输出Unknow
    private functionBody(): string {
        // const matchBlock = this.generateMatchBlock()
        // if (!isEmptyPayloadEnum(this.payloadEnum)) {
        //     const choice = this.payloadEnum.choiceField
        //     const parseAheadStatement = (choice.isInline() && choice.generateParseAheadStatementWithPayloadErrorHandle !== undefined) ? choice.generateParseAheadStatementWithPayloadErrorHandle(this.payloadEnum) : ``
        //     const statements = parseAheadStatement !== `` ? [parseAheadStatement, matchBlock] : [matchBlock]
        //     return statements.join(`\n`)
        // } else {
        //     return matchBlock
        // }
        const layerStatement = `let ${snakeCase(this.payloadEnum.info.getLevelLayerName())} = ${this.payloadEnum.info.getLevelLayerName()}::${this.payloadEnum.info.name}(${this.payloadEnum.info.header.snakeCaseName()});`

        if (!isEmptyPayloadEnum(this.payloadEnum)) {
            const body =  endent`if input.len() == 0 {
                ${layerStatement}
                return ${this.payloadEnum.info.getLevelEofStatement()};
            }
            ${this.generateMatchBlock(this.payloadEnum)}`

            return body
        } else {
            const bodyEmpty = endent`${layerStatement}
            return ${this.payloadEnum.info.getLevelEofStatement()};`
            return bodyEmpty
        }
    }

    // 生成PayloadEnum parser函数体
    // 当前应用于layer parser函数体中
    generateParserBody(): string {
        return this.functionBody()
    }

    // !unecessary
    generateParser(): string {
        throw Error(`PayloadEnumParserGenerator dont impl generateParser()`)
    }
}
