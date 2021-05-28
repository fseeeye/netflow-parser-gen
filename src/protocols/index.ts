import { Protocol } from "./generator"
import { Ipv4 } from "./ipv4"
import { Modbus } from "./modbus"
import { Tcp } from "./tcp"
import * as fs from "fs"
import * as path from "path"

export const BuiltinProtocols = [
    Ipv4,
    Tcp,
    Modbus,
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
            .map(m => `mod ${m};`)
            .join(`\n`)
        return code
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

    generate(directory: string) {
        this.protocols.forEach(p => {
            const { filename, content } = this.generateProtocolParser(directory, p)
            this.writeFile(filename, content)
        })
        const modIndex = this.generateModIndexContent()
        this.writeFile(path.join(directory, `mod.rs`), modIndex)
    }

}