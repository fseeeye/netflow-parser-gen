import {
    createNumericFieldSimple as numeric,
    createBytesReferenceFieldSimple as bytesRef,
    createNumericVector as numVec,
    createCountVar,
    createCountVarWithUnitSize,
} from "../../api/input"
import { BasicEnumChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { NumericField } from "../../field/numeric"
import { PayloadField } from "../../field/payload"
import { StructField } from "../../field/struct"
import { VecField } from "../../field/vec"
import { AnonymousStructVariant, EmptyVariant, StructEnum, EmptyPayloadEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"

const protocolName = 'ModbusReq'
const packetName = `${protocolName}Packet`
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct|StructEnum)[] = []

const MbapHeader = new Struct(
    'MbapHeader',
    [
        numeric('transaction_id', 'be_u16'),
        numeric('protocol_id', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('unit_id', 'u8'),
    ]
)
structs.push(MbapHeader)

const ReadFileRecordSubRequest = new Struct(
    'ReadFileRecordSubRequest',
    [
        numeric('ref_type', 'u8'),
        numeric('file_number', 'be_u16'),
        numeric('record_number', 'be_u16'),
        numeric('record_length', 'be_u16'),
    ]
)
structs.push(ReadFileRecordSubRequest)

const WriteFileRecordSubRequest = new Struct(
    'WriteFileRecordSubRequest',
    [
        numeric('ref_type', 'u8'),
        numeric('file_number', 'be_u16'),
        numeric('record_number', 'be_u16'),
        numeric('record_length', 'be_u16'),
        bytesRef('record_data', createCountVarWithUnitSize('record_length', 2, "mul")), // Modified: Record data len = record_length * 2
    ]
)
structs.push(WriteFileRecordSubRequest)

const SimpleReadFields: NumericField[] = [
    numeric('start_address', 'be_u16'),
    numeric('count', 'be_u16'),
]

const Data = new StructEnum(
    'Data',
    [
        new AnonymousStructVariant(0x01, 'ReadCoils', SimpleReadFields),
        new AnonymousStructVariant(0x02, 'ReadDiscreInputs', SimpleReadFields),
        new AnonymousStructVariant(0x03, 'ReadHoldingRegisters', SimpleReadFields),
        new AnonymousStructVariant(0x04, 'ReadInputRegisters', SimpleReadFields),
        new AnonymousStructVariant(
            0x05,
            'WriteSingleCoil',
            [
                numeric('output_address', 'be_u16'),
                numeric('output_value', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(
            0x06,
            'WriteSingleRegister',
            [
                numeric('register_address', 'be_u16'),
                numeric('register_value', 'be_u16'),
            ]
        ),
        new EmptyVariant(0x07, 'ReadExceptionStatus'),
        new EmptyVariant(0x0B, 'GetCommEventCounter'),
        new EmptyVariant(0x0C, 'GetCommEventLog'),
        new AnonymousStructVariant(
            0x0F,
            'WriteMultipleCoils',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
                numeric('byte_count', 'u8'),
                numVec('output_values', createCountVar('byte_count'), 'u8'),
            ]
        ),
        new AnonymousStructVariant(
            0x10,
            'WriteMultipleRegisters',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
                numeric('byte_count', 'u8'),
                numVec('output_values',
                    //  { name: 'output_count', unitSize: 2 }, 
                    createCountVar('byte_count'),
                    'be_u16')
            ]
        ),
        new EmptyVariant(0x0C, 'ReportServerID'),
        new AnonymousStructVariant(
            0x14,
            'ReadFileRecord',
            [
                numeric('byte_count', 'u8'),
                new VecField('sub_requests',
                    createCountVarWithUnitSize('byte_count', 7, 'div'),
                    ReadFileRecordSubRequest),
            ]
        ),
        new AnonymousStructVariant(
            0x15,
            'WriteFileRecord',
            [
                numeric('byte_count', 'u8'),
                new VecField('sub_requests',
                    createCountVarWithUnitSize('byte_count', 7, 'div'), // Q: 7? can't count before parse sub-req
                    WriteFileRecordSubRequest),
            ]
        ),
        new AnonymousStructVariant(
            0x16,
            'MaskWriteRegister',
            [
                numeric('ref_address', 'be_u16'),
                numeric('and_mask', 'be_u16'),
                numeric('or_mask', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(
            0x17,
            'ReadWriteMultipleRegisters',
            [
                numeric('read_start_address', 'be_u16'),
                numeric('read_count', 'be_u16'),
                numeric('write_start_address', 'be_u16'),
                numeric('write_count', 'be_u16'),
                numeric('write_byte_count', 'u8'),
                bytesRef('write_register_values', createCountVarWithUnitSize('write_count', 2, 'mul')), 
            ]
        ),
        new AnonymousStructVariant(
            0x18,
            'ReadFIFOQueue',
            [
                numeric('fifo_pointer_address', 'be_u16'),
            ]
        ),
    ],
    new BasicEnumChoice( 
        // new StructField(PDU, 'pdu'),
        // 'function_code',
        numeric('function_code', 'u8'),
    )
)
structs.push(Data)

const PDU = new Struct(
    `PDU`,
    [
        numeric('function_code', 'u8'),
        new EnumField(Data)
    ],
)
structs.push(PDU)

const header = new Struct(
    `${headerName}`,
    [
        new StructField(MbapHeader),
        new StructField(PDU),
    ]
)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
)

export const ModbusReqPacket = new Struct(
    `${packetName}`,
    [
        new StructField(header),
        new PayloadField(payload),
    ]
)

export const ModbusReq = new Protocol({
    name: `${protocolName}`,
    packet: ModbusReqPacket,
    header,
    payload,
    structs
})
