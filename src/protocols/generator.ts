import { generateNomImport } from "../nom"
import { StructEnum } from "../types/enum"
import { Struct } from "../types/struct"
import * as path from "path"
import * as fs from "fs"

export interface ProtocolDefinition {
    name: string,
    structs: (Struct | StructEnum)[],
}

export class Protocol {
    constructor(
        readonly definition: ProtocolDefinition
    ) { }

    generateParser() {
        const { structs } = this.definition
        const nomImports = generateNomImport()
        const structDefs = structs.map(s => s.definition()).join(`\n\n`)
        const parserFunctions = structs.map(s => s.parserFunctionDefinition()).join(`\n\n`)
        return [nomImports, structDefs, parserFunctions].join(`\n\n`)
    }

    private generateFilename() {
        return `${this.definition.name.toLowerCase()}.rs`
    }

    generateCode(directory: string) {
        const code = this.generateParser()
        const file = path.join(directory, this.generateFilename())
        fs.writeFileSync(file, code)
        console.log(`code generated to ${directory}.`)
    }
}