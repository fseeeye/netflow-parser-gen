import {
	createNumericFieldSimple as numeric,
	createBytesReferenceFieldSimple as bytesRef,
	createCountVar,
	createCountVarWithUnitSize,
} from "../../api/input"
import { BasicEnumChoice, InputLengthChoice } from "../../field/choice"
import { Field } from "../../field/base"
import { EnumField } from "../../field/enum"
import { UnlimitedVecLoopField, VecField } from "../../field/vec"
import { StructField } from "../../field/struct"
import { AnonymousStructVariant, StructEnum, EmptyPayloadEnum, EofVariant } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol } from "../protocol"
import { ProtocolInfo } from "../protocol-info"

const protocolName = 'FinsTcpRsp'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct | StructEnum)[] = []

const MultipleMemoryAreaReadItemChoice = new StructEnum(
	"MultipleMemoryAreaReadItemChoice",
	[
		new AnonymousStructVariant(
			'0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x09 | 0x1B | 0x20 | 0x21| 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x27 | 0x28 | 0x29 | 0x2A | 0x2B | 0x2C | 0x30	| 0x31 | 0x32 | 0x33 | 0x40 | 0x41 | 0x43 | 0x44 | 0x46 | 0x49 | 0x70 | 0x71 | 0x72',
			'MultipleMemoryAreaReadItem1',
			[bytesRef('item', createCountVar('1'))]
		),
		new AnonymousStructVariant(
			'0x80 | 0x81 | 0x82 | 0x84 | 0x85 | 0x89 | 0x90 | 0x91 | 0x92 | 0x93 | 0x94 | 0x95	| 0x96 | 0x97 | 0x98 | 0x9C | 0xA0 | 0xA1 | 0xA2 | 0xA3 | 0xA4 | 0xA5 | 0xA6 | 0xA7	| 0xA8 | 0xA9 | 0xAA | 0xAB | 0xAC | 0xB0 | 0xB1 | 0xB2 | 0xB3 | 0xBC',
			'MultipleMemoryAreaReadItem2',
			[bytesRef('item', createCountVar('2'))]
		),
		new AnonymousStructVariant(
			'0xC0 | 0xDC | 0xDD | 0xF0 | 0xF1 | 0xF2',
			'MultipleMemoryAreaReadItem4',
			[bytesRef('item', createCountVar('4'))]
		),
	],
	new BasicEnumChoice(numeric('memory_area_code', 'u8'),)
)
structs.push(MultipleMemoryAreaReadItemChoice)

