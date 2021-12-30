import endent from "endent"
import { snakeCase } from "snake-case"
import { Field } from "../field/base"
import { FieldType } from "./base"
import { StructParserGenerator } from "../parser/struct"
import { generateAllowAttributesCode, generateAttributesCode } from "../utils"
import { VisibilityType } from "../utils/variables"


export class Struct implements FieldType {

    constructor(
        readonly name: string,
        readonly fields: Field[],
        readonly extraInputs: Field[] = [],
    ) {}

    typeName(): string {
        return this.name
    }

    isRef(): boolean {
        return this.hasReference()
    }

    isUserDefined(): boolean {
        return true
    }

    isWithoutInputs(): boolean {
        if (this.extraInputs.length === 0) {
            return true
        }
        return false
    }

    parserFunctionName(): string {
        return `parse_${this.snakeCaseName()}`
    }

    parserFunctionDefinition(): string {
        const gen = new StructParserGenerator(this)
        return gen.generateParser()
        // return gen.generateParserWithUserDefinedFields()
    }

    protected visibilitySpecifier(): VisibilityType {
        return `pub`
    }

    protected generateFields(): string {
        const fieldLines = this.fields.map((field) => {
                // return `${this.visibilitySpecifier()} ${field.name}: ${field.typeName()},`
                const fieldDef = field.definition(this.visibilitySpecifier()).trim()
                return `${fieldDef}`
            })
            .filter((fieldDef) => fieldDef !== '')
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    public hasReference(): boolean {
        // 如果 field 带引用，则 struct 需要声明 lifetime
        return this.fields.filter((field) => field.isRef()).length !== 0
    }

    protected lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    definition(): string {
        const attributes = generateAttributesCode()
        const allowAttributes = generateAllowAttributesCode()
        const lifetimeSpecifier = this.lifetimeSpecifier()
        const def = `pub struct ${this.name}${lifetimeSpecifier} ${this.generateFields()}`
        return [allowAttributes, attributes, def].join(`\n`)
    }

    snakeCaseName(): string {
        return snakeCase(this.name)
    }

    protected generateRuleArgFields(pub = true): string {
        const fieldLines = this.fields
            .map(f => {
                if (f.definitionRuleArg !== undefined) {
                    return f.definitionRuleArg()
                } else {
                    throw Error(`${f.name}(${f.constructor.name}) unimpl Field.definitionRuleArg()`)
                }
            })
            .filter((str) => str.length != 0) // 去掉定义内容为空的string

        return endent`${pub ? fieldLines.join('\n') : fieldLines.map(s => s.replace(/^pub\s/g, '')).join('\n')}`
    }

    detectorDefinition(rename: string | undefined = undefined): string {
        const serdeDerive = generateAttributesCode(['Serialize', 'Deserialize', 'Debug'])
        
        return endent`
            ${serdeDerive}
            pub struct ${rename === undefined? this.name : rename} {
                ${this.generateRuleArgFields()}
            }
        `
    }

    // 生成struct的check_arg方法代码
    detectorFunctionDefinition(modName: string, rename: string | undefined = undefined): string {
        // 生成struct所有有效feilds的比较代码
        const fieldDetectCodes: (string)[] = []
        this.fields.forEach(f => {
            if (f.generateDetectCode !== undefined) {
                fieldDetectCodes.push(f.generateDetectCode("Struct", this.name))
            }
            else {
                throw Error(`${f.name}(${f.constructor.name}) unimpl Field.generateDetectCode()`)
            }
        })
        
        return endent`
            impl ${rename === undefined? this.name : rename} {
                pub fn check_arg(&self, ${this.snakeCaseName()}: &${modName}::${this.name}) -> bool {
                    ${fieldDetectCodes.join('\n').concat('\n')}
                    true
                }
            }
        `
    }
}