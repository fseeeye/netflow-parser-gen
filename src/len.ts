export type CountMode = 'mul' | 'div'

export interface CountVariable {
    name: string
    unitSize?: number
    mode?: CountMode
}

export class CountVariableImpl implements CountVariable {
    constructor(
        readonly name: string,
        readonly unitSize: number = 1,
        readonly mode: CountMode = 'mul',
    ) {
        if (unitSize === 0) {
            throw Error(`unit size should not be 0!`)
        }
    }

    private multiply() {
        return `${this.name} * ${this.unitSize}`
    }

    private divide() {
        return `(${this.name} as usize / ${this.unitSize} as usize)`
    }

    count() {
        if (this.unitSize === 1) {
            return this.name
        }
        if (this.mode === 'mul') {
            return this.multiply()
        }
        else {
            return this.divide()
        }
    }

}

