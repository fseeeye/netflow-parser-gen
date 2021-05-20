import endent from "endent"
import { RustNumericType } from "./numeric"
import { StructParserGenerator } from "./parser"
import { LengthVariableInBytes } from "../len"
import { Field } from "../field/base"
import { NumericField } from "../field/numeric"
import { BytesReferenceField } from "../field/ref"
import { Struct } from "./struct"

test('test struct with reference', () => {
    const fields: Field[] = [
        new NumericField('ref_type', RustNumericType.u8),
        new NumericField('file_number', RustNumericType.be_u16),
        new NumericField('record_number', RustNumericType.be_u16),
        new NumericField('record_len', RustNumericType.be_u16),
        new BytesReferenceField('record_data', new LengthVariableInBytes('record_len')),
    ]

    const writeFileRecordSubRequest = new Struct('WriteFileRecordSubRequest', fields)
    expect(writeFileRecordSubRequest.definition()).toEqual(endent`
    #[derive(Debug,PartialEq)]
    pub struct WriteFileRecordSubRequest <'a> {
        pub ref_type : u8,
        pub file_number : u16,
        pub record_number : u16,
        pub record_len : u16,
        pub record_data : &'a [u8],
    }`)
    const gen = new StructParserGenerator(writeFileRecordSubRequest)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record_sub_request(input: &[u8]) -> IResult<&[u8], WriteFileRecordSubRequest> {
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_len) = be_u16(input)?;
        let (input, record_data) = take(record_len)(input)?;
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
        new NumericField('transaction_id', RustNumericType.u8),
        new NumericField('protocol_id', RustNumericType.be_u16),
        new NumericField('length', RustNumericType.be_u16),
        new NumericField('unit_id', RustNumericType.u8),
    ]

    const header = new Struct('MBAPHeader', fields)

    expect(header.definition()).toEqual(endent`
    #[derive(Debug,PartialEq)]
    pub struct MBAPHeader  {
        pub transaction_id : u8,
        pub protocol_id : u16,
        pub length : u16,
        pub unit_id : u8,
    }`)
    const gen = new StructParserGenerator(header)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_mbap_header(input: &[u8]) -> IResult<&[u8], MBAPHeader> {
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
