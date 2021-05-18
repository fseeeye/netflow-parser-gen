import {
    Field, NumericField, PrimitiveNumericType, VecField, LengthVariableInBytes
} from "./field"
import { Struct } from "./struct"
import { StructParserGenerator } from "./parser"


test('test struct with vec of primitive field', () => {
    const fields: Field[] = [
        new NumericField('start_address', PrimitiveNumericType.u8),
        new NumericField('output_count', PrimitiveNumericType.be_u16),
        new NumericField('byte_count', PrimitiveNumericType.u8),
        new VecField('output_values', new LengthVariableInBytes('output_count'), PrimitiveNumericType.be_u16),
    ]
    const writeMultipleRegister = new Struct('WriteMultipleRegisters', fields)
    console.log(writeMultipleRegister.compileDefinition())
    const gen = new StructParserGenerator(writeMultipleRegister)
    console.log(gen.compileParser())
})

test('test struct with vec field of user defined type', () => {
    const read_file_sub_req_fields: Field[] = [
        new NumericField('ref_type', PrimitiveNumericType.u8),
        new NumericField('file_number', PrimitiveNumericType.be_u16),
        new NumericField('record_number', PrimitiveNumericType.be_u16),
        new NumericField('record_len', PrimitiveNumericType.be_u16),
        // new BytesRefField('record_data', new LengthVariable('record_len')),
    ]
    const readFileSubReq = new Struct('ReadFileSubRequest', read_file_sub_req_fields)
    console.log(readFileSubReq.compileDefinition())
    const subGen = new StructParserGenerator(readFileSubReq)
    console.log(subGen.compileParser())
    const read_file_record_fields: Field[] = [
        new NumericField('byte_count', PrimitiveNumericType.u8),
        new VecField('sub_requests', new LengthVariableInBytes('byte_count'), 'ReadFileSubRequest'),
    ]
    const readFileRecord = new Struct('ReadFileRecord', read_file_record_fields)
    console.log(readFileRecord.compileDefinition())
    const gen = new StructParserGenerator(readFileRecord)
    console.log(gen.compileParser())
})