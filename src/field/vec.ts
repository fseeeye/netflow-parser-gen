import { FieldType } from "../types/base"
import { NomMultiFunction } from "../nom"
import { BaseField } from "./base"
import { CountVariable } from "../len"
import { StructWithLength } from "../types/struct-with-length"
import { NumericField } from "./numeric"
import endent from "endent"

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
        return `${NomMultiFunction.count}(${elementParserFunc}, (${this.lengthVariable.count()}) as usize)`
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
// 有如下两种情况：
// 1. 有指导field来标明该vec应解析的范围，但不能计算出vec所包含的元素个数（即，元素长度可变）
// 2. 无指导field，此时需要对所剩input全部解析
export class VecLoopField extends BaseField {
    constructor(
        readonly name: string,
        readonly elementType: StructWithLength,
        readonly lengthNum?: NumericField
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

    hasFunction(): boolean {
        return true
    }

    parserInvocation(): string {
        return `get_${this.name}`
    }

    generateFunction(): string {
        if (this.lengthNum !== undefined) {
            const elementParserFunc = this.elementType.parserFunctionName()
            const code = endent`
            fn get_${this.name}(${this.lengthNum.name}: ${this.lengthNum.typeName()}, input: &[u8]) -> IResult<&[u8], Vec<${this.elementType.typeName()}>> {
                let mut ${this.name} = Vec::new();
                let mut input_tmp = input;
                let mut _${this.lengthNum.name} = ${this.lengthNum.name};
                while _${this.lengthNum.name} > 0 {
                    let input = input_tmp;
                    let (input, _${this.name}) = ${elementParserFunc}(input)?;
                    _${this.lengthNum.name} -= _${this.name}.length() as ${this.lengthNum.typeName()};
                    ${this.name}.push(_${this.name});
                    input_tmp = input;
                }
                Ok((
                    input_tmp,
                    ${this.name}
                ))
            }
            `
            return code
        } else {
            throw Error('unimpl')
        }
    }

    generateParseStatement(): string {
        if (this.lengthNum !== undefined) {
            return `let (input, ${this.name}) = ${this.parserInvocation()}(${this.lengthNum.name}, input)?;`
        } else {
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
        }
    }
}