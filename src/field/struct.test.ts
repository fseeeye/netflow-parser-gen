import endent from "endent"
import { BuiltInNumericType } from "../types/numeric"
import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { Field } from "./base"
import { NumericField } from "./numeric"
import { StructField } from "./struct"
import { BytesReferenceField } from "./ref"
import { createCountVar } from "../api/input"

test('test struct with struct field', () => {
    const mbapHeaderFields: Field[] = [
        new NumericField('transaction_id', BuiltInNumericType.u8),
        new NumericField('protocol_id', BuiltInNumericType.be_u16),
        new NumericField('length', BuiltInNumericType.be_u16),
        new NumericField('unit_id', BuiltInNumericType.u8),
    ]

    const header = new Struct('MBAPHeader', mbapHeaderFields)

    const fields: Field[] = [
        new StructField(header, 'header'),
        new NumericField('function_code', BuiltInNumericType.u8),
    ]

    const mdobusPacketPartial = new Struct('ModbusPacketPartial', fields)
    // expect(mdobusPacketPartial.definitionWithFields()).toEqual(endent` 
    // #[derive(Debug, PartialEq, Eq, Clone)]
    // pub struct MBAPHeader {
    //     pub transaction_id: u8,
    //     pub protocol_id: u16,
    //     pub length: u16,
    //     pub unit_id: u8,
    // }

    // #[derive(Debug, PartialEq, Eq, Clone)]
    // pub struct ModbusPacketPartial {
    //     pub header: MBAPHeader,
    //     pub function_code: u8,
    // }`)
    const gen = new StructParserGenerator(mdobusPacketPartial)
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
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
        new NumericField('transaction_id', BuiltInNumericType.u8),
        new NumericField('protocol_id', BuiltInNumericType.be_u16),
        new NumericField('length', BuiltInNumericType.be_u16),
        new NumericField('unit_id', BuiltInNumericType.u8),
        new BytesReferenceField('data', createCountVar('length')),
    ]

    const header = new Struct('MBAPHeaderV2', mbapHeaderFields)

    const fields: Field[] = [
        new StructField(header, 'header'),
        new NumericField('function_code', BuiltInNumericType.u8),
    ]

    const mdobusPacketPartialV2 = new Struct('ModbusPacketPartialV2', fields)
    // expect(mdobusPacketPartialV2.definitionWithFields()).toEqual(endent`
    // #[derive(Debug, PartialEq, Eq, Clone)]
    // pub struct MBAPHeaderV2<'a> {
    //     pub transaction_id: u8,
    //     pub protocol_id: u16,
    //     pub length: u16,
    //     pub unit_id: u8,
    //     pub data: &'a [u8],
    // }

    // #[derive(Debug, PartialEq, Eq, Clone)]
    // pub struct ModbusPacketPartialV2<'a> {
    //     pub header: MBAPHeaderV2<'a>,
    //     pub function_code: u8,
    // }`)
    const gen = new StructParserGenerator(mdobusPacketPartialV2)
    expect(gen.generateParserWithUserDefinedFields()).toEqual(endent`
    pub fn parse_mbap_header_v2(input: &[u8]) -> IResult<&[u8], MBAPHeaderV2> {
        let (input, transaction_id) = u8(input)?;
        let (input, protocol_id) = be_u16(input)?;
        let (input, length) = be_u16(input)?;
        let (input, unit_id) = u8(input)?;
        let (input, data) = take(length as usize)(input)?;
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