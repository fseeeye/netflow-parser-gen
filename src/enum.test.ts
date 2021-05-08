import { StructEnumVariant, StructEnum, StructEnumParserGenerator } from "./enum"
import { BytesReferenceField, NumericField, PrimitiveNumericType } from "./field"

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
            enumName,
        ),
        new StructEnumVariant(
            'ReadDiscreteInputs',
            SimpleReadRequestFields.slice(),
            enumName,
        ),
        new StructEnumVariant(
            'ReadHoldingRegisters',
            SimpleReadRequestFields.slice(),
            enumName,
        ),
        new StructEnumVariant(
            'ReadInputRegisters',
            SimpleReadRequestFields.slice(),
            enumName,
        ),
        new StructEnumVariant(
            'WriteSingleCoil',
            [
                new NumericField('output_address', PrimitiveNumericType.be_u16),
                new NumericField('output_value', PrimitiveNumericType.be_u16),
            ],
            enumName,
        )
    ]
    const structEnum = new StructEnum(enumName, variants, functionCodeField, new Map([
        [0x01, variants[0]],
        [0x02, variants[1]],
        [0x03, variants[2]],
        [0x04, variants[3]],
        [0x05, variants[4]],
    ]))
    const gen = new StructEnumParserGenerator(structEnum)
    console.log(gen.compile())
})

test('enum definition with reference', () => {
    const enumName = 'RequestData'
    const functionCodeField = new NumericField('function_code', PrimitiveNumericType.u8)
    const variants = [
        new StructEnumVariant(
            'WriteFileRecordSubRequest',
            [
                new NumericField('ref_type', PrimitiveNumericType.u8),
                new NumericField('file_number', PrimitiveNumericType.be_u16),
                new NumericField('record_number', PrimitiveNumericType.be_u16),
                new NumericField('record_len', PrimitiveNumericType.be_u16),
                new BytesReferenceField('record_data', 'record_len'),
            ],
            enumName,
        ),
        new StructEnumVariant(
            'WriteSingleRegister',
            [
                new NumericField('register_address', PrimitiveNumericType.be_u16),
                new NumericField('register_value', PrimitiveNumericType.be_u16),
            ],
            enumName,
        )
    ]
    const structEnum = new StructEnum('RequestData', variants, functionCodeField, new Map([
        [0x17, variants[0]],
        [0x06, variants[1]],
    ]))
    const gen = new StructEnumParserGenerator(structEnum)
    console.log(gen.compile())
})