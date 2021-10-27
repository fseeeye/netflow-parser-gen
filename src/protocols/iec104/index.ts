// IEC-60870-5-104 (with IEC-60870-ASDU)
import endent from "endent"
import { bitsEmptyNumeric, bitsNumeric, numeric, slice } from "../../api"
import { createCountVar } from "../../api/input"
import { Field } from "../../field/base"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { BasicEnumChoice, EnumMultiChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { AssertField, CodeField, CodeGenField, CodeVarField } from "../../field/special"
import { StructField } from "../../field/struct"
import { LimitedCountVecLoopField, UnlimitedVecLoopField } from "../../field/vec"
import { AnonymousStructVariant, EmptyPayloadEnum, EmptyVariant, IfStructEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'Iec104'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

/**
 * SIQ: Single-point information (IEV 371-02-07) w quality descriptor
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1276
 */
const SIQ: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('siq_iv', 1, 'u8'),
        bitsNumeric('siq_nt', 1, 'u8'),
        bitsNumeric('siq_sb', 1, 'u8'),
        bitsNumeric('siq_bl', 1, 'u8'),
        bitsEmptyNumeric(3, 'u8'),
        bitsNumeric('siq_spi', 1, 'u8'),
    ])
]

/**
 * DIQ: Double-point information (IEV 371-02-08) w quality descriptor
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1296
 */
const DIQ: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('diq_iv', 1, 'u8'),
        bitsNumeric('diq_nt', 1, 'u8'),
        bitsNumeric('diq_sb', 1, 'u8'),
        bitsNumeric('diq_bl', 1, 'u8'),
        bitsEmptyNumeric(2, 'u8'),
        bitsNumeric('diq_dpi', 2, 'u8'),
    ])
]

/**
 * VTI: Value with transient state indication
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1348
 */
const VTI: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('vti_t', 1, 'u8'),
        bitsNumeric('vti_value', 7, 'u8'),
    ])
]

/**
 * QDS: Quality descriptor (separate octet)
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1316
 */
const QDS: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('qds_iv', 1, 'u8'),
        bitsNumeric('qds_nt', 1, 'u8'),
        bitsNumeric('qds_sb', 1, 'u8'),
        bitsNumeric('qds_bl', 1, 'u8'),
        bitsEmptyNumeric(3, 'u8'),
        bitsNumeric('qds_ov', 1, 'u8'),
    ])
]

/**
 * "BSI": Binary state information, 32 bit
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1434
 */
const BSI: Field[] = [
    slice('bsi', 'u8_4')
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1444
const BSIspt = BSI

/**
 * NVA: Normalized value
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1365
 */
const NVA: Field[] = [
    // Warning: this should be a float num = (float)nva / 32768, but float is not easy to compare
    numeric('nva_u16', 'le_u16')
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1382
const NVAspt = NVA

/**
 * SVA: Scaled value
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1396
 */
const SVA: Field[] = [
    numeric('sva', 'be_u16')
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1407
const SVAspt = SVA

/**
 * "FLT": Short floating point number
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1415
 */
const FLT: Field[] = [
    // Warning: this should be IEEE 754 float value, but float is not easy to compare
    numeric('flt', 'be_u32'),
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1426
const FLTspt = FLT

/**
 * BCR: Binary counter reading
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1451
 */
const BCR: Field[] = [
    numeric('bcr_count', 'be_u32'),
    new BitNumericFieldGroup([
        bitsNumeric('bcr_iv', 1, 'u8'),
        bitsNumeric('bcr_ca', 1, 'u8'),
        bitsNumeric('bcr_cy', 1, 'u8'),
        bitsNumeric('bcr_sq', 5, 'u8'),
    ])
]

/**
 * Dissects the CP24Time2a time (Three octet binary time) 
   that starts 'offset' bytes in 'tvb'.
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1082
 */
const CP24Time: Field[] = [
    numeric('cp24time_ms', 'le_u16'),
    new BitNumericFieldGroup([
        bitsNumeric('cp24time_iv', 1, 'u8'),
        bitsNumeric('cp24time_min', 7, 'u8'),
    ])
]

/**
 * Dissects the CP56Time2a time (Seven octet binary time)
   that starts 'offset' bytes in 'tvb'.
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1159
 */
const CP56Time: Field[] = [
    numeric('cp56time_ms', 'le_u16'),
    new BitNumericFieldGroup([
        bitsNumeric('cp56time_iv', 1, 'u8'),
        bitsNumeric('cp56time_min', 7, 'u8'),
        bitsNumeric('cp56time_su', 1, 'u8'),
        bitsNumeric('cp56time_hour', 7, 'u8'),
        bitsNumeric('cp56time_dow', 3, 'u8'),
        bitsNumeric('cp56time_day', 5, 'u8'),
        bitsEmptyNumeric(4, 'u8'),
        bitsNumeric('cp56time_month', 4, 'u8'),
        bitsEmptyNumeric(1, 'u8'),
        bitsNumeric('cp56time_year', 7, 'u8'),
    ])
]

/**
 * SCO: Single Command (IEV 371-03-02)
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1494
 */
const SCO: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('sco_se', 1, 'u8'),
        bitsNumeric('sco_qu', 5, 'u8'),
        bitsEmptyNumeric(1, 'u8'),
        bitsNumeric('sco_on', 1, 'u8'),
    ])
]

/**
 * DCO: Double Command (IEV 371-03-03)
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1512
 */
const DCO: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('dco_se', 1, 'u8'),
        bitsNumeric('dco_qu', 5, 'u8'),
        bitsNumeric('dco_on', 2, 'u8'),
    ])
]

