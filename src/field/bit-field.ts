import endent from "endent"
import { NomBitsFunction } from "../utils/nom"
import { CountVariable, VisibilityType } from "../utils/variables"
import { NumericType } from "../types/numeric"
import { Field } from "./base"
import { NumericField } from "./numeric"

export class BitNumericField extends NumericField {
    constructor(
        readonly name: string,
        readonly fieldType: NumericType,
        readonly offset: number,
        readonly count: CountVariable,
    ) {
        super(name, fieldType)
    }

    isRef(): boolean {
        return false
    }

    isUserDefined(): boolean {
        return false
    }

    typeName(): string {
        return this.fieldType.typeName()
    }

    parserInvocation(): string {
        return `${NomBitsFunction.take}::<_, _, _, nom::error::Error<(&[u8], usize)>>(${this.count.count()})`
    }

    generateParseStatement(): string {
        return endent`
            let (input, ${this.name}) = match ${this.parserInvocation()}((input, ${this.offset} as usize)) {
                Ok(((input_remain, _offset), rst)) => (input_remain, rst),
                Err(_e) => return Err(nom::Err::Error(nom::error::Error::new(
                    input,
                    nom::error::ErrorKind::Fail
                )))
            };
        `
    }
}

export class BitsNumericField extends NumericField {
    constructor(
        readonly name: string,
        readonly length: number,
        readonly fieldType: NumericType,
    ) {
        super(name, fieldType)
        if (length > fieldType.bitLength) {
            throw Error(`${length} bits is longer than ${fieldType.typeName()}`)
        }
    }

    parserInvocation(): string {
        return `${NomBitsFunction.take}(${this.length}usize)`
    }

}

export class BitNumericFieldGroup implements Field {
    readonly name: string

    constructor(
        readonly fields: BitsNumericField[],
    ) {
        BitNumericFieldGroup.validateFields(fields)
        const fieldNames = this.fields.map(f => f.name).join(`, `)
        this.name = `${fieldNames}`
    }

    private static validateFields(fields: BitsNumericField[]) {
        const totalLength = fields.map(f => f.length).reduce((a, b) => a + b)
        if (totalLength % 8 !== 0) {
            throw Error(`group of bit fields should align to bytes!`)
        }
    }

    definition(visibility: VisibilityType): string {
        const fieldDefs = this.fields.map(f => f.definition(visibility))
        return fieldDefs.join(`\n`)
    }

    definitionRuleArg(): string {
        const fieldRuleArgDefs = this.fields.map(f => f.definitionRuleArg())
        return fieldRuleArgDefs.join(`\n`)
    }

    typeName(): string {
        throw Error(`group of bit fields has no type for itself!`)
    }

    parserInvocation(): string {
        return `bits::<_, _, nom::error::Error<(&[u8], usize)>, _, _>`
    }

    fieldParsers(): string{
        const parsers = this.fields.map(f => f.parserInvocation()).join(`, `)
        return `(${parsers})`
    }

    generateParseStatement(): string {
        const code = endent`
        let (input, (${this.name})) = ${this.parserInvocation()}(
            tuple(${this.fieldParsers()})
        )(input)?;`
        return code
    }

    isRef(): boolean { return false }
    isUserDefined(): boolean { return false }
}