import endent from "endent"
import { snakeCase } from "snake-case"
import { Field, VisibilityType } from "../field/base"
import { FieldType } from "./base"
import { StructParserGenerator } from "../parser/struct"
import { generateAttributesCode } from "../utils"
// import { BytesReferenceField, BYTES_REF_TYPENAME } from "../field/ref"

// function validateReferenceDependency(fields: Field[]) {
//     fields.forEach((field, index) => {
//         if (field.typeName() !== BYTES_REF_TYPENAME) {
//             return
//         }
//         const depdendencyName = (field as BytesReferenceField).lengthVariable.name
//         const prevFieldNames = fields.slice(0, index).map(field => field.name)
//         if (prevFieldNames.includes(depdendencyName) === false) {
//             throw Error(`bytes reference dependency check failed: length variable for ${field.name} : ${depdendencyName} not found!`)
//         }
//     })
// }


export class Struct implements FieldType {

    constructor(
        readonly name: string,
        readonly fields: Field[],
    ) {
        // validateReferenceDependency(fields)
    }

    typeName(): string {
        return this.name
    }

    isRef(): boolean {
        return this.hasReference()
    }

    isUserDefined(): boolean {
        return true
    }

    parserFunctionName(): string {
        return `parse_${this.snakeCaseName()}`
    }

    parserFunctionDefinition(): string {
        const gen = new StructParserGenerator(this)
        return gen.generateParser()
        // return gen.generateParserWithUserDefinedFields()
    }

    protected visibilitySpecifier(): VisibilityType {
        return `pub`
    }

    protected generateFields(): string {
        const fieldLines = this.fields.map((field) => {
            // return `${this.visibilitySpecifier()} ${field.name}: ${field.typeName()},`
            const fieldDef = field.definition(this.visibilitySpecifier())
            return `${fieldDef}`
        })
        return endent`{
            ${fieldLines.join('\n')}
        }`
    }

    public hasReference(): boolean {
        // 如果 field 带引用，则 struct 需要声明 lifetime
        return this.fields.filter((field) => field.isRef()).length !== 0
    }

    protected lifetimeSpecifier(): string {
        return this.hasReference() ? `<'a>` : ''
    }

    definition(): string {
        const attributes = generateAttributesCode()
        const lifetimeSpecifier = this.lifetimeSpecifier()
        const def = `pub struct ${this.name}${lifetimeSpecifier} ${this.generateFields()}`
        return [attributes, def].join(`\n`)
    }

    // // unused
    // private userDefinedFieldDefinitions() {
    //     const userDefinedFields = removeDuplicateByKey(
    //         this.fields.filter((field) => field.isUserDefined()),
    //         (field) => field.typeName()
    //     )

    //     const userDefinedFieldDefs = userDefinedFields.map((field) => {
    //         if (field.definition === undefined) {
    //             const fieldSignature = '`' + `${field.name}:${field.typeName()}` + '`'
    //             throw Error(`user defined field ${fieldSignature} has no definition!`)
    //         }
    //         return field.definition(this.visibilitySpecifier())
    //     })

    //     return userDefinedFieldDefs.join(`\n\n`)
    // }

    // // unused
    // definitionWithFields(): string {
    //     return [this.userDefinedFieldDefinitions(), this.definition()].join(`\n\n`)
    // }

    snakeCaseName(): string {
        return snakeCase(this.name)
    }
}