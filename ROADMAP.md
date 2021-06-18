# RoadMap

1. 实现基于 PacketTrait 的 Packet 与 Payload（参考 parsing-rs 中的 ethernet.rs）
2. 实现自定义错误类型（能够抛出自定义的错误）
3. 实现基于 `nom::branch::alt` 的逐个 parser 调用
4. 实现序列化（支持转换成 json）
5. 代码文件结构组织，支持手写代码给自动生成的 struct 添加特性。（用 trait 应该可以吧）
6. 使用目前的成果，添加协议支持（至少覆盖目前 C 语言版本支持的所有协议）
7. 添加规则过滤功能
8. no_std，内核模块支持
