import endent from "endent"
import { snakeCase } from "snake-case"
// import { strict } from "yargs"
import { StructEnum, AnonymousStructVariant, EnumVariant, PayloadEnum, PayloadEnumVariant, EmptyPayloadEnum, isEmptyPayloadEnum } from "../types/enum"
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
        // 如果 choice 是用户自定义类型，就接受引用作为参数
        // const choiceParameterType = choiceField.isUserDefined() ? `&${choiceField.typeName()}` : choiceField.typeName()
        // const choiceParameter = `${choiceField.name}: ${choiceParameterType}`
        const choiceParameter = structEnum.choiceField.asEnumParserFunctionParameterSignature()
        const lifetimeSpecifier = structEnum.choiceField.isFieldRef() ? `<'a>` : ``
        const lifetimeRefSpecifier = structEnum.choiceField.isFieldRef() ? `'a ` : ``

        // 如果 Enum 类型带有生命周期标记，在返回值中需要标记()
        const returnType = (structEnum.choiceField.isFieldRef() && structEnum.isRef()) ? `${structEnum.name}${lifetimeSpecifier}` : structEnum.name

        return `pub fn parse_${structEnum.snakeCaseName()}${lifetimeSpecifier}(input: &${lifetimeRefSpecifier}[u8], ${choiceParameter}) -> IResult<&${lifetimeRefSpecifier}[u8], ${returnType}>`
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

        return endent`
        let (input, ${parsedEnumVariable}) = match ${structEnum.choiceField.asMatchTarget()} {
            ${choiceArms.join('\n')}
            ${this.generateErrorArm()}
        }?;
        Ok((input, ${parsedEnumVariable}))
        `
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
    protected generateWildcardArm(payloadEnum: PayloadEnum | EmptyPayloadEnum): string {
        let armContent = `_ => Ok((input, ${payloadEnum.name}::Unknown(input))),`
        
        if (!isEmptyPayloadEnum(payloadEnum) && payloadEnum.extraPayloadEnum != undefined) {
            armContent = this.generateMainMatchBlock(payloadEnum.extraPayloadEnum)
        }

        return endent`
        ${armContent}
        `
    }

    // 输出除了`_`的所有match arm
    private generateMatchArm(variant: PayloadEnumVariant): string {
        const choiceLiteral = variant.generateChoiceLiteral()
        const upperName = variant.name
        const upperNameSnake = snakeCase(variant.name)
        const payloadName = this.payloadEnum.name

        return endent`
        ${choiceLiteral} => match ${variant.struct.name}::parse(input) {
            Ok((input, ${upperNameSnake})) => Ok((input, ${payloadName}::${upperName}(${upperNameSnake}))),
            Err(_) => Ok((input, ${payloadName}::Error(${payloadName}Error::${upperName}(input)))),
        },
        `
    }

    protected generateMainMatchBlock(payloadEnum: PayloadEnum): string {
        const choiceArms = payloadEnum.variants.map((variant) => {
            return this.generateMatchArm(variant)
        })

        return endent`_ => match ${payloadEnum.choiceField.asMatchTarget()} {
            ${choiceArms.join('\n')}
            ${this.generateWildcardArm(payloadEnum)}
        },`
    }

    // 生成match部分的内容
    // 如果是EmptyPayloadEnum，wildcard arm直接输出Unknow
    protected generateMatchBlock(): string {
        return endent`
        match input.len() {
            0 => match EofPacket::parse(input) {
                Ok((input, eof)) => Ok((input, ${this.payloadEnum.name}::Eof(eof))),
                Err(_) => Ok((input, ${this.payloadEnum.name}::Error(${this.payloadEnum.name}Error::Eof(input)))),
            },
            ${isEmptyPayloadEnum(this.payloadEnum)? this.generateWildcardArm(this.payloadEnum) : this.generateMainMatchBlock(this.payloadEnum)}
        }
        `
    }

    private functionBody(): string {
        const matchBlock = this.generateMatchBlock()
        if (!isEmptyPayloadEnum(this.payloadEnum)) {
            const choice = this.payloadEnum.choiceField
            const parseAheadStatement = (choice.isInline() && choice.generateParseAheadStatementWithPayloadErrorHandle !== undefined) ? choice.generateParseAheadStatementWithPayloadErrorHandle(this.payloadEnum) : ``
            const statements = parseAheadStatement !== `` ? [parseAheadStatement, matchBlock] : [matchBlock]
            return statements.join(`\n`)
        } else {
            return matchBlock
        }
    }

    // 生成PayloadEnum parser函数体
    // 即`private functionBody()`的public方法
    // Tips: 修改了`parseAheadStatement`表达式所在语句
    generateParserBody(): string {
        return endent`{
            ${this.functionBody()}
        }`
    }

    // !unecessary
    generateParser(): string {
        return `!unimpl`
    }
}

// export class StructEnumWithInlineChoiceParserGenerator extends StructEnumParserGenerator {
//     functionSignature() {
//         const structEnum = this.structEnum
//         return `pub fn parse_${structEnum.snakeCaseName()}(input: &[u8]) -> IResult<&[u8], ${structEnum.name}>`
//     }

//     private generatePeekChoice() {
//         const choicField = this.structEnum.choiceField
//         return `let (input, ${choicField.asMatchTarget()}) = peek(${choicField.field.parserInvocation()})(input)?;`
//     }

//     generateEnumParser() {
//         const signature = this.functionSignature()
//         const parserBlock = endent`{
//             ${this.generatePeekChoice()}
//             ${this.generateMatchBlock()}
//         }`
//         return endent`
//         ${signature} ${parserBlock}
//         `
//     }
// }