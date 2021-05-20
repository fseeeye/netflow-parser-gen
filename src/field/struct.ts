import { Struct } from "../types/struct"
import { Field } from "./base"


export class StructField implements Field {
    readonly name: string

    constructor(
        readonly struct: Struct,
        readonly fieldName?: string,
    ) {
        this.name = this.fieldName || this.struct.snakeCaseName()
    }

    isRef() {
        return this.struct.isRef()
    }

    isUserDefined() {
        return true
    }

    definition() {
        return this.struct.definition()
    }

    typeName() {
        if (this.isRef()) {
            return `${this.struct.name} <'a>`
        }
        return this.struct.name
    }

    parserInvocation() {
        return this.struct.parserFunctionName()
    }

    parserImplementation() {
        return this.struct.parserFunctionDefinition()
    }

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}