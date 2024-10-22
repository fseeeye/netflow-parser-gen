import endent from "endent"
import { createCountVar, createBytesReferenceFieldSimple as bytesRef } from "../api/input"
import { ConditionImpl, OptionField } from "./option"

function getOptionalRefField() {
    const field = bytesRef('options', createCountVar(
        'header.header_length',
        (name) => `${name} * 4 - 20`
    ))
    const condition = new ConditionImpl(
        'header.header_length',
        (name) => `${name} * 4 > 20`
    )
    const optionalRef = new OptionField(
        'options',
        condition,
        field
    )
    return optionalRef
}

test('test optional field', () => {
    const optionalRef = getOptionalRefField()
    // console.log(optionalRef.generateParseStatement())
    expect(optionalRef.generateParseStatement()).toEqual(endent`
    let (input, options) = if header.header_length * 4 > 20 {
        let (input, options) = take((header.header_length * 4 - 20) as usize)(input)?;
        Ok((input, Some(options)))
    } else {
        Ok((input, None))
    }?;
    `)
})

// test('test struct with optional field', () => {
//     const header = getIpv4Header()
//     const ipv4 = new Struct(
//         'Ipv4',
//         [
//             new StructField(header, 'header'),
//             getOptionalRefField()
//         ]
//     )
//     // console.log(ipv4.definition())
//     expect(ipv4.definition()).toEqual(endent`
//     #[derive(Debug, PartialEq, Eq, Clone)]
//     pub struct Ipv4<'a> {
//         pub header: Ipv4Header,
//         pub options: Option<&'a [u8]>,
//     }
//     `)
//     // console.log(header.parserFunctionDefinition())
//     // console.log(ipv4.parserFunctionDefinition())
//     expect(ipv4.parserFunctionDefinition()).toEqual(endent`
//     pub fn parse_ipv4(input: &[u8]) -> IResult<&[u8], Ipv4> {
//         let (input, header) = parse_ipv4_header(input)?;
//         let (input, options) = if header.header_length * 4 > 20 {
//             let (input, options) = take(header.header_length * 4 - 20)(input)?;
//             Ok((input, Some(options)))
//         } else {
//             Ok((input, None))
//         }?;
//         Ok((
//             input,
//             Ipv4 {
//                 header,
//                 options
//             }
//         ))
//     }
//     `)
// })