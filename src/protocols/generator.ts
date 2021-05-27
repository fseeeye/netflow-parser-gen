import { writeFileSync } from "node:fs"
import { generateNomImport } from "../nom"
import { StructEnum } from "../types/enum"
import { Struct } from "../types/struct"



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

    generateCode(path: string) {
        const code = this.generateParser()
        writeFileSync(path, code)
        console.log(`code generated to ${path}.`)
    }
}