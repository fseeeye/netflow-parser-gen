import { EmptyPayloadEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'Foo'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const protocolHeader = new Struct(
    `${headerName}`,
    []
)

const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const Foo = new Protocol({
    info,
    payload,
    structs
})