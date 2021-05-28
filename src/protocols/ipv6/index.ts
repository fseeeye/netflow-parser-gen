import { bitNumeric, bytesRef, sizedBytes } from "../../api"
import { createCountVar } from "../../api/input"
import { ConditionImpl, OptionField } from "../../field/option"
import { StructField } from "../../field/struct"
import { BitFieldStruct } from "../../types/bit-struct"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"

const ipv6HeaderPrefix = new BitFieldStruct(
    'Ipv6HeaderPrefix',
    [
        bitNumeric('version', 4, 'u8'),
        bitNumeric('traffic_class', 8, 'be_u16'),
        bitNumeric('flow_label', 20, 'be_u32'),
        bitNumeric('payload_length', 16, 'be_u16'),
        bitNumeric('next_header', 8, 'u8'),
        bitNumeric('hop_limit', 8, 'u8'),
    ]
)

const extensionHeader = new OptionField(
    'extension_headers',
    new ConditionImpl('prefix.payload_length',
        (payloadLen) => `${payloadLen} > 40`
    ),
    bytesRef(
        'extension_headers',
        createCountVar(
            'prefix.payload_length',
            (payloadLen) => `${payloadLen} - 40`)
    )
)

const ipv6Header = new Struct(
    'Ipv6',
    [
        new StructField(ipv6HeaderPrefix, 'prefix'),
        sizedBytes('src_ip', 16),
        sizedBytes('dst_ip', 16),
        extensionHeader,
    ]
)

const structs = [
    ipv6HeaderPrefix,
    ipv6Header,
]

export const Ipv6 = new Protocol({
    name: 'Ipv6',
    structs
})