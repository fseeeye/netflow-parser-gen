import { snakeCase } from "snake-case"
import { BaseField, isUserDefinedType, NomMultiFunction, UserDefinedType } from "./base"
import { NumericType } from "./numeric"
import { LengthVariableInBytes } from "./ref"

export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: LengthVariableInBytes,
        readonly elementType: NumericType | UserDefinedType,
    ) {
        super(name)
    }

    rustType() {
        if (isUserDefinedType(this.elementType)) {
            return `Vec<${this.elementType}>`
        }
        else {
            return `Vec<${this.elementType.rustType}>`
        }
    }

    elementParserFunc() {
        if (isUserDefinedType(this.elementType)) {
            return `parse_${snakeCase(this.elementType)}`
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