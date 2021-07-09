import { snakeCase } from "snake-case"
import { generateNomImport } from "../nom"
import { StructEnum, PayloadEnum, EmptyPayloadEnum } from "../types/enum"
import { Struct } from "../types/struct"
import * as path from "path"
import endent from "endent"
// import * as fs from "fs"

export interface ProtocolDefinition {
    name: string,
    packet: Struct,
    header: Struct,
    payload: PayloadEnum | EmptyPayloadEnum,
    structs: (Struct | StructEnum)[],
}

export class Protocol {
    constructor(
        readonly definition: ProtocolDefinition
    ) { }

    generateParser(): string {
        const { structs } = this.definition
        const nomImports = generateNomImport()
        const packetDef = this.definition.packet.definition()
        const HeaderDef = this.definition.header.definition()
        const PayloadDef = this.definition.payload.definition()
        const structDefs = structs.map(s => s.definition())
        const parserFunctions = structs.map(s => s.parserFunctionDefinition())
        const packetTraitImpl = this.generatePacketTraitImpl()

        const rst = [nomImports, packetDef, HeaderDef, PayloadDef, packetTraitImpl]
        if (structDefs.length > 0) {rst.push(structDefs.join(`\n\n`))}
        if (parserFunctions.length > 0) {rst.push(parserFunctions.join(`\n\n`))}
        return rst.join(`\n\n`)
    }
    
    generateModName(): string {
        return snakeCase(this.definition.name)
    }
    
    generateFilename(directory: string): string {
        const filename = `${this.generateModName()}.rs`
        return path.join(directory, filename)
    }

    generatePacketTraitImpl(): string { 
        const header_parser = endent`fn parse_header(input: &'a [u8]) -> nom::IResult<&'a [u8], Self::Header> ${this.definition.header.parserHeaderFunctionBody()}`
        const payload_parser = endent`fn parse_payload(
            input: &'a [u8], 
            _header: &Self::Header
        ) -> nom::IResult<&'a [u8], Self::Payload> ${this.definition.payload.parserFunctionBody()}`

        const packet_parser = endent`fn parse(input: &'a [u8]) -> nom::IResult<&'a [u8], Self> {
            let (input, ${this.definition.header.snakeCaseName()}) = Self::parse_header(input)?;
            let (input, ${this.definition.payload.snakeCaseName()}) = Self::parse_payload(input, &${this.definition.header.snakeCaseName()})?;
            Ok((input, Self { ${this.definition.header.snakeCaseName()}, ${this.definition.payload.snakeCaseName()} }))
        }`
        
        return endent`
        impl<'a> PacketTrait<'a> for ${this.definition.packet.name}<'a> {
            type Header = ${this.definition.header.name}${this.definition.header.isRef()?`<'a>`:''};
            type Payload = ${this.definition.payload.name}${this.definition.payload.isRef()?`<'a>`:''};
            type PayloadError = ${this.definition.payload.name}Error<'a>;

            ${header_parser}

            ${payload_parser}

            ${packet_parser}            
        }
`
    }
}