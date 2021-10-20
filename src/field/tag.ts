import { NomBytesFunction } from "../utils/nom"
import { BaseField } from "./base"
import { BYTES_REF_TYPENAME } from "./ref"

export class TagField extends BaseField {
    constructor(
        readonly name: string,
        readonly tag: string
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
        return `${NomBytesFunction.tag}::<_,_,nom::error::Error<&[u8]>>(${this.tag})`
    }
}