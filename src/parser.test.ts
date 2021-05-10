import { Field, NumericField, PrimitiveNumericType, BytesReferenceField, StructField } from "./field"
import { Struct } from "./struct"
import { StructParserGenerator } from "./parser"

test('test struct with reference', () => {
  const fields: Field[] = [
    new NumericField('ref_type', PrimitiveNumericType.u8),
    new NumericField('file_number', PrimitiveNumericType.be_u16),
    new NumericField('record_number', PrimitiveNumericType.be_u16),
    new NumericField('record_len', PrimitiveNumericType.be_u16),
    new BytesReferenceField('record_data', 'record_len'),
  ]

  const writeFileRecordSubRequest = new Struct('WriteFileRecordSubRequest', fields)
  console.log(writeFileRecordSubRequest.compileSelfDefinition())
  console.log()
  const gen = new StructParserGenerator(writeFileRecordSubRequest)
  console.log(gen.generateParser())

})

test('test struct with numeric types only', () => {
  const fields: Field[] = [
    new NumericField('transaction_id', PrimitiveNumericType.u8),
    new NumericField('protocol_id', PrimitiveNumericType.be_u16),
    new NumericField('length', PrimitiveNumericType.be_u16),
    new NumericField('unit_id', PrimitiveNumericType.u8),
  ]

  const header = new Struct('MBAPHeader', fields)

  console.log(header.compileSelfDefinition())
  console.log()
  const gen = new StructParserGenerator(header)
  console.log(gen.generateParser())
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
  console.log(mdobusPacketPartial.compileDefinition())
  const gen = new StructParserGenerator(mdobusPacketPartial)
  console.log(gen.compileParser())
})

test('test struct with struct field with reference', () => {
  const mbapHeaderFields: Field[] = [
    new NumericField('transaction_id', PrimitiveNumericType.u8),
    new NumericField('protocol_id', PrimitiveNumericType.be_u16),
    new NumericField('length', PrimitiveNumericType.be_u16),
    new NumericField('unit_id', PrimitiveNumericType.u8),
    new BytesReferenceField('data', 'length'),
  ]

  const header = new Struct('MBAPHeaderV2', mbapHeaderFields)

  const fields: Field[] = [
    new StructField(header, 'header'),
    new NumericField('function_code', PrimitiveNumericType.u8),
  ]

  const mdobusPacketPartialV2 = new Struct('ModbusPacketPartialV2', fields)
  console.log(mdobusPacketPartialV2.compileDefinition())
  const gen = new StructParserGenerator(mdobusPacketPartialV2)
  console.log(gen.compileParser())
})