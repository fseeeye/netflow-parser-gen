import endent from "endent"
import { PrimitiveStruct } from "./struct"


function generateNomImports() {
    const code = endent`
    use nom::bytes::complete::{tag, take};
    use nom::number::complete::{be_u32, be_u16, u8};
    use nom::sequence::tuple;
    use nom::IResult;
    `
    return code
}

function generateResultSection(struct: PrimitiveStruct) {
    const code = endent`
    Ok((
        input,
        ${struct.name} {
            ${struct.fields.map((field) => field.name).join(',\n')}
        }
    ))
    `
    return code
}

function generatePrimitiveParserBlock(struct: PrimitiveStruct) {
    const fieldParsers = struct.fields.map((field) => {
        return field.type_.generateParser(field.name)
    })

    const resultSection = generateResultSection(struct)

    return endent`{
        ${fieldParsers.join('\n')}
        ${resultSection}
    }`
}


export function generatePrimitiveParser(struct: PrimitiveStruct) {
    const name = `parse_${struct.snakeCaseName()}`
    const functionSignature = `pub fn ${name}(input: &[u8]) -> IResult<&[u8], ${struct.name}>`
    const parserBlock = generatePrimitiveParserBlock(struct)
    const nomImportsBlock = generateNomImports()

    return endent`
    ${nomImportsBlock}
    ${functionSignature} ${parserBlock}
    `
}