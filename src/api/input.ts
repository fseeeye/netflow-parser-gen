import { NumericField } from "../field/numeric"
import { BytesReferenceField } from "../field/ref"
import { CountVariable, CountVariableImpl } from "../len"
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

export interface BytesReferenceFieldConfig {
    name: string
    countVar: CountVariable
}

export function createBytesReferenceField({ name, countVar }: BytesReferenceFieldConfig): BytesReferenceField {
    const { unitSize, mode } = countVar
    const count = new CountVariableImpl(countVar.name, unitSize, mode)
    return new BytesReferenceField(name, count)
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
//             return new AnonymousStructEnumVariant(choice, name, )
//         }
//     })
// }