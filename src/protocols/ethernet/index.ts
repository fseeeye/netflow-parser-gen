import { createNumericFieldSimple as numeric } from "../../api/input"
import { PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { PayloadEnumChoice } from "../../field/choice"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"
import { Ipv4 } from "../ipv4"
import { Ipv6 } from "../ipv6"
import { MacAddress } from "../../field/address"
import { StructField } from "../../field/struct"
import { Goose } from "../goose"
import { Vlan } from "../vlan"

const protocolName = 'Ethernet'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const header = new Struct(
    `${headerName}`,
    [
        new MacAddress('dst_mac'),
        new MacAddress('src_mac'),
        numeric('link_type', 'be_u16'),
    ]
)

const info = new ProtocolInfo(protocolName, 'L2', header)

const payload = new PayloadEnum(
    `${payloadName}`,
    info,
    [
        new PayloadEnumVariant(0x0800, Ipv4),
        new PayloadEnumVariant(0x8100, Vlan),
        new PayloadEnumVariant(0x86DD, Ipv6),
        new PayloadEnumVariant(0x88B8, Goose),
    ],
    new PayloadEnumChoice(
        new StructField(header),
        'link_type',
    )
)

const structs: (Struct)[] = []

export const Ethernet = new Protocol({
    info,
    payload,
    structs
})