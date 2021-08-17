import endent from "endent"
import { Field } from "../field/base";
import { Struct } from "./struct";
import { generateAttributesCode } from "../utils"
const FieldSize: Map<string, number> = new Map([
    ["u8" , 1],
    ["u16", 2],
    ["u32", 4],
    ["u64", 8],
])

export class StructWithLength extends Struct {
    constructor(
        readonly name: string,
        readonly fields: Field[],
    ){
        super(name, fields)
     }
    definition(): string {
        const attributes = generateAttributesCode()
        const lifetimeSpecifier = super.lifetimeSpecifier()
        const def = `pub struct ${this.name}${lifetimeSpecifier} ${this.generateFields()}`
        const getLength = this.definitionFunction()
        return [attributes, def, getLength].join(`\n`)
    }

    definitionFunction(): string {
        let size = 0
        const undentifiedSize:string[] = []
        const lifetimeSpecifier = super.lifetimeSpecifier()
        this.fields.forEach((val) => {
            if(FieldSize.get(val.typeName())) {
                size += <number>FieldSize.get(val.typeName())
            }else {
                undentifiedSize.push(`self.${val.name}.len()`)
            }
        })

        return endent`
        impl${lifetimeSpecifier} ${this.name}${lifetimeSpecifier} {
            fn length(&self) -> usize {
                ${size} + ${undentifiedSize.join('+')}
            }
        }
        `
    }

    len(): number {
        let size = 0
        this.fields.forEach((val) => {
            if(FieldSize.get(val.typeName())) {
                size += <number>FieldSize.get(val.typeName())
            }
        })

        return size
    }
}