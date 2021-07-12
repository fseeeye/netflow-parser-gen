import endent from "endent"
import { Field } from "../field/base";
import { Struct } from "./struct";
import { StructVecParserGenerator } from "../parser/structVec"
let FieldSize = new Map()
FieldSize.set("u8", 1)
FieldSize.set("u16", 2)
FieldSize.set("u32", 4)
FieldSize.set("u64", 8)

export class StructVec extends Struct {
    constructor(
        readonly name: string,
        readonly fields: Field[],
    ){
        super(name, fields)
     }

    parserFunctionDefinition() {
        const gen = new StructVecParserGenerator(this)
        return gen.generateParser()
    }
    public length() {
        var size = 0
        var undentifiedSize:string[] = []
        this.fields.forEach((val) => {
            if(FieldSize.get(val.typeName())) {
                size += FieldSize.get(val.typeName())
            }else {
                undentifiedSize.push(`${val.name}.len()`)
            }
        })

        return endent`
            ${size} + ${undentifiedSize.join('+')}
        `
    }

    
}