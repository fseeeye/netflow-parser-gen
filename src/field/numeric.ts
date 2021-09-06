import endent from "endent"
import { snakeCase } from "snake-case"
import { NumericType } from "../types/numeric"
import { BaseField } from "./base"

export class NumericField extends BaseField {
    constructor(
        readonly name: string,
        readonly fieldType: NumericType
    ) {
        super(name)
    }

    isRef(): boolean {
        return false
    }

    isUserDefined(): boolean {
        return false
    }

    typeName(): string {
        return this.fieldType.typeName()
    }

    parserInvocation(): string {
        return this.fieldType.parserFunctionName()
    }

    definitionRuleArg(): string {
        return `pub ${this.name}: Option<${this.typeName()}>,`
    }

    generateDetectCode(parentType: "Struct" | "StructEnum", parentName: string): string {
        const name = this.name

        if (parentType === "Struct") {
            return endent`
                if let Some(${name}) = self.${name} {
                    if ${name} != ${snakeCase(parentName)}.${name} {
                        return false
                    }
                }
            `
        } else { // s instanceof StructEnum
            return endent`
                if let Some(${name}) = ${name} {
                    if ${name} != _${name} {
                        return false
                    }
                }
            `
        }
    } 
}
