import { Field, NumericField, PrimitiveNumericType, BytesReferenceField } from "./field"
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
  console.log(writeFileRecordSubRequest.compile())
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

  console.log(header.compile())
  console.log()
  const gen = new StructParserGenerator(header)
  console.log(gen.generateParser())
})
