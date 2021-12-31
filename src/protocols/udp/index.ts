import { Struct } from "../../types/struct"
import { bytesRef, numeric } from "../../api/index"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"
// import { PayloadField } from "../../field/payload"
import { PayloadEnumChoice } from "../../field/choice"
import { StructEnum, PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { StructField } from "../../field/struct"
import { FinsUdpRsp } from "../fins-udp-rsp"
import { FinsUdpReq } from "../fins-udp-req"
import { Bacnet } from "../bacnet"
import { CodeField, CodeVarField } from "../../field/special"
import { createCountVar } from "../../api/input"

const protocolName = 'Udp'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const header = new Struct(
    headerName,
    [
        numeric('src_port', 'be_u16'),
        numeric('dst_port', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('checksum', 'be_u16'),
        new CodeVarField(bytesRef('payload', createCountVar('_'))),
        new CodeField('let payload = input;')
    ]
)

const info = new ProtocolInfo(protocolName, 'L4', header)

const UdpPayload = new PayloadEnum(
    payloadName,
    info,
    [
        new PayloadEnumVariant(9600, FinsUdpRsp),
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
            new PayloadEnumVariant(9600, FinsUdpReq),
            new PayloadEnumVariant(47808, Bacnet),
        ],
        new PayloadEnumChoice(
            new StructField(header),
            'dst_port',
        )
    )
)

const structs: (Struct|StructEnum)[] = []

export const Udp = new Protocol({
    info,
    payload: UdpPayload,
    structs
})