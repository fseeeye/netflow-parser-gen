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

    compile() {
        const attributes = generateAttributesCode()
        const definition = this.definition()
        return [attributes, definition].join('\n')
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }
}
