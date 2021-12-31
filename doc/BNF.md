# BNF 解释 DSL
## 本语言变量类型
- 结构体类型
```
STRUCT ::=
	"new" "Struct" "(" <name> ","
	<fields> ","
	[extra_input] ")"
```
- 枚举类型及其各类分支类型(Variant)、选择类型(Choice)

```
STRUCT_ENUM ::= 
	"new" "StructEnum" "(" <name> ","
	<variants> ","
	<choice_field> ","
	[without_error_arm] ","
	[all_in_one] ")";

PAYLOAD_ENUM ::=
	"new" "PayloadEnum" "(" <name> "," <info> "," <payload_variants> "," <choice> "," [extra_payload_enum] ")";

EOF_ENUM_VARIANT ::=
	"new" "EmptyVariant" "(" <choice> "," <name> ")";

EMPTY_ENUM_VARIANT ::=
	"new" "EmptyVariant" "(" <choice> "," <name> ")";

ANONYMOUS_STRUCT_VARIANT ::=
	"new" "AnonymousStructVariant" "(" <choice> "," <name> "," <fields> ")";

NAMED_STRUCT_VARIANT ::=
	"new" "NamedStructVariant" "(" <choice> "," <name> "," <struct> ")";

NAMED_ENUM_VARIANT ::=
	"new" "NamedEnumVariant" "(" <choice> "," <name> "," <enum> ")";

BASIC_ENUM_CHOICE ::=
	"new" "BasicChoice" "(" <field> "," [match_target_expr] ")";

STRUCT_ENUM_CHOICE ::=
	"new" "StructChoice" "(" <struct_field> "," <match_field_name> "," [match_target_expr] ")";

INLINE_ENUM_CHOICE ::=
	"new" "InlineChoice" "(" <field> "," [match_target_expr] ")"
```

- 数字类型

```
NUMERIC ::=
	"new" "NumericType" "(" ( "u8" | "u16" | "u32" | "u64" | "f32" | "f64" ) ","
	<numeric_func> ","
	<bit_length> ")"
```

- 序列类型

```
SLICE ::=
	"new" "SliceType" "(" <name> ","
	( "u4_4" | "u4_6" | "u8_2" | "u8_3" | "u8_4" | "u8_5" ) ")"
```

- 协议相关类型

```
PROTOCOL ::= "new" "Protocol" "(" "{" <info> "," <payload> "," <structs> "}" ")";
PROTOCOL_INFO ::= "new" "ProtocolInfo" "(" <name> "," <level> "," <header> ")"
```

## 协议字段类型

- 枚举字段

```
ENUM_FIELD ::= "new" "EnumField" "(" <enum> "," [field_name] ")"
```

- 结构体字段

```
STRUCT_FIELD ::= "new" "StructField" "(" <struct> "," [field_name] ")";
STRUCT_MEM_FIELD ::= "new" "StructMemberField" "(" <struct> "," <match_field_name> "," [field_name] ")"
```

- 地址字段

```
MAC_ADDRESS_FIELD ::= "new" "MacAddress" "(" <name> ")";
IPV4_ADDRESS_FIELD ::= "new" "Ipv4Address" "(" <name> ")";
IPV6_ADDRESS_FIELD ::= "new" "Ipv6Address" "(" <name> ")" 
```

- TL 字段

```
TL_FIELD ::= "new" "BerTL" "(" <name> ")" 
```

- 字节字段

```
BIT_NUMERIC_FIELD ::= ( 
	"new" "BitNumericField" "(" <name> "," <field_type> "," <offset> "," <count> ")"
	| "createBitNumericField" "(" <name> "," <type_name> "," <offset> "," <count> ")"
);

BITS_NUMERIC_FIELD ::= ( 
	"new" "BitsNumericField" "(" <name> "," <length> "," <field_type> ")"
	| "createBitsNumericField" "(" <name> "," <length> "," <typename> ")"
);

EMPTY_BITS_NUMERIC_FIELD ::= ( 
	"new" "EmptyBitsNumericField" "(" <length> "," <field_type> ")"
	| "createEmptyBitsNumericField" "(" <length> "," <typename> ")"
);

BIT_NUMERIC_FIELD_GROUP ::= ( 
	"new" "BitNumericFieldGroup" "(" <fields> ")"
);

FIX_SIZED_BYTES_FIELD ::= "new" "FixSizedBytes" "(" <name> "," <length> ")"
```

- 数字字段

```
NUMERIC_FIELD ::= (
	"new" "NumericField" "(" <name> "," ( "u8" | "u16" | "u32" | "u64" | "f32" | "f64" ) ")"
	| "numeric" "(" <name> "," ( "u8" | "u16" | "u32" | "u64" | "f32" | "f64" ) ")"
)
```

- 可选字段

```
OPTION_FIELD ::= "new" "OptionField" "(" <name> "," <condition> "," <field> ")"
```

- Peek 字段

```
PEEK_FIELD ::= "new" "PeekField" "(" <inner_field> ")"
```

- 引用字段

```
BYTES_REF_FIELD ::= "new" "BytesReferenceField" "(" <name> "," <length> ")";
STR_REF_FIELD ::= "new" "StrReferenceField" "(" <name> "," <length> ")"
```

- 序列字段

```
SLICE_FIELD ::= ( 
	"new" "SliceField" "(" <name> "," ( "u4_4" | "u4_6" | "u8_2" | "u8_3" | "u8_4" | "u8_5" ) ")"
	| "slice" "(" <name> "," ( "u4_4" | "u4_6" | "u8_2" | "u8_3" | "u8_4" | "u8_5" ) ")"
)
```

- 标记字段

```
TAG_FIELD ::= "new" "TagField" "(" <name> "," <tag> ")"
```

- 向量字段

```
VEC_FIELD ::= "new" "VecField" "(" <name> "," <length_var> "," <element_type> ")";
BIT_VEC_FIELD ::= (
	"new" "BitVecField" "(" <name> "," <length_var> "," <element_type> "," [element_bit_len] ")"
	| "bitNumVec" "(" <name> "," <count_var> "," <element_type_name> ")"
);
LIMITED_LEN_VEC_LOOP_FIELD ::= "new" "LimitedLenVecLoopField" "(" <name> "," <count_var> "," <element_type_name> ")";
UNLIMITED_LEN_VEC_LOOP_FIELD ::= "new" "UnlimitedLenVecLoopField" "(" <name> "," <element_field> ")";
LIMITED_COUNT_VEC_LOOP_FIELD ::= "new" "LimitedCountVecLoopField" "(" <name> "," <length_count> "," <element_field> ")"
```

- 特殊字段

```
BLANK_STRUCT_FIELD ::= "new" "BlankStructField" "(" <inner_struct_field> ")";
SKIP_FIELD ::= "new" "SkipField" "(" <inner_field> ")";
ASSERT_FIELD ::= "new" "AssertField" "(" <target_field> "," <target_any> "," [operator] ")";
CODE_GEN_FIELD ::= "new" "CodeGenField" "(" <inner_field> ")";
CODE_VAR_FIELD ::= "new" "CodeVarField" "(" <inner_field> ")";
CODE_FIELD ::= "new" "CodeField" "(" <code_str> ")"
```