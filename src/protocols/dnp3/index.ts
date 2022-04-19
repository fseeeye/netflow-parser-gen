import { bitsNumeric, numeric } from "../../api"
import { BitNumericFieldGroup } from "../../field/bit-field"
import { PeekField } from "../../field/peek"
import { CodeField, CRC16Field, SkipField } from "../../field/special"
import { StructField } from "../../field/struct"
import { TagField } from "../../field/tag"
import { EmptyPayloadEnum, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'Dnp3'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

/****** Data Link Layer Part ******/
// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-dnp.c#L3259
const DataLinkLayer = new Struct(
    'DataLinkLayer',
    [
        new CodeField(`let (input, data_header_buffer) = peek(take(8usize))(input)?;`),
        //refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-dnp.c#L3480
        new SkipField(new TagField('start_bytes', '[0x05, 0x64]')),

        numeric('length', 'u8'),
        new BitNumericFieldGroup([ 
            bitsNumeric('dl_direction', 1, 'u8'),
            bitsNumeric('dl_primary', 1, 'u8'),
            bitsNumeric('dl_frame_count_bit', 1, 'u8'),
            bitsNumeric('dl_frame_count_valid', 1, 'u8'),
            bitsNumeric('dl_function', 4, 'u8'), 
        ]),
        numeric('destination', 'le_u16'),
        numeric('source', 'le_u16'),
        numeric('data_header_crc', 'le_u16'),
        new CRC16Field(
            'data_header_crc',
            'data_header_buffer',
        )
    ]
)
structs.push(DataLinkLayer)
/****** Data Link Layer End. ******/

/****** Transport Control Part ******/
const TransportControl = new Struct(
    'TransportControl',
    [
        new PeekField(
            new BitNumericFieldGroup([ 
                bitsNumeric('tr_final', 1, 'u8'),
                bitsNumeric('tr_first', 1, 'u8'),
                bitsNumeric('tr_sequence', 6, 'u8'),
            ])
        ),
    ]
)
structs.push(TransportControl)
/****** Transport Control End. ******/

/****** Data Chunks Part ******/
// const DataChunk = new Struct(
//     'DataChunk',
//     [
//         bytesRef('data_chunk', createCountVar('check_size')),
//         numeric('data_chunk_checksum', 'le_u16'),
//         new CRC16Field(
//             'data_chunk_checksum',
//             'data_chunk',
//         ),
//     ],
//     [
//         numeric('check_size', 'u8')
//     ]
// )
// structs.push(DataChunk)

// const DataChunks = new IfStructEnum(
//     'DataChunks',
//     [
//         new AnonymousStructVariant('dl_function != 0x09 && dl_function != 0x0B && dl_function != 0x00', 'WithData', [
//             new CodeVarField(new VecField('data_chunks', createCountVar('foo'), DataChunk)),
//             new CodeField(endent`
//                 if !(length >= 5) {
//                     return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
//                 }
                
//                 let mut input = input;
//                 let mut data_len = length - 5;
//                 let mut data_chunks: Vec<DataChunk> = Vec::new();
//                 let mut _data_chunk: DataChunk;

//                 while data_len > 0 {
//                     let check_size: u8 = std::cmp::min(data_len, 16);
//                     (input, _data_chunk) = parse_data_chunk(input, check_size)?;
//                     data_chunks.push(_data_chunk);
//                     data_len -= check_size;
//                 }
//             `),
//         ]),
//         new AnonymousStructVariant('_', 'WithoutData', [])
//     ],
//     new EnumMultiChoice([
//         numeric('data_link_layer.dl_function', 'u8'),
//         numeric('data_link_layer.length', 'u8'),
//     ]),
//     true
// )
// structs.push(DataChunks)
/****** Data Chunks End. ******/

// refs: https://gitlab.com/wireshark/wireshark/-/blob/master/epan/dissectors/packet-dnp.c#L3197
const protocolHeader = new Struct(
    `${headerName}`,
    [
        new StructField(DataLinkLayer),
        new StructField(TransportControl),
        // new EnumField(DataChunks),
        // Warning: unimpl parse Application Layer from DataChunks
    ]
)

const info = new ProtocolInfo(protocolName, 'L5', protocolHeader)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const Dnp3 = new Protocol({
    info,
    payload,
    structs
})