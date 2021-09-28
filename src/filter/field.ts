import { Field } from "../field/base"
import { InputLengthChoice } from "../field/choice"
import { EnumField } from "../field/enum"
import { NumericField } from "../field/numeric"
import { StructField } from "../field/struct"
import { IfStructEnum } from "../types/enum"
import { filterStructEnumICS } from "./enum"
import { filterStructICS } from "./struct"


// 过滤fields中不受ICS Rule支持的field 
// 目前ICS规则中Field类型中仅支持：
// * NumericField
// * StructField
// * EnumField (structEnum不为IfStructEnum，且structEnum.choiceField不为InputLengthChoice)
// * 且该Field不为某EnumField的choice所指向的Field
// Tips：需要为支持的Field类型实现definitionRuleArg()和generateDetectCode()
export function filterFieldsICS(oldFields: Field[]): Field[] {
    let cleanFields = oldFields

    // 若有enum field，去除其choice所指向的field
    const enumChoiceNames: string[] = cleanFields
        .filter((field) => field instanceof EnumField) // 找到所有enum fields
        .map((enumField) => (enumField as EnumField).structEnum.choiceField.getChoiceFieldName()) // 找到所有enum fields的choice name

    cleanFields = cleanFields
        .filter((field) => (field instanceof NumericField || field instanceof StructField || field instanceof EnumField))
        .filter((field) => !enumChoiceNames.includes(field.name)) // 去除enum choice指向的fields
        .filter((field) => !((field instanceof EnumField) && (field.structEnum.choiceField instanceof InputLengthChoice))) // 若有enum field的choiceField类型为InputLengthChoice，将其去除
        .filter((field) => !((field instanceof EnumField) && (field.structEnum instanceof IfStructEnum)))
        .map((field) => {
            if (field instanceof StructField) {
                const cleanStruct = filterStructICS(field.struct)
                return new StructField(cleanStruct, field.fieldName)
            }
            else if (field instanceof EnumField) {
                const cleanStructEnum = filterStructEnumICS(field.structEnum)
                return new EnumField(cleanStructEnum, field.fieldName)
            }
            else return field
        })

    return cleanFields
}