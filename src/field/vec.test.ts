import endent from "endent"
import { BuiltInNumericType } from "../types/numeric"
import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { Field } from "./base"
import { NumericField } from "./numeric"
import { VecField, VecLoopField } from "./vec"
import { createCountVar, createCountVarWithUnitSize } from "../api/input"
import { BytesReferenceField } from "./ref"
import { StructWithLength } from "../types/struct-with-length"
import { numeric } from "../api"

test('test struct with vec of primitive field', () => {
    const fields: Field[] = [
        new NumericField('start_address', BuiltInNumericType.u8),
        new NumericField('output_count', BuiltInNumericType.be_u16),
        new NumericField('byte_count', BuiltInNumericType.u8),
        new VecField('output_values', createCountVar('output_count'), BuiltInNumericType.be_u16),
    ]
    const writeMultipleRegister = new Struct('WriteMultipleRegisters', fields)
    // console.log(writeMultipleRegister.compileDefinition())
    expect(writeMultipleRegister.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct WriteMultipleRegisters {
        pub start_address: u8,
        pub output_count: u16,
        pub byte_count: u8,
        pub output_values: Vec<u16>,
    }`)

    const gen = new StructParserGenerator(writeMultipleRegister)
    // console.log(gen.compileParser())
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_multiple_registers(input: &[u8]) -> IResult<&[u8], WriteMultipleRegisters> {
        let (input, start_address) = u8(input)?;
        let (input, output_count) = be_u16(input)?;
        let (input, byte_count) = u8(input)?;
        let (input, output_values) = count(be_u16, (output_count) as usize)(input)?;
        Ok((
            input,
            WriteMultipleRegisters {
                start_address,
                output_count,
                byte_count,
                output_values
            }
        ))
    }`)
})

test('test struct with vec field of user defined type', () => {
    const read_file_sub_req_fields: Field[] = [
        new NumericField('ref_type', BuiltInNumericType.u8),
        new NumericField('file_number', BuiltInNumericType.be_u16),
        new NumericField('record_number', BuiltInNumericType.be_u16),
        new NumericField('record_len', BuiltInNumericType.be_u16),
    ]
    const readFileSubReq = new Struct('ReadFileSubRequest', read_file_sub_req_fields)
    // console.log(readFileSubReq.compileDefinition())
    expect(readFileSubReq.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct ReadFileSubRequest {
        pub ref_type: u8,
        pub file_number: u16,
        pub record_number: u16,
        pub record_len: u16,
    }`)
    const subGen = new StructParserGenerator(readFileSubReq)
    // console.log(subGen.compileParser())
    expect(subGen.generateParser()).toEqual(endent`
    pub fn parse_read_file_sub_request(input: &[u8]) -> IResult<&[u8], ReadFileSubRequest> {
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_len) = be_u16(input)?;
        Ok((
            input,
            ReadFileSubRequest {
                ref_type,
                file_number,
                record_number,
                record_len
            }
        ))
    }`)
    const read_file_record_fields: Field[] = [
        new NumericField('byte_count', BuiltInNumericType.u8),
        new VecField('sub_requests', createCountVarWithUnitSize('byte_count', 7, 'div'), readFileSubReq),
    ]
    const readFileRecord = new Struct('ReadFileRecord', read_file_record_fields)
    // console.log(readFileRecord.compileDefinition())
    expect(readFileRecord.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct ReadFileRecord {
        pub byte_count: u8,
        pub sub_requests: Vec<ReadFileSubRequest>,
    }`)
    const gen = new StructParserGenerator(readFileRecord)
    // console.log(gen.compileParser())
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_read_file_record(input: &[u8]) -> IResult<&[u8], ReadFileRecord> {
        let (input, byte_count) = u8(input)?;
        let (input, sub_requests) = count(parse_read_file_sub_request, (byte_count as usize / 7 as usize) as usize)(input)?;
        Ok((
            input,
            ReadFileRecord {
                byte_count,
                sub_requests
            }
        ))
    }`)
})

test('test struct with vec loop', () => {
    const fields_sub: Field[] = [
        new NumericField('ref_type', BuiltInNumericType.u8),
        new NumericField('file_number', BuiltInNumericType.be_u16),
        new NumericField('record_number', BuiltInNumericType.be_u16),
        new NumericField('record_length', BuiltInNumericType.be_u16), 
        new BytesReferenceField('record_data', createCountVar('record_length', (name) => `${ name } * 2`)),
    ]
    const WriteFileRecordSubRequest = new StructWithLength('WriteFileRecordSubRequest', fields_sub)
    expect(WriteFileRecordSubRequest.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct WriteFileRecordSubRequest<'a> {
        pub ref_type: u8,
        pub file_number: u16,
        pub record_number: u16,
        pub record_length: u16,
        pub record_data: &'a [u8],
    }
    impl<'a> WriteFileRecordSubRequest<'a> {
        fn length(&self) -> usize {
            7 + self.record_data.len()
        }
    }
    `)
    const subgen = new StructParserGenerator(WriteFileRecordSubRequest)
    expect(subgen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record_sub_request(input: &[u8]) -> IResult<&[u8], WriteFileRecordSubRequest> {
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_length) = be_u16(input)?;
        let (input, record_data) = take(record_length * 2)(input)?;
        Ok((
            input,
            WriteFileRecordSubRequest {
                ref_type,
                file_number,
                record_number,
                record_length,
                record_data
            }
        ))
    }
    `)

    const fields: Field[] = [   
        new NumericField('byte_count', BuiltInNumericType.u8),
        new VecLoopField('sub_requests', WriteFileRecordSubRequest, numeric('byte_count', 'u8')),
    ]

    const WriteFileRecord = new Struct('WriteFileRecord', fields)

    expect(WriteFileRecord.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct WriteFileRecord<'a> {
        pub byte_count: u8,
        pub sub_requests: Vec<WriteFileRecordSubRequest<'a>>,
    }
    `)

    const gen = new StructParserGenerator(WriteFileRecord)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record(input: &[u8]) -> IResult<&[u8], WriteFileRecord> {
        let (input, byte_count) = u8(input)?;
        let (input, sub_requests) = get_sub_requests(byte_count, input)?;
        Ok((
            input,
            WriteFileRecord {
                byte_count,
                sub_requests
            }
        ))
    }

    fn get_sub_requests(byte_count: u8, input: &[u8]) -> IResult<&[u8], Vec<WriteFileRecordSubRequest>> {
        let mut sub_requests = Vec::new();
        let mut input_tmp = input;
        let mut _byte_count = byte_count;
        while _byte_count > 0 {
            let input = input_tmp;
            let (input, _sub_requests) = parse_write_file_record_sub_request(input)?;
            _byte_count -= _sub_requests.length() as u8;
            sub_requests.push(_sub_requests);
            input_tmp = input;
        }
        Ok((
            input_tmp,
            sub_requests
        ))
    }  
    `)
})