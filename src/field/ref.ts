import { CountVariable } from "../utils/variables"
import { NomBytesFunction } from "../utils/nom"
import { BaseField } from "./base"
import endent from "endent"
export const BYTES_REF_TYPENAME = `&'a [u8]`
export const STR_REF_TYPENAME = `&'a str`

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

export class StrReferenceField extends BytesReferenceField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable
    ) {
        super(name, lengthVariable)
    }

    typeName(): string {
        return STR_REF_TYPENAME
    }

    generateParseStatement(): string {
        return endent`
            let (input, _${this.name}) = ${this.parserInvocation()}(input)?;
            let ${this.name} = match std::str::from_utf8(_${this.name}) {
                Ok(o) => o,
                Err(_) => return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
            };
        `
    }
}