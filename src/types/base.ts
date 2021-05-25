export interface FieldType {
    /**
     * field 的类型，对于引用类型不包括生命周期标志 <'a>
     */
    typeName(): string
    isUserDefined(): boolean
    definition?: () => string
    parserFunctionName(): string
    parserFunctionDefinition?: () => string
    isRef(): boolean
}