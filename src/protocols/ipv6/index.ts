import { bitNumeric, bytesRef, numeric, sizedBytes } from "../../api"
import { createCountVar } from "../../api/input"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { ConditionImpl, OptionField } from "../../field/option"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"

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

const ipv6 = new Struct(
    'Ipv6',
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

const structs = [
    ipv6,
]

export const Ipv6 = new Protocol({
    name: 'Ipv6',
    structs
})