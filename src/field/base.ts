
export type VisibilityType = `pub` | `` | `pub(crate)`
export interface Field {
    name: string
    isRef(): boolean
    isUserDefined(): boolean
    definition(visibility: VisibilityType): string // 生成其在结构体中的定义代码行
    typeName(): string // <u8, u16, ...> 该feild的类型名称
    parserInvocation(): string // <u8, be_u16, ...> field被调用时所生成的内容
    parserImplementation?(): string // 该feild用户实现的解析函数
    generateParseStatement(): string // 生成parser中对该field的解析语句
    generateFunction?(): string
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