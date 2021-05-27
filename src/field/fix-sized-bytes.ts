import { NomBytesFunction } from "../nom"
import { BaseField } from "./base"
import { BYTES_REF_TYPENAME } from "./ref"

export class FixSizedBytes extends BaseField {
    constructor(
        readonly name: string,
        readonly length: number
    ) {
        super(name)
    }

    isRef() {
        return true
    }

    isUserDefined() {
        return false
    }

    typeName() {
        return BYTES_REF_TYPENAME
    }

    parserInvocation() {
        return `${NomBytesFunction.take}(${this.length}usize)`
    }
}