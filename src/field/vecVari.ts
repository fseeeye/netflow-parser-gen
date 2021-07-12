import { VecField } from "./vec";
import { CountVariable } from "../len"
import { FieldType } from "../types/base"

export class VecVarField extends VecField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly elementType: FieldType,
    ){
        super(name, lengthVariable, elementType)
    }

    generateParseStatement(){
        const elementParserFunc = this.elementType.parserFunctionName()
        
        return `let (input, ${this.name}) = ${elementParserFunc}(${this.lengthVariable.count()}.into(), input)?;`
    }
}