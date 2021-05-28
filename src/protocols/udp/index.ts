import { Struct } from "../../types/struct"
import { numeric } from "../../api/index"
import { Protocol } from "../generator"

const udpDef = new Struct(
    'Udp',
    [
        numeric('src_port', 'be_u16'),
        numeric('dst_port', 'be_u16'),
        numeric('length', 'be_u16'),
        numeric('checksum', 'be_u16'),
    ]
)

const structs = [
    udpDef
]

export const Udp = new Protocol({
    name: udpDef.name,
    structs
})