import endent from "endent"
import { StructParserGenerator } from "../parser"
import { Struct } from "../struct"
import { Field } from "./base"
import { NumericField, PrimitiveNumericType } from "./numeric"
import { BytesRefField, LengthVariableInBytes } from "./ref"
import { StructField } from "./struct"


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
