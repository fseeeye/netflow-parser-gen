import { StructVec } from "../types/structVec";
import { StructParserGenerator } from "./struct";

import endent from "endent"
export class StructVecParserGenerator extends StructParserGenerator {
    constructor(
        readonly structVec: StructVec
    ){
        super(structVec)
    }

    protected generateParserBlock() {

        const fieldParsers = this.struct.fields.map((field) => {
            return field.generateParseStatement()
        })
        const code = endent`{
            let mut ${this.struct.name}_ = Vec::new();
            let mut total_size = total_size;
            let mut input_tmp = input;
            while total_size > 0 {
                let input = input_tmp;

                ${fieldParsers.join('\n')}

                total_size -= (${this.structVec.length()}) as u16;
                
                input_tmp = input;
                ${this.struct.name}_.push(
                    ${this.struct.name} {
                        ${this.struct.fields.map((field) => field.name).join(',\n')}
                    }
                );
            }
            Ok((
            input_tmp,
            ${this.struct.name}_
            ))   
        }`

        return code
    }
    protected generateFunctionSignature() {
        const name = this.struct.parserFunctionName()
        return `fn ${name}(total_size: u16, input: &[u8]) -> IResult<&[u8], Vec<${this.struct.name}> >`
    }

}