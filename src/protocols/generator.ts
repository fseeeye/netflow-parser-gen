import { generateNomImport } from "../nom"
import { StructEnum } from "../types/enum"
import { Struct } from "../types/struct"
import { StructWithLength } from "../types/structWithLength"
import * as path from "path"
import * as fs from "fs"

export interface ProtocolDefinition {
    name: string,
    structs: (Struct | StructEnum | StructWithLength)[],
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

    generateModName() {
        return this.definition.name.toLowerCase()
    }

    generateFilename(directory: string) {
        const filename = `${this.generateModName()}.rs`
        return path.join(directory, filename)
    }
}