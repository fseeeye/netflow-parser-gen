import endent from "endent"
import { snakeCase } from "snake-case"
import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { generateSerdeAttributesCode } from "../utils"
import { BaseField, Field } from "./base"


export class StructField extends BaseField {

    constructor(
        readonly struct: Struct,
        readonly fieldName?: string,
    ) {
        super(fieldName || struct.snakeCaseName())
    }

    isRef(): boolean {
        return this.struct.isRef()
    }

    isUserDefined(): boolean {
        return true
    }

    // definition() {
    //     return this.struct.definition()
    // }

    definitionRuleArg(): string {
        const serdeAttributes = generateSerdeAttributesCode(['flatten'])
        return endent`
            ${serdeAttributes}
            pub ${this.struct.snakeCaseName()}: Option<${this.struct.name}>,
        `
    }

    typeName(withLifetime = true): string {
        if (withLifetime && this.isRef()) {
            return `${this.struct.name}<'a>`
        }
        return this.struct.name
    }

    parserInvocation(): string {
        return this.struct.parserFunctionName()
    }

    parserInvocationParam(): string {
        if (this.struct.isWithoutInputs()) {
            return 'input'
        } else {
            const extraParam = this.struct.extraInputs.map(
                (field) => {
                    if (field.isRef()) {
                        return `&${field.name}`
                    } else {
                        return `${field.name}`
                    }
                }
            ).join(', ')
            return `input, ${extraParam}`
        }
    }

    parserImplementation(): string {
        const gen = new StructParserGenerator(this.struct)
        return gen.generateParser()
    }

    generateParseStatement(): string {
        return `let (input, ${this.name}) = ${this.parserInvocation()}(${this.parserInvocationParam()})?;`
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
            // 此时属于Enum中某variant的field
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


export class StructMemberField extends BaseField {
	constructor(
		readonly struct: StructField,
		readonly matchFieldName: Field,
		readonly fieldName?: string,
	) {
        super(fieldName || struct.name)
	}

	isRef(): boolean {
		return this.struct.isRef()
	}

	isUserDefined(): boolean {
		return true
	}

	typeName(): string {
		if (this.isRef()) {
			return `${this.struct.name}<'a>`
		}
		return this.struct.name
	}

	parserInvocation(): string {
		return this.struct.struct.parserFunctionName()
	}

}
