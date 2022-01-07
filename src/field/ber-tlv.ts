import { numeric } from "../api"
import { Struct } from "../types/struct"
import { BaseField } from "./base"
import { BYTES_REF_TYPENAME, BYTES_REF_TYPENAME_LIFETIME } from "./ref"
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

export class BerVField extends BaseField {
	constructor(
        readonly name: string
    ) {
        super(name)
    }

    isRef(): boolean {
        return true
    }

    isUserDefined(): boolean {
        return false
    }

    typeName(withLifetime: boolean): string {
        if (withLifetime) 
            return BYTES_REF_TYPENAME_LIFETIME
        else
            return BYTES_REF_TYPENAME
    }

    parserInvocation(): string {
        return 'ber_tl_v'
    }
}