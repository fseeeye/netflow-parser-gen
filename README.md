# parser-gen

## TODO

- ~~match 后面应该跟一个表达式，而不是一个变量~~
- NumericEnum（用于保存 match 中用到的功能码）
- **Packet 与 Payload 类型的定义与解析**
- ~~自定义的错误类型~~
- ~~可选的各层协议抽象（`Option<L2>, Option<L3>, Option<L4>, Option<App>`）~~
- ~~解析到不支持的协议时能够保存已经解析完的内容而不是直接抛出错误~~
- 自定义的 fmt？
- ~~BitField 重构~~
- 逐个尝试多个 parser
- Choice 重新设计
    - 已实现 BasicEnumChoice 和 StructEnumChoice，处理情况 1

## Enum Parser 的设计

Enum 封装了多种可能的返回类型。对于 Enum 来说，解析方法有几种可能：

1. 已经解析过的数据头部，包含了接下来选择代码路径的必要信息（例如 IPv4 的 protocol 字段、modbus 的 function code 字段等）
2. 已经解析过的数据不包含任何提示信息：
    - 2.1 待解析数据的头部包含了选择代码路径的必要信息。（例如 IP 协议前 4 位 version 字段）
    - 2.2 待解析数据的头部也不包含任何信息，我们只能逐个 parser 尝试，直到成功或者全部失败。

### 情况 1

1. 首先要从已解析的头部中取出指定的 field
2. 可能要对 field 进行一些计算，需要定义一个生成表达式的 callback

### 情况 2.1

此时需要使用 `nom::combinator::peek` 来执行一次【read but not consume】 parser，取出 choice field，再放到情况 1 中。

### 情况 2.2

此时需要使用 `nom::branch::alt` 来逐个执行 parser。