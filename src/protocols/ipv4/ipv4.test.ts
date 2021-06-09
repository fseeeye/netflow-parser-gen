import { Ipv4 } from "./index"

const answer = `
use nom::bits::bits;
use nom::bits::complete::take as take_bits;
use nom::bytes::complete::{tag, take};
use nom::multi::count;
use nom::combinator::eof;
use nom::sequence::tuple;
use nom::number::complete::{be_u32, be_u16, u8};
use nom::IResult;

#[derive(Debug, PartialEq)]
pub struct Ipv4<'a> {
    pub version: u8,
    pub header_length: u8,
    pub diff_service: u8,
    pub ecn: u8,
    pub total_length: u16,
    pub id: u16,
    pub flags: u8,
    pub fragment_offset: u16,
    pub ttl: u8,
    pub protocol: u8,
    pub checksum: u16,
    pub src_ip: u32,
    pub dst_ip: u32,
    pub options: Option<&'a [u8]>,
}

pub fn parse_ipv4(input: &[u8]) -> IResult<&[u8], Ipv4> {
    let (input, (version, header_length, diff_service, ecn)) = bits::<_, _, nom::error::Error<(&[u8], usize)>, _, _>(
        tuple((take_bits(4usize), take_bits(4usize), take_bits(6usize), take_bits(2usize)))
    )(input)?;
    let (input, total_length) = be_u16(input)?;
    let (input, id) = be_u16(input)?;
    let (input, (flags, fragment_offset)) = bits::<_, _, nom::error::Error<(&[u8], usize)>, _, _>(
        tuple((take_bits(3usize), take_bits(13usize)))
    )(input)?;
    let (input, ttl) = u8(input)?;
    let (input, protocol) = u8(input)?;
    let (input, checksum) = be_u16(input)?;
    let (input, src_ip) = be_u32(input)?;
    let (input, dst_ip) = be_u32(input)?;
    let (input, options) = if (header_length * 4) > 20 {
        let (input, options) = take(header_length * 4 - 20)(input)?;
        Ok((input, Some(options)))
    } else {
        Ok((input, None))
    }?;
    Ok((
        input,
        Ipv4 {
            version, header_length, diff_service, ecn,
            total_length,
            id,
            flags, fragment_offset,
            ttl,
            protocol,
            checksum,
            src_ip,
            dst_ip,
            options
        }
    ))
}`

test('test ipv4 v2', () => {
    // console.log(Ipv4.generateParser())
    expect(
        `\n` + Ipv4.generateParser()
    ).toEqual(
        answer
    )
})