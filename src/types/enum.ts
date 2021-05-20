import endent from "endent"
import { snakeCase } from "snake-case"
import { generateAttributesCode } from "../utils"
import { Struct } from "./struct"
import { Field } from "../field/base"
import { FieldType } from "./base"

export type ChoiceType = string | number

export class StructEnumVariant extends Struct {
    constructor(
        readonly name: string,
        readonly fields: Field[],
        readonly choice: ChoiceType,
    ) {
        super(name, fields)
    }

    protected visibilitySpecifier() {
        return ``
    }

    definition() {
        return `${this.name} ${this.generateFields()}`
    }

}

export class StructEnum implements FieldType {

    constructor(
        readonly name: string,
        readonly variants: StructEnumVariant[],
        readonly choiceField: Field,
        // readonly variantMap: Map<number | string, StructEnumVariant>,
    ) {
        // this.validateVariants()
    }

    typeName() {
        return this.name
    }

    isUserDefined() {
        return true
    }

    parserFunctionName() {
        return `parse_${this.snakeCaseName()}`
    }

    isRef() {
        return this.hasReference()
    }

    // private validateVariants(): void {
    //     const variantNames = this.variants.map((variant) => variant.name)
    //     for (const [_, variant] of this.variantMap) {
    //         if (variantNames.includes(variant.name) === false) {
    //             throw Error(`variant ${variant.name} not found!`)
    //         }
    //     }
    // }

    private generateVariants() {
        const variants = this.variants.map((variant) => variant.definition())
        return endent`{
            ${variants.join(`,\n`)}
        }`
    }

    private hasReference() {
        return this.variants.filter((variant) => variant.hasReference()).length !== 0
    }

    private lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    // definition() {
    //     return `pub enum ${this.name} ${this.lifetimeSpecifier()} ${this.generateVariants()}`
    // }

    definition() {
        const attributes = generateAttributesCode()
        const definition = `pub enum ${this.name} ${this.lifetimeSpecifier()} ${this.generateVariants()}`
        return [attributes, definition].join(`\n`)
    }

    snakeCaseName() {
        return snakeCase(this.name)
    }

}
