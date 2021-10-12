// Udp/Tcp based BACnet
import endent from "endent"
import { bitNumeric, bitsNumeric, bytesRef, numeric, slice } from "../../api"
import { createCountVar } from "../../api/input"
import { Ipv4Address, Ipv6Address, MacAddress } from "../../field/address"
import { Field } from "../../field/base"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { BasicEnumChoice, EnumMultiChoice, StructChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { CodeField } from "../../field/special"
import { StructField } from "../../field/struct"
import { LimitedVecLoopField, UnlimitedVecLoopField, VecField } from "../../field/vec"
import { AnonymousStructVariant, EmptyPayloadEnum, EmptyVariant, IfStructEnum, StructEnum } from "../../types/enum"
import { getBuildinNumericTypeByTypeName } from "../../types/numeric"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'Bacnet'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

/****** BACman Sec Part ******/
const WrapperMsgAuth = new IfStructEnum(
    'WrapperMsgAuth',
    [
        new EmptyVariant('(control & 0x10) == 0', 'EmptyAuthData'),
        new AnonymousStructVariant('((control & 0x10) != 0) && (dlen == 0)', 'AddtionalAuthData', [
            numeric('mech', 'u8'),
            numeric('usr_id', 'be_u16'),
            numeric('usr_role', 'u8'),
        ]),
        new AnonymousStructVariant('((control & 0x10) != 0) && (dlen > 0)', 'AddtionalAuthDataExtra', [
            numeric('mech', 'u8'),
            numeric('usr_id', 'be_u16'),
            numeric('usr_role', 'u8'),
            // if dlen > 0
            numeric('auth_len', 'be_u16'),
            bytesRef('auth_data', createCountVar('auth_len')),
        ]),
    ],
    new EnumMultiChoice([
        numeric('control', 'u8'),
        numeric('dlen', 'u8'),
    ]),
    true
)

const WrapperMsg = new StructEnum(
    'WrapperMsg',
    [
        new AnonymousStructVariant(0x00, 'WrapperMsgEncrypted', [
            numeric('dst_dev_instance', 'be_u24'),
            numeric('dnet', 'be_u16'),
            numeric('dlen', 'u8'),
            bytesRef('dadr', createCountVar('dlen')),
            numeric('snet', 'be_u16'),
            numeric('slen', 'u8'),
            bytesRef('sadr', createCountVar('slen')),
            new EnumField(WrapperMsgAuth),
        ]),
        new EmptyVariant(0x00, 'WrapperMsgUnencrypted'),
    ],
    new BasicEnumChoice(
        numeric('control', 'u8'),
        (string) => `${string} & 0x40`
    )
)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L345
const SecWrapper: Field[] = [
    numeric('control', 'u8'),
    numeric('key_revision', 'u8'),
    numeric('key_identifier', 'be_u16'),
    numeric('src_dev_instance', 'be_u24'),
    numeric('message_id', 'be_u32'),
    numeric('time_stamp', 'be_u32'),
    new EnumField(WrapperMsg),
]
/****** BACman Sec End. ******/


/****** BACnet Virtual Link Control Part ******/
const Bdt = new Struct(
    'Bdt',
    [
        new Ipv4Address('ip'),
        numeric('port', 'be_u16'),
        new Ipv4Address('mask'),
    ]
)
structs.push(Bdt)

const Fdt = new Struct(
    'Fdt',
    [
        new Ipv4Address('ip'),
        numeric('port', 'be_u16'),
        numeric('ttl', 'be_u16'),
        numeric('timeout', 'be_u16'),
    ]
)
structs.push(Fdt)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bvlc.c#L519
const BvlcFunctionIpv4Info = new StructEnum(
    'BvlcFunctionIpv4Info',
    [
        new AnonymousStructVariant(0x00, 'BvlcResult', [
            numeric('result_ipv4', 'be_u16'),
        ]),
        new AnonymousStructVariant(0x01, 'WriteBroadcastDistributionTable', [
            new UnlimitedVecLoopField('bdt_table', Bdt),
        ]),
        new EmptyVariant(0x02, 'ReadBroadcastDistributionTable'),
        new AnonymousStructVariant(0x03, 'ReadBroadcastDistributionTableAck', [
            new UnlimitedVecLoopField('bdt_table', Bdt),
        ]),
        new AnonymousStructVariant(0x04, 'ForwardedNpdu', [
            new Ipv4Address('fwd_ip'),
            numeric('fwd_port', 'be_u16'),
        ]),
        new AnonymousStructVariant(0x05, 'RegisterForeignDevice', [
            numeric('reg_ttl', 'be_u16'),
        ]),
        new EmptyVariant(0x06, 'ReadForeignDeviceTable'),
        new AnonymousStructVariant(0x07, 'ReadForeignDeviceTableAck', [
            new UnlimitedVecLoopField('fdt_table', Fdt),
        ]),
        new AnonymousStructVariant(0x08, 'DeleteForeignDeviceTableEntry', [
            new Ipv4Address('fdt_ip'),
            numeric('fdt_port', 'be_u16'),
        ]),
        new EmptyVariant(0x09, 'DistributeBroadcastToNetwork'),
        new EmptyVariant(0x0a, 'OriginalUnicastNpdu'),
        new EmptyVariant(0x0b, 'OriginalBroadcastNpdu'),
        /* Warning: umimpl for SecureBvll */
        // new AnonymousStructVariant(0x0c, 'SecureBvll', SecWrapper.concat([
        //     new EnumField(BvlcFunctionEnum)
        // ]))
    ],
    new BasicEnumChoice(
        numeric('bvlc_function', 'u8'),
    ),
    false,
    true
)
structs.push(BvlcFunctionIpv4Info)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bvlc.c#L743
const BvlcFunctionIpv6Info = new StructEnum(
    'BvlcFunctionIpv6Info',
    [
        new AnonymousStructVariant(0x00, 'BvlcResult', [
            numeric('result_ip6', 'be_u16'),
        ]),
        new AnonymousStructVariant(0x01, 'OriginalUnicastNpdu', [
            numeric('virt_dest', 'be_u24'),
        ]),
        new EmptyVariant(0x02, 'OriginalBroadcastNpdu'), // Warning: is it eof?
        new AnonymousStructVariant(0x03, 'AddressResolution', [
            numeric('virt_dest', 'be_u24'),
        ]),
        new AnonymousStructVariant(0x04, 'ForwardedAddressResolution', [
            numeric('virt_dest', 'be_u24'),
            new Ipv6Address('orig_source_addr'),
            numeric('orig_source_port', 'be_u16'),
        ]),
        new AnonymousStructVariant(0x05, 'AddressResolutionAck', [
            numeric('virt_dest', 'be_u24'),
        ]),
        new EmptyVariant(0x06, 'VirtualAddressResolution'),
        new AnonymousStructVariant(0x07, 'VirtualAddressResolutionAck', [
            numeric('virt_dest', 'be_u24'),
        ]),
        new AnonymousStructVariant(0x08, 'ForwardedNpdu', [
            new Ipv6Address('orig_source_addr'),
            numeric('orig_source_port', 'be_u16'),
        ]),
        new AnonymousStructVariant(0x09, 'RegisterForeignDevice', [
            numeric('reg_ttl', 'be_u16'),
        ]),
        new AnonymousStructVariant(0x0a, 'DeleteForeignDeviceTableEntry', [
            new Ipv6Address('fdt_addr'),
            numeric('fdt_port', 'be_u16'),
        ]),
        // Warning: umimpl for SecureBvll
        // new AnonymousStructVariant('0x0b', 'SecureBvll', SecWrapper.concat([
        //     new EnumField(BvlcFunctionEnum)
        // ]))
        new EmptyVariant(0x0c, 'DistributeBroadcastToNetwork'),
    ],
    new BasicEnumChoice(
        numeric('bvlc_function', 'u8'),
    ),
    false,
    true
)
structs.push(BvlcFunctionIpv6Info)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bvlc.c#L823
const BvlcTypeInfo = new StructEnum(
    'BvlcTypeInfo',
    [
        new AnonymousStructVariant(0x81, 'Ipv4AnnexJ', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bvlc.c#L448
            numeric('bvlc_function', 'u8'),
            numeric('packet_length', 'be_u16'),
            new CodeField(endent`
                let bvlc_length: u16;
                if bvlc_function >= 0x09 {
                    bvlc_length = 4;
                } else if bvlc_function == 0x04 {
                    bvlc_length = 10;
                } else {
                    bvlc_length = packet_length;
                }
                if (bvlc_length < 4) || (bvlc_length > packet_length) {
                    return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
                }
            `),
            new EnumField(BvlcFunctionIpv4Info),
        ]),
        new AnonymousStructVariant(0x82, 'Ipv6AnnexU', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bvlc.c#L649
            numeric('bvlc_function', 'u8'),
            numeric('packet_length', 'be_u16'),
            new CodeField(endent`
                let bvlc_length: u16;
                if (bvlc_function == 0x00) || (bvlc_function == 0x09) {
                    bvlc_length = 9;
                } else if (bvlc_function == 0x01) || (bvlc_function == 0x03) || (bvlc_function == 0x05) || (bvlc_function == 0x07) {
                    bvlc_length = 10;
                } else if (bvlc_function == 0x02) || (bvlc_function == 0x06) || (bvlc_function == 0x0c) {
                    bvlc_length = 7;
                } else if bvlc_function == 0x04 {
                    bvlc_length = 28;
                } else if (bvlc_function == 0x08) || (bvlc_function == 0x0a) {
                    bvlc_length = 25;
                } else if bvlc_function == 0x0b {
                    bvlc_length = 4;
                } else {
                    bvlc_length = packet_length;
                }
                if bvlc_length > packet_length {
                    return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
                }
            `),
            new EnumField(BvlcFunctionIpv6Info),
        ]),
    ],
    new BasicEnumChoice(
        numeric('bvlc_type', 'u8'),
    ),
    false,
    true
)
structs.push(BvlcTypeInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bvlc.c#L823
const Bvlc = new Struct(
    'Bvlc',
    [
        numeric('bvlc_type', 'u8'),
        new EnumField(BvlcTypeInfo),
    ]
)
structs.push(Bvlc)
/****** BACnet Virtual Link Control End. ******/


/****** Building Automation and Control Network: NPDU Part ******/
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L516
const DestAdrEnum = new StructEnum(
    'DestAdrEnum',
    [
        new EmptyVariant(0, 'Broadcast'),
        new AnonymousStructVariant(1, 'ArcnetMac', [
            numeric('dadr_mstp', 'u8'),
        ]),
        new AnonymousStructVariant(2, 'OtherMac2', [
            numeric('dadr_tmp', 'be_u16'),
        ]),
        new AnonymousStructVariant(3, 'OtherMac3', [
            numeric('dadr_tmp', 'be_u24'),
        ]),
        new AnonymousStructVariant(4, 'OtherMac4', [
            numeric('dadr_tmp', 'be_u32'),
        ]),
        new AnonymousStructVariant(5, 'OtherMac5', [
            slice('dadr_tmp', 'u8_5'),
        ]),
        new AnonymousStructVariant(6, 'EthernetMac', [
            new MacAddress('dadr_eth'),
        ]),
    ],
    new BasicEnumChoice(
        numeric('dlen', 'u8'),
    ),
    false,
    true
)
structs.push(DestAdrEnum)

const BacControlDest = new IfStructEnum(
    'BacControlDest',
    [
        new AnonymousStructVariant('control & 0x20 == 0x20', 'DestinationSpec', [
            numeric('dnet', 'be_u16'),
            numeric('dlen', 'u8'),
            new EnumField(DestAdrEnum),
        ]),
        new EmptyVariant('_', 'NonDestinationSpec'),
    ],
    new EnumMultiChoice([
        numeric('control', 'u8')
    ]),
    true
)
structs.push(BacControlDest)

const BacControlDestExtra = new IfStructEnum(
    'BacControlDestExtra',
    [
        new AnonymousStructVariant('control & 0x20 == 0x20', 'DestinationSpec', [
            numeric('hop_count', 'u8'),
        ]),
        new EmptyVariant('_', 'NonDestinationSpec'),
    ],
    new EnumMultiChoice([
        numeric('control', 'u8')
    ]),
    true
)
structs.push(BacControlDestExtra)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L564
const SrcAdrEnum = new StructEnum(
    'SrcAdrEnum',
    [
        // 0 is invalid
        new AnonymousStructVariant(1, 'ArcnetMac', [
            numeric('sadr_mstp', 'u8'),
        ]),
        new AnonymousStructVariant(2, 'OtherMac2', [
            numeric('sadr_tmp', 'be_u16'),
        ]),
        new AnonymousStructVariant(3, 'OtherMac3', [
            numeric('sadr_tmp', 'be_u24'),
        ]),
        new AnonymousStructVariant(4, 'OtherMac4', [
            numeric('sadr_tmp', 'be_u32'),
        ]),
        new AnonymousStructVariant(5, 'OtherMac5', [
            slice('sadr_tmp', 'u8_5'),
        ]),
        new AnonymousStructVariant(6, 'EthernetMac', [
            new MacAddress('sadr_eth'),
        ]),
    ],
    new BasicEnumChoice(
        numeric('slen', 'u8'),
    ),
    false,
    true
)
structs.push(SrcAdrEnum)

const BacControlSrc = new IfStructEnum(
    'BacControlSrc',
    [
        new AnonymousStructVariant('control & 0x08 == 0x08', 'SourceSpec', [
            numeric('snet', 'be_u16'),
            numeric('slen', 'u8'),
            new EnumField(SrcAdrEnum),
        ]),
        new EmptyVariant('_', 'NonSourceSpec'),
    ],
    new EnumMultiChoice([
        numeric('control', 'u8')
    ]),
    true
)
structs.push(BacControlSrc)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L620
const dnetVec: Field[] = [new UnlimitedVecLoopField('dnet_vec', getBuildinNumericTypeByTypeName('be_u16'))]
const RtabItem = new Struct(
    'RtabItem',
    [
        numeric('dnet', 'be_u16'), // Connected DNET
        numeric('port_id', 'u8'), // Port ID
        numeric('info_len', 'u8'), // Port Info Length
        bytesRef('info', createCountVar('info_len')), // Port Info
    ]
)
structs.push(RtabItem)
const InitRtab: Field[] = [
    numeric('ports_num', 'u8'),
    new LimitedVecLoopField('rtab_items', RtabItem, numeric('ports_num', 'u8')),
]

const NsduInfo = new StructEnum(
    'NsduInfo',
    [
        /* Performance Index (in I-Could-Be-Router-To-Network) */
        new AnonymousStructVariant(0x02, 'IcbR', [
            numeric('dnet', 'be_u16'),
            numeric('perf', 'u8'),
        ]),
        /* Reason, DNET (in Reject-Message-To-Network) */
        new AnonymousStructVariant(0x03, 'Rej', [
            numeric('reject_reason', 'u8'),
            numeric('dnet', 'be_u16'),
        ]),
        /* N*DNET (in Router-Busy-To-Network,Router-Available-To-Network) */
        new AnonymousStructVariant(0x04, 'RBusy', dnetVec),
        new AnonymousStructVariant(0x00, 'WhoR', dnetVec),
        new AnonymousStructVariant(0x05, 'RAva', dnetVec),
        new AnonymousStructVariant(0x01, 'IamR', dnetVec),
        /* Initialize-Routing-Table */
        new AnonymousStructVariant(0x06, 'InitRtab', InitRtab),
        new AnonymousStructVariant(0x07, 'InitRtabAck', InitRtab),
        /* Establish-Connection-To-Network */
        new AnonymousStructVariant(0x08, 'EstCon', [
            numeric('dnet', 'be_u16'),
            numeric('term_time_value', 'u8'),
        ]),
        /* Disconnect-Connection-To-Network */
        new AnonymousStructVariant(0x09, 'DiscCon', [
            numeric('dnet', 'be_u16'),
        ]),
        /* What-Is-Networknumber */
        new EmptyVariant(0x12, 'WhatNetnr'),
        /* Networknumber-Is */
        new AnonymousStructVariant(0x13, 'NetnrIs', [
            numeric('dnet', 'be_u16'),
            numeric('netno_status', 'u8'),
        ]),
        /* Secure */
        // Warning: unimpl for all secure variants: 0x0a -> 0x11
        /* Vendor */
        new AnonymousStructVariant('0x80 | 0x81 | 0x82 | 0x83 | 0x84 | 0x85 | 0x86 | 0x87 | 0x88 | 0x89 | 0x8a | 0x8b | 0x8c | 0x8d | 0x8e | 0x8f', 'Vendor', [
            numeric('vendor_id', 'be_u16'),
        ])
    ],
    new BasicEnumChoice(
        numeric('mesg_type', 'u8'),
    ),
    false,
    true
)
structs.push(NsduInfo)

const BacControlNet = new IfStructEnum(
    'BacControlNet',
    [
        new AnonymousStructVariant('control & 0x80 == 0x80', 'NsduContain', [
            numeric('mesg_type', 'u8'),
            new EnumField(NsduInfo),
        ]),
        new EmptyVariant('_', 'NonNsduContain'),
    ],
    new EnumMultiChoice([
        numeric('control', 'u8')
    ]),
    true
)
structs.push(BacControlNet)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L479
const Npdu = new Struct(
    'Npdu',
    [
        numeric('version', 'u8'),
        numeric('control', 'u8'),
        new EnumField(BacControlDest),
        new EnumField(BacControlSrc),
        new EnumField(BacControlDestExtra),
        new EnumField(BacControlNet),
    ]
)
structs.push(Npdu)
/****** Building Automation and Control Network: NPDU End. ******/


/****** Building Automation and Control Network: APDU Part ******/
const SegmentedReqInfo = new StructEnum(
    'SegmentedReqInfo',
    [
        new AnonymousStructVariant(0x08, 'SegmentedReq', [
            numeric('sequence_number', 'u8'),
            numeric('window_size', 'u8'),
        ]),
        new EmptyVariant(0x00, 'UnsegmentedReq')
    ],
    new BasicEnumChoice(
        numeric('pdu_flags', 'u8'),
        (str) => `${str} & 0x08`
    ),
    false,
    true
)
structs.push(SegmentedReqInfo)

const BacnetObjectPropertyReferenceInfo = new IfStructEnum(
    'BacnetObjectPropertyReferenceInfo',
    [
        new AnonymousStructVariant('context_tag_number == 0', 'ObjectIdentifier', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L7727
            new BitNumericFieldGroup([
                bitsNumeric('object_type', 10, 'be_u16'),
                bitsNumeric('instance_number', 22, 'be_u24'),
            ]),
        ]),
        new AnonymousStructVariant('context_tag_number == 1', 'PropertyIdentifier', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L13996
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L8072
            // Warning: it should be a enum depending on 'length_value_type'
            bitNumeric('property_identifier', 'be_u32', 0, createCountVar('length_value_type', (str) => `${str} * 8`)),
        ]),
        new AnonymousStructVariant('context_tag_number == 2', 'PropertyArrayIndex', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L8109
            // Warning: it should be a enum depending on 'length_value_type'
            bitNumeric('property_array_index', 'be_u32', 0, createCountVar('length_value_type', (str) => `${str} * 8`)),
        ]),
    ],
    new EnumMultiChoice([
        numeric('context_tag_number', 'u8'),
        numeric('length_value_type', 'u8'),
    ]),
    true
)
structs.push(BacnetObjectPropertyReferenceInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L14038
const BacnetObjectPropertyReferenceItem = new Struct(
    'BacnetObjectPropertyReferenceItem',
    [
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L6843
        new BitNumericFieldGroup([ // Warning: this is simple impl.
            bitsNumeric('context_tag_number', 4, 'u8'),
            bitsNumeric('tag_class', 1, 'u8'),
            bitsNumeric('length_value_type', 3, 'u8'), // value的长度，决定它是u8/u16/u24/u32
        ]),

        new EnumField(BacnetObjectPropertyReferenceInfo),
    ]
)
structs.push(BacnetObjectPropertyReferenceItem)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L14810
const ConfirmedServiceRequest = new StructEnum(
    'ConfirmedServiceRequest',
    [
        new AnonymousStructVariant(0,  'AcknowledgeAlarm', []),
        new AnonymousStructVariant(1,  'ConfirmedCovNotification', []),
        new AnonymousStructVariant(2,  'ConfirmedEventNotification', []),
        new AnonymousStructVariant(3,  'ConfirmedGetAlarmSummary', []),
        new AnonymousStructVariant(4,  'GetEnrollmentSummary', []),
        new AnonymousStructVariant(5,  'SubscribeCov', []),
        new AnonymousStructVariant(6,  'AtomicReadFile', []),
        new AnonymousStructVariant(7,  'AtomicWriteFile', []),
        new AnonymousStructVariant(8,  'AddListElement', []),
        new AnonymousStructVariant(9,  'RemoveListElement', []),
        new AnonymousStructVariant(10, 'CreateObject', []),
        new AnonymousStructVariant(11, 'DeleteObject', []),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L13863
        new AnonymousStructVariant(12, 'ReadProperty', [
            // new VecField('property_items', createCountVar('3'), BacnetObjectPropertyReferenceItem),
            new UnlimitedVecLoopField('property_items', BacnetObjectPropertyReferenceItem),
        ]),
        new AnonymousStructVariant(13, 'ReadPropertyConditional', []),
        new AnonymousStructVariant(14, 'ReadPropertyMultiple', []),
        new AnonymousStructVariant(15, 'WriteProperty', []),
        new AnonymousStructVariant(16, 'WritePropertyMultiple', []),
        new AnonymousStructVariant(17, 'DeviceCommunicationControl', []),
        new AnonymousStructVariant(18, 'ConfirmedPrivateTransfer', []),
        new AnonymousStructVariant(19, 'ConfirmedTextMessage', []),
        new AnonymousStructVariant(20, 'ReinitializeDevice', []),
        new AnonymousStructVariant(21, 'VtOpen', []),
        new AnonymousStructVariant(22, 'VtClose', []),
        new AnonymousStructVariant(23, 'VtData', []),
        new AnonymousStructVariant(24, 'Authenticate', []),
        new AnonymousStructVariant(25, 'RequestKey', []),
        new AnonymousStructVariant(26, 'ReadRange', []),
        new AnonymousStructVariant(27, 'LifeSafetyOperation', []),
        new AnonymousStructVariant(28, 'SubscribeCovProperty', []),
        new AnonymousStructVariant(29, 'GetEventInformation', []),
        new AnonymousStructVariant(30, 'SubscribeCovPropertyMultiple', []),
        new AnonymousStructVariant(31, 'ConfirmedCovNotificationMultiple', []),
        new AnonymousStructVariant(32, 'ConfirmedAuditNotification', []),
        new AnonymousStructVariant(33, 'AuditLogQuery', []),
    ],
    new BasicEnumChoice(
        numeric('service_choice', 'u8')
    ),
    false,
    false
)
structs.push(ConfirmedServiceRequest)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L13869
const BacnetObjectPropertyReferenceAckInfo = new IfStructEnum(
    'BacnetObjectPropertyReferenceAckInfo',
    [
        new AnonymousStructVariant('context_tag_number == 0', 'ObjectIdentifier', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L7727
            new BitNumericFieldGroup([
                bitsNumeric('object_type', 10, 'be_u16'),
                bitsNumeric('instance_number', 22, 'be_u24'),
            ]),
        ]),
        new AnonymousStructVariant('context_tag_number == 1', 'PropertyIdentifier', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L13996
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L8072
            // Warning: it should be a enum depending on 'length_value_type'
            bitNumeric('property_identifier', 'be_u32', 0, createCountVar('length_value_type', (str) => `${str} * 8`)),
        ]),
        new AnonymousStructVariant('context_tag_number == 2', 'PropertyArrayIndex', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L8109
            // Warning: it should be a enum depending on 'length_value_type'
            bitNumeric('property_array_index', 'be_u32', 0, createCountVar('length_value_type', (str) => `${str} * 8`)),
        ]),
        new AnonymousStructVariant('context_tag_number == 3 && length_value_type == 6', 'PropertyValueOpen', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L8678
            new BitNumericFieldGroup([ 
                bitsNumeric('app_context_tag_number', 4, 'u8'),
                bitsNumeric('app_tag_class', 1, 'u8'),
                bitsNumeric('app_length_value_type', 3, 'u8'),
            ]),
            // Error: there is a large enum depending on property_identifier!
            new BitNumericFieldGroup([
                bitsNumeric('object_type', 10, 'be_u16'),
                bitsNumeric('instance_number', 22, 'be_u24'),
            ]),
        ]),
        new EmptyVariant('context_tag_number == 3 && length_value_type == 7', 'PropertyValueClose'),
    ],
    new EnumMultiChoice([
        numeric('context_tag_number', 'u8'),
        // numeric('tag_class', 'u8'),
        numeric('length_value_type', 'u8'),
    ]),
    true
)
structs.push(BacnetObjectPropertyReferenceAckInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L13869
const BacnetObjectPropertyReferenceAckItem = new Struct(
    'BacnetObjectPropertyReferenceAckItem',
    [
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L6843
        new BitNumericFieldGroup([ // Warning: this is simple impl.
            bitsNumeric('context_tag_number', 4, 'u8'),
            bitsNumeric('tag_class', 1, 'u8'),
            bitsNumeric('length_value_type', 3, 'u8'), // value的长度，决定它是u8/u16/u24/u32
        ]),

        new EnumField(BacnetObjectPropertyReferenceAckInfo),
    ]
)
structs.push(BacnetObjectPropertyReferenceAckItem)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L14924
const ConfirmedServiceAck = new StructEnum(
    'ConfirmedServiceAck',
    [
        new AnonymousStructVariant(3,  'ConfirmedEventNotificationAck', []),
        new AnonymousStructVariant(4,  'GetEnrollmentSummaryAck', []),
        new AnonymousStructVariant(6,  'AtomicReadFile', []),
        new AnonymousStructVariant(7,  'AtomicReadFileAck', []),
        new AnonymousStructVariant(10, 'CreateObject', []),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L13869
        new AnonymousStructVariant(12, 'ReadPropertyAck', [
            // new VecField('property_items', createCountVar('4'), BacnetObjectPropertyReferenceAckItem),
            new UnlimitedVecLoopField('property_items', BacnetObjectPropertyReferenceAckItem),
        ]),
        new AnonymousStructVariant(13, 'ReadPropertyConditionalAck', []),
        new AnonymousStructVariant(14, 'ReadPropertyMultipleAck', []),
        new AnonymousStructVariant(18, 'ConfirmedPrivateTransferAck', []),
        new AnonymousStructVariant(21, 'VtOpenAck', []),
        new AnonymousStructVariant(23, 'VtDataAck', []),
        new AnonymousStructVariant(24, 'AuthenticateAck', []),
        new AnonymousStructVariant(26, 'ReadRangeAck', []),
        new AnonymousStructVariant(29, 'GetEventInformationACK', []),
        new AnonymousStructVariant(33, 'AuditLogQueryAck', []),
    ],
    new BasicEnumChoice(
        numeric('service_choice', 'u8')
    ),
    false,
    false
)
structs.push(ConfirmedServiceAck)

// Warning: unimpl all variants
const ApduInfo = new IfStructEnum(
    'ApduInfo',
    [
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L15164
        new AnonymousStructVariant('apdu_type == 0', 'ComfirmedServiceRequest', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L15109
            new BitNumericFieldGroup([
                bitsNumeric('unknow_bit', 1, 'u8'),
                bitsNumeric('response_segments', 3, 'u8'),
                bitsNumeric('max_adpu_size', 4, 'u8'),
            ]),
            numeric('invoke_id', 'u8'),
            new EnumField(SegmentedReqInfo),
            numeric('service_choice', 'u8'),
            new EnumField(ConfirmedServiceRequest),
        ]),
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L15215
        new AnonymousStructVariant('apdu_type == 3', 'ComplexAckPdu', [
            numeric('invoke_id', 'u8'),
            new EnumField(SegmentedReqInfo),
            numeric('service_choice', 'u8'),
            new EnumField(ConfirmedServiceAck),
        ])
    ],
    new EnumMultiChoice([
        numeric('apdu_type', 'u8'),
        numeric('pdu_flags', 'u8'),
    ]),
    true
)
structs.push(ApduInfo)

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L1073
const ApduOption = new StructEnum(
    'ApduOption',
    [
        new AnonymousStructVariant(0x80, 'UnknowApdu', [
            bytesRef('unknow_data', createCountVar('input.len()'))
        ]),
        new AnonymousStructVariant(0x00, 'Apdu', [
            // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacapp.c#L15585
            new BitNumericFieldGroup([
                bitsNumeric('apdu_type', 4, 'u8'),
                bitsNumeric('pdu_flags', 4, 'u8'),
            ]),
            new EnumField(ApduInfo),
        ])
    ],
    new StructChoice(
        new StructField(Npdu),
        'control',
        (str) => `${str} & 0x80`
    ),
    false,
    true
)
structs.push(ApduOption)
/****** Building Automation and Control Network: APDU End. ******/


const protocolHeader = new Struct(
    `${headerName}`,
    [
        /* BACnet Virtual Link Control */
        new StructField(Bvlc),
        /* NPDU */
        // refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-bacnet.c#L1083
        new StructField(Npdu),
        /* APDU */
        new EnumField(ApduOption),
    ]
)

const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const Bacnet = new Protocol({
    info,
    payload,
    structs
})