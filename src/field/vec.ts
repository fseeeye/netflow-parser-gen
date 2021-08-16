import { FieldType } from "../types/base"
import { NomMultiFunction } from "../nom"
import { BaseField } from "./base"
import { CountVariable } from "../len"
import { Struct } from "../types/struct"

export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType
    ) {
        super(name)
    }

    typeName(): string {
        if (this.elementType.isRef()) {
            return `Vec<${this.elementType.typeName()}<'a>>`
        }
        return `Vec<${this.elementType.typeName()}>`
    }

    isRef(): boolean {
        return this.elementType.isRef()
    }

    isUserDefined(): boolean {
        return false
    }

    parserInvocation(): string {
        const elementParserFunc = this.elementType.parserFunctionName()
        return `${NomMultiFunction.count}(${elementParserFunc}, ${this.lengthVariable.count()} as usize)`
    }
}

export class BitVecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType,
        readonly elementBitLong?: number
    ) {
        super(name)
    }

    typeName(): string {
        if (this.elementType.isRef()) {
            return `Vec<${this.elementType.typeName()}<'a>>`
        }
        return `Vec<${this.elementType.typeName()}>`
    }

    isRef(): boolean {
        return this.elementType.isRef()
    }

    isUserDefined(): boolean {
        return false
    }

    parserInvocation(): string {
        let elementBitLong = 1
        if (this.elementBitLong !== undefined) {
            elementBitLong = this.elementBitLong
        }
        const elementTypeName = this.elementType.typeName()
        // e.g. `bits::<_, _, Error<(&[u8], usize)>, Error<&[u8]>, _>(count::<_, u8, _, _>(take_bits(1usize), byte_count as usize * 8usize))(input)?`
        return `${NomMultiFunction.bits}::<_, _, Error<(&[u8], usize)>, Error<&[u8]>, _>(${NomMultiFunction.count}::<_, ${elementTypeName}, _, _>(take_bits(${elementBitLong}usize), ${this.lengthVariable.count()}))`
    }
}

export class LoopField extends BaseField {

	constructor(
		readonly struct: Struct,
		readonly resName: string,
	) {
		super(resName || struct.snakeCaseName())
	}

	isRef() {
		return this.struct.isRef()
	}

	isUserDefined() {
		return true
	}

	typeName(): string {
		if (this.isRef()) {
			return `Vec<${this.struct.name}<'a>>`
		}
		return `Vec<${this.struct.name}>`
	}

	parserInvocation() {
		return this.struct.parserFunctionName()
	}

	generateParseStatement() {
		return `let mut input = input;
		let mut ${this.resName} = Vec::new();
		let mut item:${this.struct.name};
		loop{
			if input.len()<=0{
				break;
			}
			(input,item) = parse_${this.struct.snakeCaseName()}(input)?;
			${this.resName}.push(item);
		}`
	}
}