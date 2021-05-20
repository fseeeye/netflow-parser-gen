import { FieldType } from "./base"
import { NomBytesFunction } from "./nom"


export const BytesReference: FieldType = {

    typeName() {
        return `&'a [u8]`
    },

    // nameWithLifetime() {
    //     return `&'a [u8]`
    // },

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
