
export interface FieldType {
    name(): string
    isUserDefined(): boolean
    parserFunctionName(): string
    parserFunctionDefinition?: () => string
}



export interface FieldRe {
    name(): string
    isRef(): boolean
    isUserDefined(): boolean
    typeName(): string
    parserInvocation: () => string
    parserImplementation?: () => string
    generateParseStatement: () => string
    // validateDependency?: (prevFields: FieldRe[]) => boolean
}

