import endent from "endent"
import { createBytesReferenceField, createCountVar, createNumericField } from "../api/input"
import { BasicEnumChoice } from "../field/choice"
import { NumericField } from "../field/numeric"
import { BytesReferenceField } from "../field/ref"
import { StructEnumParserGenerator } from "../parser/enum"
import { AnonymousStructVariant, EnumVariant, StructEnum, NamedStructVariant, NamedEnumVariant, EmptyVariant } from "./enum"
import { BuiltInNumericType } from "./numeric"
import { Struct } from "./struct"


export const SimpleReadRequestFields = [
    new NumericField('start_address', BuiltInNumericType.be_u16),
    new NumericField('count', BuiltInNumericType.be_u16),
]

export function getRequestDataEnum() {
    const enumName = 'RequestData'
    const functionCodeField = new NumericField('function_code', BuiltInNumericType.u8)
    const variants: EnumVariant[] = [
        new AnonymousStructVariant(
            0x01,
            'ReadCoils',
            SimpleReadRequestFields.slice(),
        ),
        new AnonymousStructVariant(
            0x02,
            'ReadDiscreteInputs',
            SimpleReadRequestFields.slice(),

        ),
        new AnonymousStructVariant(
            0x03,
            'ReadHoldingRegisters',
            SimpleReadRequestFields.slice(),

        ),
        new AnonymousStructVariant(
            0x04,
            'ReadInputRegisters',
            SimpleReadRequestFields.slice(),

        ),
        new AnonymousStructVariant(
            0x05,
            'WriteSingleCoil',
            [
                new NumericField('output_address', BuiltInNumericType.be_u16),
                new NumericField('output_value', BuiltInNumericType.be_u16),
            ],
        )
    ]
    const structEnum = new StructEnum(enumName, variants, new BasicEnumChoice(functionCodeField))
    return structEnum
}

