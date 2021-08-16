import endent from "endent"
import { snakeCase } from "snake-case"
import { generateAttributesCode, removeDuplicateByKey } from "../utils"
import { Struct } from "./struct"
import { Field, VisibilityType } from "../field/base"
import { FieldType } from "./base"
import { PayloadEnumParserGenerator, StructEnumParserGenerator, StructEnumVariantParserGenerator } from "../parser/enum"
import { EnumChoice } from "../field/choice"
import { Protocol, ProtocolInfo } from "../protocols/generator"

export type ChoiceType = string | number

export interface EnumVariant {
    name: string
    hasParserImplementation: boolean
    choice: ChoiceType
    definition(): string
    hasReference(): boolean
    parserInvocation(): string
    generateChoiceLiteral(): ChoiceType
    parserImplementation?: (enumName: string) => string
}

class BasicEnumVariant{
    constructor(
        readonly choice: ChoiceType,
    ) { }

    // `generateChoiceLiteral()`辅助函数，计算choice转换为hex的长度/位数
    private calculateNumberHexLength(value: number) {
        let curr = value
        let len = 0
        while (curr > 0) {
            curr = curr >> 1
            len++
        }
        return Math.ceil(len / 8) * 2
    }

    // 输出variant对应的match arm选择文本
    generateChoiceLiteral() {
        if (typeof this.choice === 'number') {
            const hexLen = this.calculateNumberHexLength(this.choice)
            const hex = this.choice.toString(16).padStart(hexLen, '0')
            return `0x${hex}`
        }
        return this.choice
    }
}

// 用法：用于表示enum空值或者占位
export class EmptyVariant extends BasicEnumVariant implements EnumVariant {
    hasParserImplementation = true

    constructor(
        readonly choice: ChoiceType,
        readonly name: string
    ) { super(choice) }

    definition(): string {
        return `${this.name} {}`
    }

    hasReference(): boolean {
        return false
    }

    parserFunctionName(): string {
        return `parse_${snakeCase(this.name)}`
    }

    parserInvocation(): string {
        return `${this.parserFunctionName()}(input)`
    }

    parserImplementation(enumName: string): string {
        const typeName = `${enumName}::${this.name}`
        const functionSignature = endent`fn ${this.parserFunctionName()}(input: &[u8]) -> IResult<&[u8], ${enumName}>`
        // 调用nom::combinator::eof
        const parserBlock = endent`{
            let (input, _) = eof(input)?;
            Ok((
                input,
                ${typeName} {}
            ))
        }`
        return `${functionSignature} ${parserBlock}`
    }
}

export class AnonymousStructVariant extends Struct implements EnumVariant {
    hasParserImplementation = true

    constructor(
        readonly choice: ChoiceType,
        readonly name: string,
        readonly fields: Field[],
    ) {
        super(name, fields)
    }

    protected visibilitySpecifier(): VisibilityType {
        return ``
    }

    definition(): string {
        return `${this.name} ${this.generateFields()}`
    }

    parserInvocation(): string {
        return `${this.parserFunctionName()}(input)`
    }

    parserImplementation(enumName: string): string {
        const gen = new StructEnumVariantParserGenerator(this, enumName)
        return gen.generateParser(false)
    }

    // `generateChoiceLiteral()`辅助函数，计算choice转换为hex的长度/位数
    private calculateNumberHexLength(value: number) {
        let curr = value
        let len = 0
        while (curr > 0) {
            curr = curr >> 1
            len++
        }
        return Math.ceil(len / 8) * 2
    }

    // 输出variant对应的match arm选择文本
    generateChoiceLiteral(): string {
        if (typeof this.choice === 'number') {
            const hexLen = this.calculateNumberHexLength(this.choice)
            const hex = this.choice.toString(16).padStart(hexLen, '0')
            return `0x${hex}`
        }
        return this.choice
    }
}

export class NamedStructVariant extends BasicEnumVariant implements EnumVariant {
    hasParserImplementation = false

    constructor(
        readonly enumName: string,
        readonly choice: ChoiceType,
        readonly name: string,
        readonly struct: Struct,
    ) { super(choice) }

