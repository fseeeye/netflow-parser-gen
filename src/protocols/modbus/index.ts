import {
    createNumericFieldSimple as numeric,
    createBytesReferenceFieldSimple as bytesRef,
    createNumericVector as numVec,
    createCountVar,
    createCountVarWithUnitSize,
} from "../../api/input"
import { EnumField } from "../../field/enum"
import { NumericField } from "../../field/numeric"
import { StructField } from "../../field/struct"
import { VecField } from "../../field/vec"
import { AnonymousStructVariant, ChoiceField, EmptyVariant, NamedEnumVariant, StructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"

const ModbusHeader = new Struct(
    'Header',
    [
        numeric('transaction_id', 'be_u16'),
        numeric('protocol_id', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('unit_id', 'u8'),
        numeric('function_code', 'u8'),
    ]
)

const ReadFileRecordSubRequest = new Struct(
    'ReadFileRecordSubRequest',
    [
        numeric('ref_type', 'u8'),
        numeric('file_number', 'be_u16'),
        numeric('record_number', 'be_u16'),
        numeric('record_length', 'be_u16'),
    ]
)

const WriteFileRecordSubRequest = new Struct(
    'WriteFileRecordSubRequest',
    [
        numeric('ref_type', 'u8'),
        numeric('file_number', 'be_u16'),
        numeric('record_number', 'be_u16'),
        numeric('record_length', 'be_u16'),
        bytesRef('record_data', createCountVar('record_length')),
    ]
)

const SimpleReadFields: NumericField[] = [
    numeric('start_address', 'be_u16'),
    numeric('count', 'be_u16'),
]

const Request = new StructEnum(
    'Request',
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
        new EmptyVariant(0x07),
        new EmptyVariant(0x0B),
        new EmptyVariant(0x0C),
        new AnonymousStructVariant(
            0x0F,
            'WriteMultipleCoils',
            [
                numeric('start_address', 'be_u16'),
                numeric('output_count', 'be_u16'),
                numeric('byte_count', 'u8'),
                numVec('output_values', createCountVar('output_count'), 'u8')
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
                    createCountVarWithUnitSize('output_count', 2, 'mul'),
                    'be_u16')
            ]
        ),
        new EmptyVariant(0x11),
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
                    createCountVarWithUnitSize('byte_count', 7, 'div'),
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
                bytesRef('write_register_values', createCountVarWithUnitSize('write_count', 2, 'mul'),),
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
    new ChoiceField(new StructField(ModbusHeader, 'header'), undefined, field => `${field.name}.function_code`)
)

const Payload = new StructEnum(
    'Payload',
    [
        // new NamedStructVariant('Payload', 0x00, 'Request', Request),
        new NamedEnumVariant('Payload', 0x00, Request.name, Request),
        new AnonymousStructVariant(
            0x01,
            'Exception',
            [
                numeric('exception_code', 'u8'),
            ]
        )
    ],
    new ChoiceField(new StructField(ModbusHeader, 'header'),
        name => `${name}.function_code & 0b1000_0000`,
    )
)

const ModbusPacket = new Struct(
    'ModbusPacket',
    [
        new StructField(ModbusHeader, 'header'),
        // numeric('function_code', 'u8'),
        new EnumField(Payload),
    ]
)

const structs = [
    ModbusHeader,
    ReadFileRecordSubRequest,
    WriteFileRecordSubRequest,
    Request,
    Payload,
    ModbusPacket,
]

// // console.log(generateNomImport())
// const nomImports = generateNomImport()

// const structDefs = structs.map(s => s.definition()).join(`\n\n`)

// const parserDefs = structs.map(s => s.parserFunctionDefinition()).join(`\n\n`)

// console.log([
//     nomImports,
//     structDefs,
//     parserDefs,
// ].join(`\n\n`)
// )

export const Modbus = new Protocol({
    name: 'Modbus',
    structs
})
