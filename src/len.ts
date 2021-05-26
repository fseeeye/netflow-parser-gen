// export type CountMode = 'mul' | 'div'

// export interface CountVariable {
//     name: string
//     unitSize?: number
//     mode?: CountMode
// }

export class CountVariable {
    constructor(
        readonly name: string,
        // readonly unitSize: number = 1,
        // readonly mode: CountMode = 'mul',
        readonly expressionGenerator?: (name: string) => string
    ) {
    }

    // private multiply() {
    //     return `(${this.name} * ${this.unitSize})`
    // }

    // private divide() {
    //     return `(${this.name} as usize / ${this.unitSize} as usize)`
    // }

    // calculateSize() {
    //     if (this.unitSize === 1) {
    //         return this.name
    //     }
    //     if (this.mode === 'mul') {
    //         return this.multiply()
    //     }
    //     else {
    //         return this.divide()
    //     }
    // }

    count() {
        if (this.expressionGenerator !== undefined) {
            return this.expressionGenerator(this.name)
        }
        return this.name
    }


}

