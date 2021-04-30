
enum NomNumberFunction {
    u8 = 'u8',
    be_u16 = 'be_u16',
    be_u32 = 'be_u32',
    be_u64 = 'be_u64',
}

enum NomBytesFunction {
    take = 'take',
    tag = 'tag',
}

type NomFunction = NomNumberFunction | NomBytesFunction

interface Type {
    name: string
    parser: NomFunction
}

class NomType implements Type {
    constructor(
        readonly name: string,
        readonly parser: NomFunction,
    ) { }

    toRustType() {
        return this.name
    }
}

export class PrimitiveNomType extends NomType {

    generateParser(fieldName: string) {
        return `let (input, ${fieldName}) = ${this.parser}(input)?;`
    }
}

export const u8 = new PrimitiveNomType('u8', NomNumberFunction.u8)
export const be_u16 = new PrimitiveNomType('u16', NomNumberFunction.be_u16)