import { CountVariable } from "../utils/variables"
import { NomBytesFunction } from "../utils/nom"
import { BaseField } from "./base"
import endent from "endent"

export const BYTES_REF_TYPENAME = `&[u8]`
export const BYTES_REF_TYPENAME_LIFETIME = `&'a [u8]`
export const STR_REF_TYPENAME = `&str`
export const STR_REF_TYPENAME_LIFETIME = `&'a str`

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

    typeName(withLifetime: boolean): string {
        if (withLifetime) 
            return BYTES_REF_TYPENAME_LIFETIME
        else
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

    typeName(withLifetime: boolean): string {
        if (withLifetime) 
            return STR_REF_TYPENAME_LIFETIME
        else
            return STR_REF_TYPENAME
    }

    generateParseStatement(): string {
        return endent`
            let (input, _${this.name}) = ${this.parserInvocation()}(${this.parserInvocationParam()})?;
            let ${this.name} = match std::str::from_utf8(_${this.name}) {
                Ok(o) => o,
                Err(_) => return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
            };
        `
    }
}