/**
 * RCO: Regulating step command (IEV 371-03-13)
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1530
 */
const RCO: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('rco_se', 1, 'u8'),
        bitsNumeric('rco_qu', 5, 'u8'),
        bitsNumeric('rco_up', 2, 'u8'),
    ])
]

/**
 * QOS: Qualifier Of Set-point command
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1477
 */
const QOS: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('qos_ql', 7, 'u8'),
        bitsNumeric('qos_se', 1, 'u8'),
    ])
]

/**
 * COI: Cause of initialisation
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1566
 */
const COI: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('coi_r', 7, 'u8'),
        bitsNumeric('coi_i', 1, 'u8'),
    ])
]

/**
 * QOI: Qualifier of interrogation
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1583
 */
const QOI: Field[] = [
    numeric('qoi', 'u8'),
]

/**
 * QCC: Qualifier of counter interrogation
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1593
 */
const QCC: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('qcc_frz', 2, 'u8'),
        bitsNumeric('qcc_rqt', 6, 'u8'),
    ])
]

/**
 * QRP: Qualifier of reset process command
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1610
 */
const QRP: Field[] = [
    numeric('qrp', 'u8')
]

/**
 * QPM: Qualifier of parameter of measured value
 * refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1548
 */
const QPM: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('qpm_pop', 1, 'u8'),
        bitsNumeric('qpm_lpc', 1, 'u8'),
        bitsNumeric('qpm_kpa', 6, 'u8'),
    ])
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1842
const IoaTypeEnum = new StructEnum(
    'IoaTypeEnum',
    [
        /* single-point information */
        new AnonymousStructVariant(1,  'M_SP_NA_1', SIQ),
        /* single-point information with time tag */
        new AnonymousStructVariant(2,  'M_SP_TA_1', SIQ.concat(CP24Time)),
        /* double-point information */
        new AnonymousStructVariant(3,  'M_DP_NA_1', DIQ),
        /* double-point information with time tag */
        new AnonymousStructVariant(4,  'M_DP_TA_1', DIQ.concat(CP24Time)),
        /* step position information */
        new AnonymousStructVariant(5,  'M_ST_NA_1', VTI.concat(QDS)),
        /* step position information with time tag */
        new AnonymousStructVariant(6,  'M_ST_TA_1', VTI.concat(QDS).concat(CP24Time)),
        /* bitstring of 32 bits */
        new AnonymousStructVariant(7,  'M_BO_NA_1', BSI.concat(QDS)),
        /* bitstring of 32 bits with time tag */
        new AnonymousStructVariant(8,  'M_BO_TA_1', BSI.concat(QDS).concat(CP24Time)),
        /* measured value, normalized value */
        new AnonymousStructVariant(9,  'M_ME_NA_1', NVA.concat(QDS)),
        /* measured value, normalized value with time tag */
        new AnonymousStructVariant(10,  'M_ME_TA_1', NVA.concat(QDS).concat(CP24Time)),
        /* measured value, scaled value */
        new AnonymousStructVariant(11,  'M_ME_NB_1', SVA.concat(QDS)),
        /* measured value, scaled value with time tag */
        new AnonymousStructVariant(12,  'M_ME_TB_1', SVA.concat(QDS).concat(CP24Time)),
        /* measured value, short floating point number */
        new AnonymousStructVariant(13,  'M_ME_NC_1', FLT.concat(QDS)),
        /* measured value, short floating point number with time tag */
        new AnonymousStructVariant(14,  'M_ME_TC_1', FLT.concat(QDS).concat(CP24Time)),
        /* integrated totals */
        new AnonymousStructVariant(15,  'M_IT_NA_1', BCR),
        /* integrated totals with time tag */
        new AnonymousStructVariant(16,  'M_IT_TA_1', BCR.concat(CP24Time)),
        /* packed single-point information with status change detection */
        new EmptyVariant(20,  'M_PS_NA_1'),
        /* measured value, normalized value without quality descriptor */
        new AnonymousStructVariant(21,  'M_ME_ND_1', NVA),
        /* single-point information with time tag CP56Time2a */
        new AnonymousStructVariant(30,  'M_SP_TB_1', SIQ.concat(CP56Time)),
        /* double-point information with time tag CP56Time2a */
        new AnonymousStructVariant(31,  'M_DP_TB_1', DIQ.concat(CP56Time)),
        /* step position information with time tag CP56Time2a */
        new AnonymousStructVariant(32,  'M_ST_TB_1', VTI.concat(QDS).concat(CP56Time)),
        /* bitstring of 32 bit with time tag CP56Time2a */
        new AnonymousStructVariant(33,  'M_BO_TB_1', BSI.concat(QDS).concat(CP56Time)),
        /* measured value, normalized value with time tag CP56Time2a */
        new AnonymousStructVariant(34,  'M_ME_TD_1', NVA.concat(QDS).concat(CP56Time)),
        /* measured value, scaled value with time tag CP56Time2a */
        new AnonymousStructVariant(35,  'M_ME_TE_1', SVA.concat(QDS.concat(CP56Time))),
        /* measured value, short floating point number with time tag CP56Time2a */
        new AnonymousStructVariant(36,  'M_ME_TF_1', FLT.concat(QDS).concat(CP56Time)),
        /* integrated totals with time tag CP56Time2a */
        new AnonymousStructVariant(37,  'M_IT_TB_1', BCR.concat(CP56Time)),
        /* event of protection equipment with time tag CP56Time2a */
        new EmptyVariant(38,  'M_EP_TD_1'),
        /* packed start events of protection equipment with time tag CP56Time2a */
        new EmptyVariant(39,  'M_EP_TE_1'),
        /* packed output circuit information of protection equipment with time tag CP56Time2a */
        new EmptyVariant(40,  'M_EP_TF_1'),
        /* integrated totals containing time tagged security statistics	*/
        new EmptyVariant(41,  'S_IT_TC_1'),
        /* single command */
        new AnonymousStructVariant(45,  'C_SC_NA_1', SCO),
        /* double command */
        new AnonymousStructVariant(46,  'C_DC_NA_1', DCO),
        /* regulating step command */
        new AnonymousStructVariant(47,  'C_RC_NA_1', RCO),
        /* set point command, normalized value */
        new AnonymousStructVariant(48,  'C_SE_NA_1', NVAspt.concat(QOS)),
        /* set point command, scaled value */
        new AnonymousStructVariant(49,  'C_SE_NB_1', SVAspt.concat(QOS)),
        /* set point command, short floating point number */
        new AnonymousStructVariant(50,  'C_SE_NC_1', FLTspt.concat(QOS)),
        /* bitstring of 32 bits */
        new AnonymousStructVariant(51,  'C_BO_NA_1', BSIspt),
        /* single command with time tag CP56Time2a */
        new AnonymousStructVariant(58,  'C_SC_TA_1', SCO.concat(CP56Time)),
        /* double command with time tag CP56Time2a */
        new AnonymousStructVariant(59,  'C_DC_TA_1', DCO.concat(CP56Time)),
        /* regulating step command with time tag CP56Time2a */
        new AnonymousStructVariant(60,  'C_RC_TA_1', RCO.concat(CP56Time)),
        /* set point command, normalized value with time tag CP56Time2a */
        new AnonymousStructVariant(61,  'C_SE_TA_1', NVAspt.concat(QOS).concat(CP56Time)),
        /* set point command, scaled value with time tag CP56Time2a */
        new AnonymousStructVariant(62,  'C_SE_TB_1', SVAspt.concat(QOS).concat(CP56Time)),
        /* set point command, short floating-point number with time tag CP56Time2a */
        new AnonymousStructVariant(63,  'C_SE_TC_1', FLTspt.concat(QOS).concat(CP56Time)),
        /* bitstring of 32 bits with time tag CP56Time2a */
        new AnonymousStructVariant(64,  'C_BO_TA_1', BSIspt.concat(QOS).concat(CP56Time)),
        /* end of initialization */
        new AnonymousStructVariant(70,  'M_EI_NA_1', COI),
        /* authentication challenge	*/
        new EmptyVariant(81,  'S_CH_NA_1'),
        /* authentication reply	*/
        new EmptyVariant(82,  'S_RP_NA_1'),
        /* aggressive mode authentication request session key status request */
        new EmptyVariant(83,  'S_AR_NA_1'),
        /* session key status request */
        new EmptyVariant(84,  'S_KR_NA_1'),
        /* session key status */
        new EmptyVariant(85,  'S_KS_NA_1'),
        /* session key change */
        new EmptyVariant(86,  'S_KC_NA_1'),
        /* authentication error */
        new EmptyVariant(87,  'S_ER_NA_1'),
        /* user status change */
        new EmptyVariant(90,  'S_US_NA_1'),
        /* update key change request */
        new EmptyVariant(91,  'S_UQ_NA_1'),
        /* update key change reply */
        new EmptyVariant(92,  'S_UR_NA_1'),
        /* update key change symmetric */
        new EmptyVariant(93,  'S_UK_NA_1'),
        /* update key change asymmetric */
        new EmptyVariant(94,  'S_UA_NA_1'),
        /* update key change confirmation */
        new EmptyVariant(95,  'S_UC_NA_1'),
        /* interrogation command */
        new AnonymousStructVariant(100, 'C_IC_NA_1', QOI),
        /* counter interrogation command */
        new AnonymousStructVariant(101, 'C_CI_NA_1', QCC),
        /* read command */
        new EmptyVariant(102, 'C_RD_NA_1'),
        /* clock synchronization command */
        new AnonymousStructVariant(103, 'C_CS_NA_1', CP56Time),
        /* reset process command */
        new AnonymousStructVariant(105, 'C_RP_NA_1', QRP),
        /* test command with time tag CP56Time2a */
        new EmptyVariant(107, 'C_TS_TA_1'),
        /* parameter of measured value, normalized value */
        new AnonymousStructVariant(110, 'P_ME_NA_1', NVA.concat(QPM)),
        /* parameter of measured value, scaled value */
        new AnonymousStructVariant(111, 'P_ME_NB_1', SVA.concat(QPM)),
        /* parameter of measured value, short floating-point number */
        new AnonymousStructVariant(112, 'P_ME_NC_1', FLT.concat(QPM)),
        /* parameter activation */
        new EmptyVariant(113, 'P_AC_NA_1'),
        /* file ready */
        new EmptyVariant(120, 'F_FR_NA_1'),
        /* section ready */
        new EmptyVariant(121, 'F_SR_NA_1'),
        /* call directory, select file, call file, call section */
        new EmptyVariant(122, 'F_SC_NA_1'),
        /* last section, last segment */
        new EmptyVariant(123, 'F_LS_NA_1'),
        /* ack file, ack section */
        new EmptyVariant(124, 'F_AF_NA_1'),
        /* segment */
        new EmptyVariant(125, 'F_SG_NA_1'),
        /* directory */
        new EmptyVariant(126, 'F_DR_NA_1'),
        /* Query Log - Request archive file */
        new EmptyVariant(127, 'F_SC_NB_1'),
    ],
    new BasicEnumChoice(numeric('type_id', 'u8')),
    false,
    true
)
structs.push(IoaTypeEnum)

