import { FieldType } from "./base"

enum BuiltInSliceTypeName {
    u4_4 = '[u8; 4]',
    u4_6 = '[u8; 6]',
    u8_2 = '[u8; 2]',
    u8_3 = '[u8; 3]',
    u8_4 = '[u8; 4]',
    u8_5 = '[u8; 5]',
}

enum EngineSliceFunction {
    u4_4 = 'slice_u4_4',
    u4_6 = 'slice_u4_6',
    u8_2 = 'slice_u8_2',
    u8_3 = 'slice_u8_3',
    u8_4 = 'slice_u8_4',
    u8_5 = 'slice_u8_5',
}

export class SliceType implements FieldType {
    constructor(
        private readonly _name: BuiltInSliceTypeName,
        private readonly _parserFunctionName: EngineSliceFunction,
    ) { }

    // 对应在`BuiltInNumericTypeName`中定义的rust类型名，如u8/u16/u32/u64
    typeName(): BuiltInSliceTypeName {
        return this._name
    }

    isUserDefined(): boolean {
        return false
    }

    // 对应nom的相应解析函数名，如be_u16
    parserFunctionName(): EngineSliceFunction {
        return this._parserFunctionName
    }

    isRef(): boolean {
        return false
    }
}

export type BuiltInSliceName = 'u4_4' | 'u4_6' | 'u8_2' | 'u8_3' | 'u8_4' | 'u8_5'

const BuiltInSliceTypesMap: Map<BuiltInSliceName, SliceType> = new Map([
    ['u4_4', new SliceType(BuiltInSliceTypeName.u4_4, EngineSliceFunction.u4_4)],
    ['u4_6', new SliceType(BuiltInSliceTypeName.u4_6, EngineSliceFunction.u4_6)],
    ['u8_2', new SliceType(BuiltInSliceTypeName.u8_2, EngineSliceFunction.u8_2)],
    ['u8_3', new SliceType(BuiltInSliceTypeName.u8_3, EngineSliceFunction.u8_3)],
    ['u8_4', new SliceType(BuiltInSliceTypeName.u8_4, EngineSliceFunction.u8_4)],
    ['u8_5', new SliceType(BuiltInSliceTypeName.u8_5, EngineSliceFunction.u8_5)],    
])

export function getSliceTypeBySliceName(sliceName: BuiltInSliceName): SliceType | undefined {
    return BuiltInSliceTypesMap.get(sliceName)
}