    hasReference(): boolean {
        return this.struct.isRef()
    }

    definition(): string {
        if (this.hasReference()) {
            return `${this.name}(${this.name}<'a>)`
        }
        return `${this.name}(${this.name})`
    }

    parserInvocation(): string {
        const typeName = `${this.enumName}::${this.struct.name}`
        const parsed = this.struct.snakeCaseName()
        const parserBlock = endent`{
            let (input, ${parsed}) = ${this.struct.parserFunctionName()}(input)?;
            Ok((input, ${typeName}(${parsed})))
        }`
        return parserBlock
    }
}

export class NamedEnumVariant extends BasicEnumVariant implements EnumVariant {
    hasParserImplementation = false

    constructor(
        readonly enumName: string,
        readonly choice: ChoiceType,
        readonly name: string,
        readonly struct: StructEnum,
    ) { super(choice) }

    hasReference(): boolean {
        return this.struct.isRef()
    }

    definition(): string {
        if (this.hasReference()) {
            return `${this.name}(${this.name}<'a>)`
        }
        return `${this.name}(${this.name})`
    }

    parserInvocation(): string {
        const typeName = `${this.enumName}::${this.struct.name}`
        const parsed = this.struct.snakeCaseName()
        const parserBlock = endent`{
            let (input, ${parsed}) = ${this.struct.parserFunctionName()}(input, ${this.struct.choiceField.asEnumParserInvocationArgument()})?;
            Ok((input, ${typeName}(${parsed})))
        }`
        return parserBlock
    }

    // parserFunctionSignature() {
    //     const functionName = `parse_${snakeCase(this.enumName)}_${this.struct.snakeCaseName()}`
    //     const choiceField = this.struct.choiceField
    //     const parameterList = `input: &[u8], ${choiceField.name}: ${choiceField.field.typeName()}`
    //     const returnType = `IResult<&[u8], ${this.enumName}>`
    //     return `fn ${functionName}(${parameterList}) -> ${returnType}`
}

export class PayloadEnumVariant extends BasicEnumVariant implements EnumVariant {
    hasParserImplementation = false

    constructor(
        readonly choice: ChoiceType,
        readonly payloadProtocol: Protocol,
    ) { super(choice) }

    readonly name = ``
    
    // 用于lifetime判断
    hasReference(): boolean {
        return this.payloadProtocol.isRef()
    }

    // 获取Variant在生成Rust enum类型时的内容
    definition(): string {
        throw Error(`PayloadEnumVariant dont impl definition()`)
    }

    // 返回Variant在生成match arm时调用的上层parser函数名，如`parse_ipv4_layer`
    parserInvocation(): string {
        return `parse_${snakeCase(this.payloadProtocol.getName())}_layer`
    }
}

export class PayloadEnum implements FieldType {

    constructor(
        readonly name: string,
        readonly info: ProtocolInfo,
        readonly variants: PayloadEnumVariant[],
        readonly choiceField: EnumChoice,
        readonly extraPayloadEnum?: PayloadEnum,
    ) { }

    typeName(): string {
        return this.name
    }

    type(): string {
        return 'PayloadEnum'
    }

    isUserDefined(): boolean {
        return true
    }

    // 输出结构体定义(PayloadEnum仅含use)
    definition(): string {
        // `use super::{parse_xxx_layer, parse_lx_eof_layer}`
        const imports = this.generateImports()
        return imports
    }

    // 输出payload parser函数名
    parserFunctionName(): string {
        throw Error(`PayloadEnum does not have parser function name.`)
    }

    // !unnecessary
    // 输出payload parser的函数签名与函数体
    parserFunctionDefinition(): string {
        throw Error(`PayloadEnum does not have parser function def.`)
    }

    // 输出payload parser的函数体
    parserFunctionBody(): string {
        const gen = new PayloadEnumParserGenerator(this)
        return gen.generateParserBody()
    }

    // 用于判断variants中是否有引用，作为是否添加生命周期标识符的参考
    isRef(): boolean {
        // return this.variants.filter((variant) => variant.hasReference()).length !== 0
        return true
    }

