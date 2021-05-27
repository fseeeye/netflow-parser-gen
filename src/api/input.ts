import { BitsNumericField } from "../field/bit-field"
import { NumericField } from "../field/numeric"
import { BytesReferenceField } from "../field/ref"
import { VecField } from "../field/vec"
import { CountVariable } from "../len"
import { BuiltinNumericTypeName, getBuildinNumericTypeByTypeName } from "../types/numeric"

export interface NumericFieldConfig {
    name: string
    typeName: BuiltinNumericTypeName
}

export function createNumericField({ name, typeName }: NumericFieldConfig): NumericField {
    const numericType = getBuildinNumericTypeByTypeName(typeName)
    if (numericType === undefined) {
        throw Error(`bad typename for numeric field!`)
    }
    return new NumericField(name, numericType)
}

export function createNumericFieldSimple(name: string, typeName: BuiltinNumericTypeName): NumericField {
    return createNumericField({ name, typeName })
}

export function createCountVar(name: string, expressionGenerator?: (name: string) => string) {
    return new CountVariable(name, expressionGenerator)
}

export function createCountVarWithUnitSize(name: string, unitSize: number, mode: 'div' | 'mul') {
    if (unitSize === 1) {
        return createCountVar(name)
    }
    const expressionGenerator = (name: string) => {
        if (mode === 'mul') {
            return `(${name} * ${unitSize})`
        }
        else {
            return `(${name} as usize / ${unitSize} as usize)`
        }
    }
    return createCountVar(name, expressionGenerator)
}

export interface BytesReferenceFieldConfig {
    name: string
    countVar: CountVariable
}

export function createBytesReferenceField({ name, countVar }: BytesReferenceFieldConfig): BytesReferenceField {
    return new BytesReferenceField(name, countVar)
}

export function createBytesReferenceFieldSimple(name: string, countVar: CountVariable) {
    return createBytesReferenceField({ name, countVar })
}

export function createNumericVector(name: string, countVar: CountVariable, elementTypeName: BuiltinNumericTypeName) {
    const elementType = getBuildinNumericTypeByTypeName(elementTypeName)
    if (elementType === undefined) {
        throw Error(`element type ${elementTypeName} is not a valid numeric type!`)
    }
    return new VecField(name, countVar, elementType)
}

export function createBitNumericField(name: string, length: number, typeName: BuiltinNumericTypeName) {
    const numericType = getBuildinNumericTypeByTypeName(typeName)
    if (numericType === undefined) {
        throw Error(`bad typename for numeric field!`)
    }
    return new BitsNumericField(name, length, numericType)
}

// type BuiltinStructFieldConfig = BytesReferenceFieldConfig | NumericFieldConfig

// interface EnumVariantConfig {
//     choice: ChoiceType
//     enumType: 'empty' | 'struct'
//     name?: string
//     fields?: BuiltinStructFieldConfig[]
// }

// interface EnumFieldConfig {
//     name: string
//     variantsConfig: EnumVariantConfig[]
// }

// export function createEnumField({ name, variantsConfig }: EnumFieldConfig): EnumField {
//     const variants = variantsConfig.map(({choice, enumType, name, fields}) => {
//         if (enumType === 'empty') {
//             return new EmptyVariant(choice)
//         }
//         else {
//             const fieldsImpl = fields?.map((cfg) => {

//             })
//             return new AnonymousStructVariant(choice, name, )
//         }
//     })
// }