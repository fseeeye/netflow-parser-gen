import endent from "endent"
import { snakeCase } from "snake-case"
import { generatePrimitiveParser } from "./parser"
import { be_u16, PrimitiveNomType, u8 } from "./types"


interface Field {
    name: string
    // value?: number
    type_: PrimitiveNomType
}

interface Struct {
    name: string
    has_ref: boolean
    fields: Field[]
}

export class PrimitiveStruct implements Struct {
    readonly attributes = [`Debug`, `PartialEq`]

    constructor(
        readonly name: string,
        readonly has_ref: boolean,
        readonly fields: Field[],
    ) { }

    genFieldsBlock() {
        const fieldLines = this.fields.map((field) => {
            return `pub ${field.name} : ${field.type_.toRustType()},`
        })
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    genStructDefinition() {
        const lifetimeSpecifier = this.has_ref ? `<'a>` : ''
        return `pub struct ${this.name} ${lifetimeSpecifier} ${this.genFieldsBlock()}`
    }

    compile() {
        const attributes = `#[derive(${this.attributes.join(',')})]`
        const definition = this.genStructDefinition()
        return [attributes, definition].join('\n')
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}

function test() {

    const MBAPHeader: Struct = {
        name: 'MBAPHeader',
        has_ref: false,
        fields: [
            { name: 'transaction_id', type_: u8 },
            { name: 'protocol_id', type_: be_u16 },
            { name: 'length', type_: be_u16 },
            { name: 'unit_id', type_: u8 },
        ]
    }

    const header = new PrimitiveStruct(MBAPHeader.name, MBAPHeader.has_ref, MBAPHeader.fields)

    console.log(header.compile())
    console.log()
    console.log(generatePrimitiveParser(header))
}

test()