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

    generateExpression() {
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

    typeName() {
        return `Option<${this.field.typeName()}>`
    }

    isRef() {
        return this.field.isRef()
    }

    isUserDefined() {
        return false
    }

    parserInvocation() {
        return ``
    }

    generateIfExpression() {
        const condition = this.condition.generateExpression()
        return endent`if ${condition} {
            ${this.field.generateParseStatement()}
            Ok((input, Some(${this.field.name})))
        } else {
            Ok((input, None))
        }`
    }

    generateParseStatement() {
        return endent`let (input, ${this.name}) = ${this.generateIfExpression()}?;`
    }

}