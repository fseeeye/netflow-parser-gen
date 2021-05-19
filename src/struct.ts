import endent from "endent"
import { snakeCase } from "snake-case"
import { Field } from "./field/base"

export const DEFAULT_ATTRIBUTES = [`Debug`, `PartialEq`]

export function generateAttributesCode(attributes: string[] = DEFAULT_ATTRIBUTES) {
    return `#[derive(${attributes.join(',')})]`
}


function validateFieldsDependency(fields: Field[]): boolean {
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        if (field.isRef === true && field.validateDependency !== undefined) {
            const prevFields = fields.slice(0, i)
            if (field.validateDependency(prevFields) === false) {
                console.log(`dependency not found for ${field.name}!`)
                return false
            }
        }
    }
    return true
}


export class Struct {

    constructor(
        readonly name: string,
        readonly fields: Field[],
    ) {
        if (validateFieldsDependency(fields) === false) {
            throw Error(`dependency check failed`)
        }
    }

    protected visibilitySpecifier(): string {
        return `pub`
    }

    protected generateFields() {
        const fieldLines = this.fields.map((field) => {
            return `${this.visibilitySpecifier()} ${field.name} : ${field.rustType()},`
        })
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    public hasReference() {
        // 如果 field 带引用，则 struct 需要声明 lifetime
        return this.fields.filter((field) => field.isRef).length !== 0
    }

    private lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    private definition() {
        const lifetimeSpecifier = this.lifetimeSpecifier()
        return `pub struct ${this.name} ${lifetimeSpecifier} ${this.generateFields()}`
    }

    compileSelfDefinition() {
        const attributes = generateAttributesCode()
        const definition = this.definition()
        return [attributes, definition].join('\n')
    }

    compileUDFDefnitions() {
        const userDefinedFields = this.fields.filter((field) => field.isUserDefined).map((field) => {
            if (field.definition === undefined) {
                const fieldSignature = '`' + `${field.name}:${field.rustType()}` + '`'
                throw Error(`user defined field ${fieldSignature} has no definition!`)
            }
            return field.definition()
        })
        return userDefinedFields.join(`\n\n`)
    }

    compileDefinition() {
        return [this.compileUDFDefnitions(), this.compileSelfDefinition()].join(`\n\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }
}
