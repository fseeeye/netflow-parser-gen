import endent from "endent"
import { BuiltInNumericType } from "../types/numeric"
import { StructParserGenerator } from "../parser/struct"
import { Struct } from "../types/struct"
import { AnonymousStructVariant, StructEnum} from "../types/enum"
import { EnumField } from "../field/enum"
import { Field } from "./base"
import { NumericField } from "./numeric"
import { LimitedVecLoopField, UnlimitedVecLoopField, VecField } from "./vec"
import { createCountVar, createCountVarWithUnitSize } from "../api/input"
import { BytesReferenceField } from "./ref"
import { bytesRef, numeric } from "../api"
import { BasicEnumChoice } from "./choice"
import { StructEnumParserGenerator } from "../parser/enum"

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

test('test struct with vec loop (with lengthNum)', () => {
    const fields_sub: Field[] = [
        new NumericField('ref_type', BuiltInNumericType.u8),
        new NumericField('file_number', BuiltInNumericType.be_u16),
        new NumericField('record_number', BuiltInNumericType.be_u16),
        new NumericField('record_length', BuiltInNumericType.be_u16), 
        new BytesReferenceField('record_data', createCountVarWithUnitSize('record_length', 2, "mul")),
    ]
    const WriteFileRecordSubRequest = new Struct('WriteFileRecordSubRequest', fields_sub)
    const subgen = new StructParserGenerator(WriteFileRecordSubRequest)
    expect(subgen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record_sub_request(input: &[u8]) -> IResult<&[u8], WriteFileRecordSubRequest> {
        let (input, ref_type) = u8(input)?;
        let (input, file_number) = be_u16(input)?;
        let (input, record_number) = be_u16(input)?;
        let (input, record_length) = be_u16(input)?;
        let (input, record_data) = take((record_length as usize * 2 as usize) as usize)(input)?;
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
        new LimitedVecLoopField('sub_req', createCountVar('byte_count'), WriteFileRecordSubRequest),
    ]

    const WriteFileRecord = new Struct('WriteFileRecord', fields)

    expect(WriteFileRecord.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct WriteFileRecord<'a> {
        pub byte_count: u8,
        pub sub_req: Vec<WriteFileRecordSubRequest<'a>>,
    }
    `)

    const gen = new StructParserGenerator(WriteFileRecord)
    expect(gen.generateParser()).toEqual(endent`
    pub fn parse_write_file_record(input: &[u8]) -> IResult<&[u8], WriteFileRecord> {
        let (input, byte_count) = u8(input)?;
        let (input, sub_req) = get_sub_req_with_write_file_record_sub_request(input, byte_count)?;
        Ok((
            input,
            WriteFileRecord {
                byte_count,
                sub_req
            }
        ))
    }

    fn get_sub_req_with_write_file_record_sub_request(input: &[u8], byte_count: u8) -> IResult<&[u8], Vec<WriteFileRecordSubRequest>> {
        let mut sub_req = Vec::new();
        let mut _sub_req: WriteFileRecordSubRequest;
        let mut input = input;
        let len_flag = input.len() - byte_count as usize;

        while input.len() > len_flag {
            (input, _sub_req) = parse_write_file_record_sub_request(input)?;
            sub_req.push(_sub_req);
        }

        Ok((
            input,
            sub_req
        ))
    }
    `)
})

test('test struct with vec loop (without lengthNum)', () => {
    const MultipleMemoryAreaReadItemChoice = new StructEnum(
        "MultipleMemoryAreaReadItemChoice",
        [
            new AnonymousStructVariant(
                '0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x09 | 0x1B | 0x20 | 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x27 | 0x28 | 0x29 | 0x2A | 0x2B | 0x2C | 0x30 | 0x31 | 0x32 | 0x33 | 0x40 | 0x41 | 0x43 | 0x44 | 0x46 | 0x49 | 0x70 | 0x71 | 0x72',
                'MultipleMemoryAreaReadItem1',
                [bytesRef('item', createCountVar('1'))]
            ),
            new AnonymousStructVariant(
                '0x80 | 0x81 | 0x82 | 0x84 | 0x85 | 0x89 | 0x90 | 0x91 | 0x92 | 0x93 | 0x94 | 0x95 | 0x96 | 0x97 | 0x98 | 0x9C | 0xA0 | 0xA1 | 0xA2 | 0xA3 | 0xA4 | 0xA5 | 0xA6 | 0xA7 | 0xA8 | 0xA9 | 0xAA | 0xAB | 0xAC | 0xB0 | 0xB1 | 0xB2 | 0xB3 | 0xBC',
                'MultipleMemoryAreaReadItem2',
                [bytesRef('item', createCountVar('2'))]
            ),
            new AnonymousStructVariant(
                '0xC0 | 0xDC | 0xDD | 0xF0 | 0xF1 | 0xF2',
                'MultipleMemoryAreaReadItem4',
                [bytesRef('item', createCountVar('4'))]
            ),
        ],
        new BasicEnumChoice(numeric('memory_area_code', 'u8'),)
    )

    const gen1 = new StructEnumParserGenerator(MultipleMemoryAreaReadItemChoice)
    expect(gen1.generateParser()).toEqual(endent`
    fn parse_multiple_memory_area_read_item1(input: &[u8]) -> IResult<&[u8], MultipleMemoryAreaReadItemChoice> {
        let (input, item) = take(1 as usize)(input)?;
        Ok((
            input,
            MultipleMemoryAreaReadItemChoice::MultipleMemoryAreaReadItem1 {
                item
            }
        ))
    }

    fn parse_multiple_memory_area_read_item2(input: &[u8]) -> IResult<&[u8], MultipleMemoryAreaReadItemChoice> {
        let (input, item) = take(2 as usize)(input)?;
        Ok((
            input,
            MultipleMemoryAreaReadItemChoice::MultipleMemoryAreaReadItem2 {
                item
            }
        ))
    }

    fn parse_multiple_memory_area_read_item4(input: &[u8]) -> IResult<&[u8], MultipleMemoryAreaReadItemChoice> {
        let (input, item) = take(4 as usize)(input)?;
        Ok((
            input,
            MultipleMemoryAreaReadItemChoice::MultipleMemoryAreaReadItem4 {
                item
            }
        ))
    }

    pub fn parse_multiple_memory_area_read_item_choice(input: &[u8], memory_area_code: u8) -> IResult<&[u8], MultipleMemoryAreaReadItemChoice> {
        let (input, multiple_memory_area_read_item_choice) = match memory_area_code {
            0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x09 | 0x1B | 0x20 | 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x27 | 0x28 | 0x29 | 0x2A | 0x2B | 0x2C | 0x30 | 0x31 | 0x32 | 0x33 | 0x40 | 0x41 | 0x43 | 0x44 | 0x46 | 0x49 | 0x70 | 0x71 | 0x72 => parse_multiple_memory_area_read_item1(input),
            0x80 | 0x81 | 0x82 | 0x84 | 0x85 | 0x89 | 0x90 | 0x91 | 0x92 | 0x93 | 0x94 | 0x95 | 0x96 | 0x97 | 0x98 | 0x9C | 0xA0 | 0xA1 | 0xA2 | 0xA3 | 0xA4 | 0xA5 | 0xA6 | 0xA7 | 0xA8 | 0xA9 | 0xAA | 0xAB | 0xAC | 0xB0 | 0xB1 | 0xB2 | 0xB3 | 0xBC => parse_multiple_memory_area_read_item2(input),
            0xC0 | 0xDC | 0xDD | 0xF0 | 0xF1 | 0xF2 => parse_multiple_memory_area_read_item4(input),
            _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
        }?;
        Ok((input, multiple_memory_area_read_item_choice))
    }
    `)
    

    const MultipleMemoryAreaReadItem = new Struct(
        "MultipleMemoryAreaReadItem",
        [
            numeric('memory_area_code', 'u8'),
            new EnumField(MultipleMemoryAreaReadItemChoice)
        ]
    )

    const gen2 = new StructParserGenerator(MultipleMemoryAreaReadItem)
    expect(gen2.generateParser()).toEqual(endent`pub fn parse_multiple_memory_area_read_item(input: &[u8]) -> IResult<&[u8], MultipleMemoryAreaReadItem> {
        let (input, memory_area_code) = u8(input)?;
        let (input, multiple_memory_area_read_item_choice) = parse_multiple_memory_area_read_item_choice(input, memory_area_code)?;
        Ok((
            input,
            MultipleMemoryAreaReadItem {
                memory_area_code,
                multiple_memory_area_read_item_choice
            }
        ))
    }`)


    const fields: Field[] = [
        numeric('rsp_code', 'be_u16'),
        new UnlimitedVecLoopField('data', MultipleMemoryAreaReadItem),
    ]
    const MultipleMemoryAreaRead = new Struct('MultipleMemoryAreaRead', fields)

    expect(MultipleMemoryAreaRead.definition()).toEqual(endent`
    #[derive(Debug, PartialEq, Eq, Clone)]
    pub struct MultipleMemoryAreaRead<'a> {
        pub rsp_code: u16,
        pub data: Vec<MultipleMemoryAreaReadItem<'a>>,
    }
    `)

    const gen3 = new StructParserGenerator(MultipleMemoryAreaRead)
    expect(gen3.generateParser()).toEqual(endent`
    pub fn parse_multiple_memory_area_read(input: &[u8]) -> IResult<&[u8], MultipleMemoryAreaRead> {
        let (input, rsp_code) = be_u16(input)?;
        let (input, data) = get_data_with_multiple_memory_area_read_item(input)?;
        Ok((
            input,
            MultipleMemoryAreaRead {
                rsp_code,
                data
            }
        ))
    }

    fn get_data_with_multiple_memory_area_read_item(input: &[u8]) -> IResult<&[u8], Vec<MultipleMemoryAreaReadItem>> {
        let mut data = Vec::new();
        let mut _data: MultipleMemoryAreaReadItem;
        let mut input = input;

        while input.len() > 0 {
            (input, _data) = parse_multiple_memory_area_read_item(input)?;
            data.push(_data);
        }

        Ok((
            input,
            data
        ))
    }
    `)
})