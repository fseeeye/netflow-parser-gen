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
    definition() {
        const attributes = generateAttributesCode()
        const lifetimeSpecifier = super.lifetimeSpecifier()
        const def = `pub struct ${this.name}${lifetimeSpecifier} ${this.generateFields()}`
        const getLength = this.length()
        return [attributes, def, getLength].join(`\n`)
    }

    public length() {
        let size = 0
        let undentifiedSize:string[] = []
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

    
}