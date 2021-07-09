import { PayloadEnumParserGenerator } from "../parser/enum"
import { EmptyPayloadEnum, isEmptyPayloadEnum, PayloadEnum } from "../types/enum"
import { BaseField } from "./base"

export class PayloadField extends BaseField {
    constructor(
        readonly payloadEnum: PayloadEnum | EmptyPayloadEnum,
        readonly fieldName?: string
    ) {
        super(fieldName || payloadEnum.snakeCaseName())
    }

    isRef(): boolean {
        return this.payloadEnum.isRef()
    }

    isUserDefined(): boolean {
        return true
    }

    typeName(): string {
        if (this.isRef()) {
            return `${this.payloadEnum.name}<'a>`
        }
        return this.payloadEnum.name
    }

    parserInvocation(): string {
        return this.payloadEnum.parserFunctionName()
    }

    // definition() {
    //     return this.payloadEnum.definition()
    // }

    // 与`PayloadEnum/EmptyPayloadEnum`的`parserFunctionBody()`实现一致
    parserImplementation(): string {
        const gen = new PayloadEnumParserGenerator(this.payloadEnum)
        return gen.generateParser()
    }

    // !unecessary: packet trait的parser实现是固定的
    generateParseStatement(): string {
        // const choiceFieldName = this.payloadEnum.choiceField.name
        // const passByRef = this.payloadEnum.choiceField.field.isUserDefined()
        // const choiceParameter = passByRef ? `&${choiceFieldName}` : choiceFieldName
        if (isEmptyPayloadEnum(this.payloadEnum)) {
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
        } else {
            const choiceParameter = this.payloadEnum.choiceField.asEnumParserInvocationArgument()
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input, ${choiceParameter})?;`
        }
    }
}