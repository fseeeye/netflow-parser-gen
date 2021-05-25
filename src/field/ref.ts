import { CountVariableImpl } from "../len"
import { NomBytesFunction } from "../nom"
import { BaseField } from "./base"

export const BYTES_REF_TYPENAME = `&'a [u8]`

export class BytesReferenceField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariableImpl
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
        return `${NomBytesFunction.take}(${this.lengthVariable.count()})`
    }
}