const IoaItem = new Struct(
    'Ioa',
    [
        numeric('ioa', 'le_u24'),
        new EnumField(IoaTypeEnum),
    ],
    [
        numeric('type_id', 'u8'),
    ]
)
structs.push(IoaItem)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L1641
const IecAsdu = new Struct(
    'IecAsdu',
    [
        numeric('type_id', 'u8'),
        new BitNumericFieldGroup([
            /* Variable structure qualifier */
            bitsNumeric('sq', 1, 'u8'),
            bitsNumeric('num_ix', 7, 'u8'),
            /* Cause of transmission */
            bitsNumeric('test', 1, 'u8'),
            bitsNumeric('negative', 1, 'u8'),
            bitsNumeric('cause_tx', 6, 'u8'),
        ]),
        /* Originator address */
        numeric('oa', 'u8'),
        /* Common address of ASDU */
        numeric('addr', 'le_u16'),
        new LimitedCountVecLoopField('ioa_array', createCountVar('num_ix'), new StructField(IoaItem)),
    ]
)
structs.push(IecAsdu)

const TypeBlock = new IfStructEnum(
    'TypeBlock',
    [
        new AnonymousStructVariant('apci_txid_tmp & 0x01u16 == 0x00u16', 'TypeI', [
            new CodeVarField(numeric('type104', 'u8')),
            new CodeVarField(numeric('apci_txid', 'le_u16')),
            new CodeVarField(numeric('apci_rxid', 'le_u16')),
            new CodeField(endent`
                let type104: u8 = 0x00;
                let apci_txid = (apci_txid_tmp >> 1).try_into().unwrap();
                let apci_rxid = (apci_rxid_tmp >> 1).try_into().unwrap();
            `),
            new StructField(IecAsdu),
        ]),
        new AnonymousStructVariant('apci_txid_tmp & 0x03u16 == 0x01u16', 'TypeS', [
            new CodeVarField(numeric('type104', 'u8')),
            new CodeVarField(numeric('apci_rxid', 'le_u16')),
            new CodeField(endent`
                let type104: u8 = 0x01;
                let apci_rxid = (apci_rxid_tmp >> 1).try_into().unwrap();
            `),
        ]),
        new AnonymousStructVariant('apci_txid_tmp & 0x03u16 == 0x03u16', 'TypeU', [
            new CodeVarField(numeric('type104', 'u8')),
            new CodeVarField(numeric('apci_utype', 'u8')),
            new CodeField(endent`
                let type104: u8 = 0x03;
                let apci_utype = (apci_txid_tmp >> 2).try_into().unwrap();
            `),
        ])
    ],
    new EnumMultiChoice([
        numeric('apci_txid_tmp', 'le_u16'),
        numeric('apci_rxid_tmp', 'le_u16'),
    ]),
    true
)
structs.push(TypeBlock)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-iec104.c#L2058
const Iec104Block = new Struct(
    'Iec104Block',
    [
        new AssertField(numeric('start', 'u8'), '0x68'),
        numeric('apdu_len', 'u8'),
        new CodeGenField(numeric('apci_txid_tmp', 'le_u16')),
        new CodeGenField(numeric('apci_rxid_tmp', 'le_u16')),
        new EnumField(TypeBlock),
    ]
)
structs.push(Iec104Block)


const protocolHeader = new Struct(
    `${headerName}`,
    [
        new UnlimitedVecLoopField('iec104_blocks', new StructField(Iec104Block))
    ]
)

const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const Iec104 = new Protocol({
    info,
    payload,
    structs
})