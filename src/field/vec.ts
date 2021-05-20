import { FieldType } from "../types/base"
import { NomMultiFunction } from "../nom"
import { Field } from "./base"
import { CountVariable } from "../len"


export class VecField implements Field {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType
    ) { }

    typeName() {
        return `Vec<${this.elementType.typeName()}>`
    }

    isRef() {
        return this.elementType.isRef()
    }

    isUserDefined() {
        return false
    }

    parserInvocation() {
        const elementParserFunc = this.elementType.parserFunctionName()
        return `${NomMultiFunction.count}(${elementParserFunc}, ${this.lengthVariable.count()} as usize)`
    }

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}