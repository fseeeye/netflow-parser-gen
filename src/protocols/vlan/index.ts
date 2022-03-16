// 802.1Q Virtual LAN
import { Struct } from "../../types/struct"
import { StructEnum, PayloadEnum, PayloadEnumVariant } from "../../types/enum"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { bitsNumeric, numeric } from "../../api"
import { PayloadEnumChoice } from "../../field/choice"
import { StructField } from "../../field/struct"
import { Sv } from "../sv"

const protocolName = 'Vlan'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const tci = new BitNumericFieldGroup(
    [
        bitsNumeric('priority', 3, 'u8'),
        bitsNumeric('dei', 1, 'u8'),
        bitsNumeric('id', 12, 'be_u16'),
    ]
)

const header = new Struct(
    `${headerName}`,
    [
        // ref: https://github.com/wireshark/wireshark/blob/5a440f7178a3330c0a479a51fceac7ec1da9921d/epan/dissectors/packet-vlan.c#L189
        tci,
        numeric('vtype', 'be_u16'),
    ]
)

const info = new ProtocolInfo(protocolName, 'L3', header)

const payload = new PayloadEnum(
    `${payloadName}`,
    info,
    [
        new PayloadEnumVariant(0x88BA, Sv)
    ],
    new PayloadEnumChoice(
        new StructField(header),
        'vtype',
    )
)

export const Vlan = new Protocol({
    info,
    payload: payload,
    structs
})
