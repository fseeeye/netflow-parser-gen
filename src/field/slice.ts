import { SliceType } from "../types/slice"
import { BaseField } from "./base"

export class SliceField extends BaseField {
    constructor(
        readonly name: string,
        readonly fieldType: SliceType,
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