import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"
import { StructEnum, EmptyPayloadEnum } from "../../types/enum"
import { numeric } from "../../api"
import { BerTLField, BerVField } from "../../field/ber-tlv"
import { StructField } from "../../field/struct"
import { LimitedLenVecLoopField } from "../../field/vec"
import { createCountVar } from "../../api/input"

const protocolName = 'Sv'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const Asdu = new Struct(
	'Asdu',
	[
		new BerTLField('asdu_tl'),
        new BerVField('sv_id'),
        new BerVField('cmp_cnt'),
        new BerVField('conf_rev'),
        new BerVField('smp_synch'),
        new BerVField('seq_data'),
	]
)
structs.push(Asdu)

const SavPDU = new Struct(
	'SavPDU',
	[
		new BerVField('no_asdu'),
        new BerTLField('seq_asdu_tl'),
        new LimitedLenVecLoopField('seq_asdu', createCountVar('seq_asdu_tl.length'), new StructField(Asdu))
	]
)
structs.push(SavPDU)

const header = new Struct(
    headerName,
    [
        numeric('appid', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('reserve_1', 'be_u16'),
        numeric('reserve_2', 'be_u16'),
        new BerTLField('sav_pdu_tl'),
        new StructField(SavPDU, 'sav_pdu'),
    ]
)

const info = new ProtocolInfo(protocolName, 'L4', header)

const payload = new EmptyPayloadEnum(
	`${payloadName}`,
	info
)

export const Sv = new Protocol({
    info,
    payload,
    structs
})