import { bitsNumeric, numeric } from "../../api"
import {
    createBytesReferenceFieldSimple as bytesRef,
    createCountVar
} from "../../api/input"
import { Struct } from "../../types/struct"
import { StructEnum, PayloadEnum, PayloadEnumVariant, UndefPayloadEnumVariant } from "../../types/enum"
import { ConditionImpl, OptionField } from "../../field/option"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { PayloadEnumChoice } from "../../field/choice"
import { StructField } from "../../field/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"
import { ModbusReq } from "../modbus-req"
import { ModbusRsp } from "../modbus-rsp"
import { FinsTcpReq } from "../fins-tcp-req"
import { FinsTcpRsp } from "../fins-tcp-rsp"
import { Bacnet } from "../bacnet"
import { Dnp3 } from "../dnp3"
import { Iec104 } from "../iec104"
import { CodeField, CodeVarField } from "../../field/special"

const protocolName = 'Tcp'
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
    bitsNumeric('header_length', 4, 'u8'),
    bitsNumeric('reserved', 3, 'u8'),
    bitsNumeric('flags', 9, 'be_u16'),
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
        new CodeVarField(bytesRef('payload', createCountVar('_'))),
        new CodeField('let payload = input;')
    ]
)

const info = new ProtocolInfo(protocolName, 'L4', header)

const payload = new PayloadEnum(
    `${payloadName}`,
    info,
    [
        new UndefPayloadEnumVariant(102, 'Iso'),
        new PayloadEnumVariant(502, ModbusRsp),
        new PayloadEnumVariant(2404, Iec104),
        new PayloadEnumVariant(9600, FinsTcpRsp),
        new PayloadEnumVariant(20000, Dnp3),
        new PayloadEnumVariant(47808, Bacnet),
    ],
    new PayloadEnumChoice(
        new StructField(header),
        'src_port',
    ),
    new PayloadEnum(
        `${payloadName}`,
        info,
        [
            new UndefPayloadEnumVariant(102, 'Iso'),
            new PayloadEnumVariant(502, ModbusReq), 
            new PayloadEnumVariant(2404, Iec104),
            new PayloadEnumVariant(9600, FinsTcpReq),
            new PayloadEnumVariant(20000, Dnp3),
            new PayloadEnumVariant(47808, Bacnet),
        ],
        new PayloadEnumChoice(
            new StructField(header),
            'dst_port',
        )
    )
)

export const Tcp = new Protocol({
    info,
    payload,
    structs
})