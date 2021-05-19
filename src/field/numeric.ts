import { BaseField, NomNumberFunction, RustPrimitiveType } from "./base"


export class NumericType {
    constructor(
        readonly rustType: RustPrimitiveType,
        readonly parseFunc: NomNumberFunction
    ) { }
}

export const PrimitiveNumericType = {
    u8: new NumericType(RustPrimitiveType.u8, NomNumberFunction.u8),
    be_u16: new NumericType(RustPrimitiveType.u16, NomNumberFunction.be_u16),
    be_u32: new NumericType(RustPrimitiveType.u32, NomNumberFunction.be_u32),
}


export class NumericField extends BaseField {
    constructor(
        readonly name: string,
        readonly numType: NumericType,
    ) {
        super(name)
    }

    parserInvocation() {
        return this.numType.parseFunc
    }

    rustType() {
        return this.numType.rustType
    }
}