import { Struct } from "../types/struct"
import { AssertField, BlankStructField, CodeField, CodeGenField, CodeVarField, SkipField } from "./special"
import { BerTLField } from "./ber-tl"
import endent from "endent"
import { StructParserGenerator } from "../parser/struct"
import { numeric } from "../api"

test("test blank struct field", () => {
    const TestSturct = new Struct(
        'BlankStructFieldStruct',
        [
            new BlankStructField(new BerTLField('user_data_tl')),
            numeric('num', 'u8')
        ]
    )

    expect(TestSturct.definition()).toEqual(endent`
        #[allow(non_camel_case_types)]
        #[derive(Debug, PartialEq, Eq, Clone)]
        pub struct BlankStructFieldStruct {
            pub num: u8,
        }
    `)

    const gen = new StructParserGenerator(TestSturct)
    expect(gen.generateParser()).toEqual(endent`
        pub fn parse_blank_struct_field_struct(input: &[u8]) -> IResult<&[u8], BlankStructFieldStruct> {
            debug!(target: "PARSER(parse_blank_struct_field_struct)", "struct BlankStructFieldStruct");
            let (input, _user_data_tl) = ber_tl(input)?;
            let (input, num) = u8(input)?;
            Ok((
                input,
                BlankStructFieldStruct {
                    num
                }
            ))
        }
    `)
})

test("test skip field", () => {
    const TestSturct = new Struct(
        'SkipFieldStruct',
        [
            new SkipField(numeric('padding', 'u8')),
            numeric('num', 'u8')
        ]
    )

    expect(TestSturct.definition()).toEqual(endent`
        #[allow(non_camel_case_types)]
        #[derive(Debug, PartialEq, Eq, Clone)]
        pub struct SkipFieldStruct {
            pub num: u8,
        }
    `)

    const gen = new StructParserGenerator(TestSturct)
    expect(gen.generateParser()).toEqual(endent`
        pub fn parse_skip_field_struct(input: &[u8]) -> IResult<&[u8], SkipFieldStruct> {
            debug!(target: "PARSER(parse_skip_field_struct)", "struct SkipFieldStruct");
            let (input, _) = u8(input)?;
            let (input, num) = u8(input)?;
            Ok((
                input,
                SkipFieldStruct {
                    num
                }
            ))
        }
    `)
})

test("test assert field", () => {
    const TestSturct = new Struct(
        'AssertFieldStruct',
        [
            new AssertField(numeric('num', 'u8'), '0x01'),
        ]
    )

    expect(TestSturct.definition()).toEqual(endent`
        #[allow(non_camel_case_types)]
        #[derive(Debug, PartialEq, Eq, Clone)]
        pub struct AssertFieldStruct {
            pub num: u8,
        }
    `)

    const gen = new StructParserGenerator(TestSturct)
    expect(gen.generateParser()).toEqual(endent`
        pub fn parse_assert_field_struct(input: &[u8]) -> IResult<&[u8], AssertFieldStruct> {
            debug!(target: "PARSER(parse_assert_field_struct)", "struct AssertFieldStruct");
            let (input, num) = u8(input)?;
            if !(num == 0x01) {
                return Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify)))
            }
            Ok((
                input,
                AssertFieldStruct {
                    num
                }
            ))
        }
    `)
})

test("test code field", () => {
    const TestSturct = new Struct(
        'CodeFieldStruct',
        [
            new CodeGenField(numeric('num1', 'u8')),
            new CodeField(`let num2: u8 = 1;`),
            new CodeVarField(numeric('num3', 'u8')),
        ]
    )

    expect(TestSturct.definition()).toEqual(endent`
        #[allow(non_camel_case_types)]
        #[derive(Debug, PartialEq, Eq, Clone)]
        pub struct CodeFieldStruct {
            pub num3: u8,
        }
    `)

    const gen = new StructParserGenerator(TestSturct)
    expect(gen.generateParser()).toEqual(endent`
        pub fn parse_code_field_struct(input: &[u8]) -> IResult<&[u8], CodeFieldStruct> {
            debug!(target: "PARSER(parse_code_field_struct)", "struct CodeFieldStruct");
            let (input, num1) = u8(input)?;
            let num2: u8 = 1;
            Ok((
                input,
                CodeFieldStruct {
                    num3
                }
            ))
        }
    `)
})