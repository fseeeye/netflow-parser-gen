import { numeric } from "../../api"
import { BasicEnumChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { CodeGenField } from "../../field/special"
import { EmptyPayloadEnum, EmptyVariant, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'Opcua'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const MessageType = new StructEnum(
    'MessageType',
    [
        /* "HEL" - Hello */
        new EmptyVariant(4736332, 'Hello'),
        /* "ACK" - Acknowledge */
        new EmptyVariant(4277067, 'Acknowledge'),
        /* "ERR" - Error */
        new EmptyVariant(4543058, 'Error'),
        /* "RHE" - ReverseHello */
        new EmptyVariant(5392453, 'ReverseHello'),
        /* "MSG" - Message */
        new EmptyVariant(5067591, 'Message'),
        /* "OPN" - OpenSecureChannel */
        new EmptyVariant(5197902, 'Message'),
        /* "CLO" - CloseSecureChannel */
        new EmptyVariant(4410447, 'CloseSecureChannel'),
    ],
    new BasicEnumChoice(numeric('_message_type', 'be_u24')),
    false,
    true
)
structs.push(MessageType)

const protocolHeader = new Struct(
    `${headerName}`,
    [
        new CodeGenField(numeric('_message_type', 'be_u24')),
        new EnumField(MessageType)
    ]
)

const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const Opcua = new Protocol({
    info,
    payload,
    structs
})