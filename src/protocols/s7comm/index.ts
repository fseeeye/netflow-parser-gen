// Tips: 目前还不能解绑Parameter和Data，根本原因是结构定义和解析顺序是一致的。
import endent from "endent"
import { bitNumeric, numeric, slice, strRef } from "../../api"
import {
    createBytesReferenceFieldSimple as bytesRef, createCountVar,
} from "../../api/input"
import { Field } from "../../field/base"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { BasicEnumChoice, EnumMultiChoice, StructChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { AssertField, CodeField, SkipField } from "../../field/special"
import { StructField } from "../../field/struct"
import { VecField } from "../../field/vec"
import { AnonymousStructVariant, EmptyPayloadEnum, EmptyVariant, EofVariant, IfStructEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'S7comm'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

/************ Header Part ************/
const HeaderErrorInfo = new StructEnum(
    'HeaderErrorInfo',
    [
        new AnonymousStructVariant("true", "HeaderRspErrorInfo", [
            numeric('error_class', 'u8'),
            numeric('error_code', 'u8'),
        ]),
        new EmptyVariant("false", "EmptyErrorInfo"),
    ],
    new BasicEnumChoice(
        numeric('rosctr', 'u8'),
        (str) => `(${str} == 0x02) || (${str} == 0x03)`
    ),
    true
)
structs.push(HeaderErrorInfo)

const S7Header = new Struct(
    'Header',
    [
        numeric('protocol_id', 'u8'),
        numeric('rosctr', 'u8'),
        slice('redundancy_identification', 'u4_4'),
        numeric('pdu_ref', 'be_u16'),
        numeric('parameter_length', 'be_u16'),
        numeric('data_length', 'be_u16'),
        new EnumField(HeaderErrorInfo),
    ]
)
structs.push(S7Header)
/************ Header End. ************/


/************ Param Part ************/
const BlankFieldArray: Field[] = []
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2757
const DbreadItem = new Struct(
    'DbreadItem',
    [
        numeric('dbread_length', 'u8'),
        numeric('dbread_db', 'be_u16'),
        numeric('dbread_startadr', 'be_u16'),
    ]
)
structs.push(DbreadItem)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2794
// Warning: unimpl
const Tia1200Subitem = new Struct(
    'Tia1200Item',
    [
        // Warning: unimpl
        slice('item_content', 'u8_4')
    ]
)
structs.push(Tia1200Subitem)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2922
const SyntaxIdEnum = new IfStructEnum(
    'SyntaxIdEnum',
    [
        /* Step 7 Classic 300 400 */
        new AnonymousStructVariant("var_spec_length == 10 && var_spec_syntax_id == 0x10", "S7any", [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2682
            numeric('transport_size', 'u8'),
            numeric('item_length', 'be_u16'),
            numeric('item_db_numer', 'be_u16'),
            numeric('item_area', 'u8'),
            slice('item_address', 'u4_6'),
            // new InlineChoice(slice('area_peek', 'u8_5'), (matchField) => matchField.concat('[4]'))
        ]),
        /* S7-400 special address mode (kind of cyclic read) */
        new AnonymousStructVariant("var_spec_length >= 7 && var_spec_syntax_id == 0xb0", "Dbread", [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2757
            numeric('num_areas', 'u8'),
            new VecField('subitems', createCountVar('num_areas'), DbreadItem),
        ]),
        /* TIA S7 1200 symbolic address mode */
        new AnonymousStructVariant("var_spec_length >= 14 && var_spec_syntax_id == 0xb2", "Tia1200", [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2794
            numeric('item_reserved1', 'u8'),
            numeric('item_area1', 'be_u16'),
            numeric('item_area2', 'be_u16'),
            numeric('item_crc', 'be_u32'),
            new VecField('substructure_items', createCountVar('var_spec_length', (string) => `(${string} - 10) / 4`), Tia1200Subitem)
        ])
    ],
    new EnumMultiChoice([
        numeric('var_spec_length', 'u8'),
        numeric('var_spec_syntax_id', 'u8'),
    ]),
    true
)
structs.push(SyntaxIdEnum)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2922
const ParamItem = new Struct(
    'ParamItem',
    [
        new AssertField(numeric('var_spec_type', 'u8'), '0x12'),
        numeric('var_spec_length', 'u8'),
        numeric('var_spec_syntax_id', 'u8'),
        new EnumField(SyntaxIdEnum),
    ]
)
structs.push(ParamItem)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3032
const RspReadData = new Struct(
    'RspReadData',
    [
        numeric('return_code', 'u8'),
        numeric('transport_size', 'u8'),
        numeric('length', 'be_u16'),
        new CodeField(endent`
            let mut length_tmp = length;
            if (length_tmp % 8) != 0 {
                length_tmp /= 8;
                length_tmp += 1;
            } else {
                length_tmp /= 8;
            }
        `),
        bytesRef('data', createCountVar('length_tmp')),
        new CodeField(endent`
            let mut input = input;
            let mut _fill_byte: u8;
            if (length_tmp % 2 != 0) && (input.len()) != 0 {
                (input, _fill_byte) = u8(input)?;
            }
        `),
    ]
)
structs.push(RspReadData)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3004
const RspWriteData = new Struct(
    'RspWriteData',
    [
        numeric('return_code', 'u8'),
    ]
)
structs.push(RspWriteData)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L2983
const SetupCommunicationFuncParam: Field[] = [
    numeric('reserved', 'u8'),
    numeric('max_amq_calling', 'be_u16'),
    numeric('max_amq_called', 'be_u16'),
    numeric('pdu_length', 'be_u16'),
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3591
const UpDownloadFilename: Field[] = [
    new AssertField(numeric('filename_length', 'u8'), '9'), 
    strRef('filename', createCountVar('filename_length')),
]

const DownloadTopFields: Field[] = [
    numeric('function_status', 'u8'),
    new SkipField(bytesRef('unknow_bytes', createCountVar('6'))),
]

const UploadTopFields: Field[] = [
    numeric('function_status', 'u8'),
    new SkipField(bytesRef('unknow_bytes', createCountVar('2'))),
    numeric('upload_id', 'be_u32'),
]

/* function: (Job) Request Download */
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3688
const JobRequestDownload: Field[] = DownloadTopFields
    .concat(UpDownloadFilename)
    .concat([
        // Warning: fields below might not exit
        numeric('length_part2', 'u8'),
        new SkipField(bytesRef('unknow_char', createCountVar('1'))),
        strRef('loadmem_len', createCountVar('6')),
        strRef('mc7code_len', createCountVar('6')),
    ])

/* function: (Job) Download Block */
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3746
const JobDownloadBlock: Field[] = DownloadTopFields
    .concat(UpDownloadFilename)

/* function: (Job) Download Ended */
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3781
const JobDownloadEnded: Field[] = BlankFieldArray
    .concat([
        numeric('function_status', 'u8'),
        numeric('error_code', 'be_u16'),
        new SkipField(bytesRef('unknow_bytes', createCountVar('4'))),
    ])
    .concat(UpDownloadFilename)

/* function: Start Upload */
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3720
const JobStartUpload: Field[] = UploadTopFields
    .concat(UpDownloadFilename)

const AckdataStartUpload: Field[] = UploadTopFields
    .concat([
        // Warning: if header.param_len > 8
        numeric('blocklen_string_length', 'u8'),
        strRef('blocklen', createCountVar('blocklen_string_length')),
    ])

/* function: Upload */
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3745
const JobUpload: Field[] = UploadTopFields

const AckdataUpload: Field[] = BlankFieldArray
    .concat([
        // Warning: if header.param_len > 2
        numeric('function_status', 'u8'),
        /* Data Part */
        // Warning: if header.data_len > 0
        numeric('data_length', 'be_u16'),
        new SkipField(bytesRef('unknow_bytes', createCountVar('2'))),
        bytesRef('data', createCountVar('data_length')), // or header.data_len > 0
    ])

/* function: End Upload */
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3780
const JobEndUpload: Field[] = BlankFieldArray
    .concat([
        numeric('function_status', 'u8'),
        numeric('error_code', 'be_u16'),
        numeric('upload_id', 'be_u32'),
    ])

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6552
const JobParam = new StructEnum(
    'JobParam',
    [
        /* function: Setup Communication */
        new AnonymousStructVariant(0xf0, 'SetupCommunication', SetupCommunicationFuncParam),
        /* function: Read Var */
        new AnonymousStructVariant(0x04, 'ReadVar', [
            numeric('item_count', 'u8'),
            new VecField('items', createCountVar('item_count'), ParamItem), // Warning: unimpl for fill-byte
        ]),
        /* function: Write Var */
        new AnonymousStructVariant(0x05, 'WriteVar', [
            numeric('item_count', 'u8'),
            new VecField('items', createCountVar('item_count'), ParamItem), // Warning: unimpl for fill-byte
            new VecField('standard_items', createCountVar('item_count'), RspReadData),
        ]),
        /* function: Request Download */
        new AnonymousStructVariant(0x1a, 'RequestDownload', JobRequestDownload),
        /* function: Download Block */
        new AnonymousStructVariant(0x1b, 'DownloadBlock', JobDownloadBlock),
        /* function: Download Ended */
        new AnonymousStructVariant(0x1c, 'DownloadEnded', JobDownloadEnded),
        /* function: Start Upload */
        new AnonymousStructVariant(0x1d, 'StartUpload', JobStartUpload),
        /* function: Upload */
        new AnonymousStructVariant(0x1e, 'Upload', JobUpload),
        /* function: End Upload */
        new AnonymousStructVariant(0x1f, 'EndUpload', JobEndUpload),
        /* function: PI Service */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3183
        new AnonymousStructVariant(0x28, 'PiService', [
            new SkipField(bytesRef('unknow_bytes', createCountVar('7'))),
            numeric('parameter_block_len', 'be_u16'),
            bytesRef('parameter_block', createCountVar('parameter_block_len')),
            numeric('string_len', 'u8'),
            strRef('service_name', createCountVar('string_len')),
        ]),
        /* function: PLC Stop */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3116
        new AnonymousStructVariant(0x29, 'PlcStop', [
            new SkipField(bytesRef('unknow_bytes', createCountVar('5'))),
            numeric('length_part2', 'u8'),
            strRef('service_name', createCountVar('length_part2')),
        ])
    ],
    new BasicEnumChoice(
        numeric('function_code', 'u8')
    )
)
structs.push(JobParam)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6552
const AckdataParam = new StructEnum(
    'AckdataParam',
    [
        /* function: Setup Communication */
        new AnonymousStructVariant(0xf0, 'SetupCommunication', SetupCommunicationFuncParam),
        /* function: Read Var */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6652
        new AnonymousStructVariant(0x04, 'ReadVar', [
            numeric('item_count', 'u8'),
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3032
            // Warning: unimpl for S7COMM_DATA_TRANSPORT_SIZE_NCKADDR
            new VecField('standard_items', createCountVar('item_count'), RspReadData),
        ]),
        /* function: Write Var */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6653
        new AnonymousStructVariant(0x05, 'WriteVar', [
            numeric('item_count', 'u8'),
            new VecField('items', createCountVar('item_count'), RspWriteData),
        ]),
        /* function: Request Download */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3711
        new EofVariant(0x1a, 'RequestDownload'),
        /* function: Download Block */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3761
        new AnonymousStructVariant(0x1b, 'DownloadBlock', [
            numeric('function_status', 'u8'),
            // Warning: if header.data_len > 0
            numeric('data_length', 'be_u16'),
            new SkipField(bytesRef('unknow_bytes', createCountVar('2'))),
            bytesRef('data', createCountVar('data_length')), // or header.data_len - 4
        ]),
        /* function: Download Ended */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L3800
        new EofVariant(0x1c, 'DownloadEnded'),
        /* function: Start Upload */
        new AnonymousStructVariant(0x1d, 'StartUpload', AckdataStartUpload),
        /* function: Upload */
        new AnonymousStructVariant(0x1e, 'Upload', AckdataUpload),
        /* function: End Upload */
        new EofVariant(0x1f, 'EndUpload'),
        /* function: PI Service */
        new EofVariant(0x28, 'PiService'),
        /* function: PLC Stop */
        new EofVariant(0x29, 'PlcStop'),
    ],
    new BasicEnumChoice(
        numeric('function_code', 'u8')
    )
)
structs.push(AckdataParam)

const UserdataParamInfo = new StructEnum(
    'UserdataParamInfo',
    [
        new AnonymousStructVariant(12, 'ExtraInfo', [
            numeric('data_unit_ref_num', 'u8'),
            numeric('is_last_data_unit', 'u8'), // bool
            numeric('error_code', 'be_u16'),
        ]),
        new EmptyVariant(8, 'EmptyInfo'),
    ],
    new BasicEnumChoice(
        numeric('header.parameter_length', 'be_u16')
    ),
    false,
    true
)
structs.push(UserdataParamInfo)

const S7Parameter = new StructEnum(
    'Parameter',
    [
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6552
        new AnonymousStructVariant(0x01, "Job", [
            numeric('function_code', 'u8'),
            new EnumField(JobParam),
        ]),
        new EofVariant(0x02, "Ack"),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6552
        new AnonymousStructVariant(0x03, "AckData", [
            numeric('function_code', 'u8'),
            new EnumField(AckdataParam),
        ]),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6407
        new AnonymousStructVariant(0x07, "Userdata", [
            slice('parameter_header', 'u4_6'),
            numeric('parameter_length', 'u8'),
            numeric('method', 'u8'), // request / response
            new BitNumericFieldGroup([
                bitNumeric('parameter_type', 4, 'u8'),
                bitNumeric('function_group', 4, 'u8'),
            ]),
            numeric('subfunction', 'u8'),
            numeric('sequence_number', 'u8'),
            new EnumField(UserdataParamInfo),
            /* Data Part */
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6220
            numeric('data_return_code', 'u8'),
            numeric('data_transport_size', 'u8'),
            numeric('data_length', 'be_u16'),
            bytesRef('data', createCountVar('data_length')), // Warning: unimpl to decode known func data
        ]),
    ],
    new StructChoice(
        new StructField(S7Header),
        'rosctr'
    ),
    false,
    true
)
structs.push(S7Parameter)
/************ Param End. ************/

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-s7comm.c#L6709
const protocolHeader = new Struct(
    `${headerName}`,
    [
        new StructField(S7Header),
        new EnumField(S7Parameter), // Parameter and Data
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