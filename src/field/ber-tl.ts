import { NumericType } from "../types/numeric"
import { BaseField } from "./base"

export class BerTLField extends BaseField {
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
		return 'BerTL'
	}

	parserInvocation(): string {
		return 'ber_tl'
	}
}
