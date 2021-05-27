import { createFixSizedBytesField as sizedBytes, createNumericFieldSimple as numeric } from "../../api/input"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"

const ethernet = new Struct(
    'Ethernet',
    [
        sizedBytes('dst_mac', 6),
        sizedBytes('src_mac', 6),
        numeric('link_type', 'be_u16'),
    ]
)

const structs = [
    ethernet
]

export const Ethernet = new Protocol({
    name: 'Ethernet',
    structs
})