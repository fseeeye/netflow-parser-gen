import { ChoiceField, NamedStructVariant, StructEnum } from "../types/enum"
import { numeric } from "../api"
import { Ipv4 } from "../protocols/ipv4"
import { Ipv6 } from "../protocols/ipv6"
import { Struct } from "../types/struct"
import { StructEnumWithInlineChoiceParserGenerator } from "./enum"

test('test struct enum with inline choice', () => {
    const ip = new StructEnum(
        'L3',
        [
            new NamedStructVariant('L3', 0x04, 'Ipv4', Ipv4.definition.structs[0] as Struct),
            new NamedStructVariant('L3', 0x06, 'Ipv6', Ipv6.definition.structs[0] as Struct),
        ],
        new ChoiceField(
            numeric('version', 'u8'),
            (version) => `${version} >> 4`,
        ),
    )
    console.log(ip.definition())
    const gen = new StructEnumWithInlineChoiceParserGenerator(ip)
    console.log(gen.generateParser())
})