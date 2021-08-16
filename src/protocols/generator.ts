import { snakeCase } from "snake-case"
import { generateNomImport } from "../nom"
import { StructEnum, PayloadEnum, EmptyPayloadEnum } from "../types/enum"
import { Struct } from "../types/struct"
import * as path from "path"
import endent from "endent"


export type ProtocolLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
export type LevelLayerName = 'LinkLayer' | 'NetworkLayer' | 'TransportLayer' | 'ApplicationLayer'
export type LevelEofInvocation =  'parse_l2_eof_layer' | 'parse_l3_eof_layer' | 'parse_l4_eof_layer' | 'parse_l5_eof_layer'

export class ProtocolInfo {
    constructor(
        readonly name: string,
        readonly level: ProtocolLevel,
        readonly header: Struct,
    ) { }

    getLevelLayerName(): LevelLayerName {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have layer name`)
            case 'L2': return 'LinkLayer'
            case 'L3': return 'NetworkLayer'
            case 'L4': return 'TransportLayer'
            case 'L5': return 'ApplicationLayer'
        }
    }

    getLevelEofInvocation(): LevelEofInvocation {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have eof func`)
            case 'L2': return 'parse_l2_eof_layer'
            case 'L3': return 'parse_l3_eof_layer'
            case 'L4': return 'parse_l4_eof_layer'
            case 'L5': return 'parse_l5_eof_layer'
        }
    }

    getLevelEofStatement(): string {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have eof func`)
            case 'L2': return 'parse_l2_eof_layer(input, link_layer, options)'
            case 'L3': return 'parse_l3_eof_layer(input, link_layer, network_layer, options)'
            case 'L4': return 'parse_l4_eof_layer(input, link_layer, network_layer, transport_layer, options)'
            case 'L5': return 'parse_l5_eof_layer(input, link_layer, network_layer, transport_layer, application_layer, options)'
        }
    }

    getNextLayerArgs(): string {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have next layer args`)
            case 'L2': return '(input, link_layer, options)'
            case 'L3': return '(input, link_layer, network_layer, options)'
            case 'L4': return '(input, link_layer, network_layer, transport_layer, options)'
            case 'L5': return '(input, link_layer, network_layer, transport_layer, application_layer, options)'
        }
    }

    getLevelLayerArgs(): string {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have layer args`)
            case 'L2': return '(input: &[u8], options: QuinPacketOptions)'
            case 'L3': return '(input: &[u8], link_layer: LinkLayer, options: QuinPacketOptions)'
            case 'L4': return `(input: &'a [u8], link_layer: LinkLayer, network_layer: NetworkLayer<'a>, options: QuinPacketOptions)`
            case 'L5': return `(input: &'a [u8], link_layer: LinkLayer, network_layer: NetworkLayer<'a>, transport_layer: TransportLayer<'a>, options: QuinPacketOptions)`
        }
    }

    getLevelLifeTime(): string {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have level life time`)
            case 'L2': return ''
            case 'L3': return ''
            case 'L4': return `<'a>`
            case 'L5': return `<'a>`
        }
    }

    getLevelLower(): ProtocolLevel {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have lower level`)
            case 'L2': return 'L1'
            case 'L3': return 'L2'
            case 'L4': return 'L3'
            case 'L5': return 'L4'
        }
    }

    returnLevelPacket(error = false, lower = false): string {
        const error_code = error ? 'Some(ParseError::ParsingHeader)' : 'None'
        const level = lower ? this.getLevelLower() : this.level

        switch(level) {
            case 'L1': return endent`
            return QuinPacket::L1(
                L1Packet {
                    error: ${error_code},
                    remain: input,
                }
            )`
            case 'L2': return endent`
            return QuinPacket::L2(
                L2Packet {
                    link_layer,
                    error: ${error_code},
                    remain: input,
                }
            )`
            case 'L3': return endent`
            return QuinPacket::L3(
                L3Packet {
                    link_layer,
                    network_layer,
                    error: ${error_code},
                    remain: input,
                }
            )`
            case 'L4': return endent`
            return QuinPacket::L4(
                L4Packet {
                    link_layer,
                    network_layer,
                    transport_layer,
                    error: ${error_code},
                    remain: input,
                }
            )`
            case 'L5': return endent`
            return QuinPacket::L5(
                L5Packet {
                    link_layer,
                    network_layer,
                    transport_layer,
                    application_layer,
                    error: ${error_code},
                    remain: input,
                }
            )`
        }
    }
}

export interface ProtocolDefinition {
    info: ProtocolInfo,
    payload: PayloadEnum | EmptyPayloadEnum,
    structs: (Struct | StructEnum)[],
}

export class Protocol {
    constructor(
        readonly definition: ProtocolDefinition
    ) { }
    
    getName(): string {
        return this.definition.info.name
    }

    getLevel(): ProtocolLevel {
        return this.definition.info.level
    }

    getHeader(): Struct {
        return this.definition.info.header
    }

    isRef(): boolean {
        return this.getHeader().isRef()
    }

    generateParser(): string {
        const { structs } = this.definition
        const nomImports = generateNomImport() // 文件顶部导入nom依赖
        const HeaderDef = this.getHeader().definition() // 生成protocol的header定义
        const PayloadDef = this.definition.payload.definition() // 生成payload所需imports
        const structDefs = structs.map(s => s.definition()) // 生成除packet/header/payload之外struct的定义
        const parserHeader = this.getHeader().parserFunctionDefinition() // 生成Header的parser函数
        const parserFunctions = structs.map(s => s.parserFunctionDefinition()) // 生成除packet/header/payload之外struct的parser函数
        const parserLayer = this.generateLayerParser() // 生成该协议的layer parser

        const rst = [nomImports, PayloadDef, HeaderDef, parserHeader, parserLayer]
        if (structDefs.length > 0) {rst.push(structDefs.join(`\n\n`))}
        if (parserFunctions.length > 0) {rst.push(parserFunctions.join(`\n\n`))}
        return rst.join(`\n\n`)
    }
    
    generateModName(): string {
        return snakeCase(this.getName())
    }
    
    generateFilename(directory: string): string {
        const filename = `${this.generateModName()}.rs`
        return path.join(directory, filename)
    }

    generateHeadername(): string {
        if (this.isRef()) {
            return `${this.getName()}Header<'a>`
        }
        return `${this.getName()}Header`
    }

    generateLayerParser(): string {
        const headerSnakeName = this.getHeader().snakeCaseName()
        const protocolName = this.getName()
        const layerLevelName = this.definition.info.getLevelLayerName()
        const layerStatement = `let ${snakeCase(layerLevelName)} = ${layerLevelName}::${protocolName}(${headerSnakeName});`

        const parseHeaderBlock = endent`let (input, ${headerSnakeName}) = match ${this.getHeader().parserFunctionName()}(input) {
            Ok(o) => o,
            Err(_e) => {
                ${this.definition.info.returnLevelPacket(true, true)}
            }
        };`
        const optionsBlock = endent`if Some(current_layertype) == options.stop {
            ${layerStatement}
            ${this.definition.info.returnLevelPacket()}
        };`

        return endent`pub(crate) fn parse_${snakeCase(this.getName())}_layer${this.definition.info.getLevelLifeTime()}${this.definition.info.getLevelLayerArgs()} -> QuinPacket${this.definition.info.getLevelLifeTime()} {
            let current_layertype = LayerType::${protocolName};

            ${parseHeaderBlock}
            
            ${optionsBlock}

            ${this.definition.payload.parserFunctionBody()}
        }`
    }
}