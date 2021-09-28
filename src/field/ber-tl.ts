import { numeric } from "../api"
import { Struct } from "../types/struct"
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