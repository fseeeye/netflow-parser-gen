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
import { removeDuplicateByKey } from "../utils"
import { snakeCase } from "snake-case"
import { Dnp3 } from "./dnp3"
import { Iec104 } from "./iec104"
import { Opcua } from "./opcua"

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
    Bacnet,
    Dnp3,
    Iec104,
    Opcua,
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
        let code = ''

        const protocolNames = this.protocols.map(p => p.getName())
            .concat('IsoOnTcp')
            .sort()

        code = code.concat('pub mod eof;\n')
        code = code.concat(
            protocolNames.map((name) => `pub mod ${snakeCase(name)};`).join('\n')
        ).concat('\n\n')

        code = code.concat('pub use eof::*;\n')
        code = code.concat(
            protocolNames.map((name) => `pub use ${snakeCase(name)}::{parse_${snakeCase(name)}_layer, ${name}Header};`).join(`\n`)
        ).concat('\n')

        return code
    }

    // 生成layer_type.rs文件内容，包含对ProtocolType enum的定义
    private generateProtocolContent() {
        const linkProtocol = this.protocols.filter(p => p.getLevel() === 'L2').map(p => `${p.getName()},`).join('\n')
        const netProtocol = this.protocols.filter(p => p.getLevel() === 'L3').map(p => `${p.getName()},`).join('\n')
        const transProtocol = this.protocols.filter(p => p.getLevel() === 'L4').map(p => `${p.getName()},`).join('\n')
        const appProtocol = this.protocols.filter(p => p.getLevel() === 'L5').map(p => `${p.getName()},`).join('\n')
        const appNaiveProtocol = removeDuplicateByKey(
            this.protocols
                .filter(p => p.getLevel() === 'L5')
                .map(p => p.getName().replace(/(Req|Rsp)$/g, ''))
                .map(pName => pName.replace(/(Tcp|Udp)$/g, '')),
            (key: string) => key
        ).join(',\n').concat(',')

        const code = endent`
        use crate::ParseError;
        use serde::{Serialize, Deserialize};

        /// ProtocolType旨在用简单结构来表示协议类型
        /// * 协助判断解析出来的packet中各层是什么协议
        /// * 也用于options的stop字段说明该在哪一层停止
        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash)]
        pub enum ProtocolType {
            Link(LinkProtocol),
            Network(NetworkProtocol),
            Transport(TransportProtocol),
            Application(ApplicationProtocol),
            Error(ParseError),
        }
        
        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash)]
        pub enum LinkProtocol {
            ${linkProtocol}
        }

        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash)]
        pub enum NetworkProtocol {
            ${netProtocol}
        }

        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash)]
        pub enum TransportProtocol {
            ${transProtocol}
        }

        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash)]
        pub enum ApplicationProtocol {
            ${appProtocol}
            IsoOnTcp,
        }

        #[derive(Debug, PartialEq, Clone, Copy, Eq, Hash, Serialize, Deserialize)]
        pub enum ApplicationNaiveProtocol {
            ${appNaiveProtocol}
            IsoOnTcp,
        }`
        return code.concat('\n')
    }

    // 生成layer.rs文件内容，包含对各层级Layer的定义
    private generateLayerContent() {
        let code = endent`
        /// Layer是包含协议解析结果的数据结构
        use crate::ProtocolType;
        use crate::protocol::{ApplicationProtocol, LinkProtocol, NetworkProtocol, TransportProtocol};
        use crate::parsers::*;
        `
        code = code.concat('\n\n\n')
        const linkProtocols = this.protocols.filter(p => p.getLevel() === 'L2')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// LinkLayer是表示link层内容的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum LinkLayer {
            ${linkProtocols}
        }`)
        code = code.concat('\n\n')

        const linkProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L2')
            .map(p => `LinkLayer::${p.getName()}(_) => ProtocolType::Link(LinkProtocol::${p.getName()}),`)
            .join('\n')
        code = code.concat(endent`
        // 层 -> 协议类型
        impl Into<ProtocolType> for LinkLayer {
            fn into(self) -> ProtocolType {
                match self {
                    ${linkProtocolsMatchArm}
                }
            }
        }`)
        code = code.concat('\n\n')

        const networkProtocols = this.protocols.filter(p => p.getLevel() === 'L3')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// NetworkLayer是表示network层内容的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum NetworkLayer<'a> {
            ${networkProtocols}
        }`)
        code = code.concat('\n\n')

        const networkProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L3')
            .map(p => `NetworkLayer::${p.getName()}(_) => ProtocolType::Network(NetworkProtocol::${p.getName()}),`)
            .join('\n')
        code = code.concat(endent`
        impl<'a> Into<ProtocolType> for NetworkLayer<'a> {
            fn into(self) -> ProtocolType {
                match self {
                    ${networkProtocolsMatchArm}
                }
            }
        }`)
        code = code.concat('\n\n')

        const transProtocols = this.protocols.filter(p => p.getLevel() === 'L4')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// TransportLayer是表示transport层内容的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum TransportLayer<'a> {
            ${transProtocols}
        }`)
        code = code.concat('\n\n')

        const transProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L4')
            .map(p => `TransportLayer::${p.getName()}(_) => ProtocolType::Transport(TransportProtocol::${p.getName()}),`)
            .join('\n')
        code = code.concat(endent`
        impl<'a> Into<ProtocolType> for TransportLayer<'a> {
            fn into(self) -> ProtocolType {
                match self {
                    ${transProtocolsMatchArm}
                }
            }
        }`)
        code = code.concat('\n\n')

        const appProtocols = this.protocols.filter(p => p.getLevel() === 'L5')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// ApplicationLayer是表示application层内容的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum ApplicationLayer<'a> {
            ${appProtocols}
            IsoOnTcp(IsoOnTcpHeader),
        }`)
        code = code.concat('\n\n')

        const appProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L5')
            .map(p => `ApplicationLayer::${p.getName()}(_) => ProtocolType::Application(ApplicationProtocol::${p.getName()}),`)
            .join('\n')
        code = code.concat(endent`
        impl<'a> Into<ProtocolType> for ApplicationLayer<'a> {
            fn into(self) -> ProtocolType {
                match self {
                    ${appProtocolsMatchArm}
                    ApplicationLayer::IsoOnTcp(_) => ProtocolType::Application(ApplicationProtocol::IsoOnTcp),
                }
            }
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
            const { filename, content } = this.generateProtocolParser(path.join(directory, `/crates/parsing_parser/src/parsers`), p)
            this.writeFile(filename, content)
            const { ICSRuleArgFilename, ICSRuleArgContent } = this.generateProtocolICSRulearg(path.join(directory, `/crates/parsing_icsrule/src/icsrule_arg`), p)
            this.writeFile(ICSRuleArgFilename, ICSRuleArgContent)
        })
        const modIndex = this.generateModIndexContent()
        this.writeFile(path.join(directory, `/crates/parsing_parser/src/parsers/mod.rs`), modIndex)
        const protocol = this.generateProtocolContent()
        this.writeFile(path.join(directory, `/crates/parsing_parser/src/protocol.rs`), protocol)
        const layer = this.generateLayerContent()
        this.writeFile(path.join(directory, `/crates/parsing_parser/src/layer.rs`), layer)
    }

    debug(directory: string, protocolName: string): void {
        this.protocols.forEach(p => {
            if (p.getName() === protocolName) {
                const { filename, content } = this.generateProtocolParser(path.join(directory, `/crates/parsing_parser/src/parsers`), p)
                this.writeFile(filename, content)
            }
        })
        const modIndex = this.generateModIndexContent()
        this.writeFile(path.join(directory, `/crates/parsing_parser/src/parsers/mod.rs`), modIndex)
        const protocol = this.generateProtocolContent()
        this.writeFile(path.join(directory, `/crates/parsing_parser/src/protocol.rs`), protocol)
        const layer = this.generateLayerContent()
        this.writeFile(path.join(directory, `/crates/parsing_parser/src/layer.rs`), layer)
    }

}