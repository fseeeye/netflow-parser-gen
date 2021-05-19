import { NomBytesFunction } from "../field/base"
import { FieldType } from "./base"


export const BytesReference: FieldType & any = {

    typeName() {
        return `&'a [u8]`
    },

    nameWithLifetime() {
        return `&'a [u8]`
    },

    isUserDefined() {
        return false
    },

    parserFunctionName() {
        return NomBytesFunction.take
    },

    isRef() {
        return true
    },
}
