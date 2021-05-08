import { StructEnumVariant, StructEnum } from "./enum"
import { BytesReferenceField, NumericField, PrimitiveNumericType } from "./field"

const SimpleReadRequestFields = [
    new NumericField('start_address', PrimitiveNumericType.be_u16),
    new NumericField('count', PrimitiveNumericType.be_u16),
]

test('test enum definition without reference', () => {
    const variants: StructEnumVariant[] = [
        new StructEnumVariant(
            'ReadCoils',
            SimpleReadRequestFields.slice(),
        ),
        new StructEnumVariant(
            'ReadDiscreteInputs',
            SimpleReadRequestFields.slice()
        ),
        new StructEnumVariant(
            'ReadHoldingRegisters',
            SimpleReadRequestFields.slice(),
        ),
        new StructEnumVariant(
            'ReadInputRegisters',
            SimpleReadRequestFields.slice(),
        ),
        new StructEnumVariant(
            'WriteSingleCoil',
            [
                new NumericField('output_address', PrimitiveNumericType.be_u16),
                new NumericField('output_value', PrimitiveNumericType.be_u16),
            ]
        )
    ]
    const structEnum = new StructEnum('RequestData', variants)
    console.log(structEnum.compile())
})

test('enum definition with reference', () => {

    const variants = [
        new StructEnumVariant(
            'ReadWriteMultipleRegisters',
            [
                new NumericField('read_start_address', PrimitiveNumericType.be_u16),
                new NumericField('read_count', PrimitiveNumericType.be_u16),
                new NumericField('write_start_address', PrimitiveNumericType.be_u16),
                new NumericField('write_count', PrimitiveNumericType.be_u16),
                new NumericField('write_byte_count', PrimitiveNumericType.u8),
                new BytesReferenceField('write_register_values', 'write_byte_count'),
            ]
        ),
        new StructEnumVariant(
            'WriteSingleRegister',
            [
                new NumericField('register_address', PrimitiveNumericType.be_u16),
                new NumericField('register_value', PrimitiveNumericType.be_u16),
            ]
        )
    ]
    const structEnum = new StructEnum('RequestData', variants)
    console.log(structEnum.compile())
})