import { EmptyPayloadEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

// Basic settings
const protocolName = 'Template'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

// please push ALL addtional struct & enum to this structs (except Protocol Header.)
const structs: (Struct|StructEnum)[] = []

// Protocol Header
const protocolHeader = new Struct(
    `${headerName}`,
    []
)
// ...

// Choose protocol NAME / LEVEL / Header Struct 
const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

// Set the payload of protocol
const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

// Define Protocol
export const Template = new Protocol({
    info,
    payload,
    structs
})
