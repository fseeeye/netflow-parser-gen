import endent from "endent"
import { snakeCase } from "snake-case"
import { Field, validateFieldsDependency } from "./field"

export const DEFAULT_ATTRIBUTES = [`Debug`, `PartialEq`]

export function generateAttributesCode(attributes: string[] = DEFAULT_ATTRIBUTES) {
    return `#[derive(${attributes.join(',')})]`
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

    private generateFields() {
        const fieldLines = this.fields.map((field) => {
            return `${this.visibilitySpecifier()} ${field.name} : ${field.rustType()},`
        })
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    /**
     * TODO:
     * 实现引用类型 field
     */
    public hasReference() {
        // 如果 field 带引用，则 struct 需要声明 lifetime
        return this.fields.filter((field) => field.isRef).length !== 0
    }

    protected lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    protected header() {
        return `pub struct `
    }

    private definition() {
        const lifetimeSpecifier = this.lifetimeSpecifier()
        return `${this.header()}${this.name} ${lifetimeSpecifier} ${this.generateFields()}`
    }

    protected attributes() {
        return generateAttributesCode()
    }

    compile() {
        const attributes = this.attributes()
        const definition = this.definition()
        return [attributes, definition].join('\n')
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}
