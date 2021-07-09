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

const protocolName = 'ModbusRsp'
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
    'ReadFileRecordRspSubRequest',
    [
        numeric('file_rsp_len', 'u8'),
        numeric('ref_type', 'u8'),
        bytesRef('record_data', createCountVar('file_rsp_len', (fileRspLength) => `${fileRspLength} - 1`)),
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


const ExceptionFields: NumericField[] = [
    numeric('exception_code', 'u8'),
]

const Data = new StructEnum(
    "Data",
    [
        new AnonymousStructVariant(
            0x01, 
            'ReadCoils', // Warning: maybe indiscernible between Req and Rsp, such `0x0103[0-F][0-F]001[1-8]`
            [
                numeric('byte_count', 'u8'),
                numVec('coil_status', createCountVar('byte_count'), 'u8')
            ]
        ),
        new AnonymousStructVariant(0x81, 'ReadCoilsExc', ExceptionFields),
        new AnonymousStructVariant(
            0x02, 
            'ReadDiscreInputs', // Warning: maybe indiscernible between Req and Rsp, such `0x0203[0-F][0-F]001[1-8]`
            [
                numeric('byte_count', 'u8'),
                numVec('coil_status', createCountVar('byte_count'), 'u8')
            ]
        ),
        new AnonymousStructVariant(0x82, 'ReadDiscreInputsExc', ExceptionFields),
        new AnonymousStructVariant(
            0x03, 
            'ReadHoldingRegisters', 
            [
                numeric('byte_count', 'u8'),
                numVec('coil_status', createCountVarWithUnitSize('byte_count', 2, "div"), 'be_u16') 
            ]
        ),
        new AnonymousStructVariant(0x83, 'ReadHoldingRegistersExc', ExceptionFields),
        new AnonymousStructVariant(
            0x04, 
            'ReadInputRegisters', 
            [
                numeric('byte_count', 'u8'),
                numVec('coil_status', createCountVarWithUnitSize('byte_count', 2, "div"), 'be_u16')
            ]
        ),
        new AnonymousStructVariant(0x84, 'ReadInputRegistersExc', ExceptionFields),
        new AnonymousStructVariant( // same variant within req & rsp
            0x05,
            'WriteSingleCoil',
            [
                numeric('output_address', 'be_u16'),
                numeric('output_value', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(0x85, 'WriteSingleCoilExc', ExceptionFields),
        new AnonymousStructVariant( // same variant within req & rsp
            0x06,
            'WriteSingleRegister',
            [
                numeric('register_address', 'be_u16'),
                numeric('register_value', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(0x86, 'WriteSingleRegisterExc', ExceptionFields),
        new EmptyVariant(0x07),
        new EmptyVariant(0x0B),
        new EmptyVariant(0x0C),
        new AnonymousStructVariant(
            0x0F,
            'WriteMultipleCoils',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(0x8F, 'WriteMultipleCoilsExc', ExceptionFields),
        new AnonymousStructVariant(
            0x10,
            'WriteMultipleRegisters',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(0x90, 'WriteMultipleRegistersExc', ExceptionFields),
        new EmptyVariant(0x11),
        new AnonymousStructVariant(
            0x14,
            'ReadFileRecord',
            [
                numeric('byte_count', 'u8'),
                new VecField('sub_requests',
                    createCountVarWithUnitSize('byte_count', 4, 'div'), // Q: can't count before parse sub-req
                    ReadFileRecordSubRequest),
            ]
        ),
        new AnonymousStructVariant(0x94, 'ReadFileRecordExc', ExceptionFields),
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
        new AnonymousStructVariant(0x95, 'WriteFileRecordExc', ExceptionFields),
        new AnonymousStructVariant(
            0x16,
            'MaskWriteRegister',
            [
                numeric('ref_address', 'be_u16'),
                numeric('and_mask', 'be_u16'),
                numeric('or_mask', 'be_u16'),
            ]
        ),
        new AnonymousStructVariant(0x96, 'MaskWriteRegisterExc', ExceptionFields),
        new AnonymousStructVariant(
            0x17,
            'ReadWriteMultipleRegisters',
            [
                numeric('byte_count', 'u8'),
                bytesRef('read_registers_value', createCountVar('byte_count')),
            ]
        ),
        new AnonymousStructVariant(0x97, 'ReadWriteMultipleRegistersExc', ExceptionFields),
        new AnonymousStructVariant(
            0x18,
            'ReadFIFOQueue',
            [
                numeric('byte_count', 'be_u16'),
                numeric('fifo_count', 'be_u16'),
                bytesRef('fifo_value_register', createCountVarWithUnitSize('fifo_count', 2, 'mul')),
            ]
        ),
        new AnonymousStructVariant(0x98, 'ReadFIFOQueueExc', ExceptionFields),
    ],
    new BasicEnumChoice( 
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

export const ModbusRspPacket = new Struct(
    `${packetName}`,
    [
        new StructField(header),
        new PayloadField(payload),
    ]
)

export const ModbusRsp = new Protocol({
    name: `${protocolName}`,
    packet: ModbusRspPacket,
    header,
    payload,
    structs
})
