# parser-gen

一个声明式解析引擎，可以使用特定的数据类型对协议的各个字段进行描述，此工具可以自动生成：

- 对应的 Rust struct 定义
- 一个解析函数，接受 `&[u8]`，返回一个 Result

## quick start

依赖 node, yarn, ts-node。

```
git clone https://gitee.com/BoleanTech/parser-gen.git
yarn
yarn test
```

命令行工具使用：

```
ts-node ./src/tooling/cli.ts generate -o <随便指定一个目录>
```
or
```
yarn cli generate -o <随便指定一个目录>
```

## 设计简述

parser-gen 的目标是让用户编写如下的定义：

```
const udpDef = new Struct(
    'Udp',
    [
        numeric('src_port', 'be_u16'),
        numeric('dst_port', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('checksum', 'be_u16'),
    ]
)
```

自动生成如下的 Rust 代码：

```
#[derive(Debug, PartialEq)]
pub struct Udp {
    pub src_port: u16,
    pub dst_port: u16,
    pub length: u16,
    pub checksum: u16,
}

pub fn parse_udp(input: &[u8]) -> IResult<&[u8], Udp> {
    let (input, src_port) = be_u16(input)?;
    let (input, dst_port) = be_u16(input)?;
    let (input, length) = be_u16(input)?;
    let (input, checksum) = be_u16(input)?;
    Ok((
        input,
        Udp {
            src_port,
            dst_port,
            length,
            checksum
        }
    ))
}
```

### Field

每个协议的生成目标都是一个 Rust struct。struct 的字段称为 field，field 有多种类型。

用户在使用 parser-gen 时，就是根据协议各个字段的类型使用对应类型的 field 进行描述。每个 field 包含了两块信息：

- 如何生成自己在 struct 中的定义 
- 如何生成自己在 struct parser 中的解析语句

这些信息定义在 `Field` 接口中：

```
export interface Field {
    name: string
    isRef(): boolean
    isUserDefined(): boolean
    definition: (visibility: VisibilityType) => string  // 生成定义
    typeName(): string
    parserInvocation: () => string
    parserImplementation?: () => string
    generateParseStatement: () => string    // 生成解析语句
}
```

上面的示例中，`numeric` 返回的就是一个 `NumericField`。

常见的 field 有以下几种类型：

- 纯数字（`u8, u16, u32` 之类）
- 字节不对齐的纯数字（例如 Ipv4 的 version 只有 4 个 bit）
    - 目前的处理方式是把多个字节不对齐的字段打包成字节对齐的 `BitNumericFieldGroup`
- 字节流（`&[u8]`)
    - 定长，例如以太网 MAC 地址固定 6 字节
    - 不定长，例如各类协议的 payload，payload 长度实际上依赖于 header 中的某一个表示长度字段（Ip 与 Tcp 都是这样）
- 数组
    - 数组的长度类似不定长字节流，依赖于另一个 field
- 多种可能（enum）
    - 具体是哪一种，依赖于另一个 field（例如 Ip 的 version 字段决定了是 Ipv4 还是 Ipv6，Ipv4 的 protocol 字段决定了 payload 是 Tcp 还是 Udp）
- 可选的字段
    - 具体有没有该字段，依赖于另一个 field

所有类型的 field 实现在 `src/field` 目录中。

### Enum

协议解析中最常见的逻辑就是根据已解析的某个字段的值，决定接下来要如何解析。Rust 的 enum 与 match 表达式可以很好的描述这类逻辑。

下面是自动生成的解析 Modbus 请求的函数：

```
pub fn parse_request<'a>(input: &'a [u8], header: &Header) -> IResult<&'a [u8], Request<'a>> {
    let (input, request) = match header.function_code {
        0x01 => parse_read_coils(input),
        0x02 => parse_read_discre_inputs(input),
        0x03 => parse_read_holding_registers(input),
        0x04 => parse_read_input_registers(input),
        0x05 => parse_write_single_coil(input),
        0x06 => parse_write_single_register(input),
        0x07 => parse_eof(input),
        0x0b => parse_eof(input),
        0x0c => parse_eof(input),
        0x0f => parse_write_multiple_coils(input),
        0x10 => parse_write_multiple_registers(input),
        0x11 => parse_eof(input),
        0x14 => parse_read_file_record(input),
        0x15 => parse_write_file_record(input),
        0x16 => parse_mask_write_register(input),
        0x17 => parse_read_write_multiple_registers(input),
        0x18 => parse_read_fifo_queue(input),
        _ =>  Err(nom::Err::Error(nom::error::Error::new(input, nom::error::ErrorKind::Verify))),
    }?;
    Ok((input, request))
}
```

在 parser-gen 中，enum 的实现在 `src/types/enum.ts`。

enum 中的每种可能性被称为 EnumVariant，目前实现了：

- EmptyVariant：表示数据包到这里应该结束，不再有别的内容
- AnonymousStructVariant：[Rust 中 enum 的 variant 可以是一个 inline struct](https://doc.rust-lang.org/reference/items/enumerations.html)
- NamedStructVariant： Rust 中 enum 的 variant 可以是一个外部定义过的 struct
- NamedEnumVariant: Rust 中 enum 的 variant 可以是一个外部定义过的 enum

关于 enum 如何使用请参考 `src/protocols/modbus/index.ts`。

### Parser 生成

struct 和 enum 有各自的 parser 生成器，分别是：

- `src/parser/struct.ts`
- `src/parser/enum.ts`

主要过程就是逐个调用每个 field 的 `generateParseStatement` 方法然后拼接成一个函数。

## 开发计划

见 ROADMAP.md