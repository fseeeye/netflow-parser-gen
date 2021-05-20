import { NumericType } from "../types/numeric"
import { BaseField } from "./base"

export class NumericField extends BaseField {
    constructor(
        readonly name: string,
        readonly fieldType: NumericType
    ) {
        super(name)
    }

    isRef() {
        return false
    }

    isUserDefined() {
        return false
    }

    typeName(): string {
        return this.fieldType.typeName()
    }

    parserInvocation() {
        return this.fieldType.parserFunctionName()
    }
}
