import endent from "endent"
import { StructParserGenerator } from "../parser/struct"
import { EmptyVariant, StructEnum, AnonymousStructVariant, EofVariant } from "../types/enum"
import { getRequestDataEnum, getRequestDataWithRefEnum, SimpleReadRequestFields } from "../types/enum.test"
import { BuiltInNumericType } from "../types/numeric"
import { Struct } from "../types/struct"
import { EnumField } from "./enum"
import { NumericField } from "./numeric"
import { EnumVariant } from "../types/enum"
import { createNumericField } from "../api/input"
import { BasicEnumChoice } from "./choice"

test('test struct with enum field', () => {
    const requestDataEnum = getRequestDataEnum()
    const request = new Struct(
        'Request',
        [
            // new NumericField('function_code', BuiltInNumericType.u8),
            createNumericField({ name: 'function_code', typeName: 'u8' }),
            new EnumField(requestDataEnum)
        ]
    )
    const gen = new StructParserGenerator(request)
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
    fn parse_request_data_read_coils(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_coils)", "struct ReadCoils");
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
    
    fn parse_request_data_read_discrete_inputs(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_discrete_inputs)", "struct ReadDiscreteInputs");
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
    
    fn parse_request_data_read_holding_registers(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_holding_registers)", "struct ReadHoldingRegisters");
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
    
    fn parse_request_data_read_input_registers(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_input_registers)", "struct ReadInputRegisters");
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
    
    fn parse_request_data_write_single_coil(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_write_single_coil)", "struct WriteSingleCoil");
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
        debug!(target: "PARSER(parse_request_data)", "enum RequestData");
        let (input, request_data) = match function_code {
            0x01 => parse_request_data_read_coils(input),
            0x02 => parse_request_data_read_discrete_inputs(input),
            0x03 => parse_request_data_read_holding_registers(input),
            0x04 => parse_request_data_read_input_registers(input),
            0x05 => parse_request_data_write_single_coil(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }
    
    pub fn parse_request(input: &[u8]) -> IResult<&[u8], Request> {
        debug!(target: "PARSER(parse_request)", "struct Request");
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
            // new NumericField('function_code', BuiltInNumericType.u8),
            createNumericField({ name: 'function_code', typeName: 'u8' }),
            new EnumField(structEnum)
        ]
    )
    const gen = new StructParserGenerator(request)
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
    fn parse_request_data_write_file_record_sub_request(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_write_file_record_sub_request)", "struct WriteFileRecordSubRequest");
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_len) = be_u16(input)?;
        let (input, record_data) = take(record_len as usize)(input)?;
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
    
    fn parse_request_data_write_single_register(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_write_single_register)", "struct WriteSingleRegister");
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
        debug!(target: "PARSER(parse_request_data)", "enum RequestData");
        let (input, request_data) = match function_code {
            0x17 => parse_request_data_write_file_record_sub_request(input),
            0x06 => parse_request_data_write_single_register(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }
    
    pub fn parse_request(input: &[u8]) -> IResult<&[u8], Request> {
        debug!(target: "PARSER(parse_request)", "struct Request");
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
        ),
        new EofVariant(0x07, 'ReadExceptionStatus'),
        new EmptyVariant(0x0B, 'GetCommEventCounter'),
    ]
    const structEnum = new StructEnum(enumName, variants, new BasicEnumChoice(functionCodeField))
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
    const gen = new StructParserGenerator(request)
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
    fn parse_request_data_read_coils(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_coils)", "struct ReadCoils");
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
    
    fn parse_request_data_read_discrete_inputs(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_discrete_inputs)", "struct ReadDiscreteInputs");
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
    
    fn parse_request_data_read_holding_registers(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_holding_registers)", "struct ReadHoldingRegisters");
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
    
    fn parse_request_data_read_input_registers(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_input_registers)", "struct ReadInputRegisters");
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
    
    fn parse_request_data_write_single_coil(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_write_single_coil)", "struct WriteSingleCoil");
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
    
    #[inline(always)]
    fn parse_request_data_read_exception_status(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_read_exception_status)", "eof variant of RequestData");
        let (input, _) = eof(input)?;
        Ok((
            input,
            RequestData::ReadExceptionStatus {}
        ))
    }

    #[inline(always)]
    fn parse_request_data_get_comm_event_counter(input: &[u8]) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data_get_comm_event_counter)", "empty variant of RequestData");
        Ok((
            input,
            RequestData::GetCommEventCounter {}
        ))
    }
    
    pub fn parse_request_data(input: &[u8], function_code: u8) -> IResult<&[u8], RequestData> {
        debug!(target: "PARSER(parse_request_data)", "enum RequestData");
        let (input, request_data) = match function_code {
            0x01 => parse_request_data_read_coils(input),
            0x02 => parse_request_data_read_discrete_inputs(input),
            0x03 => parse_request_data_read_holding_registers(input),
            0x04 => parse_request_data_read_input_registers(input),
            0x05 => parse_request_data_write_single_coil(input),
            0x07 => parse_request_data_read_exception_status(input),
            0x0b => parse_request_data_get_comm_event_counter(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, request_data))
    }
    
    pub fn parse_request(input: &[u8]) -> IResult<&[u8], Request> {
        debug!(target: "PARSER(parse_request)", "struct Request");
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