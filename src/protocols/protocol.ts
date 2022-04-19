import { snakeCase } from "snake-case"
import * as path from "path"
import endent from "endent"
import { generateNomImport } from "../utils/nom"
import { generateSerdeImports } from "../utils"
import { StructEnum, PayloadEnum, EmptyPayloadEnum, AnonymousStructVariant, NamedStructVariant, NamedEnumVariant } from "../types/enum"
import { Struct } from "../types/struct"
import { StructField } from "../field/struct"
import { EnumField } from "../field/enum"
import { ProtocolInfo, ProtocolLevel } from "./protocol-info"
import { filterStructICS } from "../filter/struct"


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

    getPayload(): PayloadEnum | EmptyPayloadEnum {
        return this.definition.payload
    }

    isRef(): boolean {
        return this.getHeader().isRef()
    }

    generateParser(): string {
        const { structs } = this.definition
        const nomImports = generateNomImport() // 文件顶部导入nom依赖
        const PayloadDef = this.getPayload().definition() // 生成payload所需imports
        const HeaderDef = this.getHeader().definition() // 生成protocol的header定义
        const parserHeader = this.getHeader().parserFunctionDefinition() // 生成Header的parser函数
        const parserLayer = this.generateLayerParser() // 生成该协议的layer parser
        const structDefs = structs.map(s => s.definition()) // 生成除packet/header/payload之外struct的定义
        const parserFunctions = structs.map(s => s.parserFunctionDefinition()) // 生成除packet/header/payload之外struct的parser函数

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
            return `${this.getHeader().name}<'a>`
        }
        return `${this.getHeader().name}`
    }

    generateLayerParser(): string {
        const headerSnakeName = this.getHeader().snakeCaseName()
        const protocolName = this.getName()
        const protocolLowcaseName = snakeCase(this.getName());
        const layerLevelName = this.definition.info.getLevelLayerName()
        const layerStatement = `let ${snakeCase(layerLevelName)} = ${layerLevelName}::${protocolName}(${headerSnakeName});`
        const layerPaseFuncName = `parse_${protocolLowcaseName}_layer`;

        const parseHeaderBlock = endent`let (input, ${headerSnakeName}) = match ${this.getHeader().parserFunctionName()}(input) {
            Ok(o) => o,
            Err(e) => {
                error!(
                    target: "PARSER(${protocolLowcaseName}::${layerPaseFuncName})",
                    error = ?e
                );
                ${this.definition.info.returnLevelPacket(true, true)}
            }
        };`
        const optionsBlock = endent`if Some(current_prototype) == options.stop {
            ${layerStatement}
            ${this.definition.info.returnLevelPacket()}
        };`

        return endent`pub fn parse_${protocolLowcaseName}_layer${this.definition.info.getLevelLifeTime()}${this.definition.info.getLevelLayerArgs()} -> QuinPacket${this.definition.info.getLevelLifeTime()} {
            info!(target: "PARSER(${protocolLowcaseName}::parse_${protocolLowcaseName}_layer)", "parsing ${protocolName} protocol.");
            let current_prototype = ${this.definition.info.getLevelProtocolTypeName()}(${this.definition.info.getLevelProtocolTypeName(0)}::${protocolName});

            ${parseHeaderBlock}

            ${optionsBlock}

            ${this.definition.payload.parserFunctionBody()}
        }`
    }

    // 同时生成入口点sturct/enum及其子struct/enum 的 RuleArg定义与check_arg方法
    private generateRuleArgFileContent(s: Struct | StructEnum, rename: string | undefined = undefined): string[] {
        const rst: string[] = []

        if (s instanceof Struct) {
            s.fields.forEach(f => {
                if (f instanceof StructField) { rst.push(this.generateRuleArgFileContent(f.struct).join('\n\n')) }
                else if (f instanceof EnumField) { rst.push(this.generateRuleArgFileContent(f.structEnum).join('\n\n')) }
            })
        } else { // s instanceof StructEnum
            s.variants.forEach(v => {
                if (v instanceof AnonymousStructVariant) {
                    v.fields.forEach(f => {
                        if (f instanceof StructField) { rst.push(this.generateRuleArgFileContent(f.struct).join('\n\n')) }
                        if (f instanceof EnumField) { rst.push(this.generateRuleArgFileContent(f.structEnum).join('\n\n')) }
                    })
                } 
                else if (v instanceof NamedStructVariant || v instanceof NamedEnumVariant) {
                    rst.push(this.generateRuleArgFileContent(v.struct).join('\n\n'))
                }
            })
        }
        
        rst.push(s.detectorDefinition(rename))
        rst.push(s.detectorFunctionDefinition(this.generateModName(), rename))

        return rst
    }

    generateRuleArg(): string {
        const imports = generateSerdeImports(this.generateModName()).concat('\n')
        const cleanHeader = filterStructICS(this.getHeader())
        const ruleArgFileContent = this.generateRuleArgFileContent(cleanHeader, cleanHeader.name.replace('Header', 'Arg')).join('\n\n')
        const rst = [imports, ruleArgFileContent]
        return rst.join('\n\n')
    }
}
