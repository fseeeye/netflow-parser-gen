import { CountVariable } from "../utils/variables"
import { NomBytesFunction } from "../utils/nom"
import { BaseField } from "./base"
export const BYTES_REF_TYPENAME = `&'a [u8]`

export class BytesReferenceField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable
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
        return `${NomBytesFunction.take}(${this.lengthVariable.count()})`
    }
}