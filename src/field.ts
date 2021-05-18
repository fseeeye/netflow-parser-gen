import { snakeCase } from "snake-case"
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

enum NomMultiFunction {
    count = 'count',
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

interface LengthVariable {
    name: string
    length: () => string
}

export class LengthVariableInBytes implements LengthVariable {
    constructor(
        readonly name: string,
        readonly scale: number = 1
    ) { }

    length() {
        if (this.scale === 1) {
            return this.name
        }
        else {
            return `${this.name} * ${this.scale}`
        }
    }
}


export class BytesRefField extends BaseField {
    isRef: boolean = true

    constructor(
        readonly name: string,
        readonly lengthVariable: LengthVariableInBytes
    ) {
        super(name)
    }

    rustType() {
        return RustPrimitiveType.bytesRefWithLifetime
    }

    parserInvocation() {
        return `${NomBytesFunction.take}(${this.lengthVariable.length()})`
    }

    validateDependency(prevFields: Field[]): boolean {
        const dependencyFields = prevFields.filter(field => field.name === this.lengthVariable.name)
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

function isUserDefinedType(elementType: any): elementType is UserDefinedType {
    return elementType.parseFunc === undefined
}

export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: LengthVariableInBytes,
        readonly elementType: NumericType | UserDefinedType,
    ) {
        super(name)
    }

    rustType() {
        if (isUserDefinedType(this.elementType)) {
            return `Vec<${this.elementType}>`
        }
        else {
            return `Vec<${this.elementType.rustType}>`
        }
    }

    elementParserFunc() {
        if (isUserDefinedType(this.elementType)) {
            return `parse_${snakeCase(this.elementType)}`
        }
        else {
            return this.elementType.parseFunc
        }
    }

    parserInvocation() {
        const elementParserFunc = this.elementParserFunc()
        return `${NomMultiFunction.count}(${elementParserFunc}, ${this.lengthVariable.length()} as usize)`
    }

}