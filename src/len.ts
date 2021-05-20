export interface LengthVariable {
    name: string
    count: () => string
}

export class LengthVariableInBytes implements LengthVariable {
    constructor(
        readonly name: string,
        readonly scale: number = 1
    ) { }

    count() {
        if (this.scale === 1) {
            return this.name
        }
        else {
            return `${this.name} * ${this.scale}`
        }
    }
}

export class CountVariable implements LengthVariable {
    constructor(
        readonly name: string,
        readonly unitSize: number,
    ) { }

    count() {
        return `(${this.name} as usize / ${this.unitSize} as usize)`
    }
}

