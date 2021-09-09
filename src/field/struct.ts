import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { BaseField, Field } from "./base"
import { snakeCase } from "snake-case"

export class StructField extends BaseField {

	constructor(
		readonly struct: Struct,
		readonly fieldName?: string,
	) {
		super(fieldName || struct.snakeCaseName())
	}

	isRef(): boolean {
		return this.struct.isRef()
	}

	isUserDefined(): boolean {
		return true
	}

	// definition() {
	//     return this.struct.definition()
	// }

	typeName(): string {
		if (this.isRef()) {
			return `${this.struct.name}<'a>`
		}
		return this.struct.name
	}

	parserInvocation(): string {
		return this.struct.parserFunctionName()
	}

	parserImplementation(): string {
		const gen = new StructParserGenerator(this.struct)
		return gen.generateParser()
	}

	generateParseStatement(): string {
		return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
	}

}

export class StructMemberField extends BaseField {
	constructor(
		readonly struct: StructField,
		readonly matchFieldName: Field,
		readonly fieldName?: string,
	) {
		super(fieldName || struct.struct.snakeCaseName())
	}

	isRef(): boolean {
		return this.struct.isRef()
	}

	isUserDefined(): boolean {
		return true
	}

	typeName(): string {
		if (this.isRef()) {
			return `${this.struct.name}<'a>`
		}
		return this.struct.name
	}

	parserInvocation(): string {
		return this.struct.struct.parserFunctionName()
	}

	generateParseStatement(): string {
		return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
	}

}