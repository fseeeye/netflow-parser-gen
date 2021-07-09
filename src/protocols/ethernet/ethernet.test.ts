import { Ethernet } from "./index"

const answer = `
use nom::bits::bits;
use nom::bits::complete::take as take_bits;
use nom::bytes::complete::{tag, take};
use nom::combinator::{eof, map, peek};
use nom::error::ErrorKind;
use nom::multi::count;
use nom::number::complete::{be_u16, be_u32, u8};
use nom::sequence::tuple;
use nom::IResult;

use crate::PacketTrait;

#[derive(Debug, PartialEq)]
pub struct EthernetPacket<'a> {
    pub header: EthernetHeader<'a>,
    pub payload: EthernetPayload<'a>,
}

#[derive(Debug, PartialEq)]
pub struct EthernetHeader<'a> {
    pub dst_mac: &'a [u8],
    pub src_mac: &'a [u8],
    pub link_type: u16,
}

use super::ipv4::Ipv4Packet;
use super::ipv6::Ipv6Packet;

#[derive(Debug, PartialEq)]
pub enum EthernetPayload<'a> {
    Ipv4(Ipv4Packet<'a>),
    Ipv6(Ipv6Packet<'a>),
    Unknown(&'a [u8]),
    Error(EthernetPayloadError),
}

#[derive(Debug, PartialEq)]
pub enum EthernetPayloadError {
    Ipv4,
    Ipv6,
    Empty,
}

impl<'a> PacketTrait<'a> for EthernetPacket<'a> {
    type Header = EthernetHeader<'a>;
    type Payload = EthernetPayload<'a>;
    type PayloadError = EthernetPayloadError;

    fn parse_header(input: &'a [u8]) -> nom::IResult<&'a [u8], Self::Header> {
        let (input, dst_mac) = take(6usize)(input)?;
        let (input, src_mac) = take(6usize)(input)?;
        let (input, link_type) = be_u16(input)?;
        Ok((
            input,
            EthernetHeader {
                dst_mac,
                src_mac,
                link_type,
            },
        ))
    }
    fn parse_payload(
        input: &'a [u8],
        _header: &Self::Header,
    ) -> nom::IResult<&'a [u8], Self::Payload> {
        let (input, version) = match peek(u8)(input) {
            Ok((input, version)) => (input, version),
            Err(nom::Err::Error((input, _))) => {
                return Ok((input, EthernetPayload::Error(EthernetPayloadError::Empty)))
            }
            _ => return Ok((input, EthernetPayload::Error(EthernetPayloadError::Empty))),
        };
        match version >> 4 {
            0x04 => match Ipv4Packet::parse(input) {
                Ok((input, ipv4)) => Ok((input, EthernetPayload::Ipv4(ipv4))),
                Err(_) => Ok((input, EthernetPayload::Error(EthernetPayloadError::Ipv4))),
            },
            0x06 => match Ipv6Packet::parse(input) {
                Ok((input, ipv6)) => Ok((input, EthernetPayload::Ipv6(ipv6))),
                Err(_) => Ok((input, EthernetPayload::Error(EthernetPayloadError::Ipv6))),
            },
            _ => Ok((input, EthernetPayload::Unknown(input))),
        }
    }
    fn parse(input: &'a [u8]) -> nom::IResult<&'a [u8], Self> {
        let (input, header) = Self::parse_header(input)?;
        let (input, payload) = Self::parse_payload(input, &header)?;
        Ok((input, Self { header, payload }))
    }
}
`

test('test ethernet', () => {
    expect(
        `\n` + Ethernet.generateParser()
    ).toEqual(answer)
})