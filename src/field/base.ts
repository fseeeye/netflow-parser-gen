
export type VisibilityType = `pub` | ``
export interface Field {
    name: string
    isRef(): boolean
    isUserDefined(): boolean
    hasFunction(): boolean
    definition: (visibility: VisibilityType) => string
    typeName(): string
    parserInvocation: () => string
    parserImplementation?: () => string
    generateFunction: () => string
    generateParseStatement: () => string

    //
    // validateDependency?: (prevFields: FieldRe[]) => boolean
}

export abstract class BaseField implements Field {
    constructor(
        readonly name: string
    ) { }

    abstract isRef(): boolean
    abstract isUserDefined(): boolean
    abstract typeName(): string
    abstract parserInvocation(): string
    // abstract definition?(): string
    hasFunction() {
        return false
    }

    generateFunction() {
        return ``
    }

    definition(visibility: VisibilityType) {
        return `${visibility} ${this.name}: ${this.typeName()},`
    }


    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}