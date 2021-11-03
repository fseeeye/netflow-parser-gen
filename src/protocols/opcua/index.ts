import endent from "endent"
import { bitsEmptyNumeric, bitsNumeric, numeric, strRef } from "../../api"
import { createCountVar } from "../../api/input"
import { Field } from "../../field/base"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { BasicEnumChoice, EnumMultiChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { CodeField, CodeVarField } from "../../field/special"
import { StructField } from "../../field/struct"
import { VecField } from "../../field/vec"
import { AnonymousStructVariant, EmptyPayloadEnum, EmptyVariant, IfStructEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'Opcua'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []


/************ Opcua Service Part *************/
const FieldsStart: Field[] = []

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_simpletypes.c#L607
function ParseOpcuaString(name: string): Field[] {
    return [
        // new CodeGenField(numeric(`_${name}_len`, 'le_u32')),
        new CodeField(endent`
            let (input, _${name}_len) = le_u32(input)?;
            let mut _${name}_len = _${name}_len;
            if _${name}_len == 0xffffffff {
                _${name}_len = 0;
            }
        `),
        strRef(name, createCountVar(`_${name}_len`)),
    ]
}
const OpcuaString = new Struct(
    'OpcuaString',
    [
        numeric('string_len', 'le_u32'),
        new CodeField(endent`
            let mut string_len = string_len;
            if string_len == 0xffffffff {
                string_len = 0;
            }
        `),
        strRef('string_data', createCountVar('string_len')),
    ]
)
structs.push(OpcuaString)


// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_simpletypes.c#L1054
// const ArrayOfString = new Struct(
//     'ArrayOfString',
//     [
//         // Warning: you should check array_size <= 10000
//         numeric('array_size', 'le_u32'),
//         new VecField('array_string_items', createCountVar('array_size'), OpcuaString)
//     ]
// )
// structs.push(ArrayOfString)
function ParseArrayOfString(name: string): Field[] {
    return [
        // Warning: you should check array_size <= 10000
        numeric(`${name}_array_size`, 'le_u32'),
        new VecField(`${name}_array_string_items`, createCountVar(`${name}_array_size`), OpcuaString)
    ]
}

const NamespaceEnum = new StructEnum(
    'NamespaceEnum',
    [
        new AnonymousStructVariant(1, 'HasNamespace', ParseOpcuaString('namespace_uri')),
        new EmptyVariant(0, 'NoNamespace')
    ],
    new BasicEnumChoice(
        numeric('expanded_nodeid_has_namespace_uri', 'u8')
    )
)
structs.push(NamespaceEnum)

const ServerIndexEnum = new StructEnum(
    'ServerIndexEnum',
    [
        new AnonymousStructVariant(1, 'HasServerIndex', [
            numeric('server_index', 'le_u32')
        ]),
        new EmptyVariant(0, 'NoServerIndex')
    ],
    new BasicEnumChoice(
        numeric('expanded_nodeid_has_server_index', 'u8')
    )
)
structs.push(ServerIndexEnum)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_simpletypes.c#L1143
const NodeidInfo = new StructEnum(
    'NodeidInfo',
    [
        /* Two Byte Node Id */
        new AnonymousStructVariant(0x00, 'TB', [
            numeric('nodeid_numeric', 'u8')
        ]),
        /* Four Byte Node Id */
        new AnonymousStructVariant(0x01, 'FB', [
            numeric('nodeid_namespace', 'u8'),
            numeric('nodeid_numeric', 'le_u16')
        ]),
        /* Numeric, that does not fit into four bytes */
        new AnonymousStructVariant(0x02, 'Numeric', [
            numeric('nodeid_namespace', 'le_u16'),
            numeric('nodeid_numeric', 'le_u32')
        ]),
        /* String */
        new AnonymousStructVariant(0x03, 'String', [
            numeric('nodeid_namespace', 'le_u16')
        ]),
        /* Guid */
        new AnonymousStructVariant(0x04, 'Guid', [
            numeric('nodeid_namespace', 'le_u16')
        ]),
        /* Opaque */
        new AnonymousStructVariant(0x05, 'Opaque', [
            numeric('nodeid_namespace', 'le_u16')
        ]),
    ],
    new BasicEnumChoice(
        numeric('nodeid_encodingmask', 'u8')
    )
)
structs.push(NodeidInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_simpletypes.c#L1240
const ExpandedNodeIdInfo = new IfStructEnum(
    'ExpandedNodeIdInfo',
    [
        /* Two Byte Node Id */
        new AnonymousStructVariant("expanded_nodeid_encodingmask == 0x00", 'TB', [
            numeric('nodeid_numeric', 'u8'),
            new EnumField(NamespaceEnum),
            new EnumField(ServerIndexEnum)
        ]),
        /* Four Byte Node Id */
        new AnonymousStructVariant("expanded_nodeid_encodingmask == 0x01", 'FB', [
            numeric('nodeid_namespace', 'u8'),
            numeric('nodeid_numeric', 'le_u16'),
            new EnumField(NamespaceEnum),
            new EnumField(ServerIndexEnum)
        ]),
        /* Numeric, that does not fit into four bytes */
        new AnonymousStructVariant("expanded_nodeid_encodingmask == 0x02", 'Numeric', [
            numeric('nodeid_namespace', 'le_u16'),
            numeric('nodeid_numeric', 'le_u32'),
            new EnumField(NamespaceEnum),
            new EnumField(ServerIndexEnum)
        ]),
        /* String */
        new AnonymousStructVariant("expanded_nodeid_encodingmask == 0x03", 'String', [
            numeric('nodeid_namespace', 'le_u16'),
            new EnumField(NamespaceEnum),
            new EnumField(ServerIndexEnum)
        ]),
        /* Guid */
        new AnonymousStructVariant("expanded_nodeid_encodingmask == 0x04", 'Guid', [
            numeric('nodeid_namespace', 'le_u16'),
            new EnumField(NamespaceEnum),
            new EnumField(ServerIndexEnum)
        ]),
        /* Opaque */
        new AnonymousStructVariant("expanded_nodeid_encodingmask == 0x05", 'Opaque', [
            numeric('nodeid_namespace', 'le_u16'),
            new EnumField(NamespaceEnum),
            new EnumField(ServerIndexEnum)
        ]),
    ],
    new EnumMultiChoice([
        numeric('expanded_nodeid_encodingmask', 'u8'),
        numeric('expanded_nodeid_has_namespace_uri', 'u8'),
        numeric('expanded_nodeid_has_server_index', 'u8')
    ]),
    true
)
structs.push(ExpandedNodeIdInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_simpletypes.c#L1193
const ExtensionObject: Field[] = [
    new BitNumericFieldGroup([
        bitsNumeric('expanded_nodeid_has_namespace_uri', 1, 'u8'),
        bitsNumeric('expanded_nodeid_has_server_index', 1, 'u8'),
        bitsEmptyNumeric(2, 'u8'),
        bitsNumeric('expanded_nodeid_encodingmask', 4, 'u8')
    ]),
    new EnumField(ExpandedNodeIdInfo),
    new BitNumericFieldGroup([
        bitsEmptyNumeric(6, 'u8'),
        bitsNumeric('encodingmask_has_binary_body', 1, 'u8'),
        bitsNumeric('encodingmask_has_xml_body', 1, 'u8')
    ]),
    // Warning: this should be like above, but we can't solve reference cycle problem.
    // new EnumField(ServiceEnum)
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_complextypeparser.c#L573
const RequestHeader = new Struct(
    'RequestHeader',
    FieldsStart
    .concat([
        new BitNumericFieldGroup([
            bitsEmptyNumeric(4, 'u8'),
            bitsNumeric('nodeid_encodingmask', 4, 'u8')
        ]),
        new EnumField(NodeidInfo),
        numeric('timestamp', 'be_u64'), // Warning: this should be a DateTime
        numeric('request_handle', 'le_u32'),
        // Return Diagnostics
        // numeric('return_diagnostics', 'le_u32'),
        new BitNumericFieldGroup([ 
            bitsNumeric('sl_symbolic_id', 1, 'u8'),
            bitsNumeric('sl_localized_text', 1, 'u8'),
            bitsNumeric('sl_additional_info', 1, 'u8'),
            bitsNumeric('sl_inner_status_code', 1, 'u8'),
            bitsNumeric('sl_inner_diagnostics', 1, 'u8'),
            bitsNumeric('ol_symbolic_id', 1, 'u8'),
            bitsNumeric('ol_localized_text', 1, 'u8'),
            bitsNumeric('ol_additional_info', 1, 'u8'),
            bitsNumeric('ol_inner_status_code', 1, 'u8'),
            bitsNumeric('ol_inner_diagnostics', 1, 'u8'),
            bitsEmptyNumeric(22, 'le_u24')
        ])
    ])
    .concat(ParseOpcuaString('audit_entryid'))
    .concat(numeric('timeout_hint', 'le_u32'))
    .concat(ExtensionObject)
)
structs.push(RequestHeader)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_servicetable.c#L285
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_serviceids.h
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_serviceparser.c
const ServiceEnum = new StructEnum(
    'ServiceEnum',
    [
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_serviceparser.c#L249
        /* Default Binary */
        // Warning: we only impl part of it, now.
        new AnonymousStructVariant(397, 'ServiceFault', []),
        new AnonymousStructVariant(422, 'FindServersRequest', []),
        new AnonymousStructVariant(425, 'FindServersResponse', []),
        new AnonymousStructVariant(12208, 'FindServersOnNetworkRequest', []),
        new AnonymousStructVariant(12209, 'FindServersOnNetworkResponse', []),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_serviceparser.c#L249
        new AnonymousStructVariant(428, 'GetEndpointsRequest', 
            FieldsStart
            .concat([new StructField(RequestHeader)])
            .concat(ParseOpcuaString('endpoint_url'))
            .concat(ParseArrayOfString('locale_ids'))
            .concat(ParseArrayOfString('profile_uris'))
        ),
        new AnonymousStructVariant(431, 'GetEndpointsResponse', []), // 
        new AnonymousStructVariant(437, 'RegisterServerRequest', []),
        new AnonymousStructVariant(440, 'RegisterServerResponse', []),
        new AnonymousStructVariant(12211, 'RegisterServer2Request', []),
        new AnonymousStructVariant(12212, 'RegisterServer2Response', []),
        new AnonymousStructVariant(446, 'OpenSecureChannelRequest', []),
        new AnonymousStructVariant(449, 'OpenSecureChannelResponse', []),
        new AnonymousStructVariant(452, 'CloseSecureChannelRequest', []),
        new AnonymousStructVariant(455, 'CloseSecureChannelResponse', []),
        new AnonymousStructVariant(461, 'CreateSessionRequest', []),
        new AnonymousStructVariant(464, 'CreateSessionResponse', []),
        new AnonymousStructVariant(467, 'ActivateSessionRequest', []),
        new AnonymousStructVariant(470, 'ActivateSessionResponse', []),
        new AnonymousStructVariant(473, 'CloseSessionRequest', []),
        new AnonymousStructVariant(476, 'CloseSessionResponse', []),
        new AnonymousStructVariant(479, 'CancelRequest', []),
        new AnonymousStructVariant(482, 'CancelResponse', []),
        new AnonymousStructVariant(488, 'AddNodesRequest', []),
        new AnonymousStructVariant(491, 'AddNodesResponse', []),
        new AnonymousStructVariant(494, 'AddReferencesRequest', []),
        new AnonymousStructVariant(497, 'AddReferencesResponse', []),
        new AnonymousStructVariant(500, 'DeleteNodesRequest', []),
        new AnonymousStructVariant(503, 'DeleteNodesResponse', []),
        new AnonymousStructVariant(506, 'DeleteReferencesRequest', []),
        new AnonymousStructVariant(509, 'DeleteReferencesResponse', []),
        new AnonymousStructVariant(527, 'BrowseRequest', []),
        new AnonymousStructVariant(530, 'BrowseResponse', []),
        new AnonymousStructVariant(533, 'BrowseNextRequest', []),
        new AnonymousStructVariant(536, 'BrowseNextResponse', []),
        new AnonymousStructVariant(554, 'TranslateBrowsePathsToNodeIdsRequest', []),
        new AnonymousStructVariant(557, 'TranslateBrowsePathsToNodeIdsResponse', []),
        new AnonymousStructVariant(560, 'RegisterNodesRequest', []),
        new AnonymousStructVariant(563, 'RegisterNodesResponse', []),
        new AnonymousStructVariant(566, 'UnregisterNodesRequest', []),
        new AnonymousStructVariant(569, 'UnregisterNodesResponse', []),
        new AnonymousStructVariant(615, 'QueryFirstRequest', []),
        new AnonymousStructVariant(618, 'QueryFirstResponse', []),
        new AnonymousStructVariant(621, 'QueryNextRequest', []),
        new AnonymousStructVariant(624, 'QueryNextResponse', []),
        new AnonymousStructVariant(631, 'ReadRequest', []),
        new AnonymousStructVariant(634, 'ReadResponse', []),
        new AnonymousStructVariant(664, 'HistoryReadRequest', []),
        new AnonymousStructVariant(667, 'HistoryReadResponse', []),
        new AnonymousStructVariant(673, 'WriteRequest', []),
        new AnonymousStructVariant(676, 'WriteResponse', []),
        new AnonymousStructVariant(700, 'HistoryUpdateRequest', []),
        new AnonymousStructVariant(703, 'HistoryUpdateResponse', []),
        new AnonymousStructVariant(712, 'CallRequest', []),
        new AnonymousStructVariant(715, 'CallResponse', []),
        new AnonymousStructVariant(751, 'CreateMonitoredItemsRequest', []),
        new AnonymousStructVariant(754, 'CreateMonitoredItemsResponse', []),
        new AnonymousStructVariant(763, 'ModifyMonitoredItemsRequest', []),
        new AnonymousStructVariant(766, 'ModifyMonitoredItemsResponse', []),
        new AnonymousStructVariant(769, 'SetMonitoringModeRequest', []),
        new AnonymousStructVariant(772, 'SetMonitoringModeResponse', []),
        new AnonymousStructVariant(775, 'SetTriggeringRequest', []),
        new AnonymousStructVariant(778, 'SetTriggeringResponse', []),
        new AnonymousStructVariant(781, 'DeleteMonitoredItemsRequest', []),
        new AnonymousStructVariant(784, 'DeleteMonitoredItemsResponse', []),
        new AnonymousStructVariant(787, 'CreateSubscriptionRequest', []),
        new AnonymousStructVariant(790, 'CreateSubscriptionResponse', []),
        new AnonymousStructVariant(793, 'ModifySubscriptionRequest', []),
        new AnonymousStructVariant(796, 'ModifySubscriptionResponse', []),
        new AnonymousStructVariant(799, 'SetPublishingModeRequest', []),
        new AnonymousStructVariant(802, 'SetPublishingModeResponse', []),
        new AnonymousStructVariant(826, 'PublishRequest', []),
        new AnonymousStructVariant(829, 'PublishResponse', []),
        new AnonymousStructVariant(832, 'RepublishRequest', []),
        new AnonymousStructVariant(835, 'RepublishResponse', []),
        new AnonymousStructVariant(841, 'TransferSubscriptionsRequest', []),
        new AnonymousStructVariant(844, 'TransferSubscriptionsResponse', []),
        new AnonymousStructVariant(847, 'DeleteSubscriptionsRequest', []),
        new AnonymousStructVariant(850, 'DeleteSubscriptionsResponse', []),
        new AnonymousStructVariant(410, 'TestStackRequest', []),
        new AnonymousStructVariant(413, 'TestStackResponse', []),
        new AnonymousStructVariant(416, 'TestStackExRequest', []),
        new AnonymousStructVariant(419, 'TestStackExResponse', []),
        /* Default XML */
        // Warning: unimpl for this, now.
    ],
    new BasicEnumChoice(
        numeric('service_nodeid_numeric', 'le_u32')
    )
)
structs.push(ServiceEnum)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_application_layer.c#L58
const ServiceNodeidInfo = new StructEnum(
    'ServiceNodeidInfo',
    [
        /* Two Byte Node Id */
        new AnonymousStructVariant(0x00, 'TB', [
            numeric('service_nodeid_numeric', 'u8'),
            new CodeVarField(new EnumField(ServiceEnum)),
            new CodeField('let (input, service_enum) = parse_service_enum(input, service_nodeid_numeric as u32)?;')
        ]),
        /* Four Byte Node Id */
        new AnonymousStructVariant(0x01, 'FB', [
            numeric('service_nodeid_namespace', 'u8'),
            numeric('service_nodeid_numeric', 'le_u16'),
            new CodeVarField(new EnumField(ServiceEnum)),
            new CodeField('let (input, service_enum) = parse_service_enum(input, service_nodeid_numeric as u32)?;')
        ]),
        /* Numeric, that does not fit into four bytes */
        new AnonymousStructVariant(0x02, 'Numeric', [
            numeric('service_nodeid_namespace', 'le_u16'),
            numeric('service_nodeid_numeric', 'le_u32'),
            new EnumField(ServiceEnum),
        ]),
        /* String */
        new EmptyVariant(0x03, 'String'),
        /* Guid */
        new EmptyVariant(0x04, 'Guid'),
        /* Opaque */
        new EmptyVariant(0x05, 'Opaque'),
    ],
    new BasicEnumChoice(
        numeric('service_nodeid_encodingmask', 'u8')    
    ),
    false,
    true
)
structs.push(ServiceNodeidInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_transport_layer.c#L147
const OpcuaService: Field[] = [
    /* Node Id */
    numeric('service_nodeid_encodingmask', 'u8'),
    new EnumField(ServiceNodeidInfo),
]
/************ Opcua Service End. *************/


const MessageBasicInfo: Field[] = [
    numeric('chunk_type', 'u8'), // Warning: it should be a char.
    numeric('transport_size', 'le_u32'),
]

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua.c#L221
// Warning: there should be check tvb is part of chunked message, but we omit a lot of options.
const MsgVariantInfo = new StructEnum(
    'MsgVariantInfo',
    [
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua.c#L241
        new AnonymousStructVariant(0x41, 'Abort', 
            ParseOpcuaString('error')
            .concat(ParseOpcuaString('reason'))
        ),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua.c#L345
        new AnonymousStructVariant('_', 'Service', OpcuaService)
    ],
    new BasicEnumChoice(
        numeric('chunk_type', 'u8')
    ),
    true,
    true
)
structs.push(MsgVariantInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua.c#L142
const MessageTypeEnum = new StructEnum(
    'MessageTypeEnum',
    [
        /* "HEL" - Hello */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_transport_layer.c#L78
        new AnonymousStructVariant(0x48454c, 'Hello', 
            MessageBasicInfo
            .concat([
                numeric('version', 'le_u32'),
                numeric('receive_buffer_size', 'le_u32'),
                numeric('send_buffer_size', 'le_u32'),
                numeric('max_message_size', 'le_u32'),
                numeric('max_chunk_count', 'le_u32'),
            ])
            .concat(ParseOpcuaString('endpoint_url'))
        ),
        /* "ACK" - Acknowledge */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_transport_layer.c#L93
        new AnonymousStructVariant(0x41434b, 'Acknowledge', 
            MessageBasicInfo
            .concat([
                numeric('version', 'le_u32'),
                numeric('receive_buffer_size', 'le_u32'),
                numeric('send_buffer_size', 'le_u32'),
                numeric('max_message_size', 'le_u32'),
                numeric('max_chunk_count', 'le_u32'),
            ])
        ),
        /* "ERR" - Error */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_transport_layer.c#L106
        new AnonymousStructVariant(0x455252, 'Error', 
            MessageBasicInfo
            .concat([
                // Warning: those two fields below could be handled more meticulously.
                // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_simpletypes.c#L644
                numeric('error', 'le_u32'),
                numeric('reason', 'le_u32'),
            ])
        ),
        /* "RHE" - ReverseHello */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_transport_layer.c#L116
        new AnonymousStructVariant(0x524845, 'ReverseHello', 
            MessageBasicInfo
            .concat(ParseOpcuaString('suri'))
            .concat(ParseOpcuaString('endpoint_url'))
        ),
        /* "MSG" - Message */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_transport_layer.c#L126
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua.c#L221
        new AnonymousStructVariant(0x4d5347, 'Message', 
            MessageBasicInfo
            .concat([
                numeric('secure_channel_id', 'le_u32'),
                // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua_security_layer.c#L39
                numeric('security_token_id', 'le_u32'),
                numeric('security_sequence_number', 'le_u32'),
                numeric('security_request_id', 'le_u32'),
                // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/plugins/epan/opcua/opcua.c#L221
                new EnumField(MsgVariantInfo),
            ])
        ),
        /* "OPN" - OpenSecureChannel */
        new EmptyVariant(0x4f504e, 'OpenSecureChannel'),
        /* "CLO" - CloseSecureChannel */
        new EmptyVariant(0x434c4f, 'CloseSecureChannel'),
    ],
    new BasicEnumChoice(numeric('message_type', 'be_u24')),
    false,
    true
)
structs.push(MessageTypeEnum)


const protocolHeader = new Struct(
    `${headerName}`,
    [
        numeric('message_type', 'be_u24'),
        new EnumField(MessageTypeEnum)
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