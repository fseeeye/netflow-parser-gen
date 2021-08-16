import { bitNumeric, bytesRef, numeric } from "../../api"
import { createCountVar } from "../../api/input"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { ConditionImpl, OptionField } from "../../field/option"
// import { PayloadField } from "../../field/payload"
import { PayloadEnumChoice } from "../../field/choice"
import { PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol, ProtocolInfo } from "../generator"
import { StructField } from "../../field/struct"
import { Tcp } from "../tcp"
import { Udp } from "../udp"
import { Ipv6Address } from "../../field/address"

const protocolName = 'Ipv6'
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
        new Ipv6Address('src_ip'),
        new Ipv6Address('dst_ip'),
        extensionHeader,
    ]
)

const info = new ProtocolInfo(protocolName, 'L3', header)

// !Unimplement
const payload = new PayloadEnum(
    payloadName,
    info,
    [
        new PayloadEnumVariant(0x06, Tcp),
        new PayloadEnumVariant(0x11, Udp), 
    ],
    new PayloadEnumChoice(
        new StructField(header),
        'next_header',
    )
)

const structs: Struct[] = []

export const Ipv6 = new Protocol({
    info,
    payload,
    structs
})