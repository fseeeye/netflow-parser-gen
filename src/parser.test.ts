import { Field, NumericField, PrimitiveNumericType, BytesRefField, StructField, LengthVariableInBytes } from "./field"
import { Struct } from "./struct"
import { StructParserGenerator } from "./parser"
import endent from "endent"

test('test struct with reference', () => {
    const fields: Field[] = [
        new NumericField('ref_type', PrimitiveNumericType.u8),
        new NumericField('file_number', PrimitiveNumericType.be_u16),
        new NumericField('record_number', PrimitiveNumericType.be_u16),
        new NumericField('record_len', PrimitiveNumericType.be_u16),
        new BytesRefField('record_data', new LengthVariableInBytes('record_len')),
    ]

    const writeFileRecordSubRequest = new Struct('WriteFileRecordSubRequest', fields)
    // console.log(writeFileRecordSubRequest.compileSelfDefinition())
    expect(writeFileRecordSubRequest.compileSelfDefinition()).toEqual(endent`
    #[derive(Debug,PartialEq)]
    pub struct WriteFileRecordSubRequest <'a> {
        pub ref_type : u8,
        pub file_number : u16,
        pub record_number : u16,
        pub record_len : u16,
        pub record_data : &'a [u8],
    }`)
    const gen = new StructParserGenerator(writeFileRecordSubRequest)
    // console.log(gen.generateParser())
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
        new NumericField('transaction_id', PrimitiveNumericType.u8),
        new NumericField('protocol_id', PrimitiveNumericType.be_u16),
        new NumericField('length', PrimitiveNumericType.be_u16),
        new NumericField('unit_id', PrimitiveNumericType.u8),
    ]

    const header = new Struct('MBAPHeader', fields)

    // console.log(header.compileSelfDefinition())
    expect(header.compileSelfDefinition()).toEqual(endent`
    #[derive(Debug,PartialEq)]
    pub struct MBAPHeader  {
        pub transaction_id : u8,
        pub protocol_id : u16,
        pub length : u16,
        pub unit_id : u8,
    }`)
    const gen = new StructParserGenerator(header)
    // console.log(gen.generateParser())
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


test('test struct with struct field', () => {
    const mbapHeaderFields: Field[] = [
        new NumericField('transaction_id', PrimitiveNumericType.u8),
        new NumericField('protocol_id', PrimitiveNumericType.be_u16),
        new NumericField('length', PrimitiveNumericType.be_u16),
        new NumericField('unit_id', PrimitiveNumericType.u8),
    ]

    const header = new Struct('MBAPHeader', mbapHeaderFields)

    const fields: Field[] = [
        new StructField(header, 'header'),
        new NumericField('function_code', PrimitiveNumericType.u8),
    ]

    const mdobusPacketPartial = new Struct('ModbusPacketPartial', fields)
    // console.log(mdobusPacketPartial.compileDefinition())
    expect(mdobusPacketPartial.compileDefinition()).toEqual(`\n\n` + endent` 
    #[derive(Debug,PartialEq)]
    pub struct MBAPHeader  {
        pub transaction_id : u8,
        pub protocol_id : u16,
        pub length : u16,
        pub unit_id : u8,
    }
    
    #[derive(Debug,PartialEq)]
    pub struct ModbusPacketPartial  {
        pub header : MBAPHeader,
        pub function_code : u8,
    }`)
    const gen = new StructParserGenerator(mdobusPacketPartial)
    // console.log(gen.compileParser())
    expect(gen.compileParser()).toEqual(endent`
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
    }

    pub fn parse_modbus_packet_partial(input: &[u8]) -> IResult<&[u8], ModbusPacketPartial> {
        let (input, header) = parse_mbap_header(input)?;
        let (input, function_code) = u8(input)?;
        Ok((
            input,
            ModbusPacketPartial {
                header,
                function_code
            }
        ))
    }`)
})

test('test struct with struct field with reference', () => {
    const mbapHeaderFields: Field[] = [
        new NumericField('transaction_id', PrimitiveNumericType.u8),
        new NumericField('protocol_id', PrimitiveNumericType.be_u16),
        new NumericField('length', PrimitiveNumericType.be_u16),
        new NumericField('unit_id', PrimitiveNumericType.u8),
        new BytesRefField('data', new LengthVariableInBytes('length')),
    ]

    const header = new Struct('MBAPHeaderV2', mbapHeaderFields)

    const fields: Field[] = [
        new StructField(header, 'header'),
        new NumericField('function_code', PrimitiveNumericType.u8),
    ]

    const mdobusPacketPartialV2 = new Struct('ModbusPacketPartialV2', fields)
    expect(mdobusPacketPartialV2.compileDefinition()).toEqual(`\n\n` + endent`
    #[derive(Debug,PartialEq)]
    pub struct MBAPHeaderV2 <'a> {
        pub transaction_id : u8,
        pub protocol_id : u16,
        pub length : u16,
        pub unit_id : u8,
        pub data : &'a [u8],
    }
    
    #[derive(Debug,PartialEq)]
    pub struct ModbusPacketPartialV2 <'a> {
        pub header : MBAPHeaderV2 <'a>,
        pub function_code : u8,
    }`)
    // console.log(mdobusPacketPartialV2.compileDefinition())
    const gen = new StructParserGenerator(mdobusPacketPartialV2)
    // console.log(gen.compileParser())
    expect(gen.compileParser()).toEqual(endent`
    pub fn parse_mbap_header_v2(input: &[u8]) -> IResult<&[u8], MBAPHeaderV2> {
        let (input, transaction_id) = u8(input)?;
        let (input, protocol_id) = be_u16(input)?;
        let (input, length) = be_u16(input)?;
        let (input, unit_id) = u8(input)?;
        let (input, data) = take(length)(input)?;
        Ok((
            input,
            MBAPHeaderV2 {
                transaction_id,
                protocol_id,
                length,
                unit_id,
                data
            }
        ))
    }

    pub fn parse_modbus_packet_partial_v2(input: &[u8]) -> IResult<&[u8], ModbusPacketPartialV2> {
        let (input, header) = parse_mbap_header_v2(input)?;
        let (input, function_code) = u8(input)?;
        Ok((
            input,
            ModbusPacketPartialV2 {
                header,
                function_code
            }
        ))
    }`)
})
