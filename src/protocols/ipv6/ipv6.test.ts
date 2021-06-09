import { Ipv6 } from "./index"

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
pub struct Ipv6<'a> {
    pub version: u8,
    pub traffic_class: u8,
    pub flow_label: u32,
    pub payload_length: u16,
    pub next_header: u8,
    pub hop_limit: u8,
    pub src_ip: &'a [u8],
    pub dst_ip: &'a [u8],
    pub extension_headers: Option<&'a [u8]>,
}

pub fn parse_ipv6(input: &[u8]) -> IResult<&[u8], Ipv6> {
    let (input, (version, traffic_class, flow_label)) = bits::<_, _, nom::error::Error<(&[u8], usize)>, _, _>(
        tuple((take_bits(4usize), take_bits(8usize), take_bits(20usize)))
    )(input)?;
    let (input, payload_length) = be_u16(input)?;
    let (input, next_header) = u8(input)?;
    let (input, hop_limit) = u8(input)?;
    let (input, src_ip) = take(16usize)(input)?;
    let (input, dst_ip) = take(16usize)(input)?;
    let (input, extension_headers) = if payload_length > 40 {
        let (input, extension_headers) = take(payload_length - 40)(input)?;
        Ok((input, Some(extension_headers)))
    } else {
        Ok((input, None))
    }?;
    Ok((
        input,
        Ipv6 {
            version, traffic_class, flow_label,
            payload_length,
            next_header,
            hop_limit,
            src_ip,
            dst_ip,
            extension_headers
        }
    ))
}`

test('test ipv6', () => {
    // console.log(Ipv6.generateParser())
    expect(
        `\n` + Ipv6.generateParser()
    ).toEqual(answer)
})