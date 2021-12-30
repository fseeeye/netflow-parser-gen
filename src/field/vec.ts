import { FieldType } from "../types/base"
import { NomMultiFunction } from "../utils/nom"
import { BaseField, Field } from "./base"
import { CountVariable } from "../utils/variables"
import endent from "endent"

export class VecField extends BaseField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType,
    ) {
        super(name)
    }

    typeName(withLifetime = true): string {
        if (withLifetime && this.elementType.isRef()) {
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
        readonly elementBitLen?: number
    ) {
        super(name)
    }

    typeName(withLifetime = true): string {
        if (withLifetime && this.elementType.isRef()) {
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
        if (this.elementBitLen !== undefined) {
            elementBitLong = this.elementBitLen
        }
        const elementTypeName = this.elementType.typeName()
        // e.g. `bits::<_, _, Error<(&[u8], usize)>, Error<&[u8]>, _>(count::<_, u8, _, _>(take_bits(1usize), byte_count as usize * 8usize))(input)?`
        return `${NomMultiFunction.bits}::<_, _, Error<(&[u8], usize)>, Error<&[u8]>, _>(${NomMultiFunction.count}::<_, ${elementTypeName}, _, _>(take_bits(${elementBitLong}usize), ${this.lengthVariable.count()}))`
    }
}

// 用于解析未知长度的vec或较为复杂的vec
abstract class VecLoopField extends BaseField {
    constructor(
        readonly name: string,
        readonly elementField: Field,
    ) {
        super(name)
    }

    typeName(withLifetime: boolean): string {
        if (withLifetime && this.elementField.isRef()) {
            return `Vec<${this.elementField.typeName(false)}<'a>>`
        }
        return `Vec<${this.elementField.typeName(false)}>`
    }

    isRef(): boolean {
        return this.elementField.isRef()
    }

    isUserDefined(): boolean {
        return false
    }

    parserInvocation(): string {
        // return `get_${this.name}_with_${snakeCase(this.elementField.typeName())}`
        return this.elementField.parserInvocation()
    }

    parserInvocationParam(): string {
        return this.elementField.parserInvocationParam()
    }

    // abstract generateFunction(): string
    abstract generateParseStatement(): string
}

// 用于：有指导field来标明该vec应解析的范围，但不能计算出vec所包含的元素个数（即，元素长度可变）
export class LimitedLenVecLoopField extends VecLoopField {
    constructor(
        readonly name: string,
        readonly lengthNum: CountVariable,
        readonly elementField: Field,
    ) {
        super(name, elementField)
    }

    generateParseStatement(): string {
        // return `let (input, ${this.name}) = ${this.parserInvocation()}(input, ${this.lengthNum.name})?;`
        const elementFieldName = this.elementField.typeName(false)
        const name = this.name
        const lengthNumParameter = this.lengthNum.count()

        return endent`
            /* LimitedLenVecLoopField Start */
            let mut ${name} = Vec::new();
            let mut _${name}: ${elementFieldName};
            let mut input = input;
            let len_flag = input.len() - ${lengthNumParameter};
            while input.len() > len_flag {
                (input, _${name}) = ${this.parserInvocation()}(${this.parserInvocationParam()})?;
                ${name}.push(_${name});
            }
            let input = input;
            /* LimitedLenVecLoopField End. */
        `
    }
}

// 用于：无指导field，此时需要对所剩input全部解析
export class UnlimitedVecLoopField extends VecLoopField {
    constructor(
        readonly name: string,
        readonly elementField: Field,
    ) {
        super(name, elementField)
    }

    generateParseStatement(): string {
        const elementFieldName = this.elementField.typeName(false)
        const name = this.name

        return endent`
            /* UnlimitedVecLoopField Start */
            let mut ${name} = Vec::new();
            let mut _${name}: ${elementFieldName};
            let mut input = input;
            while input.len() > 0 {
                (input, _${name}) = ${this.parserInvocation()}(${this.parserInvocationParam()})?;
                ${name}.push(_${name});
            }
            let input = input;
            /* UnlimitedVecLoopField End. */
        `
    }
}

// 用于：有指导field来标明元素个数，但是需要传入除input外的额外参数来解析vec元素，否则请使用VecField
export class LimitedCountVecLoopField extends VecLoopField {
    constructor(
        readonly name: string,
        readonly lengthCount: CountVariable,
        readonly elementField: Field,
    ) {
        super(name, elementField)
    }

    generateParseStatement(): string {
        const elementFieldName = this.elementField.typeName(false)
        const name = this.name
        const lengthCountParameter = this.lengthCount.count()

        return endent`
            /* LimitedCountVecLoopField Start */
            let mut ${name} = Vec::new();
            let mut _${name}: ${elementFieldName};
            let mut input = input;
            for _ in 0..(${lengthCountParameter}) {
                (input, _${name}) = ${this.parserInvocation()}(${this.elementField.parserInvocationParam()})?;
                ${name}.push(_${name});
            }
            let input = input;
            /* LimitedCountVecLoopField End. */
        `
    }
}