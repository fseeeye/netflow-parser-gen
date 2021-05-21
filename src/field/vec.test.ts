import endent from "endent"
import { CountVariable } from "../len"
import { RustNumericType } from "../types/numeric"
import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { Field } from "./base"
import { NumericField } from "./numeric"
import { VecField } from "./vec"

test('test struct with vec of primitive field', () => {
    const fields: Field[] = [
        new NumericField('start_address', RustNumericType.u8),
        new NumericField('output_count', RustNumericType.be_u16),
        new NumericField('byte_count', RustNumericType.u8),
        new VecField('output_values', new CountVariable('output_count'), RustNumericType.be_u16),
    ]
    const writeMultipleRegister = new Struct('WriteMultipleRegisters', fields)
    // console.log(writeMultipleRegister.compileDefinition())
    expect(writeMultipleRegister.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub struct WriteMultipleRegisters  {
        pub start_address : u8,
        pub output_count : u16,
        pub byte_count : u8,
        pub output_values : Vec<u16>,
    }`)

    const gen = new StructParserGenerator(writeMultipleRegister)
    // console.log(gen.compileParser())
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_multiple_registers(input: &[u8]) -> IResult<&[u8], WriteMultipleRegisters> {
        let (input, start_address) = u8(input)?;
        let (input, output_count) = be_u16(input)?;
        let (input, byte_count) = u8(input)?;
        let (input, output_values) = count(be_u16, output_count as usize)(input)?;
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
        new NumericField('ref_type', RustNumericType.u8),
        new NumericField('file_number', RustNumericType.be_u16),
        new NumericField('record_number', RustNumericType.be_u16),
        new NumericField('record_len', RustNumericType.be_u16),
    ]
    const readFileSubReq = new Struct('ReadFileSubRequest', read_file_sub_req_fields)
    // console.log(readFileSubReq.compileDefinition())
    expect(readFileSubReq.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub struct ReadFileSubRequest  {
        pub ref_type : u8,
        pub file_number : u16,
        pub record_number : u16,
        pub record_len : u16,
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
        new NumericField('byte_count', RustNumericType.u8),
        new VecField('sub_requests', new CountVariable('byte_count', 7, 'div'), readFileSubReq),
    ]
    const readFileRecord = new Struct('ReadFileRecord', read_file_record_fields)
    // console.log(readFileRecord.compileDefinition())
    expect(readFileRecord.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub struct ReadFileRecord  {
        pub byte_count : u8,
        pub sub_requests : Vec<ReadFileSubRequest>,
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