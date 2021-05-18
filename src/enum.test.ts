import { StructEnumVariant, StructEnum, StructEnumParserGenerator } from "./enum"
import { BytesRefField, LengthVariableInBytes, NumericField, PrimitiveNumericType } from "./field"

const SimpleReadRequestFields = [
    new NumericField('start_address', PrimitiveNumericType.be_u16),
    new NumericField('count', PrimitiveNumericType.be_u16),
]

test('test enum definition without reference', () => {
    const enumName = 'RequestData'
    const functionCodeField = new NumericField('function_code', PrimitiveNumericType.u8)
    const variants: StructEnumVariant[] = [
        new StructEnumVariant(
            'ReadCoils',
            SimpleReadRequestFields.slice(),
            0x01
        ),
        new StructEnumVariant(
            'ReadDiscreteInputs',
            SimpleReadRequestFields.slice(),
            0x02
        ),
        new StructEnumVariant(
            'ReadHoldingRegisters',
            SimpleReadRequestFields.slice(),
            0x03
        ),
        new StructEnumVariant(
            'ReadInputRegisters',
            SimpleReadRequestFields.slice(),
            0x04
        ),
        new StructEnumVariant(
            'WriteSingleCoil',
            [
                new NumericField('output_address', PrimitiveNumericType.be_u16),
                new NumericField('output_value', PrimitiveNumericType.be_u16),
            ],
            0x05
        )
    ]
    const structEnum = new StructEnum(enumName, variants, functionCodeField)
    const gen = new StructEnumParserGenerator(structEnum)
    console.log(gen.compile())
})

test('enum definition with reference', () => {
    const functionCodeField = new NumericField('function_code', PrimitiveNumericType.u8)
    const variants = [
        new StructEnumVariant(
            'WriteFileRecordSubRequest',
            [
                new NumericField('ref_type', PrimitiveNumericType.u8),
                new NumericField('file_number', PrimitiveNumericType.be_u16),
                new NumericField('record_number', PrimitiveNumericType.be_u16),
                new NumericField('record_len', PrimitiveNumericType.be_u16),
                new BytesRefField('record_data', new LengthVariableInBytes('record_len')),
            ],
            0x17
        ),
        new StructEnumVariant(
            'WriteSingleRegister',
            [
                new NumericField('register_address', PrimitiveNumericType.be_u16),
                new NumericField('register_value', PrimitiveNumericType.be_u16),
            ],
            0x06
        )
    ]
    const structEnum = new StructEnum('RequestData', variants, functionCodeField)
    const gen = new StructEnumParserGenerator(structEnum)
    console.log(gen.compile())
})