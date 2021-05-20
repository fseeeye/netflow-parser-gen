export interface FieldType {
    typeName(): string
    isUserDefined(): boolean
    definition?: () => string
    parserFunctionName(): string
    parserFunctionDefinition?: () => string
    isRef(): boolean
}