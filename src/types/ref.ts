import { NomBytesFunction } from "../field/base"
import { FieldType } from "./base"


export class BytesReference implements FieldType {

    name() {
        return `&[u8]`
    }

    nameWithLifetime() {
        return `&'a [u8]`
    }

    isUserDefined() {
        return false
    }

    parserFunctionName() {
        return NomBytesFunction.take
    }
}
