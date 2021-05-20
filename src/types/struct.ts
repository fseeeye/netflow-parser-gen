import endent from "endent"
import { snakeCase } from "snake-case"
import { Field } from "../field/base"
import { FieldType } from "./base"
import { StructParserGenerator } from "./parser"
import { generateAttributesCode } from "../utils"

export class Struct implements FieldType {

    constructor(
        readonly name: string,
        readonly fields: Field[],
    ) {
    }

    typeName() {
        return this.name
    }

    isRef() {
        return this.hasReference()
    }

    isUserDefined() {
        return true
    }

    parserFunctionName() {
        return `parse_${snakeCase(this.name)}`
    }

    parserFunctionDefinition() {
        const gen = new StructParserGenerator(this)
        return gen.generateParser()
    }

    protected visibilitySpecifier(): string {
        return `pub`
    }

    protected generateFields() {
        const fieldLines = this.fields.map((field) => {
            return `${this.visibilitySpecifier()} ${field.name} : ${field.typeName()},`
        })
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    public hasReference() {
        // 如果 field 带引用，则 struct 需要声明 lifetime
        return this.fields.filter((field) => field.isRef()).length !== 0
    }

    private lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    definition() {
        const attributes = generateAttributesCode()
        const lifetimeSpecifier = this.lifetimeSpecifier()
        const def = `pub struct ${this.name} ${lifetimeSpecifier} ${this.generateFields()}`
        return [attributes, def].join(`\n`)
    }

    userDefinedFieldDefinitions() {
        const userDefinedFields = this.fields.filter((field) => field.isUserDefined()).map((field) => {
            if (field.definition === undefined) {
                const fieldSignature = '`' + `${field.name}:${field.typeName()}` + '`'
                throw Error(`user defined field ${fieldSignature} has no definition!`)
            }
            return field.definition()
        })
        return userDefinedFields.join(`\n\n`)
    }

    definitionWithFields() {
        return [this.userDefinedFieldDefinitions(), this.definition()].join(`\n\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }
}