const MultipleMemoryAreaReadItem = new Struct(
	"MultipleMemoryAreaReadItem",
	[
		numeric('memory_area_code', 'u8'),
		new EnumField(MultipleMemoryAreaReadItemChoice)
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

const ConnectionDataReadDataItem = new Struct(
	'ConnectionDataReadDataItem',
	[
		numeric('unit_address', 'u8'),
		bytesRef('model_number', createCountVar('20'))
	]
)
structs.push(ConnectionDataReadDataItem)

const ErrorLogReadDataItem = new Struct(
	'ErrorLogReadDataItem',
	[
		numeric('error_reset_fal_1', 'be_u16'),
		numeric('error_reset_fal_2', 'be_u16'),
		numeric('minute', 'u8'),
		numeric('second', 'u8'),
		numeric('day', 'u8'),
		numeric('hour', 'u8'),
		numeric('year', 'u8'),
		numeric('month', 'u8'),
	]
)
structs.push(ErrorLogReadDataItem)

const FileNameReadDiskDataItem = new Struct(
	'FileNameReadDiskDataItem',
	[
		bytesRef('volume_label', createCountVar('12')),
		numeric('date', 'be_u32'),
		numeric('total_capacity', 'be_u32'),
		numeric('unused_capacity', 'be_u32'),
		numeric('total_number_of_files', 'be_u16'),
	]
)
structs.push(FileNameReadDiskDataItem)

const FileNameReadFileDataItem = new Struct(
	'FileNameReadFileDataItem',
	[
		bytesRef('file_name', createCountVar('12')),
		numeric('date', 'be_u32'),
		numeric('file_capacity', 'be_u32'),
	]
)
structs.push(FileNameReadFileDataItem)

const FileMemoryIndexReadDataItem = new Struct(
	'FileMemoryIndexReadDataItem',
	[
		numeric('data_type', 'u8'),
		numeric('control_data', 'u8')
	]
)
structs.push(FileMemoryIndexReadDataItem)

const CycleTimeReadChoice = new StructEnum(
	'CycleTimeReadChoice',
	[
		new AnonymousStructVariant(0x02, 'CycleTimeRead2', [
			numeric('rsp_code', 'be_u16')
		]),
		new AnonymousStructVariant(0x0e, 'CycleTimeRead14', [
			numeric('rsp_code', 'be_u16'),
			numeric('averge_cycle_time', 'be_u32'),
			numeric('max_cycle_time', 'be_u32'),
			numeric('min_cycle_time', 'be_u32'),
		]),
	],
	new InputLengthChoice()
)
structs.push(CycleTimeReadChoice)

const AccessRightAcquireChoice = new StructEnum(
	'AccessRightAcquireChoice',
	[
		new AnonymousStructVariant(0x02, 'AccessRightAcquire2', [
			numeric('rsp_code', 'be_u16')
		]),
		new AnonymousStructVariant(0x05, 'AccessRightAcquire5', [
			numeric('rsp_code', 'be_u16'),
			numeric('unit_address', 'u8'),
			numeric('node_number', 'u8'),
			numeric('network_address', 'u8'),
		]),
	],
	new InputLengthChoice()
)
structs.push(AccessRightAcquireChoice)

const MessageInfo = new Struct(
	'MessageInfo',
	[
		bytesRef('item', createCountVar('32'))
	]
)
structs.push(MessageInfo)

const MessageReadOrClearOrFALSReadChoice = new StructEnum(
	'MessageReadOrClearOrFALSReadChoice',
	[
		new AnonymousStructVariant(0x14, 'MessageReadOrClearOrFALSRead20', [
			numeric('rsp_code', 'be_u16'),
			numeric('fals', 'be_u16'),
			bytesRef('error_message', createCountVar('16')),
		]),
		new AnonymousStructVariant(0x02, 'MessageReadOrClearOrFALSRead2', [
			numeric('rsp_code', 'be_u16')
		]),
		new AnonymousStructVariant('_', 'MessageReadOrClearOrFALSReadLong', [
			numeric('rsp_code', 'be_u16'),
			numeric('message_info', 'be_u16'),
			new VecField('message', createCountVarWithUnitSize('input.len()', 32, 'div'), MessageInfo)
		]),
	],
	new InputLengthChoice()
)
structs.push(MessageReadOrClearOrFALSReadChoice)

const ControllerDataReadDataChoice = new StructEnum(
	'ControllerDataReadDataChoice',
	[
		new AnonymousStructVariant(0xa1, 'ControllerDataReadDataItem161', [
			numeric('rsp_code', 'be_u16'),
			bytesRef('controller_model', createCountVar('20')),
			bytesRef('controller_version', createCountVar('20')),
			bytesRef('for_system_use', createCountVar('40')),
			numeric('program_area_size', 'be_u16'),
			numeric('ios_size', 'u8'),
			numeric('number_of_dw_words', 'be_u16'),
			numeric('time_counter_size', 'u8'),
			numeric('expansion_dm_size', 'u8'),
			numeric('number_step_transitions', 'be_u16'),
			numeric('kind_memory_card', 'u8'),
			numeric('memory_card_size', 'be_u16'), numeric('cpu_bus_unit_0', 'be_u16'),
			numeric('cpu_bus_unit_1', 'be_u16'),
			numeric('cpu_bus_unit_2', 'be_u16'),
			numeric('cpu_bus_unit_3', 'be_u16'),
			numeric('cpu_bus_unit_4', 'be_u16'),
			numeric('cpu_bus_unit_5', 'be_u16'),
			numeric('cpu_bus_unit_6', 'be_u16'),
			numeric('cpu_bus_unit_7', 'be_u16'),
			numeric('cpu_bus_unit_8', 'be_u16'),
			numeric('cpu_bus_unit_9', 'be_u16'),
			numeric('cpu_bus_unit_10', 'be_u16'),
			numeric('cpu_bus_unit_11', 'be_u16'),
			numeric('cpu_bus_unit_12', 'be_u16'),
			numeric('cpu_bus_unit_13', 'be_u16'),
			numeric('cpu_bus_unit_14', 'be_u16'),
			numeric('cpu_bus_unit_15', 'be_u16'),
			bytesRef('cpu_bus_rsserved', createCountVar('32')),
			numeric('remote_io_data_1', 'u8'),
			numeric('remote_io_data_2', 'u8'),
			numeric('pc_status', 'u8'),
		]),
		new AnonymousStructVariant(0x5e, 'ControllerDataReadDataItem94', [
			numeric('rsp_code', 'be_u16'),
			bytesRef('controller_model', createCountVar('20')),
			bytesRef('controller_version', createCountVar('20')),
			bytesRef('for_system_use', createCountVar('40')),
			numeric('program_area_size', 'be_u16'),
			numeric('ios_size', 'u8'),
			numeric('number_of_dw_words', 'be_u16'),
			numeric('time_counter_size', 'u8'),
			numeric('expansion_dm_size', 'u8'),
			numeric('number_step_transitions', 'be_u16'),
			numeric('kind_memory_card', 'u8'),
			numeric('memory_card_size', 'be_u16'),
		]),
		new AnonymousStructVariant(0x45, 'ControllerDataReadDataItem69', [
			numeric('rsp_code', 'be_u16'),
			numeric('cpu_bus_unit_0', 'be_u16'),
			numeric('cpu_bus_unit_1', 'be_u16'),
			numeric('cpu_bus_unit_2', 'be_u16'),
			numeric('cpu_bus_unit_3', 'be_u16'),
			numeric('cpu_bus_unit_4', 'be_u16'),
			numeric('cpu_bus_unit_5', 'be_u16'),
			numeric('cpu_bus_unit_6', 'be_u16'),
			numeric('cpu_bus_unit_7', 'be_u16'),
			numeric('cpu_bus_unit_8', 'be_u16'),
			numeric('cpu_bus_unit_9', 'be_u16'),
			numeric('cpu_bus_unit_10', 'be_u16'),
			numeric('cpu_bus_unit_11', 'be_u16'),
			numeric('cpu_bus_unit_12', 'be_u16'),
			numeric('cpu_bus_unit_13', 'be_u16'),
			numeric('cpu_bus_unit_14', 'be_u16'),
			numeric('cpu_bus_unit_15', 'be_u16'),
			bytesRef('cpu_bus_rsserved', createCountVar('32')),
			numeric('remote_io_data_1', 'u8'),
			numeric('remote_io_data_2', 'u8'),
			numeric('pc_status', 'u8'),
		]),
	],
	new InputLengthChoice()
)
structs.push(ControllerDataReadDataChoice)

const Order = new StructEnum(
	'Order',
	[
		new AnonymousStructVariant(0x0101, 'MemoryAreaRead', [
			numeric('rsp_code', 'be_u16'),
			bytesRef('last_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0102, 'MemoryAreaWrite', [
			numeric('memory_area_code', 'u8'),
			numeric('beginning_address', 'be_u16'),
			numeric('beginning_address_bits', 'u8'),
			numeric('number_of_items', 'be_u16'),
			numeric('command_data', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0103, 'MemoryAreaFill', [
			numeric('memory_area_code', 'u8'),
			numeric('beginning_address', 'be_u16'),
			numeric('beginning_address_bits', 'u8'),
			numeric('number_of_items', 'be_u16'),
			numeric('command_data', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0104, 'MultipleMemoryAreaRead', [
			numeric('rsp_code', 'be_u16'),
			new UnlimitedVecLoopField('data', new StructField(MultipleMemoryAreaReadItem))
		]),
		new AnonymousStructVariant(0x0105, 'MemoryAreaTransfer', [
			numeric('rsp_code', 'be_u16')
		]),
		new AnonymousStructVariant(0x0201, 'ParameterAreaRead', [
			numeric('rsp_code', 'be_u16'),
			numeric('parameter_area_code', 'be_u16'),
			numeric('beginning_word', 'be_u16'),
			numeric('number_words_or_bytes', 'be_u16'),
			bytesRef('rsp_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0202, 'ParameterAreaWrite', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0203, 'ParameterAreaClear', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0220, 'DataLinkTableRead', [
			numeric('rsp_code', 'be_u16'),
			numeric('number_of_link_nodes', 'u8'),
			new UnlimitedVecLoopField('data', new StructField(DLTBLockDataItem)),
		]),
		new AnonymousStructVariant(0x0221, 'DataLinkTableRWrite', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0304, 'ParameterAreaProtect', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0305, 'ParameterAreaProtectClear', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0306, 'ProgramAreaRead', [
			numeric('rsp_code', 'be_u16'),
			numeric("program_number", 'be_u16'),
			numeric('beginning_word', 'be_u32'),
			numeric('words_of_bytes', 'be_u16'),
			bytesRef('rsp_data', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x0307, 'ProgramAreaWrite', [
			numeric('rsp_code', 'be_u16'),
			numeric("program_number", 'be_u16'),
			numeric('beginning_word', 'be_u32'),
			numeric('words_of_bytes', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0308, 'ProgramAreaClear', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0401, 'Run', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0402, 'Stop', [
			numeric('rsp_code', 'be_u16'),
		]),
		new AnonymousStructVariant(0x0501, 'ControllerDataRead', [
			new EnumField(ControllerDataReadDataChoice)
		]),
		new AnonymousStructVariant(0x0502, 'ConnectionDataRead', [
			numeric('rsp_code', 'be_u16'),
			numeric('number_of_units', 'u8'),
			new UnlimitedVecLoopField('data', new StructField(ConnectionDataReadDataItem)),
		]),
		new AnonymousStructVariant(0x0601, 'ControllerStatusRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("status_stop", 'u8'),
			numeric("mode_code", 'u8'),
			numeric("fatal_error_data", 'be_u16'),
			numeric("non_fatal_error_data", 'be_u16'),
			numeric("message", 'be_u16'),
			numeric("fals", 'be_u16'),
			bytesRef("error_message", createCountVar('input.len()')),
		]),
		new AnonymousStructVariant(0x0602, 'NetworkStatusRead', [
			numeric("rsp_code", 'be_u16'),
			bytesRef("network_nodes_status", createCountVar('31')),
			numeric("communications_cycle_time", 'be_u16'),
			numeric("current_polling_unit_node_number", 'u8'),
			numeric("cyclic_operation", 'u8'),
			numeric("cyclic_transmission_status", 'u8'),
			bytesRef("network_nodes_non_fatal_error_status", createCountVar('8')),
			bytesRef("network_nodes_cyclic_error_counters", createCountVar('62')),
		]),
		new AnonymousStructVariant(0x0603, 'DataLinkStatusRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("status_flags", 'u8'),
			numeric("master_node_number", 'u8'),
			bytesRef("data", createCountVar('input.len()')),
		]),
		new AnonymousStructVariant(0x0620, 'CycleTimeRead', [
			new EnumField(CycleTimeReadChoice)
		]),
		new AnonymousStructVariant(0x0701, 'ClcokRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("year", 'u8'),
			numeric("month", 'u8'),
			numeric("date", 'u8'),
			numeric("hour", 'u8'),
			numeric("minute", 'u8'),
			numeric("second", 'u8'),
			numeric("day", 'u8'),
		]),
		new AnonymousStructVariant(0x0702, 'ClcokWrite', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x0801, 'LoopBackTest', [
			numeric("rsp_code", 'be_u16'),
			bytesRef("data", createCountVar("input.len()"))
		]),
		new AnonymousStructVariant(0x0802, 'BroadcastTestResultsRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("number_of_receptions", 'be_u16'),
		]),
		new EofVariant(0x0803, 'BroadcastTestDataSend'),
		new AnonymousStructVariant(0x0920, 'MessageReadClearFALSRead', [
			new EnumField(MessageReadOrClearOrFALSReadChoice)
		]),
		new AnonymousStructVariant(0x0c01, 'AccessRightAcquire', [
			new EnumField(AccessRightAcquireChoice)
		]),
		new AnonymousStructVariant(0x0c02, 'AccessRightForcedAcquire', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x0c03, 'AccessRightRelease', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2101, 'ErrorClear', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2102, 'ErrorLogRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("max_number_of_stored_records", 'be_u16'),
			numeric("number_of_stored_records", 'be_u16'),
			numeric("number_of_records", 'be_u16'),
			new UnlimitedVecLoopField('error_log_data', new StructField(ErrorLogReadDataItem))
		]),
		new AnonymousStructVariant(0x2103, 'ErrorLogClear', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2201, 'FileNameRead', [
			numeric("rsp_code", 'be_u16'),
			new StructField(FileNameReadDiskDataItem, "disk_data"),
			numeric("number_of_files", 'be_u16'),
			new UnlimitedVecLoopField('error_log_data', new StructField(FileNameReadFileDataItem))
		]),
		new AnonymousStructVariant(0x2202, 'SingleFileRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("file_capacity", 'be_u16'),
			numeric("file_position", 'be_u32'),
			numeric("data_length", 'be_u16'),
			bytesRef("file_data", createCountVar("input.len()")),
		]),
		new AnonymousStructVariant(0x2203, 'SingleFileWrite', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2204, 'MemoryCardFormat', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2205, 'FileDelete', [
			numeric("rsp_code", 'be_u16'),
			numeric("number_of_files", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2206, 'VolumeLabelCreateOrDelete', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2207, 'FileCopy', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2208, 'FileNameChange', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2209, 'FileDataCheck', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x220a, 'MemoryAreaFileTransfer', [
			numeric("rsp_code", 'be_u16'),
			numeric("number_of_items", 'be_u16'),
		]),
		new AnonymousStructVariant(0x220b, 'ParameterAreaFileTransfer', [
			numeric("rsp_code", 'be_u16'),
			numeric("number_of_word_or_bytes", 'be_u16'),
		]),
		new EofVariant(0x220c, 'ProgramAreaFileTransfer'),
		new AnonymousStructVariant(0x220f, 'FileMemoryIndexRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("number_of_blocks_remaining", 'be_u16'),
			numeric("total_number_of_blocks", 'be_u16'),
			numeric("omron_type", 'u8'),
			new UnlimitedVecLoopField("data", new StructField(FileMemoryIndexReadDataItem))
		]),
		new AnonymousStructVariant(0x2210, 'FileMemoryRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("data_type", 'u8'),
			numeric("control_data", 'u8'),
			bytesRef("data", createCountVar('input.len()')),
		]),
		new AnonymousStructVariant(0x2211, 'FileMemoryWrite', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2301, 'ForcedSetOrReset', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2302, 'ForcedSetOrResetCancel', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x230a, 'MultipleForcedStatusRead', [
			numeric("rsp_code", 'be_u16'),
			numeric("memory_area_code", 'be_u16'),
			numeric("beginning_address", 'be_u24'),
			numeric("number_of_units", 'be_u16'),
			bytesRef("data", createCountVar('input.len()')),
		]),
		new AnonymousStructVariant(0x2601, 'NameSet', [
			numeric("rsp_code", 'be_u16'),
		]),
		new AnonymousStructVariant(0x2602, 'NameDelete', [
			numeric("rsp_code", 'be_u16'),
		]),
		new EofVariant(0x2603, 'NameRead'),
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
		numeric('dnn', 'u8'),
		numeric('dua', 'u8'),
		numeric('sna', 'u8'),
		numeric('snn', 'u8'),
		numeric('sua', 'u8'),
		numeric('sid', 'u8'),
		new StructField(CmdType)
	]
)
structs.push(FH)

const HeaderEntrying: Field[] =
	[
		numeric('client_add', 'be_u32'),
		numeric('server_add', 'be_u32')
	]

const HeaderEntryed: Field[] =
	[
		new StructField(FH, 'fh')
	]

const State = new StructEnum(
	'State',
	[
		new AnonymousStructVariant(0x01, 'Connecting', HeaderEntrying),
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

const info = new ProtocolInfo(protocolName, 'L5', header)

const payload = new EmptyPayloadEnum(
    `${payloadName}`,
    info
)

export const FinsTcpRsp = new Protocol({
	info,
	payload,
	structs
})
