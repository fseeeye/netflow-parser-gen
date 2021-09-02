import { bitNumVec } from "../../api"
import {
	createNumericFieldSimple as numeric,
	createBytesReferenceFieldSimple as bytesRef,
	createNumericVector as numVec,
	createCountVar,
	createCountVarWithUnitSize,
} from "../../api/input"
import { BasicEnumChoice, ArgsBitOperatorChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { NumericField } from "../../field/numeric"
// import { PayloadField } from "../../field/payload"
import { StructField } from "../../field/struct"
import { VecField, LimitedVecLoopField, UnlimitedVecLoopField } from "../../field/vec"
import { AnonymousStructVariant, StructEnum, EmptyPayloadEnum, NamedStructVariant } from "../../types/enum"
import { Struct } from "../../types/struct"
import { Protocol, ProtocolInfo } from "../generator"

const protocolName = 'Mms'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct | StructEnum)[] = []

// const Tpkt = new Struct(
// 	'Tpkt',
// 	[
// 		numeric('version', 'u8'),
// 		numeric('reserved', 'u8'),
// 		numeric('length', 'be_u16'),
// 	]
// )
// structs.push(Tpkt)

// const ConnectRequestFields: NumericField[] = [
// 	numeric('destination_reference', 'be_u16'),
// 	numeric('source_reference', 'be_u16'),
// 	numeric('bit_mask', 'u8'),
// 	numeric('parameter_src_tsap', 'u8'),
// 	numeric('parameter_src_length', 'u8'),
// 	numeric('source_tsap', 'be_u16'),
// 	numeric('parameter_dst_tsap', 'u8'),
// 	numeric('parameter_dst_length', 'u8'),
// 	numeric('destination_tsap', 'be_u16'),

// ]

// const ConnectConfirmFields: NumericField[] = [
// 	numeric('destination_reference', 'be_u16'),
// 	numeric('source_reference', 'be_u16'),
// 	numeric('bit_mask', 'u8'),
// 	numeric('parameter_src_tsap', 'u8'),
// 	numeric('parameter_src_length', 'u8'),
// 	numeric('source_tsap', 'be_u16'),
// 	numeric('parameter_dst_tsap', 'u8'),
// 	numeric('parameter_dst_length', 'u8'),
// 	numeric('destination_tsap', 'be_u16'),
// 	numeric('parameter_tpdu_size', 'u8'),
// 	numeric('parameter_tpdu_length', 'u8'),
// 	numeric('tpdu_size', 'u8'),
// ]

// const DataFields: NumericField[] = [
// 	numeric('length','u8'),
// 	numeric('pdu_type','u8'),
// 	numeric('bit_mask','u8'),
// ]

// const CotpPduData = new StructEnum(
// 	'CotpPduData',
// 	[
// 		new AnonymousStructVariant(0xe0, 'ConnectRequest', ConnectRequestFields),
// 		new AnonymousStructVariant(0xd0, 'ConnectConfirm', ConnectConfirmFields),
// 		new AnonymousStructVariant(0xf0, 'DTData', DataFields)
// 	],
// 	new BasicEnumChoice(numeric('pdu_type', 'u8'))
// )
// structs.push(CotpPduData)

// const CotpPdu = new Struct(
// 	'CotpPdu',
// 	[
// 		numeric('pdu_type', 'u8'),
// 		new EnumField(CotpPduData)
// 	],
// )
// structs.push(CotpPdu)

// const Cotp = new Struct(
// 	'Cotp',
// 	[
// 		numeric('length', 'u8'),
// 		new StructField(CotpPdu),
// 	]
// )
// structs.push(Cotp)

// const MmsApHeader = new Struct(
// 	'MmsApHeader',
// 	[
// 		new StructField(Tpkt),
// 		new StructField(Cotp),
// 	]
// )

// const BerTag = new Struct(
// 	'BerTag',
// 	[

// 	]
// )


const SimpleItem = new Struct(
	'SimpleItem',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		bytesRef('data', createCountVar('length'))
	]
)
structs.push(SimpleItem)

