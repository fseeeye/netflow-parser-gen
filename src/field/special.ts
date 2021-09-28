import { StructField } from "./struct"
import { Field } from "./base"
import endent from "endent"
import { VisibilityType } from "../utils/variables"

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

abstract class NestedField implements Field {
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

    typeName(): string {
        return this.innerField.typeName()
    }

    parserInvocation(): string {
        return this.innerField.parserInvocation()
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

    generateParseStatement(): string {
        return `let (input, _) = ${this.parserInvocation()}(input)?;`
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

    definition(): string {
        return ``
    }

    generateParseStatement(): string {
        return this.code
    }
}