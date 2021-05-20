import endent from "endent"
import { NumericField } from "../field/numeric"
import { BytesReferenceField } from "../field/ref"
import { CountVariable } from "../len"
import { StructEnumVariant, StructEnum, StructEnumParserGenerator } from "./enum"
import { RustNumericType } from "./numeric"


const SimpleReadRequestFields = [
    new NumericField('start_address', RustNumericType.be_u16),
    new NumericField('count', RustNumericType.be_u16),
]

test('test enum definition without reference', () => {
    const enumName = 'RequestData'
    const functionCodeField = new NumericField('function_code', RustNumericType.u8)
    const variants: StructEnumVariant[] = [
        new StructEnumVariant(
            'ReadCoils',
            SimpleReadRequestFields.slice(),
            0x01
        ),
        new StructEnumVariant(
            'ReadDiscreteInputs',
            SimpleReadRequestFields.slice(),
            0x02
        ),
        new StructEnumVariant(
            'ReadHoldingRegisters',
            SimpleReadRequestFields.slice(),
            0x03
        ),
        new StructEnumVariant(
            'ReadInputRegisters',
            SimpleReadRequestFields.slice(),
            0x04
        ),
        new StructEnumVariant(
            'WriteSingleCoil',
            [
                new NumericField('output_address', RustNumericType.be_u16),
                new NumericField('output_value', RustNumericType.be_u16),
            ],
            0x05
        )
    ]
    const structEnum = new StructEnum(enumName, variants, functionCodeField)
    const gen = new StructEnumParserGenerator(structEnum)
    // console.log(gen.compile())
    expect(gen.generateParser()).toEqual(endent`
    use nom::bytes::complete::{tag, take};
    use nom::multi::count;
    use nom::number::complete::{be_u32, be_u16, u8};
    use nom::sequence::tuple;
    use nom::IResult;
    
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
    }`)
})

test('enum definition with reference', () => {
    const functionCodeField = new NumericField('function_code', RustNumericType.u8)
    const variants = [
        new StructEnumVariant(
            'WriteFileRecordSubRequest',
            [
                new NumericField('ref_type', RustNumericType.u8),
                new NumericField('file_number', RustNumericType.be_u16),
                new NumericField('record_number', RustNumericType.be_u16),
                new NumericField('record_len', RustNumericType.be_u16),
                new BytesReferenceField('record_data', new CountVariable('record_len')),
            ],
            0x17
        ),
        new StructEnumVariant(
            'WriteSingleRegister',
            [
                new NumericField('register_address', RustNumericType.be_u16),
                new NumericField('register_value', RustNumericType.be_u16),
            ],
            0x06
        )
    ]
    const structEnum = new StructEnum('RequestData', variants, functionCodeField)
    const gen = new StructEnumParserGenerator(structEnum)
    // console.log(gen.compile())
    expect(gen.generateParser()).toEqual(endent`
    use nom::bytes::complete::{tag, take};
    use nom::multi::count;
    use nom::number::complete::{be_u32, be_u16, u8};
    use nom::sequence::tuple;
    use nom::IResult;
    
    #[derive(Debug,PartialEq)]
    pub enum RequestData <'a> {
        WriteFileRecordSubRequest {
             ref_type : u8,
             file_number : u16,
             record_number : u16,
             record_len : u16,
             record_data : &'a [u8],
        },
        WriteSingleRegister {
             register_address : u16,
             register_value : u16,
        }
    }
    
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
    }`)
})