const SimpleU8Data = new Struct(
	'SimpleU8Data',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		numeric('data', 'u8')
	]
)
structs.push(SimpleU8Data)

const ObjectClass = new StructEnum(
	'ObjectClass',
	[
		new AnonymousStructVariant(0x00, 'NamedVariable', [
			new StructField(SimpleItem, 'named_variable'),
		]),
		new AnonymousStructVariant(0x01, 'ScatteredAccess', [
			new StructField(SimpleItem, 'scattered_access'),
		]),
		new AnonymousStructVariant(0x02, 'NamedVariableList', [
			new StructField(SimpleItem, 'named_variable_list'),
		]),
		new AnonymousStructVariant(0x03, 'NamedType', [
			new StructField(SimpleItem, 'named_type'),
		]),
		new AnonymousStructVariant(0x04, 'Semaphore', [
			new StructField(SimpleItem, 'semaphore'),
		]),
		new AnonymousStructVariant(0x05, 'EventCondition', [
			new StructField(SimpleItem, 'event_condition'),
		]),
		new AnonymousStructVariant(0x06, 'EventAction', [
			new StructField(SimpleItem, 'event_action'),
		]),
		new AnonymousStructVariant(0x07, 'EventEnrollment', [
			new StructField(SimpleItem, 'event_enrollment'),
		]),
		new AnonymousStructVariant(0x08, 'Journal', [
			new StructField(SimpleItem, 'journal'),
		]),
		new AnonymousStructVariant(0x09, 'Domain', [
			new StructField(SimpleItem, 'domain'),
		]),
		new AnonymousStructVariant(0x0a, 'ProgramInvocation', [
			new StructField(SimpleItem, 'program_invocation'),
		]),
		new AnonymousStructVariant(0x0b, 'OperatorStation', [
			new StructField(SimpleItem, 'operator_station'),
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('object_class_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('object_class_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(ObjectClass)

const Identifier = new StructEnum(
	'Identifier',
	[
		new AnonymousStructVariant(0x00, 'IdentifierVmd', [
			numeric('tag', 'u8'),
			numeric('length', 'be_u16'),
			bytesRef('value', createCountVar('length'))
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('identifier_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('identifier_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(Identifier)

const IdentifierStruct = new Struct(
	'IdentifierStruct',
	[
		numeric('identifier_tag', 'u8'),
		numeric('identifier_length', 'be_u16'),
		new EnumField(Identifier, 'identifier')
	]
)
structs.push(IdentifierStruct)

const ObjectScope = new StructEnum(
	'ObjectScope',
	[
		new AnonymousStructVariant(0x00, 'ObjectScopeVmd', [
			new StructField(IdentifierStruct, 'object_scope_vmd'),
		]),
		new AnonymousStructVariant(0x01, 'ObjectScopeDomain', [
			new StructField(IdentifierStruct, 'object_scope_domain_id'),
			new StructField(IdentifierStruct, 'object_scope_item_id'),
		]),
		new AnonymousStructVariant(0x02, 'ObjectScopeAaSpecific', [
			new StructField(IdentifierStruct, 'object_scope_aa_specific')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('object_scope_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('object_scope_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(ObjectScope)

const BoolResult = new Struct(
	'BoolResult',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		numeric('result', 'u8')
	]
)
structs.push(BoolResult)

const ListOfData = new Struct(
	'ListOfData',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		new LimitedVecLoopField('data', SimpleItem, numeric('length', 'be_u16'))
	]
)
structs.push(ListOfData)

const ObjectName = new StructEnum(
	'ObjectName',
	[
		new AnonymousStructVariant(0x00, 'ObjectNameVmd', [
			new StructField(IdentifierStruct, 'object_name_vmd'),
		]),
		new AnonymousStructVariant(0x01, 'ObjectNameDomain', [
			new StructField(IdentifierStruct, 'object_name_domain_id'),
			new StructField(IdentifierStruct, 'object_name_item_id'),
		]),
		new AnonymousStructVariant(0x02, 'ObjectNameAaSpecific', [
			new StructField(IdentifierStruct, 'object_name_aa_specific')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('object_name_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('object_name_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(ObjectName)

const ObjectNameStruct = new Struct(
	'ObjectNameStruct',
	[
		numeric('object_name_tag', 'u8'),
		numeric('object_name_length', 'be_u16'),
		new EnumField(ObjectName, 'object_name')
	]
)
structs.push(ObjectNameStruct)

const VariableSpecification = new StructEnum(
	'VariableSpecification',
	[
		new AnonymousStructVariant(0x00, 'Name', [
			new StructField(ObjectNameStruct, 'res')
		]),
		new AnonymousStructVariant(0x01, 'Others', [
			numeric('tag', 'u8'),
			numeric('length', 'be_u16'),
			bytesRef('value', createCountVar('length'))
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('variable_specification_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('variable_specification_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(VariableSpecification)

const VariableSpecificationStruct = new Struct(
	'VariableSpecificationStruct',
	[
		numeric('variable_specification_tag', 'u8'),
		numeric('variable_specification_length', 'be_u16'),
		new EnumField(VariableSpecification, 'variable_specification')
	]
)
structs.push(VariableSpecificationStruct)

const ListOfVariableSpecification = new Struct(
	'ListOfVariableSpecification',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		new LimitedVecLoopField('data', VariableSpecificationStruct, numeric('length', 'be_u16'))
	]
)
structs.push(ListOfVariableSpecification)

const DataAccessError = new StructEnum(
	'DataAccessError',
	[
		new AnonymousStructVariant(0x00, 'ObjectInvalidated', [
			new StructField(SimpleU8Data, 'object_invalidated'),
		]),
		new AnonymousStructVariant(0x01, 'HardwareFault', [
			new StructField(SimpleU8Data, 'hardware_fault'),
		]),
		new AnonymousStructVariant(0x02, 'TemporarilyUnavailable', [
			new StructField(SimpleU8Data, 'temporarily_unavailable'),
		]),
		new AnonymousStructVariant(0x03, 'ObjectAccessDenied', [
			new StructField(SimpleU8Data, 'object_access_denied'),
		]),
		new AnonymousStructVariant(0x04, 'ObjectUndefined', [
			new StructField(SimpleU8Data, 'object_undefined'),
		]),
		new AnonymousStructVariant(0x05, 'InvalidAddress', [
			new StructField(SimpleU8Data, 'invalid_address'),
		]),
		new AnonymousStructVariant(0x06, 'TypeUnsupported', [
			new StructField(SimpleU8Data, 'type_unsupported'),
		]),
		new AnonymousStructVariant(0x07, 'TypeInconsistent', [
			new StructField(SimpleU8Data, 'type_inconsistent'),
		]),
		new AnonymousStructVariant(0x08, 'ObjectAttributeInconsistent', [
			new StructField(SimpleU8Data, 'object_attribute_inconsistent'),
		]),
		new AnonymousStructVariant(0x09, 'ObjectAccessUnsupported', [
			new StructField(SimpleU8Data, 'object_access_unsupported'),
		]),
		new AnonymousStructVariant(0x0a, 'ObjectNonExistent', [
			new StructField(SimpleU8Data, 'object_non_existent'),
		]),
		new AnonymousStructVariant(0x0b, 'ObjectValueInvalid', [
			new StructField(SimpleU8Data, 'object_value_invalid'),
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('data_access_error_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('data_access_error_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(DataAccessError)

const DataAccessErrorConstruct = new Struct(
	'DataAccessErrorConstruct',
	[
		numeric('data_access_error_tag', 'u8'),
		numeric('data_access_error_length', 'be_u16'),
		new EnumField(DataAccessError, 'data_access_error')
	]
)
structs.push(DataAccessErrorConstruct)


const Data = new Struct(
	'Data',
	[
		new StructField(SimpleItem, 'data')
	],
)
structs.push(Data)

const AccessResult = new StructEnum(
	'AccessResult',
	[
		new AnonymousStructVariant(0x00, 'AccessResultFailure', [
			new StructField(DataAccessErrorConstruct, 'failure'),
		]),
		new AnonymousStructVariant(0x01, 'AccessResultSuccess', [
			new StructField(Data, 'success'),
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('access_result_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('access_result_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(AccessResult)

const AccessResultStruct = new Struct(
	'AccessResultStruct',
	[
		numeric('access_result_tag', 'u8'),
		numeric('access_result_length', 'be_u16'),
		new EnumField(AccessResult, 'access_result')
	]
)
structs.push(AccessResultStruct)

const ListOfAccessResult = new Struct(
	'ListOfAccessResult',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		new LimitedVecLoopField('loar', AccessResultStruct, numeric('length', 'be_u16'))
	]
)
structs.push(ListOfAccessResult)

const ListOfIdentifier = new Struct(
	'ListOfIdentifier',
	[
		numeric('tag', 'u8'),
		numeric('length', 'be_u16'),
		new LimitedVecLoopField('loar', IdentifierStruct, numeric('length', 'be_u16'))
	]
)
structs.push(ListOfIdentifier)

const InitDetailRequest = new Struct(
	'InitDetailRequest',
	[
		new StructField(SimpleItem, 'proposed_version_number'),
		new StructField(SimpleItem, 'proposed_parameter_cbb'),
		new StructField(SimpleItem, 'service_supported_calling'),
	]
)
structs.push(InitDetailRequest)

const InitDetailResponse = new Struct(
	'InitDetailResponse',
	[
		new StructField(SimpleItem, 'proposed_version_number'),
		new StructField(SimpleItem, 'proposed_parameter_cbb'),
		new StructField(SimpleItem, 'service_supported_called'),
	]
)
structs.push(InitDetailResponse)

const InvokeId = new Struct(
	'InvokeId',
	[
		numeric('invoke_id', 'u8')
	]
)
structs.push(InvokeId)

const VaribaleAccessSpecificationChoice = new StructEnum(
	'VaribaleAccessSpecificationChoice',
	[
		new AnonymousStructVariant(0x00, 'ListOfVariable', [
			new StructField(ListOfVariableSpecification, 'res')
		]),
		new AnonymousStructVariant(0x01, 'VaribaleListName', [
			new StructField(ObjectNameStruct, 'res')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('varibale_access_specification_choice_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('varibale_access_specification_choice_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(VaribaleAccessSpecificationChoice)

const VaribaleAccessSpecificationChoiceStruct = new Struct(
	'VaribaleAccessSpecificationChoiceStruct',
	[
		numeric('varibale_access_specification_choice_tag', 'u8'),
		numeric('varibale_access_specification_choice_length', 'be_u16'),
		new EnumField(VaribaleAccessSpecificationChoice, 'varibale_access_specification_choice')
	]
)
structs.push(VaribaleAccessSpecificationChoiceStruct)

const ReadRequestChoice = new StructEnum(
	'ReadRequestChoice',
	[
		new AnonymousStructVariant(0x00, 'ReadRequestChoiceDefault', [
			new StructField(VaribaleAccessSpecificationChoiceStruct, 'res')
		]),
		new AnonymousStructVariant(0x01, 'Otherwise', [
			new StructField(BoolResult, 'specification_with_result'),
			new StructField(VaribaleAccessSpecificationChoiceStruct, 'res')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('read_request_choice_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('read_request_choice_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(ReadRequestChoice)

const WriteRequestChoiceConstruct = new Struct(
	'WriteRequestChoiceConstruct',
	[
		numeric('varibale_access_specification_choice_tag', 'u8'),
		numeric('varibale_access_specification_choice_length', 'be_u16'),
		new EnumField(VaribaleAccessSpecificationChoice, 'varibale_access_specification_choice'),
		numeric('list_of_data_tag', 'u8'),
		numeric('list_of_data_length', 'be_u16'),
		new StructField(ListOfData, 'list_of_data')
	],
)
structs.push(WriteRequestChoiceConstruct)

const GetNamedVariableListAttributesRequestChoiceConstruct = new Struct(
	'GetNamedVariableListAttributesRequestChoiceConstruct',
	[
		numeric('object_name_tag', 'u8'),
		numeric('object_name_length', 'be_u16'),
		new EnumField(ObjectName, 'object_name')
	]
)
structs.push(GetNamedVariableListAttributesRequestChoiceConstruct)

const GetNameListRequestChoiceConstruct = new Struct(
	'GetNameListRequestChoiceConstruct',
	[
		numeric('object_class_tag', 'u8'),
		numeric('object_class_length', 'be_u16'),
		new EnumField(ObjectClass, 'object_class'),
		numeric('object_scope_tag', 'u8'),
		numeric('object_scope_length', 'be_u16'),
		new EnumField(ObjectScope, 'object_scope'),
	]
)
structs.push(GetNameListRequestChoiceConstruct)

const GetNameListResponseChoiceConstruct = new Struct(
	'GetNameListResponseChoiceConstruct',
	[
		numeric('list_of_identifier_tag', 'u8'),
		numeric('list_of_identifier_length', 'be_u16'),
		new StructField(ListOfIdentifier, 'list_of_identifier'),
		numeric('more_follows_tag', 'u8'),
		numeric('more_follows_length', 'be_u16'),
		new StructField(BoolResult, 'more_follows'),
	]
)
structs.push(GetNameListResponseChoiceConstruct)

const IdentifyRequestChoiceConstruct = new Struct(
	'IdentifyRequestChoiceConstruct',
	[
		// IdentifyRequest is NULL
	]
)
structs.push(IdentifyRequestChoiceConstruct)

const IdentifyResponseChoiceConstruct = new Struct(
	'IdentifyResponseChoiceConstruct',
	[
		numeric('vendor_name_tag', 'u8'),
		numeric('vendor_name_length', 'be_u16'),
		new StructField(SimpleItem, 'vendor_name'),
		numeric('model_name_tag', 'u8'),
		numeric('model_name_length', 'be_u16'),
		new StructField(SimpleItem, 'model_name'),
		numeric('revision_tag', 'u8'),
		numeric('revision_length', 'be_u16'),
		new StructField(SimpleItem, 'revision'),
	]
)
structs.push(IdentifyResponseChoiceConstruct)

const ReadResponseChoice = new StructEnum(
	'ReadResponseChoice',
	[
		//VaribaleAccessSpecification is OPTIONAL
		new AnonymousStructVariant(0x00, 'ReadResponseChoiceDefault', [
			numeric('list_of_access_result_tag', 'u8'),
			numeric('list_of_access_result_length', 'be_u16'),
			new StructField(ListOfAccessResult, 'list_of_access_result')
		]),
		// new AnonymousStructVariant(0x01, 'Otherwise', [
		// 	numeric('tag', 'u8'),
		// 	numeric('length', 'be_u16'),
		// 	new StructField(ListOfAccessResult, 'loar'),
		// 	new EnumField(VaribaleAccessSpecificationChoice, 'vas')
		// ]),
	],
	// new BasicEnumChoice(
	// 	numeric('read_response_choice_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('read_response_choice_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(ReadResponseChoice)

const WriteResponseChoice = new StructEnum(
	'WriteResponseChoice',
	[
		new AnonymousStructVariant(0x00, 'WriteResponseChoiceFailure', [
			new StructField(DataAccessErrorConstruct, 'failure')
		]),
		new AnonymousStructVariant(0x01, 'WriteResponseChoiceSuccess', [
			// Success is NULL
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('write_response_choice_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('write_response_choice_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(WriteResponseChoice)

const ReadResponseChoiceConstruct = new Struct(
	'ReadResponseChoiceConstruct',
	[
		numeric('read_response_choice_tag', 'u8'),
		numeric('read_response_choice_length', 'be_u16'),
		new EnumField(ReadResponseChoice, 'read_response_choice')
	]
)
structs.push(ReadResponseChoiceConstruct)

const WriteResponseChoiceConstruct = new Struct(
	'WriteResponseChoiceConstruct',
	[
		numeric('write_response_choice_tag', 'u8'),
		numeric('write_response_choice_length', 'be_u16'),
		new EnumField(WriteResponseChoice, 'write_response_choice')
	]
)
structs.push(WriteResponseChoiceConstruct)

const GetNamedVariableListAttributesResponseChoice = new Struct(
	'GetNamedVariableListAttributesResponseChoice',
	[
		numeric('mms_deleteable_tag', 'u8'),
		numeric('mms_deleteable_length', 'be_u16'),
		new StructField(BoolResult, 'mms_deleteable'),
		numeric('list_of_variable_specification_tag', 'u8'),
		numeric('list_of_variable_specification_length', 'be_u16'),
		new StructField(ListOfVariableSpecification, 'list_of_variable_specification'),
	],
)
structs.push(GetNamedVariableListAttributesResponseChoice)

const InformationReportChoice = new Struct(
	'InformationReportChoice',
	[
		numeric('varibale_access_specification_choice_tag', 'u8'),
		numeric('varibale_access_specification_choice_length', 'be_u16'),
		new EnumField(VaribaleAccessSpecificationChoice, 'varibale_access_specification_choice'),
		numeric('list_of_access_result_tag', 'u8'),
		numeric('list_of_access_result_length', 'be_u16'),
		new StructField(ListOfAccessResult, 'list_of_access_result'),
	]
)
structs.push(InformationReportChoice)

const ReadRequestChoiceConstruct = new Struct(
	'ReadRequestChoiceStruct',
	[
		numeric('read_request_choice_tag', 'u8'),
		numeric('read_request_choice_length', 'be_u16'),
		new EnumField(ReadRequestChoice, 'read_request_choice')
	]
)
structs.push(ReadRequestChoiceConstruct)

const ConfirmedServiceRequestChoice = new StructEnum(
	'ConfirmedServiceRequestChoice',
	[
		new AnonymousStructVariant(0x00, 'GetNameListRequest', [
			new StructField(GetNameListRequestChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x02, 'IdentifyRequest', [
			new StructField(IdentifyRequestChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x04, 'ReadRequest', [
			new StructField(ReadRequestChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x05, 'WriteRequest', [
			new StructField(WriteRequestChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x0c, 'GetNamedVariableListAttributesRequest', [
			new StructField(GetNamedVariableListAttributesRequestChoiceConstruct, 'res')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('confirmed_service_request_choice_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('confirmed_service_request_choice_tag', 'u8'),
		'and',
		'0x1f'
	)
)

structs.push(ConfirmedServiceRequestChoice)

const ConfirmedServiceResponseChoice = new StructEnum(
	'ConfirmedServiceResponseChoice',
	[
		new AnonymousStructVariant(0x00, 'GetNameListResponse', [
			new StructField(GetNameListResponseChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x02, 'IdentifyResponse', [
			new StructField(IdentifyResponseChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x04, 'ReadResponse', [
			new StructField(ReadResponseChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x05, 'WriteResponse', [
			new StructField(WriteResponseChoiceConstruct, 'res')
		]),
		new AnonymousStructVariant(0x0c, 'GetNamedVariableListAttributesResponse', [
			new StructField(GetNamedVariableListAttributesResponseChoice, 'res')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('service_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('service_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(ConfirmedServiceResponseChoice)

const UnConfirmedChoice = new StructEnum(
	'UnConfirmedChoice',
	[
		new AnonymousStructVariant(0x00, 'InformationReport', [
			new StructField(InformationReportChoice, 'res')
		]),
		// new AnonymousStructVariant(0x01, 'IdentifyResponse', [
		// ]),
		// new AnonymousStructVariant(0x02, 'EventNotification', [
		// ]),
	],
	// new BasicEnumChoice(
	// 	numeric('service_tag.bitand(0x1f)', 'u8')
	// )
	new ArgsBitOperatorChoice(
		numeric('service_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(UnConfirmedChoice)

const ConfirmedServiceRequestChoiceConstruct = new Struct(
	'ConfirmedServiceRequestChoiceConstruct',
	[
		numeric('confirmed_service_request_choice_tag', 'u8'),
		numeric('confirmed_service_request_choice_length', 'be_u16'),
		new EnumField(ConfirmedServiceRequestChoice, 'confirmed_service_request_choice')
	]
)
structs.push(ConfirmedServiceRequestChoiceConstruct)

const ConfirmedRequestPDU = new Struct(
	'ConfirmedRequestPDU',
	[
		numeric('invoke_id_tag', 'u8'),
		numeric('invoke_id_length', 'be_u16'),
		new StructField(InvokeId, 'invoke_id'),

		numeric('service_tag', 'u8'),
		numeric('service_length', 'be_u16'),
		new StructField(ConfirmedServiceRequestChoiceConstruct, 'service'),
	]
)
structs.push(ConfirmedRequestPDU)

const ConfirmedResponsePDU = new Struct(
	'ConfirmedResponsePDU',
	[
		numeric('invoke_id_tag', 'u8'),
		numeric('invoke_id_length', 'be_u16'),
		numeric('invoke_id', 'u8'),
		numeric('service_tag', 'u8'),
		numeric('service_length', 'be_u16'),
		new EnumField(ConfirmedServiceResponseChoice, 'service'),
	]
)
structs.push(ConfirmedResponsePDU)

const UnConfirmedPDU = new Struct(
	'UnConfirmedPDU',
	[
		numeric('service_tag', 'u8'),
		numeric('service_length', 'be_u16'),
		new EnumField(UnConfirmedChoice, 'service'),
	]
)
structs.push(UnConfirmedPDU)

const InitiateRequestPDU = new Struct(
	'InitiateRequestPDU',
	[
		new StructField(SimpleItem, 'local_detail_calling'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_calling'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_called'),
		new StructField(SimpleItem, 'proposed_data_structure_nesting_level'),
		numeric('init_request_detail_tag', 'u8'),
		numeric('init_request_detail_length', 'be_u16'),
		new StructField(InitDetailRequest, 'init_request_detail'),
	]
)
structs.push(InitiateRequestPDU)

const InitiateResponsePDU = new Struct(
	'InitiateResponsePDU',
	[
		new StructField(SimpleItem, 'local_detail_called'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_calling'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_called'),
		new StructField(SimpleItem, 'proposed_data_structure_nesting_level'),
		numeric('init_response_detail_tag', 'u8'),
		numeric('init_response_detail_length', 'be_u16'),
		new StructField(InitDetailResponse, 'init_response_detail'),
	]
)
structs.push(InitiateResponsePDU)

const MmsPduChoice = new StructEnum(
	'MmsPduChoice',
	[
		new AnonymousStructVariant(0x00, 'ConfirmedRequest', [
			new StructField(ConfirmedRequestPDU, 'value')
		]),
		new AnonymousStructVariant(0x01, 'ConfirmedResponse', [
			new StructField(ConfirmedResponsePDU, 'value')
		]),
		new AnonymousStructVariant(0x02, 'UnConfirmed', [
			new StructField(UnConfirmedPDU, 'value')
		]),
		new AnonymousStructVariant(0x03, 'InitiateRequest', [
			new StructField(InitiateRequestPDU, 'value')
		]),
		new AnonymousStructVariant(0x04, 'InitiateResponse', [
			new StructField(InitiateResponsePDU, 'value')
		]),
	],
	// new BasicEnumChoice(
	// 	numeric('mms_pdu_choice_tag.bitand(0x1f)','u8'),
	// )
	new ArgsBitOperatorChoice(
		numeric('mms_pdu_choice_tag', 'u8'),
		'and',
		'0x1f'
	)
)
structs.push(MmsPduChoice)

const PDU = new Struct(
	'MmsPdu',
	[
		numeric('mms_pdu_choice_tag', 'u8'),
		numeric('mms_pdu_choice_length', 'be_u16'),
		new EnumField(MmsPduChoice, 'mms_pdu_choice')
	]
)
structs.push(PDU)

const header = new Struct(
	`${headerName}`,
	[
		new StructField(PDU),
	]
)

const info = new ProtocolInfo(protocolName, 'L5', header)

const payload = new EmptyPayloadEnum(
	`${payloadName}`,
	info
)

export const Mms = new Protocol({
	info,
	payload,
	structs
})