import { NamedStructVariant, StructEnum } from "../types/enum"
import { numeric } from "../api"
import { Ipv4 } from "../protocols/ipv4"
import { Ipv6 } from "../protocols/ipv6"
// import { StructEnumWithInlineChoiceParserGenerator } from "./enum"
import { InlineChoice } from "../field/choice"
import { StructEnumParserGenerator } from "./enum"

test('test struct enum with inline choice', () => {
    const ip = new StructEnum(
        'L3',
        [
            new NamedStructVariant('L3', 0x04, 'Ipv4', Ipv4.definition.info.header),
            new NamedStructVariant('L3', 0x06, 'Ipv6', Ipv6.definition.info.header),
        ],
        new InlineChoice(
            numeric('version', 'u8'),
            (version) => `${version} >> 4`,
        ),
    )
    console.log(ip.definition())
    const gen = new StructEnumParserGenerator(ip)
    console.log(gen.generateParser())
})