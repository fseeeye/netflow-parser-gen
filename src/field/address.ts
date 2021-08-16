// export interface Field {
//     name: string
//     isRef(): boolean
//     isUserDefined(): boolean
//     definition: (visibility: VisibilityType) => string // 生成其在结构体中的定义代码行
//     typeName(): string // <u8, u16, ...> 该feild的类型名称
//     parserInvocation(): string // <u8, be_u16, ...> field被调用时所生成的内容
//     parserImplementation?(): string // 该feild用户实现的解析函数
//     generateParseStatement(): string // 生成parser中对该field的解析语句
//     // valida

import { snakeCase } from "snake-case";
import { BaseField} from "./base";

export class MacAddress extends BaseField {
    constructor(
        readonly name: string
    ) {
        super(name)
    }

    isRef(): boolean {
        return false
    }

    isUserDefined(): boolean {
        return true
    }

    typeName(): string {
        return 'MacAddress'
    }

    parserInvocation(): string {
        return snakeCase(this.typeName())
    }
}

export class Ipv4Address extends BaseField {
    constructor(
        readonly name: string
    ) {
        super(name)
    }

    isRef(): boolean {
        return false
    }

    isUserDefined(): boolean {
        return true
    }

    typeName(): string {
        return 'Ipv4Addr'
    }

    parserInvocation(): string {
        return `address4`
    }
}

export class Ipv6Address extends BaseField {
    constructor(
        readonly name: string
    ) {
        super(name)
    }

    isRef(): boolean {
        return false
    }

    isUserDefined(): boolean {
        return true
    }

    typeName(): string {
        return 'Ipv6Addr'
    }

    parserInvocation(): string {
        return `address6`
    }
}