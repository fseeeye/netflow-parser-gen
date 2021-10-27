import { NomCombinatorFunction } from "../utils/nom";
import { Field } from "./base";
import { NestedField } from "./special";

export class PeekField extends NestedField {
    constructor(
        readonly inner_field: Field
    ) {
        super(inner_field)
    }

    parserInvocation(): string {
        return `${NomCombinatorFunction.peek}(${this.innerField.parserInvocation()})`
    }

    generateParseStatement(): string {
        return `let (input, (${this.innerField.name})) = ${this.parserInvocation()}(${this.parserInvocationParam()})?;`
    }
}