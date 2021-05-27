import { BitFieldStruct } from "../../types/bit-struct"
import { createBitNumericField as bitNumeric, createBytesReferenceFieldSimple, createCountVar } from "../../api/input"
import { ConditionImpl, OptionField } from "../../field/option"
import { Struct } from "../../types/struct"
import { StructField } from "../../field/struct"
import { Protocol } from "../generator"

const ipv4Header = new BitFieldStruct(
    'Ipv4Header',
    [
        bitNumeric('version', 4, 'u8'),
        bitNumeric('header_length', 4, 'u8'),
        bitNumeric('diff_service', 6, 'u8'),
        bitNumeric('ecn', 2, 'u8'),
        bitNumeric('total_length', 16, 'be_u16'),
        bitNumeric('id', 16, 'be_u16'),
        bitNumeric('flags', 3, 'u8'),
        bitNumeric('fragment_offset', 13, 'be_u16'),
        bitNumeric('ttl', 8, 'u8'),
        bitNumeric('protocol', 8, 'u8'),
        bitNumeric('checksum', 16, 'be_u16'),
        bitNumeric('src_ip', 32, 'be_u32'),
        bitNumeric('dst_ip', 32, 'be_u32'),
    ]
)

const ipv4Options = new OptionField(
    'options',
    new ConditionImpl(
        'header.header_length',
        (len) => `(${len} * 4) > 20`
    ),
    createBytesReferenceFieldSimple('options', createCountVar('header.header_length', (len) => `${len} * 4 - 20`))
)

const ipv4 = new Struct(
    'Ipv4',
    [
        new StructField(ipv4Header, 'header'),
        ipv4Options,
    ]
)

const structs = [
    ipv4Header,
    ipv4,
]

export const Ipv4 = new Protocol({
    name: 'Ipv4',
    structs
})