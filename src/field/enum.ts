import endent from "endent"
import { snakeCase } from "snake-case"
import { StructEnumParserGenerator } from "../parser/enum"
import { StructEnum } from "../types/enum"
import { generateSerdeAttributesCode } from "../utils"
import { BaseField } from "./base"

export class EnumField extends BaseField {
    constructor(
        readonly structEnum: StructEnum,
        readonly fieldName?: string
    ) {
        super(fieldName || structEnum.snakeCaseName())
    }

    isRef(): boolean {
        return this.structEnum.isRef()
    }

    isUserDefined(): boolean {
        return true
    }

    typeName(): string {
        if (this.isRef()) {
            return `${this.structEnum.name}<'a>`
        }
        return this.structEnum.name
    }

    parserInvocation(): string {
        return this.structEnum.parserFunctionName()
    }

    // definition() {
    //     return this.structEnum.definition()
    // }

    definitionRuleArg(): string {
        const serdeAttributes = generateSerdeAttributesCode(['flatten'])
        return endent`
            ${serdeAttributes}
            pub ${this.name}: Option<${this.structEnum.name}>
        `
    }

    parserImplementation(): string {
        const gen = new StructEnumParserGenerator(this.structEnum)
        return gen.generateParser()
    }

    generateParseStatement(): string {
        // const choiceFieldName = this.structEnum.choiceField.name
        // const passByRef = this.structEnum.choiceField.field.isUserDefined()
        // const choiceParameter = passByRef ? `&${choiceFieldName}` : choiceFieldName
        if (this.structEnum.choiceField.isWithoutInput()) {
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input)?;`
        } else {
            const choiceParameter = this.structEnum.choiceField.asEnumParserInvocationArgument()
            return `let (input, ${this.name}) = ${this.parserInvocation()}(input, ${choiceParameter})?;`
        }
    }

    generateDetectCode(parentType: "Struct" | "StructEnum", parentName: string): string {
        const name = this.name

        if (parentType === "Struct") {
            return endent`
                if let Some(${name}) = &self.${name} {
                    if !${name}.check_arg(&${snakeCase(parentName)}.${name}) {
                        return false
                    }
                }
            `
        } else { // s instanceof StructEnum
            return endent`
                if let Some(${name}) = ${name} {
                    if !${name}.check_arg(_${name}) {
                        return false
                    }
                }
            `
        }
    }
}