import { NomBytesFunction } from "../field/base"
import { LengthVariable } from "../field/ref"
import { NumericType } from "./numeric"
import { BytesReference } from "./ref"

export interface FieldType {
    typeName(): string
    isUserDefined(): boolean
    definition?: () => string
    parserFunctionName(): string
    parserFunctionDefinition?: () => string
    isRef(): boolean
}


export interface FieldProps {
    name: string
    isRef(): boolean
    isUserDefined(): boolean
    definition?: () => string
    typeName(): string
    parserInvocation: () => string
    parserImplementation?: () => string
    generateParseStatement: () => string
    // validateDependency?: (prevFields: FieldRe[]) => boolean
}


export abstract class BasicField implements FieldProps {
    constructor(
        readonly name: string,
        readonly fieldType: FieldType
    ) { }

    isRef() {
        return this.fieldType.isRef()
    }

    isUserDefined() {
        return this.fieldType.isUserDefined()
    }

    typeName() {
        return this.fieldType.typeName()
    }

    abstract parserInvocation(): string

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}

export class NumericField extends BasicField {
    constructor(
        readonly name: string,
        readonly fieldType: NumericType
    ) {
        super(name, fieldType)
    }

    parserInvocation() {
        return this.fieldType.parserFunctionName()
    }
}

export class BytesReferenceField extends BasicField {
    constructor(
        readonly name: string,
        readonly lengthVariable: LengthVariable
    ) {
        super(name, BytesReference)
    }

    parserInvocation() {
        return `${NomBytesFunction.take}(${this.lengthVariable.count()})`
    }

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}