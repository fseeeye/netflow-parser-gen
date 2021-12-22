import { Field } from "./base"
import endent from "endent"
import { VisibilityType } from "../utils/variables"
import { StructField } from "./struct"

export class BlankStructField extends StructField {
    constructor(
		readonly innerStructField: StructField,
    ) { 
		super(innerStructField.struct)
	}
	readonly name: string = '_'.concat(this.innerStructField.name)

    isRef(): boolean {
		return this.innerStructField.isRef()
	}
    
	isUserDefined(): boolean {
		return this.innerStructField.isUserDefined()
	}

    typeName(): string {
		return this.innerStructField.typeName()
	}
    
	parserInvocation(): string {
		return this.innerStructField.parserInvocation()
	}

    definition(): string {
        return ``
    }

    generateParseStatement(): string {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}

export abstract class NestedField implements Field {
    constructor(
        readonly innerField: Field,
    ) { }
    readonly name: string = this.innerField.name

    abstract generateParseStatement(): string

    isRef(): boolean {
        return this.innerField.isRef()
    }

    isUserDefined(): boolean {
        return this.innerField.isUserDefined()
    }

    typeName(withLifetime = true): string {
        return this.innerField.typeName(withLifetime)
    }

    parserInvocation(): string {
        return this.innerField.parserInvocation()
    }

    parserInvocationParam(): string {
        return this.innerField.parserInvocationParam()
    }

    definition(visibility: VisibilityType): string {
        return this.innerField.definition(visibility)
    }
}

export class SkipField extends NestedField {
    constructor(
        readonly innerField: Field,
    ) { 
        super(innerField)
    }
    readonly name = ''

    definition(): string {
        return ``
    }

    isRef(): boolean{
        return false
    }

    generateParseStatement(): string {
        return `let (input, _) = ${this.parserInvocation()}(${this.parserInvocationParam()})?;`
    }
}

export class AssertField extends NestedField {
    constructor(
        readonly assertTargetField: Field,
        readonly assertTargetAny: string,
        readonly operator = '==',
    ) { 
        super(assertTargetField)
    }

    generateParseStatement(): string {
        return endent`
            ${this.innerField.generateParseStatement()}
            if !(${this.assertTargetField.name} ${this.operator} ${this.assertTargetAny}) {
                return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
            }
        `
    }
}

// 该field仅生成解析代码行，不生成进父结构体的定义和函数返回值中
export class CodeGenField extends NestedField {
    constructor(
        readonly innerField: Field,
    ) {
        super(innerField)
    }
    readonly name = ''

    typeName(): string {
		return ``
	}

    definition(): string {
        return ``
    }

    generateParseStatement(): string {
        return this.innerField.generateParseStatement()
    }
}

// 该field仅生成结构体的参数，不生成结构体解析代码行
export class CodeVarField extends NestedField {
    constructor(
        readonly inner_field: Field,
    ) {
        super(inner_field)
    }

    parserInvocation(): string {
        return ``
    }

    generateParseStatement(): string {
        return ``
    }
}

export class CodeField implements Field {
    constructor(
        readonly code: string,
    ) { }
    readonly name: string = ''

    isRef(): boolean {
        return false
    }

    isUserDefined(): boolean {
        return false
    }

    typeName(): string {
        return ``
    }

    parserInvocation(): string {
        return ``
    }

    parserInvocationParam(): string {
        return ``
    }

    definition(): string {
        return ``
    }

    generateParseStatement(): string {
        return this.code
    }
}

export class CRC16Field extends CodeField {
    constructor(
        readonly checksumName: string,
        readonly checkBufferName: string,
        readonly seed = 0
    ) {
        super(``)
    }

    parserInvocation(): string {
        return 'crc16_0x3d65_check'
    }

    parserInvocationParam(): string {
        return `${this.checksumName}, ${this.checkBufferName}, ${this.seed}`
    }

    generateParseStatement(): string {
        return endent`
            match crc16_0x3d65_check(${this.checksumName}, ${this.checkBufferName}, ${this.seed}) {
                true => {},
                false => {
                    return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
                }
            };
        `
    }
}