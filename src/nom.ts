import endent from "endent"

export enum NomBytesFunction {
    take = 'take',
    tag = 'tag',
}

export enum NomMultiFunction {
    count = 'count',
}

export enum NomNumberFunction {
    u8 = 'u8',
    be_u16 = 'be_u16',
    be_u32 = 'be_u32',
    be_u64 = 'be_u64',
    le_u16 = 'le_u16',
    le_u32 = 'le_u32',
    le_u64 = 'le_u64',
}

export enum NomCombinatorFunction {
    eof = 'eof'
}

export function generateNomImport() {
    const code = endent`
    use nom::bytes::complete::{tag, take};
    use nom::multi::count;
    use nom::number::complete::{be_u32, be_u16, u8};
    use nom::sequence::tuple;
    use nom::IResult;
    `
    return code
}

