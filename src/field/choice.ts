import { Field } from "./base"

export class ChoiceField {
    constructor(
        readonly field: Field,
        readonly matchTargetGenerator?: (choiceFieldName: string) => string,
    ) { }

    get name() {
        return this.field.name
    }

    generateMatchTarget() {
        if (this.matchTargetGenerator === undefined) {
            return this.name
        }
        return this.matchTargetGenerator(this.name)
    }

}
