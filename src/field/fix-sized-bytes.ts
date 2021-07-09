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

    isRef(): boolean {
        return true
    }

    isUserDefined(): boolean {
        return false
    }

    typeName(): string {
        return BYTES_REF_TYPENAME
    }

    parserInvocation(): string {
        return `${NomBytesFunction.take}(${this.length}usize)`
    }
}