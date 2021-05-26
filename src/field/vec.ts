import { FieldType } from "../types/base"
import { NomMultiFunction } from "../nom"
import { BaseField } from "./base"
import { CountVariable } from "../len"


export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType
    ) {
        super(name)
    }

    typeName() {
        if (this.elementType.isRef()) {
            return `Vec<${this.elementType.typeName()}<'a>>`
        }
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

}