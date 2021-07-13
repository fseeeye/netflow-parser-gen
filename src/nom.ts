import endent from "endent"

export enum NomBytesFunction {
    take = 'take',
    tag = 'tag',
}

export enum NomBitsFunction {
    // warning: must use with `use nom::bits::complete::take as take_bits;`
    take = 'take_bits'
}

export enum NomMultiFunction {
    count = 'count',
    bits = 'bits'
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
    #[allow(unused)]
    use nom::bits::bits;
    #[allow(unused)]
    use nom::bits::complete::take as take_bits;
    #[allow(unused)]
    use nom::bytes::complete::{tag, take};
    #[allow(unused)]
    use nom::combinator::{eof, map, peek};
    #[allow(unused)]
    use nom::error::{ErrorKind, Error};
    #[allow(unused)]
    use nom::multi::count;
    #[allow(unused)]
    use nom::number::complete::{be_u16, be_u32, u8};
    #[allow(unused)]
    use nom::sequence::tuple;
    #[allow(unused)]
    use nom::IResult;

    use crate::PacketTrait;

    `
    return code
}