import endent from "endent"
import { StructParserGenerator } from "../parser/struct"
import { getRequestDataEnum } from "../types/enum.test"
import { RustNumericType } from "../types/numeric"
import { Struct } from "../types/struct"
import { EnumField } from "./enum"
import { NumericField } from "./numeric"

test('test struct with enum field', () => {
    const requestDataEnum = getRequestDataEnum()
    const request = new Struct(
        'Request',
        [
            new NumericField('function_code', RustNumericType.u8),
            new EnumField(requestDataEnum)
        ]
    )
    // console.log(request.definitionWithFields())
    expect(request.definitionWithFields()).toEqual(endent`
    #[derive(Debug,PartialEq)]
    pub enum RequestData  {
        ReadCoils {
             start_address : u16,
             count : u16,
        },
        ReadDiscreteInputs {
             start_address : u16,
             count : u16,
        },
        ReadHoldingRegisters {
             start_address : u16,
             count : u16,
        },
        ReadInputRegisters {
             start_address : u16,
             count : u16,
        },
        WriteSingleCoil {
             output_address : u16,
             output_value : u16,
        }
    }
    
    #[derive(Debug,PartialEq)]
    pub struct Request  {
        pub function_code : u8,
        pub request_data : RequestData,
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