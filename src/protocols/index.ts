import { Protocol } from "./generator"
import { Ipv4 } from "./ipv4"
import { ModbusReq } from "./modbus_req"
import { Tcp } from "./tcp"
import * as fs from "fs"
import * as path from "path"
import { Ethernet } from "./ethernet"
import { Udp } from "./udp"
import { Ipv6 } from "./ipv6"
import { ModbusRsp } from "./modbus_rsp"

export const BuiltinProtocols = [
    Ethernet,
    Ipv4,
    Ipv6,
    Tcp,
    Udp,
    ModbusReq,
    ModbusRsp,
]

interface ProtocolParser {
    filename: string,
    content: string,
}

export class ProtocolParserGenerator {
    constructor(
        readonly protocols: Protocol[]
    ) { }

    private generateModIndexContent() {
        const code = this.protocols.map(p => p.generateModName())
            .sort()
            .map(m => `pub mod ${m};`)
            .join(`\n`)
        return code.concat(`\npub mod eof;\n`)
    }

    private writeFile(path: string, content: string) {
        fs.writeFileSync(path, content)
        console.log(`code generated to ${path}.`)
    }

    private generateProtocolParser(directory: string, protocol: Protocol): ProtocolParser {
        const filename = protocol.generateFilename(directory)
        const content = protocol.generateParser()
        return { filename, content }
    }

    generate(directory: string): void {
        this.protocols.forEach(p => {
            const { filename, content } = this.generateProtocolParser(directory.concat(`/parsers_ts`), p)
            this.writeFile(filename, content)
        })
        const modIndex = this.generateModIndexContent()
        this.writeFile(path.join(directory, `parsers_ts.rs`), modIndex)
    }

}