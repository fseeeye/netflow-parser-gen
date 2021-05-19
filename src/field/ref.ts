import { BaseField, Field, NomBytesFunction, RustPrimitiveType } from "./base"

export interface LengthVariable {
    name: string
    length: () => string
}

export class LengthVariableInBytes implements LengthVariable {
    constructor(
        readonly name: string,
        readonly scale: number = 1
    ) { }

    length() {
        if (this.scale === 1) {
            return this.name
        }
        else {
            return `${this.name} * ${this.scale}`
        }
    }
}


export class BytesRefField extends BaseField {
    isRef: boolean = true

    constructor(
        readonly name: string,
        readonly lengthVariable: LengthVariable
    ) {
        super(name)
    }

    rustType() {
        return RustPrimitiveType.bytesRefWithLifetime
    }

    parserInvocation() {
        return `${NomBytesFunction.take}(${this.lengthVariable.length()})`
    }

    validateDependency(prevFields: Field[]): boolean {
        const dependencyFields = prevFields.filter(field => field.name === this.lengthVariable.name)
        return dependencyFields.length !== 0
    }
}