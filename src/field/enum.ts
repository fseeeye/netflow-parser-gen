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

    isRef() {
        return this.structEnum.isRef()
    }

    isUserDefined() {
        return true
    }

    typeName() {
        if (this.isRef()) {
            return `${this.structEnum.name} <'a>`
        }
        return this.structEnum.name
    }

    parserInvocation() {
        return this.structEnum.parserFunctionName()
    }

    definition() {
        return this.structEnum.definition()
    }

    parserImplementation() {
        const gen = new StructEnumParserGenerator(this.structEnum)
        return gen.generateParser()
    }

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input, ${this.structEnum.choiceField.name})?;`
    }
}