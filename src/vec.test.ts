import { Field, NumericField, PrimitiveNumericType, VecField } from "./field"
import { Struct } from "./struct"
import { StructParserGenerator } from "./parser"


test('test struct with vec of primitive field', () => {
    const fields: Field[] = [
        new NumericField('start_address', PrimitiveNumericType.u8),
        new NumericField('output_count', PrimitiveNumericType.be_u16),
        new NumericField('byte_count', PrimitiveNumericType.u8),
        new VecField('output_values', 'output_count', PrimitiveNumericType.be_u16),
    ]
    const writeMultipleRegister = new Struct('WriteMultipleRegisters', fields)
    console.log(writeMultipleRegister.compileDefinition())
    const gen = new StructParserGenerator(writeMultipleRegister)
    console.log(gen.compileParser())
})