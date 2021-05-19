import { Struct } from "../struct"
import { BaseField, NomMultiFunction } from "./base"
import { NumericType } from "./numeric"
import { LengthVariable } from "./ref"

function isUserDefinedType(elementType: any): elementType is Struct {
    return elementType.isUserDefinedType === true
}

export class CountVariable implements LengthVariable {
    constructor(
        readonly name: string,
        readonly unitSize: number,
    ) { }

    length() {
        return `(${this.name} as usize / ${this.unitSize} as usize)`
    }
}

export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: LengthVariable,
        readonly elementType: NumericType | Struct,
    ) {
        super(name)
    }

    rustType() {
        if (isUserDefinedType(this.elementType)) {
            return `Vec<${this.elementType.name}>`
        }
        else {
            return `Vec<${this.elementType.rustType}>`
        }
    }

    elementParserFunc() {
        if (isUserDefinedType(this.elementType)) {
            return `parse_${this.elementType.snakeCaseName()}`
        }
        else {
            return this.elementType.parseFunc
        }
    }

    parserInvocation() {
        const elementParserFunc = this.elementParserFunc()
        return `${NomMultiFunction.count}(${elementParserFunc}, ${this.lengthVariable.length()} as usize)`
    }

}