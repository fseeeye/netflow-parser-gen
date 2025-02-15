import endent from "endent"
import { Struct } from "../types/struct"
import { removeDuplicateByKey } from "../utils"

export class StructParserGenerator {

    constructor(
        readonly structVariant: Struct,
    ) { }

    protected generateResultSection(): string {
        const struct = this.structVariant
        const code = endent`
        Ok((
            input,
            ${struct.name} {
                ${struct.fields.map((field) => field.name)
                    .filter((filedName) => filedName !== '' && !filedName.startsWith('_'))
                    .join(',\n')
                }
            }
        ))
        `
        return code
    }

    generateParserBlock(): string {
        const fieldParsers = this.structVariant.fields
            .map((field) => {
                return field.generateParseStatement()
            })
            .filter((field) => field !== ``)

        const resultSection = this.generateResultSection()

        return endent`
            ${fieldParsers.join('\n')}
            ${resultSection}
        `
    }

    generateFieldFunction(): string[] {
        const fieldFuction: (string)[] = []
        this.structVariant.fields.map((field) => {
            if (field.generateFunction !== undefined) {
                fieldFuction.push(field.generateFunction())
            }
        })

        return fieldFuction
    }

    static generateParserName(struct: Struct): string {
        return struct.parserFunctionName()
    }

    // generateParserName() {
    //     return this.struct.parserFunctionName()
    // }

    protected generateFunctionSignature(): string {
        const funcName = this.structVariant.parserFunctionName()
        if (this.structVariant.isWithoutInputs()) {
            return `fn ${funcName}(input: &[u8]) -> IResult<&[u8], ${this.structVariant.name}>`
        } else {
            let refFlag = false
            const extraParamClean = this.structVariant.extraInputs.map(
                (field) => {
                    const splitedFiledName = field.name.split('.')
                    const fixedFiledName = splitedFiledName[splitedFiledName.length - 1]

                    if (field.isRef() === false) {
                        return `${fixedFiledName}: ${field.typeName(true)}`
                    } else {
                        refFlag = true
                        return `${fixedFiledName}: &${field.typeName(true)}`
                    }
                }
            ).join(', ')

            const lifetimeSpecifier = refFlag ? `<'a>` : ''
            const lifetimeRefSpecifier = refFlag ? `'a ` : ''
            const returnType = (refFlag && this.structVariant.isRef()) ? `${this.structVariant.name}${lifetimeSpecifier}` : this.structVariant.name

            return `fn ${funcName}${lifetimeSpecifier}(input: &${lifetimeRefSpecifier}[u8], ${extraParamClean}) -> IResult<&${lifetimeRefSpecifier}[u8], ${returnType}>`
        }
    }

    protected generateDebugStatement(): string {
        return `debug!(target: "PARSER(${this.structVariant.parserFunctionName()})", "struct ${this.structVariant.name}");`
    }

    // 生成struct的parser函数内容
    generateParser(pub = true): string {
        const visibilitySpecifier = pub ? `pub ` : ``
        const functionSignature = `${visibilitySpecifier}${this.generateFunctionSignature()}`
        const debugStatement = this.generateDebugStatement()
        const parserBlock = this.generateParserBlock()

        const fieldFuction: (string)[] = this.generateFieldFunction()
        const structParser = endent`
        ${functionSignature} {
            ${debugStatement}
            ${parserBlock}
        }
        `

        if (fieldFuction.length !== 0) {
            return endent`
            ${fieldFuction.join("\n")}

            ${structParser}
            `
        } else {
            return structParser
        }
        
    }

    // 输出Header在Packet Trait中的代码内容(不包含函数签名)
    // 即`protected generateParserBlock()`的public方法
    generateHeaderParserContent(): string {
        return this.generateParserBlock()
    }

    // unused
    private generateUserDefinedFieldParsers() {
        // 由于存在多个字段使用同种field类型的情况，所以此处需要去重
        const userDefinedFields = removeDuplicateByKey(
            this.structVariant.fields.filter((field) => field.isUserDefined()),
            (field) => field.constructor.name
        )
        const userDefinedFieldParsers = userDefinedFields.map((field) => {
            if (field.parserImplementation === undefined) {
                throw Error(`User defined field ${field.name} has no parser implementation!`)
            }
            return field.parserImplementation()
        })
        return userDefinedFieldParsers.join(`\n\n`)
    }

    // unused
    // 生成struct的parser函数内容(附带用户对field parser的实现)
    generateParserWithUserDefinedFields(): string {
        const udfParsers = this.generateUserDefinedFieldParsers()
        const structParser = this.generateParser()
        return [udfParsers, structParser].join(`\n\n`)
    }
}

// export class BitFieldStructParserGenerator {
//     constructor(
//         readonly struct: BitFieldStruct,
//     ) {
//     }

//     protected generateResultSection() {
//         const struct = this.struct
//         const code = endent`
//         Ok((
//             input,
//             ${struct.name} {
//                 ${struct.fields.map((field) => field.name).join(',\n')}
//             }
//         ))
//         `
//         return code
//     }

//     protected generateParserBlock() {
//         const fieldParsers = this.struct.fields.map((field) => {
//             return field.generateParseStatement()
//         })

//         const resultSection = this.generateResultSection()

//         return endent`{
//             ${fieldParsers.join('\n')}
//             ${resultSection}
//         }`
//     }

//     private bitsFunctionName() {
//         return `parse_bits_${this.struct.snakeCaseName()}`
//     }

//     private generateBitsFunctionSignature() {
//         const name = this.bitsFunctionName()
//         return `fn ${name}(input: (&[u8], usize)) -> IResult<(&[u8], usize),  ${this.struct.name}>`
//     }

//     private generateBitsFunction() {
//         const functionSignature = this.generateBitsFunctionSignature()
//         const parserBlock = this.generateParserBlock()

//         return endent`
//         ${functionSignature} ${parserBlock}
//         `
//     }

//     protected generateFunctionSignature() {
//         const name = this.struct.parserFunctionName()
//         return `fn ${name}(input: &[u8]) -> IResult<&[u8], ${this.struct.name}>`
//     }

//     private generateWrapperFunction() {
//         const signature = this.generateFunctionSignature()
//         const body = endent`{
//             bits(${this.bitsFunctionName()})(input)
//         }
//         `
//         return `${signature} ${body}`
//     }

//     generateParser() {
//         const bitsFunction = this.generateBitsFunction()
//         const wrapperFunction = this.generateWrapperFunction()
//         return [bitsFunction, wrapperFunction].join(`\n\n`)
//     }

// }