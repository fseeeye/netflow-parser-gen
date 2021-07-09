import { bitNumeric, bytesRef, numeric, sizedBytes } from "../../api"
import { createCountVar } from "../../api/input"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { ConditionImpl, OptionField } from "../../field/option"
import { PayloadField } from "../../field/payload"
import { PayloadEnumChoice } from "../../field/choice"
import { PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"
import { StructField } from "../../field/struct"
import { TcpPacket } from "../tcp"
import { UdpPacket } from "../udp"

const protocolName = 'Ipv6'
const packetName = `${protocolName}Packet`
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const group = new BitNumericFieldGroup(
    [
        bitNumeric('version', 4, 'u8'),
        bitNumeric('traffic_class', 8, 'u8'),
        bitNumeric('flow_label', 20, 'be_u32'),
    ]
)


const extensionHeader = new OptionField(
    'extension_headers',
    new ConditionImpl('payload_length',
        (payloadLen) => `${payloadLen} > 40`
    ),
    bytesRef(
        'extension_headers',
        createCountVar(
            'payload_length',
            (payloadLen) => `${payloadLen} - 40`)
    )
)

const header = new Struct(
    `${headerName}`,
    [
        group,
        numeric('payload_length', 'be_u16'),
        numeric('next_header', 'u8'),
        numeric('hop_limit', 'u8'),
        sizedBytes('src_ip', 16),
        sizedBytes('dst_ip', 16),
        extensionHeader,
    ]
)

// !Unimplement
const payload = new PayloadEnum(
    `${payloadName}`,
    [
        new PayloadEnumVariant(`${payloadName}`, 0x06, TcpPacket),
        new PayloadEnumVariant(`${payloadName}`, 0x11, UdpPacket), 
    ],
    new PayloadEnumChoice(
        new StructField(header, '_header'),
        'next_header',
    )
)

const packet = new Struct (
    `${packetName}`,
    [
        new StructField(header),
        new PayloadField(payload),
    ]
)

const structs: Struct[] = []

export const Ipv6 = new Protocol({
    name: protocolName,
    packet,
    header,
    payload,
    structs
})