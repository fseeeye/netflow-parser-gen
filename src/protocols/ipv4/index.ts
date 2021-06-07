import { createBitNumericField as bitNumeric, createBytesReferenceFieldSimple, createCountVar } from "../../api/input"
import { numeric } from "../../api/index"
import { ConditionImpl, OptionField } from "../../field/option"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"
import { BitNumericFieldGroup } from "../../field/bit-field"

const group1 = new BitNumericFieldGroup(
    [
        bitNumeric('version', 4, 'u8'),
        bitNumeric('header_length', 4, 'u8'),
        bitNumeric('diff_service', 6, 'u8'),
        bitNumeric('ecn', 2, 'u8'),
    ]
)

const group2 = new BitNumericFieldGroup(
    [
        bitNumeric('flags', 3, 'u8'),
        bitNumeric('fragment_offset', 13, 'be_u16'),
    ]
)


const ipv4Options = new OptionField(
    'options',
    new ConditionImpl(
        'header_length',
        (len) => `(${len} * 4) > 20`
    ),
    createBytesReferenceFieldSimple('options', createCountVar('header_length', (len) => `${len} * 4 - 20`))
)

const ipv4 = new Struct(
    'Ipv4',
    [
        group1,
        numeric('total_length', 'be_u16'),
        numeric('id', 'be_u16'),
        group2,
        numeric('ttl', 'u8'),
        numeric('protocol', 'u8'),
        numeric('checksum', 'be_u16'),
        numeric('src_ip', 'be_u32'),
        numeric('dst_ip', 'be_u32'),
        ipv4Options,
    ]
)

const structs = [
    ipv4,
]

export const Ipv4 = new Protocol({
    name: ipv4.name,
    structs
})