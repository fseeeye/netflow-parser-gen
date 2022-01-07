import { NamedStructVariant, StructEnum } from "../types/enum"
import { numeric } from "../api"
import { Ipv4 } from "../protocols/ipv4"
import { Ipv6 } from "../protocols/ipv6"
// import { StructEnumWithInlineChoiceParserGenerator } from "./enum"
import { InlineChoice } from "../field/choice"
import { StructEnumParserGenerator } from "./enum"
import endent from "endent"

test('test struct enum with inline choice', () => {
    const ip = new StructEnum(
        'L3',
        [
            new NamedStructVariant(0x04, 'Ipv4', Ipv4.definition.info.header),
            new NamedStructVariant(0x06, 'Ipv6', Ipv6.definition.info.header),
        ],
        new InlineChoice(
            numeric('version', 'u8'),
            (version) => `${version} >> 4`,
        ),
    )
    
    expect(ip.definition()).toEqual(endent`
        #[allow(non_camel_case_types)]
        #[derive(Debug, PartialEq, Eq, Clone)]
        pub enum L3<'a> {
            Ipv4(Ipv4<'a>),
            Ipv6(Ipv6<'a>)
        }
    `)
    const gen = new StructEnumParserGenerator(ip)

    expect(gen.generateParser()).toEqual(`

pub fn parse_l3(input: &[u8]) -> IResult<&[u8], L3> {
    debug!(target: "PARSER(parse_l3)", "enum L3");
    let (input, version) = peek(u8)(input)?;
    let (input, l3) = match version >> 4 {
        0x04 => {
            let (input, ipv4_header) = parse_ipv4_header(input)?;
            Ok((input, L3::Ipv4Header(ipv4_header)))
        },
        0x06 => {
            let (input, ipv6_header) = parse_ipv6_header(input)?;
            Ok((input, L3::Ipv6Header(ipv6_header)))
        },
        _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
    }?;
    Ok((input, l3))
}`)
    
})