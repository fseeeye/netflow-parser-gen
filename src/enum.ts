import endent from "endent"
import { snakeCase } from "snake-case"
import { generateAttributesCode, Struct } from "./struct"

export { }

export class StructEnumVariant extends Struct {
    protected lifetimeSpecifier(): string {
        return ``
    }

    protected visibilitySpecifier() {
        return ``
    }

    protected attributes() {
        return ``
    }

    protected header() {
        return ``
    }

}

export class StructEnum {

    constructor(
        readonly name: string,
        readonly variants: StructEnumVariant[],
    ) { }

    private generateVariants() {
        const variants = this.variants.map((variant) => variant.compile())
        return endent`{
            ${variants.join(`,`)}
        }`
    }

    private hasReference() {
        return this.variants.filter((variant) => variant.hasReference()).length !== 0
    }

    private lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    private header() {
        return `pub enum `
    }

    definition() {
        return `${this.header()}${this.name} ${this.lifetimeSpecifier()} ${this.generateVariants()}`
    }

    compile() {
        const attributes = generateAttributesCode()
        const definition = this.definition()
        return [attributes, definition].join(`\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}