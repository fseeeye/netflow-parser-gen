import endent from "endent"
import { Struct } from "./struct"

export function generateNomImport() {
    const code = endent`
    use nom::bytes::complete::{tag, take};
    use nom::number::complete::{be_u32, be_u16, u8};
    use nom::sequence::tuple;
    use nom::IResult;
    `
    return code
}

export class StructParserGenerator {

    constructor(
        readonly struct: Struct,
    ) { }

    protected generateResultSection() {
        const struct = this.struct
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

    protected generateParserBlock() {
        const fieldParsers = this.struct.fields.map((field) => {
            return field.generateParserCode()
        })

        const resultSection = this.generateResultSection()

        return endent`{
            ${fieldParsers.join('\n')}
            ${resultSection}
        }`
    }

    static generateParserName(struct: Struct) {
        return `parse_${struct.snakeCaseName()}`
    }

    generateParserName() {
        return StructParserGenerator.generateParserName(this.struct)
    }

    protected generateFunctionSignature() {
        const name = this.generateParserName()
        return `fn ${name}(input: &[u8]) -> IResult<&[u8], ${this.struct.name}>`
    }

    generateParser(pub: boolean = true) {
        const visibilitySpecifier = pub ? `pub` : ``
        const functionSignature = `${visibilitySpecifier} ${this.generateFunctionSignature()}`
        const parserBlock = this.generateParserBlock()

        return endent`
        ${functionSignature} ${parserBlock}
        `
    }
}

