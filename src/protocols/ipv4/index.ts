import { createBitNumericField as bitNumeric, createBytesReferenceFieldSimple, createCountVar } from "../../api/input"
import { numeric } from "../../api/index"
import { Struct } from "../../types/struct"
import { StructEnum, PayloadEnumVariant, PayloadEnum } from "../../types/enum"
import { ConditionImpl, OptionField } from "../../field/option"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { StructField } from "../../field/struct"
import { Protocol, ProtocolInfo } from "../generator"
import { Tcp } from "../tcp"
import { Udp } from "../udp"
import { PayloadEnumChoice } from "../../field/choice"
import { Ipv4Address } from "../../field/address"
// import { PayloadField } from "../../field/payload"

const protocolName = 'Ipv4'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`


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

const header = new Struct(
    `${headerName}`,
    [
        group1,
        numeric('total_length', 'be_u16'),
        numeric('id', 'be_u16'),
        group2,
        numeric('ttl', 'u8'),
        numeric('protocol', 'u8'),
        numeric('checksum', 'be_u16'),
        new Ipv4Address('src_ip'),
        new Ipv4Address('dst_ip'),
        ipv4Options,
    ]
)

const info = new ProtocolInfo(protocolName, 'L3', header)

const payload = new PayloadEnum(
    `${payloadName}`,
    info,
    [
        new PayloadEnumVariant(0x06, Tcp),
        new PayloadEnumVariant(0x11, Udp), 
    ],
    new PayloadEnumChoice(
        new StructField(header),
        'protocol',
    )
)

const structs: (Struct|StructEnum)[] = []

export const Ipv4 = new Protocol({
    info,
    payload: payload,
    structs
})