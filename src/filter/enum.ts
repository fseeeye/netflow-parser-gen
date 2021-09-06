import { AnonymousStructVariant, EnumVariant, EofVariant, StructEnum } from "../types/enum"
import { filterFieldsICS } from "./field"


// 过滤Enum variants中存储的不受ICS Rule支持的field
// 目前Variants类型尚且只支持:
// * EofVariant
// * AnonymousStructVariant
// Tips: 需要为支持的EnumVariant类型实现definitionRuleArg()和detectorImplementation()
export function filterVariantsICS(oldVariants: EnumVariant[]): EnumVariant[] {
    const cleanVariants = oldVariants
    .filter(v => (v instanceof AnonymousStructVariant || v instanceof EofVariant))
    .map(v => {
        if (v instanceof AnonymousStructVariant) {
            // 过滤variants中所含fields
            const cleanFields = filterFieldsICS(v.fields)
            return new AnonymousStructVariant(v.choice, v.name, cleanFields)
        }
        return v
    })
    return cleanVariants
}

export function filterStructEnumICS(s: StructEnum): StructEnum {
    const cleanVariants = filterVariantsICS(s.variants)
    return new StructEnum(s.name, cleanVariants, s.choiceField)
}