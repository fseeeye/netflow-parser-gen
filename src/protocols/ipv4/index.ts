import { createBitNumericField as bitNumeric, createBytesReferenceFieldSimple, createCountVar } from "../../api/input"
import { numeric } from "../../api/index"
import { Struct } from "../../types/struct"
import { StructEnum, PayloadEnumVariant, PayloadEnum } from "../../types/enum"
import { ConditionImpl, OptionField } from "../../field/option"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { StructField } from "../../field/struct"
// import { EnumField } from "../../field/enum"
import { Protocol } from "../generator"
import { TcpPacket } from "../tcp"
import { UdpPacket } from "../udp"
import { PayloadEnumChoice } from "../../field/choice"
import { PayloadField } from "../../field/payload"

const protocolName = 'Ipv4'
const packetName = `${protocolName}Packet`
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
        numeric('src_ip', 'be_u32'),
        numeric('dst_ip', 'be_u32'),
        ipv4Options,
    ]
)

const payload = new PayloadEnum(
    `${payloadName}`,
    [
        new PayloadEnumVariant(`${payloadName}`, 0x06, TcpPacket),
        new PayloadEnumVariant(`${payloadName}`, 0x11, UdpPacket), 
    ],
    new PayloadEnumChoice(
        new StructField(header, '_header'),
        'protocol',
    )
)

const packet = new Struct (
    `${packetName}`,
    [
        new StructField(header),
        new PayloadField(payload),
    ]
)

const structs: (Struct|StructEnum)[] = []

export const Ipv4 = new Protocol({
    name: protocolName,
    packet: packet,
    header: header,
    payload: payload,
    structs
})