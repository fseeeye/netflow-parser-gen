import { FieldType } from "./base"
import { NomNumberFunction } from "../nom"

enum BuiltInNumericTypeName {
    u8 = 'u8',
    u16 = 'u16',
    u32 = 'u32',
    u64 = 'u64',
}


export class NumericType implements FieldType {
    constructor(
        private readonly _name: BuiltInNumericTypeName,
        private readonly _parserFunctionName: NomNumberFunction,
        readonly bitLength: number
    ) { }

    typeName() {
        return this._name
    }

    isUserDefined() {
        return false
    }

    hasConstrain() {
        return false
    }

    getName() { return this._name }
    parserFunctionName(): string {
        return this._parserFunctionName
    }

    isRef() {
        return false
    }

}

export const BuiltInNumericType = {
    u8: new NumericType(BuiltInNumericTypeName.u8, NomNumberFunction.u8, 8),
    be_u16: new NumericType(BuiltInNumericTypeName.u16, NomNumberFunction.be_u16, 16),
    be_u32: new NumericType(BuiltInNumericTypeName.u32, NomNumberFunction.be_u32, 32),
    be_u64: new NumericType(BuiltInNumericTypeName.u64, NomNumberFunction.be_u64, 64),
    le_u16: new NumericType(BuiltInNumericTypeName.u16, NomNumberFunction.le_u16, 16),
    le_u32: new NumericType(BuiltInNumericTypeName.u32, NomNumberFunction.le_u32, 32),
    le_u64: new NumericType(BuiltInNumericTypeName.u64, NomNumberFunction.le_u64, 64),
}

export type BuiltinNumericTypeName = 'u8' | 'be_u16' | 'be_u32' | 'be_u64' | 'le_u16' | 'le_u32' | 'le_u64'

const BuiltinNumericTypes: Map<BuiltinNumericTypeName, NumericType> = new Map([
    ['u8', new NumericType(BuiltInNumericTypeName.u8, NomNumberFunction.u8, 8)],
    ['be_u16', new NumericType(BuiltInNumericTypeName.u16, NomNumberFunction.be_u16, 16)],
    ['be_u32', new NumericType(BuiltInNumericTypeName.u32, NomNumberFunction.be_u32, 32),],
    ['be_u64', new NumericType(BuiltInNumericTypeName.u64, NomNumberFunction.be_u64, 64),],
    ['le_u16', new NumericType(BuiltInNumericTypeName.u16, NomNumberFunction.le_u16, 16),],
    ['le_u32', new NumericType(BuiltInNumericTypeName.u32, NomNumberFunction.le_u32, 32),],
    ['le_u64', new NumericType(BuiltInNumericTypeName.u64, NomNumberFunction.le_u64, 64),],
])

export function getBuildinNumericTypeByTypeName(typeName: BuiltinNumericTypeName): NumericType | undefined {
    return BuiltinNumericTypes.get(typeName)
}