import { StructParserGenerator } from "./parser"
import { Struct } from "./struct"

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

export enum RustPrimitiveType {
    u8 = 'u8',
    u16 = 'u16',
    u32 = 'u32',
    bytesRef = `&[u8]`,
    bytesRefWithLifetime = `&'a [u8]`
}

type UserDefinedType = string

export interface Field {
    name: string
    isRef: boolean
    isUserDefined: boolean
    rustType(): RustPrimitiveType | UserDefinedType
    parserInvocation: () => string
    definition?: () => string
    parserImplementation?: () => string
    generateParseStatement: () => string
    validateDependency?: (prevFields: Field[]) => boolean
}

abstract class BaseField implements Field {
    isRef: boolean = false
    isUserDefined: boolean = false

    constructor(
        readonly name: string
    ) { }

    abstract rustType(): RustPrimitiveType | UserDefinedType
    abstract parserInvocation(): string

    generateParseStatement() {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}

export class NumericType {
    constructor(
        readonly rustType: RustPrimitiveType,
        readonly parseFunc: NomNumberFunction
    ) { }
}

export const PrimitiveNumericType = {
    u8: new NumericType(RustPrimitiveType.u8, NomNumberFunction.u8),
    be_u16: new NumericType(RustPrimitiveType.u16, NomNumberFunction.be_u16),
    be_u32: new NumericType(RustPrimitiveType.u32, NomNumberFunction.be_u32),
}


export class NumericField extends BaseField {
    constructor(
        readonly name: string,
        readonly numType: NumericType,
    ) {
        super(name)
    }

    parserInvocation() {
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
        return RustPrimitiveType.bytesRefWithLifetime
    }

    parserInvocation() {
        return `${NomBytesFunction.take}(${this.lengthVariable})`
    }

    validateDependency(prevFields: Field[]): boolean {
        const dependencyFields = prevFields.filter(field => field.name === this.lengthVariable)
        return dependencyFields.length !== 0
    }
}

export class StructField extends BaseField {
    isUserDefined: boolean = true

    constructor(
        readonly struct: Struct,
        readonly fieldName?: string,
    ) {
        super(fieldName || struct.snakeCaseName())
        this.isRef = this.struct.hasReference()
    }

    definition() {
        return this.struct.compileDefinition()
    }

    rustType() {
        if (this.isRef) {
            return `${this.struct.name} <'a>`
        }
        return this.struct.name
    }

    parserInvocation() {
        return StructParserGenerator.generateParserName(this.struct)
    }

    parserImplementation() {
        const gen = new StructParserGenerator(this.struct)
        return gen.generateParser()
    }
}