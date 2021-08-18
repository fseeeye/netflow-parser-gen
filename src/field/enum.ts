import { StructEnumParserGenerator } from "../parser/enum"
import { StructEnum } from "../types/enum"
import { BaseField } from "./base"

export class EnumField extends BaseField {
    constructor(
        readonly structEnum: StructEnum,
        readonly fieldName?: string
    ) {
        super(fieldName || structEnum.snakeCaseName())
    }

    isRef(): boolean {
        return this.structEnum.isRef()
    }

    isUserDefined(): boolean {
        return true
    }

    typeName(): string {
        if (this.isRef()) {
            return `${this.structEnum.name}<'a>`
        }
        return this.structEnum.name
    }

    parserInvocation(): string {
        return this.structEnum.parserFunctionName()
    }

    // definition() {
    //     return this.structEnum.definition()
    // }

    parserImplementation(): string {
        const gen = new StructEnumParserGenerator(this.structEnum)
        return gen.generateParser()
    }

    generateParseStatement(): string {
        // const choiceFieldName = this.structEnum.choiceField.name
        // const passByRef = this.structEnum.choiceField.field.isUserDefined()
        // const choiceParameter = passByRef ? `&${choiceFieldName}` : choiceFieldName
        if (this.structEnum.choiceField.isWithoutInput()) {
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
        } else {
            const choiceParameter = this.structEnum.choiceField.asEnumParserInvocationArgument()
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input, ${choiceParameter})?;`
        }
    }
}