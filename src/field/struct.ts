import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { BaseField, Field } from "./base"


export class StructField extends BaseField {

    constructor(
        readonly struct: Struct,
        readonly fieldName?: string,
    ) {
        super(fieldName || struct.snakeCaseName())
    }

    isRef() {
        return this.struct.isRef()
    }

    isUserDefined() {
        return true
    }

    // definition() {
    //     return this.struct.definition()
    // }
    typeName() {
        if (this.isRef()) {
            return `${this.struct.name}<'a>`
        }
        return this.struct.name
    }

    parserInvocation() {
        return this.struct.parserFunctionName()
    }

    parserImplementation() {
        const gen = new StructParserGenerator(this.struct)
        return gen.generateParser()
    }

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }

   
}