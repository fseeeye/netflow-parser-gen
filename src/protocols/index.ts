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
import { Goose } from "./goose"
import { Vlan } from "./vlan"
import { Sv } from "./sv"

// Add all valid Protocols here.
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
    Goose,
    Vlan,
    Sv
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
        code = code.concat('pub mod http;\n')
        code = code.concat(
            protocolNames.map((name) => `pub mod ${snakeCase(name)};`).join('\n')
        ).concat('\n\n')

        code = code.concat('pub use eof::*;\n')
        code = code.concat('pub use http::{parse_http_layer, HttpHeader};\n')
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
                .map(p => p.getName().replace(/(Req|Rsp)$/g, '').replace(/(Tcp|Udp)$/g, '')),
            (key: string) => key
        ).join(',\n').concat(',')
        const attributeStr = "#[derive(Serialize, Deserialize, Debug, PartialEq, Clone, Copy, Eq, Hash)]"

        const appProtocolsMatchArm = this.protocols
            .filter(p => p.getLevel() === 'L5')
            .map(p => `ApplicationProtocol::${p.getName()} => ApplicationNaiveProtocol::${p.getName().replace(/(Req|Rsp)$/g, '').replace(/(Tcp|Udp)$/g, '')},`)
            .join('\n')

        let code = endent`
        use crate::{ApplicationLayer, LinkLayer, NetworkLayer, TransportLayer};
        use serde::{Deserialize, Serialize};

        /// ProtocolType旨在用简单结构来表示协议类型
        /// * 协助判断解析出来的packet中各层是什么协议
        /// * 也用于options的stop字段说明该在哪一层停止
        #[derive(Serialize, Deserialize, Debug, Clone, Copy, Hash)]
        pub enum ProtocolType {
            Link(LinkProtocol),
            Network(NetworkProtocol),
            Transport(TransportProtocol),
            Application(ApplicationProtocol),
        }

        impl PartialEq for ProtocolType {
            fn eq(&self, other: &Self) -> bool {
                match self {
                    Self::Link(p) => match other {
                        Self::Link(op) => return *p == *op,
                        _ => return false,
                    },
                    Self::Network(p) => match other {
                        Self::Network(op) => return *p == *op,
                        _ => return false,
                    },
                    Self::Transport(p) => match other {
                        Self::Transport(op) => return *p == *op,
                        _ => return false,
                    },
                    Self::Application(p) => match other {
                        Self::Application(op) => {
                            let p: ApplicationNaiveProtocol = p.into();
                            let op = op.into();
                            return p == op;
                        }
                        _ => return false,
                    },
                }
            }
        }
        
        ${attributeStr}
        pub enum LinkProtocol {
            ${linkProtocol}
        }

        ${attributeStr}
        pub enum NetworkProtocol {
            ${netProtocol}
        }

        ${attributeStr}
        pub enum TransportProtocol {
            ${transProtocol}
        }

        ${attributeStr}
        pub enum ApplicationProtocol {
            ${appProtocol}
            Http,
            IsoOnTcp,
        }

        ${attributeStr}
        pub enum ApplicationNaiveProtocol {
            ${appNaiveProtocol}
            Http,
            IsoOnTcp,
        }
        
        impl From<ApplicationProtocol> for ApplicationNaiveProtocol {
            fn from(p: ApplicationProtocol) -> Self {
                match p {
                    ${appProtocolsMatchArm}
                    ApplicationProtocol::Http => ApplicationNaiveProtocol::Http,
                    ApplicationProtocol::IsoOnTcp => ApplicationNaiveProtocol::IsoOnTcp,
                }
            }
        }

        impl From<&ApplicationProtocol> for ApplicationNaiveProtocol {
            fn from(p: &ApplicationProtocol) -> Self {
                match p {
                    ${appProtocolsMatchArm}
                    ApplicationProtocol::Http => ApplicationNaiveProtocol::Http,
                    ApplicationProtocol::IsoOnTcp => ApplicationNaiveProtocol::IsoOnTcp,
                }
            }
        }`
        code = code.concat('\n\n')

        const linkProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L2')
            .map(p => `LinkLayer::${p.getName()}(_) => LinkProtocol::${p.getName()},`)
            .join('\n')
        code = code.concat(endent`
        // 层 -> 协议类型
        impl From<LinkLayer> for LinkProtocol {
            #[inline]
            fn from(link_layer: LinkLayer) -> Self {
                match link_layer {
                    ${linkProtocolsMatchArm}
                }
            }
        }
        
        impl From<LinkLayer> for ProtocolType {
            #[inline(always)]
            fn from(link_layer: LinkLayer) -> Self {
                ProtocolType::Link(link_layer.into())
            }
        }`)
        code = code.concat('\n\n')

        const networkProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L3')
            .map(p => `NetworkLayer::${p.getName()}(_) => NetworkProtocol::${p.getName()},`)
            .join('\n')
        code = code.concat(endent`
        impl<'a> From<NetworkLayer<'a>> for NetworkProtocol {
            #[inline]
            fn from(net_layer: NetworkLayer<'a>) -> Self {
                match net_layer {
                    ${networkProtocolsMatchArm}
                }
            }
        }
        
        impl<'a> From<NetworkLayer<'a>> for ProtocolType {
            #[inline(always)]
            fn from(net_layer: NetworkLayer<'a>) -> Self {
                ProtocolType::Network(net_layer.into())
            }
        }`)
        code = code.concat('\n\n')

        const transProtocolsMatchArm = this.protocols.filter(p => p.getLevel() === 'L4')
            .map(p => `TransportLayer::${p.getName()}(_) => TransportProtocol::${p.getName()},`)
            .join('\n')
        code = code.concat(endent`
        impl<'a> From<TransportLayer<'a>> for TransportProtocol {
            #[inline]
            fn from(trans_layer: TransportLayer<'a>) -> Self {
                match trans_layer {
                    ${transProtocolsMatchArm}
                }
            }
        }
        
        impl<'a> From<TransportLayer<'a>> for ProtocolType {
            #[inline(always)]
            fn from(trans_layer: TransportLayer<'a>) -> Self {
                ProtocolType::Transport(trans_layer.into())
            }
        }`)
        code = code.concat('\n\n')

        const appLayerMatchArm = this.protocols.filter(p => p.getLevel() === 'L5')
            .map(p => `ApplicationLayer::${p.getName()}(_) => ApplicationProtocol::${p.getName()},`)
            .join('\n')
        code = code.concat(endent`
        impl<'a> From<ApplicationLayer<'a>> for ApplicationProtocol {
            #[inline]
            fn from(app_layer: ApplicationLayer<'a>) -> Self {
                match app_layer {
                    ${appLayerMatchArm}
                    ApplicationLayer::Http(_) => ApplicationProtocol::Http,
                    ApplicationLayer::IsoOnTcp(_) => ApplicationProtocol::IsoOnTcp,
                }
            }
        }
        
        impl<'a> From<ApplicationLayer<'a>> for ProtocolType {
            #[inline(always)]
            fn from(app_layer: ApplicationLayer<'a>) -> Self {
                ProtocolType::Application(app_layer.into())
            }
        }`)

        return code.concat('\n')
    }

    // 生成layer.rs文件内容，包含对各层级Layer的定义
    private generateLayerContent() {
        let code = endent`
        //! Layer是包含协议解析结果的数据结构
        use std::net::IpAddr;

        use crate::{field_type::MacAddress, parsers::*};
        `
        code = code.concat('\n\n')
        const linkProtocols = this.protocols.filter(p => p.getLevel() === 'L2')
            .map(p => `${p.getName()}(${p.generateHeadername()}),`)
            .join('\n')
        code = code.concat(endent`/// LinkLayer是表示link层内容的类型。
        #[derive(Debug, PartialEq, Clone)]
        pub enum LinkLayer {
            ${linkProtocols}
        }
        
        impl LinkLayer {
            #[inline]
            pub fn get_dst_mac(&self) -> Option<MacAddress> {
                match &self {
                    LinkLayer::Ethernet(eth) => Some(eth.dst_mac),
                }
            }
        
            #[inline]
            pub fn get_src_mac(&self) -> Option<MacAddress> {
                match &self {
                    LinkLayer::Ethernet(eth) => Some(eth.src_mac),
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
        }
        
        impl<'a> NetworkLayer<'a> {
            #[inline]
            pub fn get_dst_ip(&self) -> Option<IpAddr> {
                match self {
                    NetworkLayer::Ipv4(ipv4) => Some(IpAddr::V4(ipv4.dst_ip)),
                    NetworkLayer::Ipv6(ipv6) => Some(IpAddr::V6(ipv6.dst_ip)),
                    NetworkLayer::Goose(_) => None,
                    NetworkLayer::Vlan(_) => None
                }
            }
        
            #[inline]
            pub fn get_src_ip(&self) -> Option<IpAddr> {
                match self {
                    NetworkLayer::Ipv4(ipv4) => Some(IpAddr::V4(ipv4.src_ip)),
                    NetworkLayer::Ipv6(ipv6) => Some(IpAddr::V6(ipv6.src_ip)),
                    NetworkLayer::Goose(_) => None,
                    NetworkLayer::Vlan(_) => None
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
        }
        
        impl<'a> TransportLayer<'a> {
            #[inline]
            pub fn get_dst_port(&self) -> Option<u16> {
                match self {
                    TransportLayer::Tcp(tcp) => Some(tcp.dst_port),
                    TransportLayer::Udp(udp) => Some(udp.dst_port),
                    TransportLayer::Sv(_) => None
                }
            }
        
            #[inline]
            pub fn get_src_port(&self) -> Option<u16> {
                match self {
                    TransportLayer::Tcp(tcp) => Some(tcp.src_port),
                    TransportLayer::Udp(udp) => Some(udp.src_port),
                    TransportLayer::Sv(_) => None
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
            Http(HttpHeader<'a>),
            IsoOnTcp(IsoOnTcpHeader),
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
            // 协议解析代码生成
            const { filename, content } = this.generateProtocolParser(path.join(directory, `/crates/parsing_parser/src/parsers`), p)
            this.writeFile(filename, content)
            // 工控白名单规则生成
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
                // 特定协议解析代码生成
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
