import endent from "endent"
import { PayloadEnum } from "../types/enum"
import { Field } from "./base"
import { EnumField } from "./enum"
import { NumericField } from "./numeric"
import { StructField, StructMemberField } from "./struct"

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
    getChoiceFieldName(): string
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
        return this.fixFiledName()
    }

	protected fixFiledName(): string {
		const splitedFieldName = this.field.name.split('.')
		const fixedFieldName = splitedFieldName[splitedFieldName.length - 1]
		return fixedFieldName
	}

    asMatchTarget(): string {
        const matchField = this.matchFieldExpr()
        if (this.matchTargetExprGenerator === undefined) {
            return matchField
        }
        return this.matchTargetExprGenerator(matchField)
    }

    asEnumParserFunctionParameterSignature(): string {
        return `${this.fixFiledName()}: ${this.field.typeName()}`
    }

    asEnumParserInvocationArgument(): string {
        return this.field.name
    }

    getChoiceFieldName(): string {
        return this.fixFiledName()
    }
}

export class StructChoice extends BasicEnumChoice {
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

	asMatchTarget(): string {
		const matchField = this.matchFieldExpr()
		if (this.matchTargetExprGenerator === undefined) {
			return matchField
		}
		return this.matchTargetExprGenerator(matchField)
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

	isWithoutInput(): boolean {
		return true
	}

	generateParseAheadStatement(): string {
		return `let (input, ${this.matchFieldExpr()}) = peek(${this.field.parserInvocation()})(input)?;`
	}

	generateParseAheadStatementWithPayloadErrorHandle(payloadEnum: PayloadEnum): string {
		return endent`let (input, ${this.field.name}) = match peek::<_,_,nom::error::Error<&[u8]>,_>(${this.field.parserInvocation()})(input) {
            Ok((input, ${this.field.name})) => (input, ${this.field.name}),
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

    getChoiceFieldName(): string {
        return ''
    }
}

export class NumericBitOperatorChoice extends BasicEnumChoice {
	constructor(
		readonly field: NumericField,
		readonly mod: string,
		readonly operand: string,
		readonly matchTargetExprGenerator?: (matchField: string) => string,
	) {
		super(field, matchTargetExprGenerator)
	}

	isInline(): boolean {
		return false
	}

	isWithoutInput(): boolean {
		return false
	}

	isFieldRef(): boolean {
		return this.field.isRef()
	}

	matchFieldTypeName(): string {
		return this.field.typeName()
	}

	protected matchFieldExprParameter(): string {
		return this.field.name
	}

	protected matchFieldExprArgument(): string {
		return this.field.name
	}

	protected matchFieldExpr(): string {
		return `${this.matchFieldExprParameter()}.bit${this.mod}(${this.operand})`
	}

	asMatchTarget(): string {
		const matchField = this.matchFieldExpr()
		if (this.matchTargetExprGenerator === undefined) {
			return matchField
		}
		return this.matchTargetExprGenerator(matchField)
	}

	asEnumParserFunctionParameterSignature(): string {
		return `${this.matchFieldExprParameter()}: ${this.matchFieldTypeName()}`
	}

	asEnumParserInvocationArgument(): string {
		return this.matchFieldExprArgument()
	}
}

export class StructBitOperatorChoice extends BasicEnumChoice {
	constructor(
		readonly field: StructMemberField,
		readonly mod: string,
		readonly operand: string,
		readonly matchTargetExprGenerator?: (matchField: string) => string,
	) {
		super(field, matchTargetExprGenerator)
	}

	isInline(): boolean {
		return false
	}

	isWithoutInput(): boolean {
		return false
	}

	isFieldRef(): boolean {
		return this.field.isRef()
	}

	matchFieldTypeName(): string {
		return this.field.matchFieldName.typeName()
	}

	protected matchFieldExprParameter(): string {
		return `${this.field.name}_${this.field.matchFieldName.name}`
	}

	protected matchFieldExprArgument(): string {
		return `${this.field.name}.${this.field.matchFieldName.name}`
	}

	protected matchFieldExpr(): string {
		return `${this.matchFieldExprParameter()}.bit${this.mod}(${this.operand})`
	}

	asMatchTarget(): string {
		const matchField = this.matchFieldExpr()
		if (this.matchTargetExprGenerator === undefined) {
			return matchField
		}
		return this.matchTargetExprGenerator(matchField)
	}

	asEnumParserFunctionParameterSignature(): string {
		return `${this.matchFieldExprParameter()}: ${this.matchFieldTypeName()}`
	}

	asEnumParserInvocationArgument(): string {
		return this.matchFieldExprArgument()
	}
}

// Now, only for IfStructEnum
export class EnumMultiChoice implements EnumChoice {
    constructor(
        readonly fields: Field[], // if enum variant需要用到的fields
    ) { }

    isInline(): boolean {
        return false
    }

    isWithoutInput(): boolean {
		if (this.fields === []) {
			return true
		}
        return false
    }

    isFieldRef(): boolean {
		let res = false

        this.fields.forEach((field) => {
			if (field.isRef() === true) {
				res = true
			}
		})
		this.fields.forEach((field) => {
			if ((field instanceof StructField) || (field instanceof EnumField)) {
				res = true
			}
		})

		return res
    }

    asMatchTarget(): string {
        throw Error(`This IfEnumChoice don't impl asMatchTarget()`)
    }

    asEnumParserFunctionParameterSignature(): string {
		return this.fields
		.map((field) => {
				const splitedFiledName = field.name.split('.')
				const fixedFiledName = splitedFiledName[splitedFiledName.length - 1]
				if ((field instanceof StructField) || (field instanceof EnumField)) {
					return `${fixedFiledName}: &${field.typeName()}`
				} else {
					return `${fixedFiledName}: ${field.typeName()}`
				}
			})
			.join(', ')
    }

    asEnumParserInvocationArgument(): string {
        return this.fields
			.map((field) => {
				if ((field instanceof StructField) || (field instanceof EnumField)) {
					return `&${field.name}`
				} else {
					return `${field.name}`
				}
			})
			.join(', ')
    }

    getChoiceFieldName(): string {
        throw Error(`This IfEnumChoice don't impl getChoiceFieldName()`)
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
