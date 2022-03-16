import { Struct } from "../../types/struct"
import { StructEnum, EmptyPayloadEnum } from "../../types/enum"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"
import { numeric } from "../../api"
import { BerTLField, BerVField } from "../../field/ber-tlv"
import { StructField } from "../../field/struct"
import { LimitedLenVecLoopField } from "../../field/vec"
import { createCountVar } from "../../api/input"
import { BlankStructField } from "../../field/special"

const protocolName = 'Goose'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const GoosePDU = new Struct(
	'GoosePDU',
	[
		new BerVField('gocb_ref'),
        new BerVField('time_allowed_to_live'),
		new BerVField('dat_set'),
		new BerVField('go_id'),
		new BerVField('t'),
		new BerVField('st_num'),
		new BerVField('sq_num'),
		new BerVField('simulation'),
		new BerVField('conf_rev'),
		new BerVField('nds_com'),
		new BerVField('num_dat_set_entries'),
        new BlankStructField(new BerTLField('all_data_tl')),
        new LimitedLenVecLoopField('all_data', createCountVar('_all_data_tl.length'), new BerVField('foo'))
	]
)
structs.push(GoosePDU)

const header = new Struct(
    `${headerName}`,
    [
        // ref: https://github.com/wireshark/wireshark/blob/e69446aa55d293412002375a549e85327267e65b/epan/dissectors/packet-goose.c#L825
        numeric('appid', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('reserve_1', 'be_u16'),
        numeric('reserve_2', 'be_u16'),
        new BlankStructField(new BerTLField('goose_pdu_tl')),
        new StructField(GoosePDU, 'goose_pdu'),
    ]
)

const info = new ProtocolInfo(protocolName, 'L3', header)

const payload = new EmptyPayloadEnum(
	`${payloadName}`,
	info
)

export const Goose = new Protocol({
    info,
    payload: payload,
    structs
})