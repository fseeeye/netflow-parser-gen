import { createFixSizedBytesField as sizedBytes, createNumericFieldSimple as numeric } from "../../api/input"
import { PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { InlineChoice } from "../../field/choice"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"
import { StructField } from "../../field/struct"
import { PayloadField } from "../../field/payload"
import { Ipv4 } from "../ipv4"
import { Ipv6 } from "../ipv6"

const protocolName = 'Ethernet'
const packetName = `${protocolName}Packet`
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const header = new Struct(
    `${headerName}`,
    [
        sizedBytes('dst_mac', 6),
        sizedBytes('src_mac', 6),
        numeric('link_type', 'be_u16'),
    ]
)

const payload = new PayloadEnum(
    `${payloadName}`,
    [
        new PayloadEnumVariant(`${payloadName}`, 0x04, Ipv4.definition.packet),
        new PayloadEnumVariant(`${payloadName}`, 0x06, Ipv6.definition.packet),
    ],
    new InlineChoice(
        numeric('version', 'u8'),
        (version) => `${version} >> 4`,
    )
)

const packet = new Struct (
    `${packetName}`,
    [
        new StructField(header),
        new PayloadField(payload),
    ]
)

const structs: (Struct)[] = []

export const Ethernet = new Protocol({
    name: protocolName,
    packet,
    header,
    payload,
    structs
})