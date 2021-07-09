import { NumericType } from "../types/numeric"
import { BaseField } from "./base"

export class NumericField extends BaseField {
    constructor(
        readonly name: string,
        readonly fieldType: NumericType
    ) {
        super(name)
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
        return this.fieldType.parserFunctionName()
    }
}
