import { BaseField } from "./base"

export class InputLengthField extends BaseField {
	constructor(
		readonly name: string,
	) {
		super(name)
	}

	isRef(): boolean {
		return false
	}

	isUserDefined(): boolean {
		return false
	}

	typeName(): string {
		return 'usize'
	}

	parserInvocation(): string {
		return ''
	}
	generateParseStatement(): string {
		return `let ${this.name} = input.len();`
	}
}