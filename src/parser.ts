import endent from "endent"
import { Struct } from "./struct"

export class StructParserGenerator {

    private static generateNomImports() {
        const code = endent`
        use nom::bytes::complete::{tag, take};
        use nom::number::complete::{be_u32, be_u16, u8};
        use nom::sequence::tuple;
        use nom::IResult;
        `
        return code
    }

    private static generateResultSection(struct: Struct) {
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

    private static generateParserBlock(struct: Struct) {
        const fieldParsers = struct.fields.map((field) => {
            return field.generateParserCode()
        })

        const resultSection = StructParserGenerator.generateResultSection(struct)

        return endent`{
            ${fieldParsers.join('\n')}
            ${resultSection}
        }`
    }

    static generateParserName(struct: Struct) {
        return `parse_${struct.snakeCaseName()}`
    }

    static generateParser(struct: Struct, pub: boolean = true) {
        const name = StructParserGenerator.generateParserName(struct)
        const visibilitySpecifier = pub ? `pub ` : ``
        const functionSignature = `${visibilitySpecifier}fn ${name}(input: &[u8]) -> IResult<&[u8], ${struct.name}>`
        const parserBlock = StructParserGenerator.generateParserBlock(struct)
        const nomImportsBlock = StructParserGenerator.generateNomImports()

        return endent`
        ${nomImportsBlock}
        ${functionSignature} ${parserBlock}
        `
    }
}