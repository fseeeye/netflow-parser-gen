import { FieldType } from "./base"

enum RustNumericTypeName {
    u8 = 'u8',
    u16 = 'u16',
    u32 = 'u32',
    u64 = 'u64',
}

enum NomNumberFunction {
    u8 = 'u8',
    be_u16 = 'be_u16',
    be_u32 = 'be_u32',
    be_u64 = 'be_u64',
    le_u16 = 'le_u16',
    le_u32 = 'le_u32',
    le_u64 = 'le_u64',
}


export class NumericType implements FieldType {
    constructor(
        private readonly _name: RustNumericTypeName,
        private readonly _parserFunctionName: NomNumberFunction,
    ) { }

    typeName() {
        return this._name
    }

    isUserDefined() {
        return false
    }

    parserFunctionName() {
        return this._parserFunctionName
    }

}

export const RustNumericType = {
    u8: new NumericType(RustNumericTypeName.u8, NomNumberFunction.u8),
    be_u16: new NumericType(RustNumericTypeName.u16, NomNumberFunction.be_u16),
    be_u32: new NumericType(RustNumericTypeName.u32, NomNumberFunction.be_u32),
    be_u64: new NumericType(RustNumericTypeName.u64, NomNumberFunction.be_u64),
    le_u16: new NumericType(RustNumericTypeName.u16, NomNumberFunction.le_u16),
    le_u32: new NumericType(RustNumericTypeName.u32, NomNumberFunction.le_u32),
    le_u64: new NumericType(RustNumericTypeName.u64, NomNumberFunction.le_u64),
}
