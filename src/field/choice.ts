import endent from "endent"
import { PayloadEnum } from "../types/enum"
import { Field } from "./base"
import { StructField } from "./struct"

export interface EnumChoice {
    isInline(): boolean
    isWithoutInput(): boolean
    generateParseAheadStatement?: () => string
    generateParseAheadStatementWithPayloadErrorHandle?: (payloadEnum:PayloadEnum) => string,
    matchTargetExprGenerator?: (matchField: string) => string,
    asMatchTarget(): string
    asEnumParserFunctionParameterSignature(): string
    asEnumParserInvocationArgument(): string
    isFieldRef(): boolean
}

export class BasicEnumChoice implements EnumChoice {
    constructor(
        readonly field: Field,
        readonly matchTargetExprGenerator?: (matchField: string) => string,
    ) { }

    isInline(): boolean {
        return false
    }

    isWithoutInput(): boolean {
        return false
    }

    isFieldRef(): boolean {
        return this.field.isRef()
    }

    protected matchFieldExpr(): string {
        return this.field.name
    }

    asMatchTarget(): string {
        const matchField = this.matchFieldExpr()
        if (this.matchTargetExprGenerator === undefined) {
            return matchField
        }
        return this.matchTargetExprGenerator(matchField)
    }

    asEnumParserFunctionParameterSignature(): string {
        return `${this.field.name}: ${this.field.typeName()}`
    }

    asEnumParserInvocationArgument(): string {
        return this.matchFieldExpr()
    }
}

export class StructEnumChoice extends BasicEnumChoice {
    constructor(
        readonly structField: StructField,
        readonly matchFieldName: string,
        readonly matchTargetExprGenerator?: (matchField: string) => string,
    ) {
        super(structField, matchTargetExprGenerator)
        if (this.validateMatchField() === false) {
            throw Error(`'${matchFieldName}' is not a field of struct ${structField.name}!`)
        }
    }

    private validateMatchField() {
        const fieldNames = this.structField.struct.fields.map(f => f.name)
        return fieldNames.includes(this.matchFieldName)
    }

    protected matchFieldExpr(): string {
        return `${this.structField.name}.${this.matchFieldName}`
    }

    // 定义 enum parser 的参数类型签名与调用 enum parser 时提供的参数形式一一对应。

    asEnumParserFunctionParameterSignature(): string {
        return `${this.structField.name}: &${this.structField.typeName()}`
    }

    asEnumParserInvocationArgument(): string {
        return `&${this.structField.name}`
    }
}

export class PayloadEnumChoice extends BasicEnumChoice {
    constructor(
        readonly struct: StructField,
        readonly matchFieldName: string,
        readonly matchTargetExprGenerator?: (matchField: string) => string,
    ) {
        super(struct, matchTargetExprGenerator)
        // if (this.validateMatchField() === false) {
        //     throw Error(`'${matchFieldName}' is not a field of struct ${struct.name}!`)
        // }
    }

    // private validateMatchField() {
    //     const fieldNames = this.struct.struct.fields.map(f => f.name)
    //     return fieldNames.includes(this.matchFieldName)
    // }

    protected matchFieldExpr(): string {
        return `${this.struct.name}.${this.matchFieldName}`
    }

    // 定义enum parser的参数类型签名 与 调用enum parser时提供的参数形式一一对应。
    asEnumParserFunctionParameterSignature(): string {
        return `${this.struct.name}: &${this.struct.typeName()}`
    }

    asEnumParserInvocationArgument(): string {
        return `&${this.struct.name}`
    }
}

export class InlineChoice extends BasicEnumChoice {

    isInline(): boolean {
        return true
    }

    generateParseAheadStatement(): string {
        return `let (input, ${this.matchFieldExpr()}) = peek(${this.field.parserInvocation()})(input)?;`
    }

    generateParseAheadStatementWithPayloadErrorHandle(payloadEnum: PayloadEnum): string {
        return endent`let (input, ${this.field.name}) = match peek(${this.field.parserInvocation()})(input) {
            Ok((input, ${this.field.name})) => (input, ${this.field.name}),
            Err(nom::Err::Error((input, _))) => {
                return Ok((input, ${payloadEnum.name}::Error(${payloadEnum.name}Error::NomPeek(input))))
            }
            _ => return Ok((input, ${payloadEnum.name}::Error(${payloadEnum.name}Error::NomPeek(input)))),
        };`
    }
}

export class InputLengthChoice implements EnumChoice {
    isWithoutInput(): boolean {
        return true
    }

    isInline(): boolean {
        return false
    }

    isFieldRef(): boolean {
        return false
    }

    protected matchFieldExpr(): string {
        return 'input.len()'
    }

    asMatchTarget(): string {
        return this.matchFieldExpr()
    }

    asEnumParserFunctionParameterSignature(): string {
        throw Error(`InputLengthChoice dont need input :(`)
    }

    asEnumParserInvocationArgument(): string {
        throw Error(`InputLengthChoice dont need input :(`)
    }
}


// export class ChoiceField {
//     constructor(
//         readonly field: Field,
//         /**
//          * choice 作为 match 的 target，可能是一个表达式
//          */
//         readonly matchFieldExtractFunc?: (field?: Field) => Field,
//         readonly matchTargetExprGenerator?: (matchField: Field) => string,
//         // readonly enumParserInvocationArgGenerator?: (field: Field) => string,
//     ) { }

//     get name() {
//         return this.field.name
//     }

//     private matchField(): Field {
//         if (this.field.isUserDefined() === false || this.matchFieldExtractFunc === undefined) {
//             return this.field
//         }
//         return this.matchFieldExtractFunc(this.field)
//     }

//     /**
//      * 自身所属的 Enum parser 函数体中，match 表达式所匹配的 target
//      */
//     asMatchTarget(): string {
//         const matchField = this.matchField()
//         if (this.matchTargetExprGenerator === undefined) {
//             return matchField.name
//         }
//         return this.matchTargetExprGenerator(matchField)
//     }

//     private passByRef() {
//         return this.field.isUserDefined()
//     }

//     // private asArgument(name: string) {
//     //     return this.passByRef() ? `&{name}` : name
//     // }

//     /**
//      * 自身所属的 Enum 的 parser 函数定义时，函数签名中，关于自身的参数签名
//      */
//     asEnumParserFunctionParameterSignature(): string {
//         const choiceParameterType = this.passByRef() ? `&${this.field.typeName()}` : this.field.typeName()
//         const choiceParameter = `${this.field.name}: ${choiceParameterType}`
//         return choiceParameter
//     }

//     /**
//      * 自身所属的 Enum 的 parser 被调用时，传入的实际参数
//      */
//     asEnumParserInvocationArgument(): string {
//         return this.matchField().name
//         // if (this.enumParserInvocationArgGenerator !== undefined) {
//         //     const arg = this.enumParserInvocationArgGenerator(this.field)
//         //     return this.asArgument(arg)
//         // }
//         // return this.asArgument(this.field.name)
//     }

// }
