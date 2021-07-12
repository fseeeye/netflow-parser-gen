import endent from "endent"
import { BuiltInNumericType, NumericType } from "../types/numeric"
import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { BytesReferenceField } from "./ref"
import { StructWithLength } from "../types/structWithLength"
import { Field } from "./base"
import { NumericField } from "./numeric"
import { VecVarField } from "./vecVari"
import { createCountVar, createCountVarWithUnitSize } from "../api/input"

test('test struct with vec', () => {
    const fields_sub: Field[] = [
        new NumericField('ref_type', BuiltInNumericType.u8),
        new NumericField('file_number', BuiltInNumericType.be_u16),
        new NumericField('record_number', BuiltInNumericType.be_u16),
        new NumericField('record_length', BuiltInNumericType.be_u16), 
        new BytesReferenceField('record_data', createCountVar('record_length', (name) => `${ name } * 2`)),
    ]
    const WriteFileRecordSubRequest = new StructWithLength('WriteFileRecordSubRequest', fields_sub)
    expect(WriteFileRecordSubRequest.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
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
        new VecVarField('sub_requests', createCountVarWithUnitSize('byte_count', 1, 'div'), 'u8', WriteFileRecordSubRequest),
    ]

    const WriteFileRecord = new Struct('WriteFileRecord', fields)

    expect(WriteFileRecord.definition()).toEqual(endent`
    #[derive(Debug, PartialEq)]
    pub struct WriteFileRecord<'a> {
        pub byte_count: u8,
        pub sub_requests: Vec<WriteFileRecordSubRequest<'a>>,
    }
    `)

    const gen = new StructParserGenerator(WriteFileRecord)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record(input: &[u8]) -> IResult<&[u8], WriteFileRecord> {
        let (input, byte_count) = u8(input)?;
        let mut sub_requests = Vec::new();
        let mut input_tmp = input;
        let mut byte_count_ = byte_count;
        while byte_count_ > 0 {
            let input = input_tmp;
            let (input, sub_requests_) = parse_write_file_record_sub_request(input)?;
            byte_count_ -= sub_requests_.length() as u8;
            sub_requests.push(sub_requests_);
            input_tmp = input;
        }
        let input = input_tmp;
        Ok((
            input,
            WriteFileRecord {
                byte_count,
                sub_requests
            }
        ))
    }    
    `)
})