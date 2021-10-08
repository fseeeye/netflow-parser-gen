import { Protocol } from "./protocol"
import { Ipv4 } from "./ipv4"
import { ModbusReq } from "./modbus-req"
import { Tcp } from "./tcp"
import * as fs from "fs"
import { Ethernet } from "./ethernet"
import { Udp } from "./udp"
import { Ipv6 } from "./ipv6"
import { ModbusRsp } from "./modbus-rsp"
import { FinsTcpReq } from "./fins-tcp-req"
import { FinsTcpRsp } from "./fins-tcp-rsp"
import { FinsUdpReq } from "./fins-udp-req"
import { FinsUdpRsp } from "./fins-udp-rsp"
import endent from "endent"
import path from "path"
import { Mms } from "./mms"
import { S7comm } from "./s7comm"
import { Bacnet } from "./bacnet"

export const BuiltinProtocols = [
    Ethernet,
    Ipv4,
    Ipv6,
    Tcp,
    Udp,
    ModbusReq,
	ModbusRsp,
	FinsTcpReq,
	FinsTcpRsp,
	FinsUdpReq,
	FinsUdpRsp,
    Mms,
    S7comm,
    Bacnet
]

interface ProtocolParser {
    filename: string,
    content: string,
}

interface ProtocolRuleArg {
    ICSRuleArgFilename: string,
    ICSRuleArgContent: string,
}

export class ProtocolParserGenerator {
    constructor(
        readonly protocols: Protocol[]
    ) { }

    // 生成parsers.rs文件内容，包含对各parsers模块的引入
    private generateModIndexContent() {
        let code = 'mod eof;\n'
        code = code.concat(this.protocols.map(p => p.generateModName())
            .sort()
            .map(m => `mod ${m};`)
            .join('\n'))
            .concat('\n')

        code = code.concat('\npub(crate) use eof::*;\n')
        code = code.concat(this.protocols.map(p => p.generateModName())
            .sort()
            .map(m => `pub use ${m}::*;`)
            .join(`\n`))
            .concat('\n')

        return code
    }

    // 生成layer_type.rs文件内容，包含对LayerType enum的定义
    private generateLayerTypeContent() {
        const layersName = this.protocols.map(p => p.getName())
            .concat('Eof')
            .sort()
            .concat('Error(ParseError)')
            .map(name => `${name},`)
            .join('\n')

        const code = endent`use crate::ParseError;

        /// LayerType旨在用简单结构来表示协议类型
        /// * 协助判断解析出来的packet中各层是什么协议
        /// * 也用于options的stop字段说明该在哪一层停止
        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash)]
        pub enum LayerType {
            ${layersName}
        }`
        return code.concat('\n')
    }

    // 生成layer.rs文件内容，包含对各层级Layer的定义
    private generateLayerContent() {
        let code = 'use crate::parsers::*;\n\n'
        const linkProtocols = this.protocols.filter(p => p.getLevel() === 'L2')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// LinkLayer是表示link层各类协议信息的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum LinkLayer {
            ${linkProtocols}
        }`)
        code = code.concat('\n\n')

        const networkProtocols = this.protocols.filter(p => p.getLevel() === 'L3')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// NetworkLayer是表示network层各类协议信息的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum NetworkLayer<'a> {
            ${networkProtocols}
        }`)
        code = code.concat('\n\n')

        const transProtocols = this.protocols.filter(p => p.getLevel() === 'L4')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// TransportLayer是表示transport层各类协议新的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum TransportLayer<'a> {
            ${transProtocols}
        }`)
        code = code.concat('\n\n')

        const appProtocols = this.protocols.filter(p => p.getLevel() === 'L5')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// ApplicationLayer是表示application层各类协议新的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum ApplicationLayer<'a> {
            ${appProtocols}
        }`)
        code = code.concat('\n')

        return code
    }

    private writeFile(path: string, content: string) {
        fs.writeFileSync(path, content)
        console.log(`code generated to ${path}.`)
    }
    
    // 生成各协议的代码文件内容
    private generateProtocolParser(directory: string, protocol: Protocol): ProtocolParser {
        const filename = protocol.generateFilename(directory)
        const content = protocol.generateParser()
        return { filename, content }
    }

    // 生成各协议规则的rule_arg文件内容
    private generateProtocolICSRulearg(directory: string, protocol: Protocol): ProtocolRuleArg {
        const ICSRuleArgFilename = protocol.generateFilename(directory)
        const ICSRuleArgContent = protocol.generateRuleArg()
        return { ICSRuleArgFilename, ICSRuleArgContent }
    }

    generate(directory: string): void {
        this.protocols.forEach(p => {
            const { filename, content } = this.generateProtocolParser(directory.concat(`/parsers_ts`), p)
            this.writeFile(filename, content)
            const { ICSRuleArgFilename, ICSRuleArgContent } = this.generateProtocolICSRulearg(directory.concat(`/ics_rule/rule_arg_ts`), p)
            this.writeFile(ICSRuleArgFilename, ICSRuleArgContent)
        })
        const modIndex = this.generateModIndexContent()
        this.writeFile(path.join(directory, `parsers.rs`), modIndex)
        const layerType = this.generateLayerTypeContent()
        this.writeFile(path.join(directory, `layer_type.rs`), layerType)
        const layer = this.generateLayerContent()
        this.writeFile(path.join(directory, `layer.rs`), layer)
    }

    debug(directory: string, protocolName: string): void {
        this.protocols.forEach(p => {
            if (p.getName() === protocolName) {
                const { filename, content } = this.generateProtocolParser(directory.concat(`/parsers`), p)
                this.writeFile(filename, content)
            }
        })
    }

}