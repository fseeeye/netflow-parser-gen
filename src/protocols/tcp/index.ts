import { numeric } from "../../api"
import {
    createBitNumericField as bitNumeric,
    createBytesReferenceFieldSimple as bytesRef,
    createCountVar
} from "../../api/input"
import { Struct } from "../../types/struct"
import { StructEnum, PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { ConditionImpl, OptionField } from "../../field/option"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { PayloadEnumChoice } from "../../field/choice"
import { StructField } from "../../field/struct"
import { PayloadField } from "../../field/payload"
import { Protocol } from ".././generator"
import { ModbusReqPacket } from "../modbus_req"
import { ModbusRspPacket } from "../modbus_rsp"

const protocolName = 'Tcp'
const packetName = `${protocolName}Packet`
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

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

const header = new Struct(
    `${headerName}`,
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

const payload = new PayloadEnum(
    `${payloadName}`,
    [
        new PayloadEnumVariant(`${payloadName}`, 502, ModbusRspPacket), 
    ],
    new PayloadEnumChoice(
        new StructField(header, '_header'),
        'src_port',
    ),
    new PayloadEnum(
        `${payloadName}`,
        [
            new PayloadEnumVariant(`${payloadName}`, 502, ModbusReqPacket), 
        ],
        new PayloadEnumChoice(
            new StructField(header, '_header'),
            'dst_port',
        )
    )
)

export const TcpPacket = new Struct (
    `${packetName}`,
    [
        new StructField(header),
        new PayloadField(payload),
    ]
)

export const Tcp = new Protocol({
    name: protocolName,
    packet: TcpPacket,
    header,
    payload,
    structs
})