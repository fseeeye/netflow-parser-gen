import { FieldType } from "../types/base"
import { NomMultiFunction } from "../utils/nom"
import { BaseField } from "./base"
import { CountVariable } from "../utils/variables"
import { NumericField } from "./numeric"
import endent from "endent"
import { snakeCase } from "snake-case"

export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType,
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
        return `${NomMultiFunction.count}(${elementParserFunc}, ${this.lengthVariable.count()})`
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

// 用于解析未知长度的vec
abstract class VecLoopField extends BaseField {
    constructor(
        readonly name: string,
        readonly elementType: FieldType,
    ){
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
        return `get_${this.name}_with_${snakeCase(this.elementType.typeName())}`
    }

    abstract generateFunction(): string
    abstract generateParseStatement(): string
}

// 用于：有指导field来标明该vec应解析的范围，但不能计算出vec所包含的元素个数（即，元素长度可变）
export class LimitedVecLoopField extends VecLoopField {
    constructor(
        readonly name: string,
        readonly elementType: FieldType,
        readonly lengthNum: NumericField,
    ){
        super(name, elementType)
    }

	asParameterLengthNum(): string {
		return `${this.lengthNum.name.replace('.', '_')}`
	}

    generateFunction(): string {
        const elementParserFunc = this.elementType.parserFunctionName()
        const elementTypeName = this.elementType.typeName()
        const name = this.name
		const lengthNumParameter = this.asParameterLengthNum()

		const code = endent`
        fn ${this.parserInvocation()}(input: &[u8], ${lengthNumParameter} : ${this.lengthNum.typeName()}) -> IResult<&[u8], Vec<${elementTypeName}>> {
            let mut ${name} = Vec::new();
            let mut _${name}: ${elementTypeName};
            let mut input = input;
            let len_flag = input.len() - ${lengthNumParameter} as usize;

            while input.len() > len_flag {
                (input, _${name}) = ${elementParserFunc}(input)?;
                ${name}.push(_${name});
            }

            Ok((
                input,
                ${name}
            ))
        }
        `
        return code
    }

    generateParseStatement(): string {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input, ${this.lengthNum.name})?;`
    }
}

// 用于：无指导field，此时需要对所剩input全部解析
export class UnlimitedVecLoopField extends VecLoopField {
    constructor(
        readonly name: string,
        readonly elementType: FieldType,
    ){
        super(name, elementType)
    }

    generateFunction(): string {
        const elementParserFunc = this.elementType.parserFunctionName()
        const elementTypeName = this.elementType.typeName()
        const name = this.name

        const code = endent`
        fn ${this.parserInvocation()}(input: &[u8]) -> IResult<&[u8], Vec<${elementTypeName}>> {
            let mut ${name} = Vec::new();
            let mut _${name}: ${elementTypeName};
            let mut input = input;

            while input.len() > 0 {
                (input, _${name}) = ${elementParserFunc}(input)?;
                ${name}.push(_${name});
            }

            Ok((
                input,
                ${name}
            ))
        }
        `
        return code
    }

    generateParseStatement(): string {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
    }
}