    getAllVariants(): PayloadEnumVariant[] {
        let vars = this.variants
        if (this.extraPayloadEnum != undefined) {
            vars = vars.concat(this.extraPayloadEnum.getAllVariants())
        }
        return vars
    }

    // 根据variants.name 输出 use上层协议parser的代码，形如: `use super::{parse_ipv4_layer, parse_l2_eof_layer}`
    private generateImports(): string {
        const vars = this.getAllVariants()
        const importParsers = vars.map(v => `${v.parserInvocation()}, `).join(``).concat(this.info.getLevelEofInvocation())
        return `use super::{${importParsers}};`
    }

    snakeCaseName(): string {
        return snakeCase(this.name)
    }
}

// 用法：当协议的Payload只可能是Eof时使用
export class EmptyPayloadEnum implements FieldType {
    readonly variants: PayloadEnumVariant[] = []
    
    constructor(
        readonly name: string,
        readonly info: ProtocolInfo,
        // readonly variants: PayloadEnumVariant[],
        // readonly choiceField: EnumChoice,
    ) { }

    typeName(): string {
        return this.name
    }

    type(): string {
        return 'EmptyPayloadEnum'
    }

    isUserDefined(): boolean {
        return true
    }

    // 输出结构体定义(EmptyPayloadEnum仅含use)
    definition(): string {
        // `use super::parse_lx_eof_layer`
        const imports = this.generateImports()
        return imports
    }

    // 输出payload parser函数名
    parserFunctionName(): string {
        throw Error(`EmptyPayloadEnum does not have parser function name.`)
    }

    // !unnecessary
    // 输出payload parser的函数签名与函数体
    parserFunctionDefinition(): string {
        throw Error(`EmptyPayloadEnum does not have parser function def.`)
    }

    // 输出payload parser的函数体
    parserFunctionBody(): string {
        const gen = new PayloadEnumParserGenerator(this)
        return gen.generateParserBody()
    }

    // 用于判断variants中是否有引用，作为是否添加生命周期标识符的参考
    isRef(): boolean {
        return true
    }

    // 在需要时，输出生命周期标识符`<'a>`
    private lifetimeSpecifier(): string {
        return this.isRef() ? `<'a>` : ''
    }

    // 根据variants.name 输出 导入上层协议的Packet Struct的代码，形如: `use super::upper_Protocol::UpperProtocolPacket`
    private generateImports(): string {
        return `use super::${this.info.getLevelEofInvocation()};`
    }

    snakeCaseName(): string {
        return snakeCase(this.name)
    }
}

export function isEmptyPayloadEnum(arg: PayloadEnum | EmptyPayloadEnum): arg is EmptyPayloadEnum {
    return arg.type() === 'EmptyPayloadEnum'
}

export class StructEnum implements FieldType {

    constructor(
        readonly name: string,
        readonly variants: EnumVariant[],
        readonly choiceField: EnumChoice,
    ) { }

    typeName(): string {
        return this.name
    }

    isUserDefined(): boolean {
        return true
    }

    parserFunctionName(): string {
        return `parse_${this.snakeCaseName()}`
    }

    parserFunctionDefinition(): string {
        const gen = new StructEnumParserGenerator(this)
        return gen.generateParser()
    }

    isRef(): boolean {
        return this.hasReference()
    }

    private generateVariants() {
        const uniqueVariants = removeDuplicateByKey(
            this.variants,
            (v) => v.name
        ).map(v => v.definition())
        return endent`{
            ${uniqueVariants.join(`,\n`)}
        }`
    }

    private hasReference() {
        return this.variants.filter((variant) => variant.hasReference()).length !== 0
    }

    private lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    definition(): string {
        const attributes = generateAttributesCode()
        const definition = `pub enum ${this.name}${this.lifetimeSpecifier()} ${this.generateVariants()}`
        return [attributes, definition].join(`\n`)
    }

    snakeCaseName(): string {
        return snakeCase(this.name)
    }

}
