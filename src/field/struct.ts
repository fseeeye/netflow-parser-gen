import { StructParserGenerator } from "../parser"
import { Struct } from "../struct"
import { BaseField } from "./base"

export class StructField extends BaseField {
    isUserDefined: boolean = true

    constructor(
        readonly struct: Struct,
        readonly fieldName?: string,
    ) {
        super(fieldName || struct.snakeCaseName())
        this.isRef = this.struct.hasReference()
    }

    definition() {
        return this.struct.compileDefinition()
    }

    rustType() {
        if (this.isRef) {
            return `${this.struct.name} <'a>`
        }
        return this.struct.name
    }

    parserInvocation() {
        return StructParserGenerator.generateParserName(this.struct)
    }

    parserImplementation() {
        const gen = new StructParserGenerator(this.struct)
        return gen.generateParser()
    }
}