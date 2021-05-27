import { Ipv4 } from "./index"

const answer = `
use nom::bits::bits;
use nom::bits::complete::take as take_bits;
use nom::bytes::complete::{tag, take};
use nom::multi::count;
use nom::combinator::eof;
use nom::number::complete::{be_u32, be_u16, u8};
use nom::IResult;

#[derive(Debug, PartialEq)]
pub struct Ipv4Header {
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
}

#[derive(Debug, PartialEq)]
pub struct Ipv4<'a> {
    pub header: Ipv4Header,
    pub options: Option<&'a [u8]>,
}

fn parse_bits_ipv4_header(input: (&[u8], usize)) -> IResult<(&[u8], usize),  Ipv4Header> {
    let (input, version) = take_bits(4usize)(input)?;
    let (input, header_length) = take_bits(4usize)(input)?;
    let (input, diff_service) = take_bits(6usize)(input)?;
    let (input, ecn) = take_bits(2usize)(input)?;
    let (input, total_length) = take_bits(16usize)(input)?;
    let (input, id) = take_bits(16usize)(input)?;
    let (input, flags) = take_bits(3usize)(input)?;
    let (input, fragment_offset) = take_bits(13usize)(input)?;
    let (input, ttl) = take_bits(8usize)(input)?;
    let (input, protocol) = take_bits(8usize)(input)?;
    let (input, checksum) = take_bits(16usize)(input)?;
    let (input, src_ip) = take_bits(32usize)(input)?;
    let (input, dst_ip) = take_bits(32usize)(input)?;
    Ok((
        input,
        Ipv4Header {
            version,
            header_length,
            diff_service,
            ecn,
            total_length,
            id,
            flags,
            fragment_offset,
            ttl,
            protocol,
            checksum,
            src_ip,
            dst_ip
        }
    ))
}

fn parse_ipv4_header(input: &[u8]) -> IResult<&[u8], Ipv4Header> {
    bits(parse_bits_ipv4_header)(input)
}

pub fn parse_ipv4(input: &[u8]) -> IResult<&[u8], Ipv4> {
    let (input, header) = parse_ipv4_header(input)?;
    let (input, options) = if (header.header_length * 4) > 20 {
        let (input, options) = take(header.header_length * 4 - 20)(input)?;
        Ok((input, Some(options)))
    } else {
        Ok((input, None))
    }?;
    Ok((
        input,
        Ipv4 {
            header,
            options
        }
    ))
}`

test('test ipv4', () => {
    // console.log(Ipv4.generateParser())
    expect(
        `\n` + Ipv4.generateParser()
    ).toEqual(
        answer
    )
})