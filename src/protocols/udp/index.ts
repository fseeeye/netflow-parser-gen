import { Struct } from "../../types/struct"
import { numeric } from "../../api/index"
import { Protocol } from "../generator"
import { PayloadField } from "../../field/payload"
import { PayloadEnumChoice } from "../../field/choice"
import { StructEnum, PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { ModbusReqPacket } from "../modbus_req"
import { StructField } from "../../field/struct"

const UdpHeader = new Struct(
    'UdpHeader',
    [
        numeric('src_port', 'be_u16'),
        numeric('dst_port', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('checksum', 'be_u16'),
    ]
)

const UdpPayload = new PayloadEnum(
    'UdpPayload',
    [
        new PayloadEnumVariant('UdpPayload', 502, ModbusReqPacket), 
    ],
    new PayloadEnumChoice(
        new StructField(UdpHeader, '_header'),
        'src_port',
    )
)

export const UdpPacket = new Struct (
    'UdpPacket',
    [
        new StructField(UdpHeader),
        new PayloadField(UdpPayload),
    ]
)

const structs: (Struct|StructEnum)[] = []

export const Udp = new Protocol({
    name: 'Udp',
    packet: UdpPacket,
    header: UdpHeader,
    payload: UdpPayload,
    structs
})