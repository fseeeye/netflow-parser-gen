import {
	createNumericFieldSimple as numeric,
	createBytesReferenceFieldSimple as bytesRef,
	createNumericVector as numVec,
	createCountVar,
	createCountVarWithUnitSize,
} from "../../api/input"
import { BasicEnumChoice, StructEnumChoice } from "../../field/choice"
import { Field } from "../../field/base"
import { VecField } from "../../field/vec"
import { EnumField, } from "../../field/enum"
import { NumericField } from "../../field/numeric"
import { PayloadField } from "../../field/payload"
import { StructField } from "../../field/struct"
import { AnonymousStructVariant, EmptyVariant, StructEnum, EmptyPayloadEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../generator"

const protocolName = 'FinsTcpReq'
const packetName = `${protocolName}Packet`
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct | StructEnum)[] = []


const MultipleMemoryAreaReadItem = new Struct(
	"MultipleMemoryAreaReadItem",
	[
		numeric('memory_area_code', 'u8'),
		numeric('beginning_address', 'be_u16'),
		numeric('beginning_address_bits', 'u8'),
	]
)
structs.push(MultipleMemoryAreaReadItem)
const DLTBLockDataItem = new Struct(
	"DLTBLockDataItem",
	[
		numeric('status_and_link_nodes', 'u8'),
		numeric('cio_area_first_word', 'be_u16'),
		numeric('kind_od_dm', 'u8'),
		numeric('dm_area_first_word', 'be_u16'),
		numeric('number_of_total_words', 'be_u16'),
	]
)
structs.push(DLTBLockDataItem)
const ForcedSetOrResetDataItem = new Struct(
	'ForcedSetOrResetDataItem',
	[
		numeric('specification', 'be_u16'),
		numeric('memory_area_code', 'u8'),
		numeric('bit_or_filg', 'be_u24'),
	]
)
structs.push(ForcedSetOrResetDataItem)
const Order = new StructEnum(
	'Order',
	[
		new AnonymousStructVariant(0x0101, 'MemoryAreaRead', [
			numeric('memory_area_code', 'u8'),
			numeric('beginning_address', 'be_u16'),
			numeric('beginning_address_bits', 'u8'),
			numeric('number_of_items', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0102, 'MemoryAreaWrite', [
			numeric('memory_area_code', 'u8'),
			numeric('beginning_address', 'be_u16'),
			numeric('beginning_address_bits', 'u8'),
			numeric('number_of_items', 'be_u16'),
			bytesRef('command_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0103, 'MemoryAreaFill', [
			numeric('memory_area_code', 'u8'),
			numeric('beginning_address', 'be_u16'),
			numeric('beginning_address_bits', 'u8'),
			numeric('number_of_items', 'be_u16'),
			numeric('command_data', 'be_u16')
		]),
		new AnonymousStructVariant(0x0104, 'MultipleMemoryAreaRead', [
			new VecField('result', createCountVarWithUnitSize("input.len()", 4, 'div'), MultipleMemoryAreaReadItem)
		]),
		new AnonymousStructVariant(0x0105, 'MemoryAreaTransfer', [
			numeric('memory_area_code_wc', 'u8'),
			numeric('beginning_address', 'be_u16'),
			numeric('beginning_address_bits', 'u8'),

			numeric('memory_area_code_pv', 'u8'),
			numeric('beginning_address_pv', 'be_u16'),
			numeric('beginning_address_bits_pv', 'u8'),
			numeric('number_of_items', 'be_u16'),
		]),

		new AnonymousStructVariant(0x0201, 'ParameterAreaRead', [
			numeric('parameter_area_code', 'be_u16'),
			numeric('beginning_word', 'be_u16'),
			numeric('words_of_bytes', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0202, 'ParameterAreaWrite', [
			numeric('parameter_area_code', 'be_u16'),
			numeric('beginning_word', 'be_u32'),
			numeric('words_of_bytes', 'be_u16'),
			bytesRef('command_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0220, 'DataLinkTableRead', [
			numeric('fixed', 'be_u16'),
			numeric('intelligent_id', 'be_u16'),
			numeric('first_word', 'be_u16'),
			numeric('read_length', 'be_u16'),
		]),
		//0x0221
		new AnonymousStructVariant(0x0221, 'DataLinkTableWrite', [
			numeric('fixed', 'be_u16'),
			numeric('intelligent_id', 'be_u16'),
			numeric('first_word', 'be_u16'),
			numeric('read_length', 'be_u16'),
			numeric('link_nodes', 'u8'),
			new VecField('block_data', createCountVarWithUnitSize("input.len()", 8, "div"), DLTBLockDataItem)
		]),
		new AnonymousStructVariant(0x0203, 'ParameterAreaClear', [
			numeric("parameter_area_code", 'be_u16'),
			numeric("beginning_word", 'be_u16'),
			numeric('words_of_bytes', 'be_u16'),
			bytesRef("command_data", createCountVar('input.len()')),
		]),
		new AnonymousStructVariant(0x0304, 'ParameterAreaProtect', [
			numeric("parameter_number", 'be_u16'),
			numeric("protect_code", 'u8'),
			numeric('beginning_word', 'be_u32'),
			numeric('last_word', 'be_u32'),
			numeric('pass_word', 'be_u32'),
		]),
		new AnonymousStructVariant(0x0305, 'ParameterAreaProtectClear', [
			numeric("parameter_number", 'be_u16'),
			numeric("protect_code", 'u8'),
			numeric('beginning_word', 'be_u32'),
			numeric('last_word', 'be_u32'),
			numeric('pass_word', 'be_u32'),
		]),
		new AnonymousStructVariant(0x0306, 'ProgramAreaRead', [
			numeric("program_number", 'be_u16'),
			numeric('beginning_word', 'be_u32'),
			numeric('words_of_bytes', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0307, 'ProgramAreaWrite', [
			numeric("program_number", 'be_u16'),
			numeric('beginning_word', 'be_u32'),
			numeric('words_of_bytes', 'be_u16'),
			bytesRef('command_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0308, 'ProgramAreaClear', [
			numeric("program_number", 'be_u16'),
			numeric('clear_code', 'u8'),
		]),
		new AnonymousStructVariant(0x0401, 'Run', [
			numeric("program_number", 'be_u16'),
			bytesRef('mode_code', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0402, 'Stop', [
		]),

		new AnonymousStructVariant(0x0501, 'ControllerDataRead', [
			bytesRef('command_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0502, 'ConnectionDataRead', [
			numeric("unit_address", 'u8'),
			bytesRef('number_of_units', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0601, 'ControllerStatusRead', [
		]),
		new AnonymousStructVariant(0x0603, 'DataLinkStatusRead', [
		]),
		new AnonymousStructVariant(0x0620, 'CycleTimeRead', [
			numeric("initializes_cycle_time", 'u8')
		]),
		new AnonymousStructVariant(0x0701, 'ClcokRead', [
		]),
		new AnonymousStructVariant(0x0702, 'ClcokWrite', [
			numeric("year", 'u8'),
			numeric("month", 'u8'),
			numeric("date", 'u8'),
			numeric("hour", 'u8'),
			numeric("minute", 'u8'),
			bytesRef('second_and_day', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0801, 'LoopBackTest', [
			bytesRef('data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0802, 'BroadcastTestResultsRead', [
		]),
		new AnonymousStructVariant(0x0803, 'BroadcastTestDataSend', [
			bytesRef('data', createCountVar('input.len()'))

		]),
		new AnonymousStructVariant(0x0920, 'MessageReadClearFALSRead', [
			numeric("message", 'be_u16')
		]),
		new AnonymousStructVariant(0x0c01, 'AccessRightAcquire', [
			numeric("program_number", 'be_u16')
		]),
		new AnonymousStructVariant(0x0c02, 'AccessRightForcedAcquire', [
			numeric("program_number", 'be_u16')
		]),
		new AnonymousStructVariant(0x0c03, 'AccessRightRelease', [
			numeric("program_number", 'be_u16')
		]),
		new AnonymousStructVariant(0x2101, 'ErrorClear', [
			numeric("error_reset_fal", 'be_u16')
		]),
		new AnonymousStructVariant(0x2102, 'ErrorLogRead', [
			numeric("beginning_record", 'be_u16'),
			numeric("record_numbers", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2103, 'ErrorLogClear', [
		]),
		new AnonymousStructVariant(0x2201, 'FileNameRead', [
			numeric("disk_number", 'be_u16'),
			numeric("beginning_file_position", 'be_u16'),
			numeric("number_of_files", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2202, 'SingleFileRead', [
			numeric("disk_number", 'be_u16'),
			bytesRef("file_name", createCountVar("12 as usize")),
			numeric("file_position", 'be_u32'),
			numeric("data_length", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2203, 'SingleFileWrite', [
			numeric("disk_number", 'be_u16'),
			numeric("parameter_code", 'be_u16'),
			bytesRef("file_name", createCountVar("12 as usize")),
			numeric("file_position", 'be_u32'),
			numeric("data_length", 'be_u16'),
			bytesRef("file_data", createCountVar("data_length as usize")),
		]),
		new AnonymousStructVariant(0x2204, 'MemoryCardFormat', [
			numeric("disk_number", 'be_u16')
		]),
		new AnonymousStructVariant(0x2205, 'FileDelete', [
			numeric("disk_number", 'be_u16'),
			numeric("number_of_files", 'be_u16'),
			bytesRef("file_names", createCountVar('number_of_files as usize * 12 as usize')),
		]),
		new AnonymousStructVariant(0x2206, 'VolumeLabelCreateOrDelete', [
			numeric("disk_number", 'be_u16'),
			numeric("volume_parameter_code", 'be_u16'),
			bytesRef("volume_label", createCountVar("input.len()"))
		]),
		new AnonymousStructVariant(0x2207, 'FileCopy', [
			numeric("disk_number_src", 'be_u16'),
			bytesRef("file_name_src", createCountVar("12 as usize")),
			numeric("disk_number_dst", 'be_u16'),
			bytesRef("file_name_dst", createCountVar("12 as usize")),
		]),
		new AnonymousStructVariant(0x2208, 'FileNameChange', [
			numeric("disk_number_src", 'be_u16'),
			bytesRef("file_name_new", createCountVar("12 as usize")),
			bytesRef("file_name_old", createCountVar("12 as usize")),
		]),
		new AnonymousStructVariant(0x2209, 'FileDataCheck', [
			numeric("disk_number", 'be_u16'),
			bytesRef("file_name", createCountVar("12 as usize")),
		]),
		new AnonymousStructVariant(0x220a, 'MemoryAreaFileTransfer', [
			numeric("parameter_code", 'be_u16'),
			numeric("memory_area_code", 'u8'),
			numeric("beginning_address", 'be_u24'),
			numeric("number_of_items", 'be_u16'),
			numeric("disk_number", 'be_u16'),
			bytesRef("file_name", createCountVar("12 as usize")),
		]),
		new AnonymousStructVariant(0x220b, 'ParameterAreaFileTransfer', [
			numeric("parameter_code", 'be_u16'),
			numeric("parameter_area_code", 'be_u16'),
			numeric("beginning_address", 'be_u16'),
			numeric("number_of_word_or_bytes", 'be_u16'),
			numeric("disk_number", 'be_u16'),
			bytesRef("file_name", createCountVar("12 as usize")),
		]),
		new AnonymousStructVariant(0x220c, 'ProgramAreaFileTransfer', [
			numeric("parameter_code", 'be_u16'),
			numeric("program_number", 'be_u16'),
			numeric("beginning_address", 'be_u32'),
			numeric("number_of_word_or_bytes", 'be_u32'),
			numeric("disk_number", 'be_u16'),
			bytesRef("file_name", createCountVar("12 as usize")),
		]),
		new AnonymousStructVariant(0x220f, 'FileMemoryIndexRead', [
			numeric("beginning_block_number", 'be_u16'),
			numeric("number_of_blocks", 'u8'),
		]),
		new AnonymousStructVariant(0x2210, 'FileMemoryRead', [
			numeric("block_number", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2211, 'FileMemoryWrite', [
			numeric("data_type", 'u8'),
			numeric("contral_data", 'u8'),
			numeric("block_number", 'be_u16'),
			bytesRef("file_name", createCountVar("input.len()")),
		]),
		new AnonymousStructVariant(0x2301, 'ForcedSetOrReset', [
			numeric("number_of_bits_flags", 'be_u16'),
			new VecField("data", createCountVarWithUnitSize("input.len()", 6, 'div'), ForcedSetOrResetDataItem)
		]),
		new AnonymousStructVariant(0x2302, 'ForcedSetOrResetCancel', [
		]),
		new AnonymousStructVariant(0x230a, 'MultipleForcedStatusRead', [
			numeric("memory_area_code", 'u8'),
			numeric("beginning_address", 'be_u24'),
			numeric("number_of_units", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2601, 'NameSet', [
			bytesRef("name_data", createCountVar("input.len()"))
		]),
		new AnonymousStructVariant(0x2602, 'NameDelete', [
		]),
		new AnonymousStructVariant(0x2603, 'NameRead', [
		]),
	],
	new BasicEnumChoice(
		numeric('cmd_code', "be_u16")
	)
)
structs.push(Order)


const CmdType = new Struct(
	'CmdType',
	[
		numeric('cmd_code', 'be_u16'),
		new EnumField(Order)
	]
)
structs.push(CmdType)

const FTH = new Struct(
	'FTH',
	[
		numeric('magic', 'be_u32'),
		numeric('length', 'be_u32'),
	]
)
structs.push(FTH)
const FH = new Struct(
	'FH',
	[
		numeric('fram_info', 'u8'),
		numeric('sys_save', 'u8'),
		numeric('gateway', 'u8'),
		numeric('dna', 'u8'),
		numeric('da1', 'u8'),
		numeric('da2', 'u8'),
		numeric('sna', 'u8'),
		numeric('sa1', 'u8'),
		numeric('sa2', 'u8'),
		numeric('sid', 'u8'),
		new StructField(CmdType)
	]
)
structs.push(FH)

const HeaderEntrying: Field[] =
	[
		numeric('client_add', 'be_u32'),
	]

const HeaderEntryed: Field[] =
	[
		new StructField(FH, 'fh')
	]

const State = new StructEnum(
	'State',
	[
		new AnonymousStructVariant(0x00, 'Connecting', HeaderEntrying),
		new AnonymousStructVariant(0x02, 'Connected', HeaderEntryed),
	],
	new BasicEnumChoice(
		numeric('ct', "be_u32")
	)
)
structs.push(State)

const header = new Struct(
	`${headerName}`,
	[
		new StructField(FTH),
		numeric('ct', 'be_u32'),
		numeric('ec', 'be_u32'),
		new EnumField(State)
	]
)

const payload = new EmptyPayloadEnum(
	`${payloadName}`
)

export const FinsTcpReqPacket = new Struct(
	`${packetName}`,
	[
		new StructField(header),
		new PayloadField(payload)
	]
)

export const FinsTcpReq = new Protocol({
	name: `${protocolName}`,
	packet: FinsTcpReqPacket,
	header,
	payload,
	structs
})