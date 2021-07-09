import { ModbusRsp } from "./index"

const answer = ``

test('test modbus response', () => {
    expect(
        `\n` + ModbusRsp.generateParser()
    ).toEqual(answer)
    // console.log(ModbusRsp.generateParser())
})