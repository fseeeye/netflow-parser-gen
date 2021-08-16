import endent from "endent"
import { NomBitsFunction } from "../nom"
import { NumericType } from "../types/numeric"
import { Field, VisibilityType } from "./base"
import { NumericField } from "./numeric"

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