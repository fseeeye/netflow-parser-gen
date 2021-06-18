// import { BitsNumericField } from "../field/bit-field"
// import { BitFieldStructParserGenerator } from "../parser/struct"
// import { Struct } from "./struct"

// export class BitFieldStruct extends Struct {
//     constructor(
//         readonly name: string,
//         readonly fields: BitsNumericField[],
//     ) {
//         super(name, fields)
//     }

//     parserFunctionDefinition() {
//         const gen = new BitFieldStructParserGenerator(this)
//         return gen.generateParser()
//     }
// }