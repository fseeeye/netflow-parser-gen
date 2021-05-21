import { CountVariableImpl } from "../len"
import { NomBytesFunction } from "../nom"
import { BaseField } from "./base"

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
        return `&'a [u8]`
    }

    parserInvocation() {
        return `${NomBytesFunction.take}(${this.lengthVariable.count()})`
    }
}