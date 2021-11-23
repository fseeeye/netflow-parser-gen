import endent from "endent"
import { Struct } from "../types/struct"

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

    getLevelProtocolTypeName(flag: 0 | 1 = 1): string {
        switch(this.level) {
            case 'L1': throw Error(`L1 dont have layer type name`)
            case 'L2': return flag ? 'ProtocolType::Link' : 'LinkProtocol'
            case 'L3': return flag ? 'ProtocolType::Network' : 'NetworkProtocol'
            case 'L4': return flag ? 'ProtocolType::Transport' : 'TransportProtocol'
            case 'L5': return flag ? 'ProtocolType::Application' : 'ApplicationProtocol'
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
            case 'L2': return '(input: &[u8], options: &QuinPacketOptions)'
            case 'L3': return '(input: &[u8], link_layer: LinkLayer, options: &QuinPacketOptions)'
            case 'L4': return `(input: &'a [u8], link_layer: LinkLayer, network_layer: NetworkLayer<'a>, options: &QuinPacketOptions)`
            case 'L5': return `(input: &'a [u8], link_layer: LinkLayer, network_layer: NetworkLayer<'a>, transport_layer: TransportLayer<'a>, options: &QuinPacketOptions)`
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