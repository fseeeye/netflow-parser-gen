
enum NomNumberFunction {
    u8 = 'u8',
    be_u16 = 'be_u16',
    be_u32 = 'be_u32',
    be_u64 = 'be_u64',
}

enum NomBytesFunction {
    take = 'take',
    tag = 'tag',
}

export enum RustType {
    u8 = 'u8',
    u16 = 'u16',
    u32 = 'u32',
    bytesRef = `&[u8]`,
    bytesRefWithLifetime = `&'a [u8]`
}

export interface Field {
    name: string
    isRef: boolean
    rustType: () => RustType
    compileParser: () => string
    generateParserCode: () => string
    validateDependency?: (prevFields: Field[]) => boolean
}

abstract class BaseField implements Field {
    isRef: boolean = false

    constructor(
        readonly name: string
    ) { }

    abstract rustType(): RustType
    abstract compileParser(): string

    generateParserCode() {
        return `let (input, ${this.name}) = ${this.compileParser()}(input)?;`
    }
}

export class NumericType {
    constructor(
        readonly rustType: RustType,
        readonly parseFunc: NomNumberFunction
    ) { }
}

export const PrimitiveNumericType = {
    u8: new NumericType(RustType.u8, NomNumberFunction.u8),
    be_u16: new NumericType(RustType.u16, NomNumberFunction.be_u16),
    be_u32: new NumericType(RustType.u32, NomNumberFunction.be_u32),
}


export class NumericField extends BaseField {
    constructor(
        readonly name: string,
        readonly numType: NumericType,
    ) {
        super(name)
    }

    compileParser() {
        return this.numType.parseFunc
    }

    rustType() {
        return this.numType.rustType
    }
}


export class BytesReferenceField extends BaseField {
    isRef: boolean = true

    constructor(
        readonly name: string,
        readonly lengthVariable: string
    ) {
        super(name)
    }

    rustType() {
        return RustType.bytesRefWithLifetime
    }

    compileParser() {
        return `${NomBytesFunction.take}(${this.lengthVariable})`
    }

    validateDependency(prevFields: Field[]): boolean {
        const dependencyFields = prevFields.filter(field => field.name === this.lengthVariable)
        return dependencyFields.length !== 0
    }
}

