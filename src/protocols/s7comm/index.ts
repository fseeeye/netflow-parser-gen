import { numeric, slice } from "../../api"
import { StructField } from "../../field/struct"
import { EmptyPayloadEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'S7comm'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const S7Header = new Struct(
    'S7Header',
    [
        numeric('protocol_id', 'u8'),
        numeric('rosctr', 'u8'),
        // bytesRef('redundancy_identification', createCountVar('2')),
        slice('redundancy_identification', 'u8_2'),
        numeric('pdu_ref', 'be_u16'),
        numeric('parameter_length', 'be_u16'),
        numeric('data_length', 'be_u16'),
    ]
)
structs.push(S7Header)




const protocolHeader = new Struct(
    `${headerName}`,
    [
        new StructField(S7Header),
    ]
)

const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const S7comm = new Protocol({
    info,
    payload,
    structs
})