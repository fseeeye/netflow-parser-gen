import endent from "endent"
import { BaseField, Field } from "./base"

interface Condition {
    variable: string,
    generateExpression: () => string
}

export class ConditionImpl implements Condition {
    constructor(
        readonly variable: string,
        readonly expressionGenerator: (name: string) => string
    ) { }

    generateExpression(): string {
        return this.expressionGenerator(this.variable)
    }
}

export class OptionField extends BaseField {
    constructor(
        readonly name: string,
        readonly condition: Condition,
        readonly field: Field,
    ) {
        super(name)
    }

    typeName(): string {
        return `Option<${this.field.typeName()}>`
    }

    isRef(): boolean {
        return this.field.isRef()
    }

    isUserDefined(): boolean {
        return false
    }

    parserInvocation(): string {
        return ``
    }

    generateIfExpression(): string {
        const condition = this.condition.generateExpression()
        return endent`if ${condition} {
            ${this.field.generateParseStatement()}
            Ok((input, Some(${this.field.name})))
        } else {
            Ok((input, None))
        }`
    }

    generateParseStatement(): string {
        return endent`let (input, ${this.name}) = ${this.generateIfExpression()}?;`
    }

}