test('test enum definition without reference', () => {
    const structEnum = getRequestDataEnum()
    expect(structEnum.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub enum RequestData {
        ReadCoils {
             start_address: u16,
             count: u16,
        },
        ReadDiscreteInputs {
             start_address: u16,
             count: u16,
        },
        ReadHoldingRegisters {
             start_address: u16,
             count: u16,
        },
        ReadInputRegisters {
             start_address: u16,
             count: u16,
        },
        WriteSingleCoil {
             output_address: u16,
             output_value: u16,
        }
    }`)
    const gen = new StructEnumParserGenerator(structEnum)
    // console.log(gen.compile())
    expect(gen.generateParser()).toEqual(endent`
    fn parse_read_coils(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, start_address) = be_u16(input)?;
        let (input, count) = be_u16(input)?;
        Ok((
            input,
            RequestData::ReadCoils {
                start_address,
                count
            }
        ))
    }
    
    fn parse_read_discrete_inputs(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, start_address) = be_u16(input)?;
        let (input, count) = be_u16(input)?;
        Ok((
            input,
            RequestData::ReadDiscreteInputs {
                start_address,
                count
            }
        ))
    }
    
    fn parse_read_holding_registers(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, start_address) = be_u16(input)?;
        let (input, count) = be_u16(input)?;
        Ok((
            input,
            RequestData::ReadHoldingRegisters {
                start_address,
                count
            }
        ))
    }
    
    fn parse_read_input_registers(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, start_address) = be_u16(input)?;
        let (input, count) = be_u16(input)?;
        Ok((
            input,
            RequestData::ReadInputRegisters {
                start_address,
                count
            }
        ))
    }
    
    fn parse_write_single_coil(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, output_address) = be_u16(input)?;
        let (input, output_value) = be_u16(input)?;
        Ok((
            input,
            RequestData::WriteSingleCoil {
                output_address,
                output_value
            }
        ))
    }
    
    pub fn parse_request_data<'a>(input: &'a [u8], function_code: u8) -> IResult<&'a [u8], RequestData> {
        let (input, request_data) = match function_code {
            0x01 => parse_read_coils(input),
            0x02 => parse_read_discrete_inputs(input),
            0x03 => parse_read_holding_registers(input),
            0x04 => parse_read_input_registers(input),
            0x05 => parse_write_single_coil(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }`)
})

export function getRequestDataWithRefEnum() {
    const functionCodeField = new NumericField('function_code', BuiltInNumericType.u8)
    const variants = [
        new AnonymousStructVariant(
            0x17,
            'WriteFileRecordSubRequest',
            [
                new NumericField('ref_type', BuiltInNumericType.u8),
                new NumericField('file_number', BuiltInNumericType.be_u16),
                new NumericField('record_number', BuiltInNumericType.be_u16),
                new NumericField('record_len', BuiltInNumericType.be_u16),
                new BytesReferenceField('record_data', createCountVar('record_len')),
            ],
        ),
        new AnonymousStructVariant(
            0x06,
            'WriteSingleRegister',
            [
                new NumericField('register_address', BuiltInNumericType.be_u16),
                new NumericField('register_value', BuiltInNumericType.be_u16),
            ],

        )
    ]
    const structEnum = new StructEnum('RequestData', variants, new BasicEnumChoice(functionCodeField))
    return structEnum
}

test('enum definition with reference', () => {
    const structEnum = getRequestDataWithRefEnum()
    expect(structEnum.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub enum RequestData<'a> {
        WriteFileRecordSubRequest {
             ref_type: u8,
             file_number: u16,
             record_number: u16,
             record_len: u16,
             record_data: &'a [u8],
        },
        WriteSingleRegister {
             register_address: u16,
             register_value: u16,
        }
    }`)
    const gen = new StructEnumParserGenerator(structEnum)
    // console.log(gen.compile())
    expect(gen.generateParser()).toEqual(endent`
    fn parse_write_file_record_sub_request(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_len) = be_u16(input)?;
        let (input, record_data) = take(record_len)(input)?;
        Ok((
            input,
            RequestData::WriteFileRecordSubRequest {
                ref_type,
                file_number,
                record_number,
                record_len,
                record_data
            }
        ))
    }
    
    fn parse_write_single_register(input: &[u8]) -> IResult<&[u8], RequestData> {
        let (input, register_address) = be_u16(input)?;
        let (input, register_value) = be_u16(input)?;
        Ok((
            input,
            RequestData::WriteSingleRegister {
                register_address,
                register_value
            }
        ))
    }
    
    pub fn parse_request_data<'a>(input: &'a [u8], function_code: u8) -> IResult<&'a [u8], RequestData<'a>> {
        let (input, request_data) = match function_code {
            0x17 => parse_write_file_record_sub_request(input),
            0x06 => parse_write_single_register(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }`)
})

