import endent from "endent"
import { BuiltInNumericType } from "./numeric"
import { Field } from "../field/base"
import { NumericField } from "../field/numeric"
import { BytesReferenceField } from "../field/ref"
import { Struct } from "./struct"
import { StructParserGenerator } from "../parser/struct"
import { createCountVar } from "../api/input"

test('test struct with reference', () => {
    const fields: Field[] = [
        new NumericField('ref_type', BuiltInNumericType.u8),
        new NumericField('file_number', BuiltInNumericType.be_u16),
        new NumericField('record_number', BuiltInNumericType.be_u16),
        new NumericField('record_len', BuiltInNumericType.be_u16),
        new BytesReferenceField('record_data', createCountVar('record_len')),
    ]

    const writeFileRecordSubRequest = new Struct('WriteFileRecordSubRequest', fields)
    expect(writeFileRecordSubRequest.definition()).toEqual(endent`
    #[allow(non_camel_case_types)]
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct WriteFileRecordSubRequest<'a> {
        pub ref_type: u8,
        pub file_number: u16,
        pub record_number: u16,
        pub record_len: u16,
        pub record_data: &'a [u8],
    }`)
    const gen = new StructParserGenerator(writeFileRecordSubRequest)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record_sub_request(input: &[u8]) -> IResult<&[u8], WriteFileRecordSubRequest> {
        debug!(target: "PARSER(parse_write_file_record_sub_request)", "struct WriteFileRecordSubRequest");
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_len) = be_u16(input)?;
        let (input, record_data) = take(record_len as usize)(input)?;
        Ok((
            input,
            WriteFileRecordSubRequest {
                ref_type,
                file_number,
                record_number,
                record_len,
                record_data
            }
        ))
    }`)
})

test('test struct with numeric types only', () => {
    const fields: Field[] = [
        new NumericField('transaction_id', BuiltInNumericType.u8),
        new NumericField('protocol_id', BuiltInNumericType.be_u16),
        new NumericField('length', BuiltInNumericType.be_u16),
        new NumericField('unit_id', BuiltInNumericType.u8),
    ]

    const header = new Struct('MBAPHeader', fields)

    expect(header.definition()).toEqual(endent`
    #[allow(non_camel_case_types)]
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct MBAPHeader {
        pub transaction_id: u8,
        pub protocol_id: u16,
        pub length: u16,
        pub unit_id: u8,
    }`)
    const gen = new StructParserGenerator(header)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_mbap_header(input: &[u8]) -> IResult<&[u8], MBAPHeader> {
        debug!(target: "PARSER(parse_mbap_header)", "struct MBAPHeader");
        let (input, transaction_id) = u8(input)?;
        let (input, protocol_id) = be_u16(input)?;
        let (input, length) = be_u16(input)?;
        let (input, unit_id) = u8(input)?;
        Ok((
            input,
            MBAPHeader {
                transaction_id,
                protocol_id,
                length,
                unit_id
            }
        ))
    }`)
})
