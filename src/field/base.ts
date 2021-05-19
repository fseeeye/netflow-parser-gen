export enum NomNumberFunction {
    u8 = 'u8',
    be_u16 = 'be_u16',
    be_u32 = 'be_u32',
    be_u64 = 'be_u64',
}

export enum NomBytesFunction {
    take = 'take',
    tag = 'tag',
}

export enum NomMultiFunction {
    count = 'count',
}

export enum RustPrimitiveType {
    u8 = 'u8',
    u16 = 'u16',
    u32 = 'u32',
    bytesRef = `&[u8]`,
    bytesRefWithLifetime = `&'a [u8]`
}

export type UserDefinedTypeName = string

export interface Field {
    name: string
    isRef: boolean
    isUserDefined: boolean
    rustType(): RustPrimitiveType | UserDefinedTypeName
    parserInvocation: () => string
    definition?: () => string
    parserImplementation?: () => string
    generateParseStatement: () => string
    validateDependency?: (prevFields: Field[]) => boolean
}

export abstract class BaseField implements Field {
    isRef: boolean = false
    isUserDefined: boolean = false

    constructor(
        readonly name: string
    ) { }

    abstract rustType(): RustPrimitiveType | UserDefinedTypeName
    abstract parserInvocation(): string

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}