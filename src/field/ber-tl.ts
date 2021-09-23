import { numeric } from "../api"
import { Struct } from "../types/struct"
import { VisibilityType } from "../utils/variables"
import { StructField } from "./struct"

export class BerTLField extends StructField {
	constructor(
		readonly name: string
	) {
		super(
			new Struct(
				name,
				[
					numeric('tag', 'u8'),
					numeric('length', 'be_u16'),
				]
			)
		)
	}

	isRef(): boolean {
		return false
	}

	isUserDefined(): boolean {
		return false
	}

	typeName(): string {
		return 'BerTL'
	}

	parserInvocation(): string {
		return 'ber_tl'
	}
}

export class BlankStructField extends StructField {
    constructor(
		readonly inner_field: StructField,
    ) { 
		super(inner_field.struct)
	}
	readonly name = '_'.concat(this.inner_field.name)

    isRef(): boolean {
		return this.inner_field.isRef()
	}
    
	isUserDefined(): boolean {
		return this.inner_field.isUserDefined()
	}

    typeName(): string {
		return this.inner_field.typeName()
	}
    
	parserInvocation(): string {
		return this.inner_field.parserInvocation()
	}

    definition(_visibility: VisibilityType): string {
        return ``
    }

    generateParseStatement(): string {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}