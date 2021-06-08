import { Tcp } from "./index"

const answer = `
use nom::bits::bits;
use nom::bits::complete::take as take_bits;
use nom::bytes::complete::{tag, take};
use nom::multi::count;
use nom::combinator::eof;
use nom::number::complete::{be_u32, be_u16, u8};
use nom::IResult;

#[derive(Debug, PartialEq)]
pub struct Tcp<'a> {
    pub src_port: u16,
    pub dst_port: u16,
    pub seq: u32,
    pub ack: u32,
    pub header_length: u8,
    pub reserved: u8,
    pub flags: u16,
    pub window_size: u16,
    pub checksum: u16,
    pub urgent_pointer: u16,
    pub options: Option<&'a [u8]>,
}

pub fn parse_tcp(input: &[u8]) -> IResult<&[u8], Tcp> {
    let (input, src_port) = be_u16(input)?;
    let (input, dst_port) = be_u16(input)?;
    let (input, seq) = be_u32(input)?;
    let (input, ack) = be_u32(input)?;
    let (input, (header_length, reserved, flags)) = bits::<_, _, nom::error::Error<(&[u8], usize)>, _, _>(
        tuple((take_bits(4usize), take_bits(3usize), take_bits(9usize)))
    )(input)?;
    let (input, window_size) = be_u16(input)?;
    let (input, checksum) = be_u16(input)?;
    let (input, urgent_pointer) = be_u16(input)?;
    let (input, options) = if (header_length * 4) > 20 {
        let (input, options) = take(header_length * 4 - 20)(input)?;
        Ok((input, Some(options)))
    } else {
        Ok((input, None))
    }?;
    Ok((
        input,
        Tcp {
            src_port,
            dst_port,
            seq,
            ack,
            header_length, reserved, flags,
            window_size,
            checksum,
            urgent_pointer,
            options
        }
    ))
}`

test('test tcp', () => {
    // console.log(Tcp.generateParser())
    expect(
        `\n` + Tcp.generateParser()
    ).toEqual(answer)
})