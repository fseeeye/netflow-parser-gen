import { Struct } from "../types/struct"
import { filterFieldsICS } from "./field"


export function filterStructICS(s: Struct): Struct {
    const cleanFields = filterFieldsICS(s.fields)
    return new Struct(s.name, cleanFields)
}