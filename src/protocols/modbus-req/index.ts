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
import { StructField } from "../../field/struct"
import { LimitedLenVecLoopField, VecField } from "../../field/vec"
import { AnonymousStructVariant, EofVariant, StructEnum, EmptyPayloadEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'ModbusReq'
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

const byte_count = numeric('byte_count', 'u8')
const Data = new StructEnum(
    'Data',
    [
        new AnonymousStructVariant(0x01, 'ReadCoils', SimpleReadFields),
        new AnonymousStructVariant(0x02, 'ReadDiscreteInputs', SimpleReadFields),
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
        new EofVariant(0x07, 'ReadExceptionStatus'),
        new EofVariant(0x0B, 'GetCommEventCounter'),
        new EofVariant(0x0C, 'GetCommEventLog'),
        new AnonymousStructVariant(
            0x0F,
            'WriteMultipleCoils',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
                byte_count,
                numVec('output_values', createCountVar('byte_count'), 'u8'),
            ]
        ),
        new AnonymousStructVariant(
            0x10,
            'WriteMultipleRegisters',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
                byte_count,
                numVec('output_values',
                    //  { name: 'output_count', unitSize: 2 }, 
                    createCountVar('byte_count'),
                    'be_u16')
            ]
        ),
        new EofVariant(0x11, 'ReportServerID'),
        new AnonymousStructVariant(
            0x14,
            'ReadFileRecord',
            [
                byte_count,
                new VecField('sub_requests',
                    createCountVarWithUnitSize('byte_count', 7, 'div'),
                    ReadFileRecordSubRequest),
            ]
        ),
        new AnonymousStructVariant(
            0x15,
            'WriteFileRecord',
            [
                byte_count,
                new LimitedLenVecLoopField('sub_requests', createCountVar('byte_count'), new StructField(WriteFileRecordSubRequest)),
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
                numVec('write_register_values',
                    createCountVar('write_byte_count'),
                    'be_u16')
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

const info = new ProtocolInfo(protocolName, 'L5', header)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const ModbusReq = new Protocol({
    info,
    payload,
    structs
})
