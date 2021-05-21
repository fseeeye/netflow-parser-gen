import endent from "endent"
import { StructParserGenerator } from "../parser/struct"
import { EmptyVariant, StructEnum, StructEnumVariant } from "../types/enum"
import { getRequestDataEnum, getRequestDataWithRefEnum, SimpleReadRequestFields } from "../types/enum.test"
import { BuiltInNumericType } from "../types/numeric"
import { Struct } from "../types/struct"
import { EnumField } from "./enum"
import { NumericField } from "./numeric"
import { EnumVariant } from "../types/enum"

test('test struct with enum field', () => {
    const requestDataEnum = getRequestDataEnum()
    const request = new Struct(
        'Request',
        [
            new NumericField('function_code', BuiltInNumericType.u8),
            new EnumField(requestDataEnum)
        ]
    )
    // console.log(request.definitionWithFields())
    expect(request.definitionWithFields()).toEqual(endent`
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
    }
    
    #[derive(Debug, PartialEq)]
    pub struct Request {
        pub function_code: u8,
        pub request_data: RequestData,
    }
    `)
    const gen = new StructParserGenerator(request)
    // console.log(gen.generateParserWithUserDefinedFields())
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
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
    
    pub fn parse_request_data(input: &[u8], function_code: u8) -> IResult<&[u8], RequestData> {
        let (input, request_data) = match function_code {
            0x01 => parse_read_coils(input),
            0x02 => parse_read_discrete_inputs(input),
            0x03 => parse_read_holding_registers(input),
            0x04 => parse_read_input_registers(input),
            0x05 => parse_write_single_coil(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }
    
    pub fn parse_request(input: &[u8]) -> IResult<&[u8], Request> {
        let (input, function_code) = u8(input)?;
        let (input, request_data) = parse_request_data(input, function_code)?;
        Ok((
            input,
            Request {
                function_code,
                request_data
            }
        ))
    }
    `)
})

test('test struct with enum field with lifetime', () => {
    const structEnum = getRequestDataWithRefEnum()
    const request = new Struct(
        'Request',
        [
            new NumericField('function_code', BuiltInNumericType.u8),
            new EnumField(structEnum)
        ]
    )
    // console.log(request.definitionWithFields())
    expect(request.definitionWithFields()).toEqual(endent`
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
    }
    
    #[derive(Debug, PartialEq)]
    pub struct Request<'a> {
        pub function_code: u8,
        pub request_data: RequestData<'a>,
    }
    `)
    const gen = new StructParserGenerator(request)
    // console.log(gen.generateParserWithUserDefinedFields())
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
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
    
    pub fn parse_request_data(input: &[u8], function_code: u8) -> IResult<&[u8], RequestData> {
        let (input, request_data) = match function_code {
            0x17 => parse_write_file_record_sub_request(input),
            0x06 => parse_write_single_register(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }
    
    pub fn parse_request(input: &[u8]) -> IResult<&[u8], Request> {
        let (input, function_code) = u8(input)?;
        let (input, request_data) = parse_request_data(input, function_code)?;
        Ok((
            input,
            Request {
                function_code,
                request_data
            }
        ))
    }
    `)
})


function getRequestDataEnumWithEmptyVariant() {
    const enumName = 'RequestData'
    const functionCodeField = new NumericField('function_code', BuiltInNumericType.u8)
    const variants: EnumVariant[] = [
        new StructEnumVariant(
            0x01,
            'ReadCoils',
            SimpleReadRequestFields.slice(),
        ),
        new StructEnumVariant(
            0x02,
            'ReadDiscreteInputs',
            SimpleReadRequestFields.slice(),

        ),
        new StructEnumVariant(
            0x03,
            'ReadHoldingRegisters',
            SimpleReadRequestFields.slice(),

        ),
        new StructEnumVariant(
            0x04,
            'ReadInputRegisters',
            SimpleReadRequestFields.slice(),

        ),
        new StructEnumVariant(
            0x05,
            'WriteSingleCoil',
            [
                new NumericField('output_address', BuiltInNumericType.be_u16),
                new NumericField('output_value', BuiltInNumericType.be_u16),
            ],
        ),
        new EmptyVariant(
            0x07
        ),
        new EmptyVariant(
            0x0B
        )
    ]
    const structEnum = new StructEnum(enumName, variants, functionCodeField)
    return structEnum
}

test('test struct with empty variant', () => {
    const structEnum = getRequestDataEnumWithEmptyVariant()
    const request = new Struct(
        'Request',
        [
            new NumericField('function_code', BuiltInNumericType.u8),
            new EnumField(structEnum)
        ]
    )
    // console.log(request.definitionWithFields())
    expect(request.definitionWithFields()).toEqual(endent`
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
        },
        Eof {}
    }
    
    #[derive(Debug, PartialEq)]
    pub struct Request {
        pub function_code: u8,
        pub request_data: RequestData,
    }    
    `)
    const gen = new StructParserGenerator(request)
    // console.log(gen.generateParserWithUserDefinedFields())
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
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
    
    fn parse_eof(input: &[u8]) -> IResult<&[u8], RequestData> {
         let (input, _) = eof(input)?;
         Ok((
             input,
             RequestData::Eof {}
         ))
    }
    
    pub fn parse_request_data(input: &[u8], function_code: u8) -> IResult<&[u8], RequestData> {
        let (input, request_data) = match function_code {
            0x01 => parse_read_coils(input),
            0x02 => parse_read_discrete_inputs(input),
            0x03 => parse_read_holding_registers(input),
            0x04 => parse_read_input_registers(input),
            0x05 => parse_write_single_coil(input),
            0x07 => parse_eof(input),
            0x0b => parse_eof(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }
    
    pub fn parse_request(input: &[u8]) -> IResult<&[u8], Request> {
        let (input, function_code) = u8(input)?;
        let (input, request_data) = parse_request_data(input, function_code)?;
        Ok((
            input,
            Request {
                function_code,
                request_data
            }
        ))
    }
    `)
})