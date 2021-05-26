import { BitFieldStruct } from "./bit-struct"
import { createBitNumericField as bitNumeric } from "../api/input"

test('test bit field struct', () => {
    const ipv4Header = new BitFieldStruct(
        'Ipv4Header',
        [
            bitNumeric('version', 4, 'u8'),
            bitNumeric('header_length', 4, 'u8'),
            bitNumeric('diff_service', 6, 'u8'),
            bitNumeric('ecn', 2, 'u8'),
            bitNumeric('total_length', 16, 'be_u16'),
            bitNumeric('id', 16, 'be_u16'),
            bitNumeric('flags', 3, 'u8'),
            bitNumeric('fragment_offset', 13, 'be_u16'),
            bitNumeric('ttl', 8, 'u8'),
            bitNumeric('protocol', 8, 'u8'),
            bitNumeric('checksum', 16, 'be_u16'),
            bitNumeric('src_ip', 32, 'be_u32'),
            bitNumeric('dst_ip', 32, 'be_u32'),
        ]
    )
    console.log(ipv4Header.definition())
    console.log(ipv4Header.parserFunctionDefinition())
})