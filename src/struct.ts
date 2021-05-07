import endent from "endent"
import { snakeCase } from "snake-case"
import { Field, validateFieldsDependency } from "./field"

export class Struct {
    readonly attributes = [`Debug`, `PartialEq`]

    constructor(
        readonly name: string,
        readonly fields: Field[],
    ) {
        if (validateFieldsDependency(fields) === false) {
            throw Error(`dependency check failed`)
        }
    }

    private generateFields() {
        const fieldLines = this.fields.map((field) => {
            return `pub ${field.name} : ${field.rustType()},`
        })
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    /**
     * TODO:
     * 实现引用类型 field
     */
    private hasReference() {
        // 如果 field 带引用，则 struct 需要声明 lifetime
        return this.fields.filter((field) => field.isRef).length !== 0
    }

    private definition() {
        const lifetimeSpecifier = this.hasReference() ? `<'a>` : ''
        return `pub struct ${this.name} ${lifetimeSpecifier} ${this.generateFields()}`
    }

    compile() {
        const attributes = `#[derive(${this.attributes.join(',')})]`
        const definition = this.definition()
        return [attributes, definition].join('\n')
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}