test('enum with user defined variants', () => {
    const request = new StructEnum(
        'RequestData',
        [
            new AnonymousStructVariant(0x01, 'ReadCoils', [
                createNumericField({ name: 'start_address', typeName: 'be_u16' }),
                createNumericField({ name: 'count', typeName: 'be_u16' }),
            ]),
            new AnonymousStructVariant(0x04, 'WriteSingleCoil', [
                createNumericField({ name: 'output_address', typeName: 'be_u16' }),
                createNumericField({ name: 'output_value', typeName: 'be_u16' }),
            ]),
            new EmptyVariant(0x0b, 'GetCommEventCounter'),
        ],
        new BasicEnumChoice(createNumericField({ name: 'function_code', typeName: 'u8' })),
    )
    // console.log(request.definition())
    // const reqGen = new StructEnumParserGenerator(request)
    // console.log(reqGen.generateParser())
    const exception = new Struct(
        'Exception',
        [
            createNumericField({ name: 'exception_code', typeName: 'u8' })
        ]
    )
    // console.log(exception.definition())
    // const exceptionGen = new StructParserGenerator(exception)
    // console.log(exceptionGen.generateParser())
    const payload = new StructEnum(
        'Payload',
        [
            new NamedEnumVariant('Payload', 0x00, 'RequestData', request),
            new NamedStructVariant('Payload', 0x01, 'Exception', exception)
        ],
        new BasicEnumChoice(createNumericField({ name: 'function_code', typeName: 'u8' }), (field) => { return `${field} & 0b10000000` }),
    )
    // console.log(payload.definition())
    expect(payload.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub enum Payload {
        RequestData(RequestData),
        Exception(Exception)
    }
    `)
    const gen = new StructEnumParserGenerator(payload)
    expect(gen.generateEnumParser()).toEqual(endent`
    pub fn parse_payload<'a>(input: &'a [u8], function_code: u8) -> IResult<&'a [u8], Payload> {
        let (input, payload) = match function_code & 0b10000000 {
            0x0 => {
                let (input, request_data) = parse_request_data(input, function_code)?;
                Ok((input, Payload::RequestData(request_data)))
            },
            0x01 => {
                let (input, exception) = parse_exception(input)?;
                Ok((input, Payload::Exception(exception)))
            },
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, payload))
    }
    `)
})

test('enum with user defined variants with reference', () => {
    const request = new StructEnum(
        'RequestData',
        [
            new AnonymousStructVariant(0x01, 'ReadCoils', [
                createNumericField({ name: 'start_address', typeName: 'be_u16' }),
                createNumericField({ name: 'count', typeName: 'be_u16' }),
                createBytesReferenceField({ name: 'data', countVar: createCountVar('count') }),
            ]),
            new AnonymousStructVariant(0x04, 'WriteSingleCoil', [
                createNumericField({ name: 'output_address', typeName: 'be_u16' }),
                createNumericField({ name: 'output_value', typeName: 'be_u16' }),
            ]),
            new EmptyVariant(0x0b, 'GetCommEventCounter'),
        ],
        new BasicEnumChoice(createNumericField({ name: 'function_code', typeName: 'u8' })),
    )
    const payload = new StructEnum(
        'Payload',
        [
            new NamedEnumVariant('Payload', 0x00, 'RequestData', request),
            new AnonymousStructVariant(0x02, 'WriteMultipleRegisters', [
                createNumericField({ name: 'write_start_address', typeName: 'be_u16' }),
                createNumericField({ name: 'write_count', typeName: 'be_u16' }),
                createBytesReferenceField({ name: 'write_register_values', countVar: createCountVar('write_count') }),
            ])
        ],
        new BasicEnumChoice(createNumericField({ name: 'function_code', typeName: 'u8' }), (field) => { return `${field} & 0b10000000` }),
    )
    // console.log(payload.definition())
    expect(payload.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub enum Payload<'a> {
        RequestData(RequestData<'a>),
        WriteMultipleRegisters {
             write_start_address: u16,
             write_count: u16,
             write_register_values: &'a [u8],
        }
    }
    `)
    const gen = new StructEnumParserGenerator(payload)
    // console.log(gen.generateParser())
    expect(gen.generateParser()).toEqual(endent`
    fn parse_write_multiple_registers(input: &[u8]) -> IResult<&[u8], Payload> {
        let (input, write_start_address) = be_u16(input)?;
        let (input, write_count) = be_u16(input)?;
        let (input, write_register_values) = take(write_count)(input)?;
        Ok((
            input,
            Payload::WriteMultipleRegisters {
                write_start_address,
                write_count,
                write_register_values
            }
        ))
    }
    
    pub fn parse_payload<'a>(input: &'a [u8], function_code: u8) -> IResult<&'a [u8], Payload<'a>> {
        let (input, payload) = match function_code & 0b10000000 {
            0x0 => {
                let (input, request_data) = parse_request_data(input, function_code)?;
                Ok((input, Payload::RequestData(request_data)))
            },
            0x02 => parse_write_multiple_registers(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, payload))
    }
    `)
})