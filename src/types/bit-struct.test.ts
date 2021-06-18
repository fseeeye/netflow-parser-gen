// import { BitFieldStruct } from "./bit-struct"
// import { createBitNumericField as bitNumeric } from "../api/input"
// import endent from "endent"

// export function getIpv4Header() {
//     const ipv4Header = new BitFieldStruct(
//         'Ipv4Header',
//         [
//             bitNumeric('version', 4, 'u8'),
//             bitNumeric('header_length', 4, 'u8'),
//             bitNumeric('diff_service', 6, 'u8'),
//             bitNumeric('ecn', 2, 'u8'),
//             bitNumeric('total_length', 16, 'be_u16'),
//             bitNumeric('id', 16, 'be_u16'),
//             bitNumeric('flags', 3, 'u8'),
//             bitNumeric('fragment_offset', 13, 'be_u16'),
//             bitNumeric('ttl', 8, 'u8'),
//             bitNumeric('protocol', 8, 'u8'),
//             bitNumeric('checksum', 16, 'be_u16'),
//             bitNumeric('src_ip', 32, 'be_u32'),
//             bitNumeric('dst_ip', 32, 'be_u32'),
//         ]
//     )
//     return ipv4Header
// }

// test('test bit field struct', () => {
//     const ipv4Header = getIpv4Header()
//     // console.log(ipv4Header.definition())
//     expect(ipv4Header.definition()).toEqual(endent`
//     #[derive(Debug, PartialEq)]
//     pub struct Ipv4Header {
//         pub version: u8,
//         pub header_length: u8,
//         pub diff_service: u8,
//         pub ecn: u8,
//         pub total_length: u16,
//         pub id: u16,
//         pub flags: u8,
//         pub fragment_offset: u16,
//         pub ttl: u8,
//         pub protocol: u8,
//         pub checksum: u16,
//         pub src_ip: u32,
//         pub dst_ip: u32,
//     }
//     `)
//     // console.log(ipv4Header.parserFunctionDefinition())
//     expect(ipv4Header.parserFunctionDefinition()).toEqual(endent`
//     fn parse_bits_ipv4_header(input: (&[u8], usize)) -> IResult<(&[u8], usize),  Ipv4Header> {
//         let (input, version) = take_bits(4usize)(input)?;
//         let (input, header_length) = take_bits(4usize)(input)?;
//         let (input, diff_service) = take_bits(6usize)(input)?;
//         let (input, ecn) = take_bits(2usize)(input)?;
//         let (input, total_length) = take_bits(16usize)(input)?;
//         let (input, id) = take_bits(16usize)(input)?;
//         let (input, flags) = take_bits(3usize)(input)?;
//         let (input, fragment_offset) = take_bits(13usize)(input)?;
//         let (input, ttl) = take_bits(8usize)(input)?;
//         let (input, protocol) = take_bits(8usize)(input)?;
//         let (input, checksum) = take_bits(16usize)(input)?;
//         let (input, src_ip) = take_bits(32usize)(input)?;
//         let (input, dst_ip) = take_bits(32usize)(input)?;
//         Ok((
//             input,
//             Ipv4Header {
//                 version,
//                 header_length,
//                 diff_service,
//                 ecn,
//                 total_length,
//                 id,
//                 flags,
//                 fragment_offset,
//                 ttl,
//                 protocol,
//                 checksum,
//                 src_ip,
//                 dst_ip
//             }
//         ))
//     }

//     fn parse_ipv4_header(input: &[u8]) -> IResult<&[u8], Ipv4Header> {
//         bits(parse_bits_ipv4_header)(input)
//     }
//     `)
// })

test('', () => { })