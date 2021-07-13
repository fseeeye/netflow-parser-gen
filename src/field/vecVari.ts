import { VecField } from "./vec";
import { CountVariable } from "../len"
import { FieldType } from "../types/base"
import endent from "endent";

export class VecVarField extends VecField {
    constructor(
        readonly name: string,
        readonly lengthVariable: CountVariable,
        readonly lengthType: string,
        readonly elementType: FieldType,
    ){
        super(name, lengthVariable, elementType)
    }

    hasFunction() {
        return true
    }

    generateFunction() {
        const elementParserFunc = this.elementType.parserFunctionName()
        const code = endent`
        fn get_${this.name}(${this.lengthVariable.count()}: ${this.lengthType}, input: &[u8]) -> IResult<&[u8], Vec<${this.elementType.typeName()}>> {
            let mut ${this.name} = Vec::new();
            let mut input_tmp = input;
            let mut ${this.lengthVariable.count()}_ = ${this.lengthVariable.count()};
            while ${this.lengthVariable.count()}_ > 0 {
                let input = input_tmp;
                let (input, ${this.name}_) = ${elementParserFunc}(input)?;
                ${this.lengthVariable.count()}_ -= ${this.name}_.length() as ${this.lengthType};
                ${this.name}.push(${this.name}_);
                input_tmp = input;
            }
            Ok((
                input_tmp,
                ${this.name}
            ))
        }
        `
        return code
    }

    generateParseStatement(){
        const elementParserFunc = this.elementType.parserFunctionName()
        const code =endent `
        let (input, ${this.name}) = get_${this.name}(${this.lengthVariable.count()}, input)?;
        `
        return code
    }



}