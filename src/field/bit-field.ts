import { NomBitsFunction } from "../nom"
import { NumericType } from "../types/numeric"
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

    parserInvocation() {
        return `${NomBitsFunction.take}(${this.length}usize)`
    }

}