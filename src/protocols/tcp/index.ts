import { numeric } from "../../api"
import {
    createBitNumericField as bitNumeric,
    createBytesReferenceFieldSimple as bytesRef,
    createCountVar
} from "../../api/input"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { ConditionImpl, OptionField } from "../../field/option"
import { StructField } from "../../field/struct"
import { BitFieldStruct } from "../../types/bit-struct"
import { Struct } from "../../types/struct"
import { Protocol } from ".././generator"

// const tcpHeader = new BitFieldStruct(
//     'TcpHeader',
//     [
//         bitNumeric('src_port', 16, 'be_u16'),
//         bitNumeric('dst_port', 16, 'be_u16'),
//         bitNumeric('seq', 32, 'be_u32'),
//         bitNumeric('ack', 32, 'be_u32'),
//         bitNumeric('header_length', 4, 'u8'),
//         bitNumeric('reserved', 3, 'u8'),
//         bitNumeric('flags', 9, 'be_u16'),
//         bitNumeric('window_size', 16, 'be_u16'),
//         bitNumeric('checksum', 16, 'be_u16'),
//         bitNumeric('urgent_pointer', 16, 'be_u16'),
//     ]
// )

const tcpOptions = new OptionField(
    'options',
    new ConditionImpl(
        'header_length',
        (headerLen) => `(${headerLen} * 4) > 20`
    ),
    bytesRef(
        'options',
        createCountVar('header_length', (headerLen) => `${headerLen} * 4 - 20`)
    )
)

const group = new BitNumericFieldGroup([
    bitNumeric('header_length', 4, 'u8'),
    bitNumeric('reserved', 3, 'u8'),
    bitNumeric('flags', 9, 'be_u16'),
])

const tcp = new Struct(
    'Tcp',
    [
        numeric('src_port', 'be_u16'),
        numeric('dst_port', 'be_u16'),
        numeric('seq', 'be_u32'),
        numeric('ack', 'be_u32'),
        group,
        numeric('window_size', 'be_u16'),
        numeric('checksum', 'be_u16'),
        numeric('urgent_pointer', 'be_u16'),
        tcpOptions,
    ]
)

const structs = [
    // tcpHeader,
    tcp
]

export const Tcp = new Protocol({
    name: 'Tcp',
    structs
})