
export type VisibilityType = `pub` | ``
export interface Field {
    name: string
    isRef(): boolean
    isUserDefined(): boolean
    definition: (visibility: VisibilityType) => string
    typeName(): string // <u8, u16, ...>
    parserInvocation: () => string // <u8, be_u16, ...>
    parserImplementation?: () => string
    generateParseStatement: () => string // 生成parser中对该field的解析语句
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

    definition(visibility: VisibilityType): string {
        return `${visibility} ${this.name}: ${this.typeName()},`
    }

    generateParseStatement(): string {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}