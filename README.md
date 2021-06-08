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