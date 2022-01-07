import {
	createNumericFieldSimple as numeric,
	createBytesReferenceFieldSimple as bytesRef,
	createCountVar,
} from "../../api/input"
import { BasicEnumChoice, StructBitOperatorChoice, InputLengthChoice, InlineChoice, StructChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { BerTLField } from "../../field/ber-tl"
import { StructField, StructMemberField } from "../../field/struct"
import { LimitedLenVecLoopField } from "../../field/vec"
import { AnonymousStructVariant, StructEnum, EmptyPayloadEnum, EmptyVariant } from "../../types/enum"
import { Struct } from "../../types/struct"
import { ProtocolInfo } from "../protocol-info"
import { Protocol } from "../protocol"
import { BlankStructField, CodeField } from "../../field/special"
import endent from "endent"
import { Field } from "../../field/base"

const protocolName = 'Mms'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct | StructEnum)[] = []

const SimpleItem = new Struct(
	'SimpleItem',
	[
		new BlankStructField(new BerTLField('simple_item_tl')),
		bytesRef('data', createCountVar('_simple_item_tl.length'))
	]
)
structs.push(SimpleItem)

const SimpleU8Data = new Struct(
	'SimpleU8Data',
	[
		new BlankStructField(new BerTLField('simple_u8_item_tl')),
		numeric('data', 'u8')
	]
)
structs.push(SimpleU8Data)

//OsiProtocolStack

const OsiSesConnectAcceptItem = new Struct(
	'OsiSesConnectAcceptItem',
	[
		numeric('connect_accept_item_parameter_type', 'u8'),
		numeric('connect_accept_item_parameter_length', 'u8'),
		numeric('porocol_parameter_type', 'u8'),
		numeric('porocol_parameter_length', 'u8'),
		numeric('porocol_flag', 'u8'),
		numeric('version_number_parameter_type', 'u8'),
		numeric('version_number_parameter_length', 'u8'),
		numeric('version_number_parameter_flag', 'u8'),
	]
)
structs.push(OsiSesConnectAcceptItem)

const OsiSesSessionRequirement = new Struct(
	'OsiSesSessionRequirement',
	[
		numeric('session_requirement_parameter_type', 'u8'),
		numeric('session_requirement_parameter_length', 'u8'),
		numeric('session_requirement_flag', 'be_u16'),
	]
)
structs.push(OsiSesSessionRequirement)

const OsiSesCallingSessionSelector = new Struct(
	'OsiSesCallingSessionSelector',
	[
		numeric('calling_session_selector_parameter_type', 'u8'),
		numeric('calling_session_selector_parameter_length', 'u8'),
		numeric('calling_session_selector_value', 'be_u16'),
	]
)
structs.push(OsiSesCallingSessionSelector)

const OsiSesCalledSessionSelector = new Struct(
	'OsiSesCalledSessionSelector',
	[
		numeric('called_session_selector_parameter_type', 'u8'),
		numeric('called_session_selector_parameter_length', 'u8'),
		numeric('called_session_selector_value', 'be_u16'),
	]
)
structs.push(OsiSesCalledSessionSelector)

const OsiSesSessionUserData = new Struct(
	'OsiSesSessionUserData',
	[
		numeric('session_user_data_parameter_type', 'u8'),
		numeric('session_user_data_parameter_length', 'u8'),
	]
)
structs.push(OsiSesSessionUserData)

const OsiSesConnectRequest = new Struct(
	'OsiSesConnectRequest',
	[
		new StructField(OsiSesConnectAcceptItem, 'connect_accept_item'),
		new StructField(OsiSesSessionRequirement, 'session_requirement'),
		new StructField(OsiSesCallingSessionSelector, 'calling_session_selector'),
		new StructField(OsiSesCalledSessionSelector, 'called_session_selector'),
		new StructField(OsiSesSessionUserData, 'session_user_data'),
	]
)
structs.push(OsiSesConnectRequest)

const OsiPresUserData = new Struct(
	'OsiPresUserData',
	[
		new BlankStructField(new BerTLField('fullt_encode_data_tl')),
		new StructField(SimpleU8Data, 'presentation_context_indentifier'),
		new BlankStructField(new BerTLField('presentation_context_values_tl')),
	]
)
structs.push(OsiPresUserData)

const NormalModeParametersCpWithProtocolVersion = new Struct(
	'NormalModeParametersCpWithProtocolVersion',
	[
		new StructField(SimpleItem, 'protocol_version'),
		new StructField(SimpleItem, 'calling_presentation_selector'),
		new StructField(SimpleItem, 'called_presentation_selector'),
		new StructField(SimpleItem, 'presentation_context_definition_list'),
		new StructField(SimpleItem, 'presentation_requirements'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(NormalModeParametersCpWithProtocolVersion)

const NormalModeParametersCpaWithProtocolVersion = new Struct(
	'NormalModeParametersCpaWithProtocolVersion',
	[
		new StructField(SimpleItem, 'protocol_version'),
		new StructField(SimpleItem, 'responding_presentation_selector'),
		new StructField(SimpleItem, 'presentation_context_definition_result_list'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(NormalModeParametersCpaWithProtocolVersion)

const OsiPresPduNormalModeParametersCp = new Struct(
	'OsiPresPduNormalModeParametersCp',
	[
		new StructField(SimpleItem, 'calling_presentation_selector'),
		new StructField(SimpleItem, 'called_presentation_selector'),
		new StructField(SimpleItem, 'presentation_context_definition_list'),
		new StructField(SimpleItem, 'presentation_requirements'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(OsiPresPduNormalModeParametersCp)

const OsiPresPduNormalModeParametersCpa = new Struct(
	'OsiPresPduNormalModeParametersCpa',
	[
		new StructField(SimpleItem, 'responding_presentation_selector'),
		new StructField(SimpleItem, 'presentation_context_definition_result_list'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(OsiPresPduNormalModeParametersCpa)

const OsiPresPduNormalModeParametersCpChoice = new StructEnum(
	'OsiPresPduNormalModeParametersCpChoice',
	[
		new AnonymousStructVariant(0x80, 'NormalModeParametersCpWithProtocolVersionChoice',
			[
				new StructField(NormalModeParametersCpWithProtocolVersion),
			]
		),
		new AnonymousStructVariant('_', 'NormalModeParametersCpChoice',
			[
				new StructField(OsiPresPduNormalModeParametersCp)
			]
		)
	],
	new InlineChoice(
		numeric('_tag', 'u8')
	)
)
structs.push(OsiPresPduNormalModeParametersCpChoice)

const OsiPresPduNormalModeParametersCpaChoice = new StructEnum(
	'OsiPresPduNormalModeParametersCpaChoice',
	[
		new AnonymousStructVariant(0x80, 'NormalModeParametersCpaWithProtocolVersionChoice',
			[
				new StructField(NormalModeParametersCpaWithProtocolVersion),
			]
		),
		new AnonymousStructVariant('_', 'NormalModeParametersCpaChoice',
			[
				new StructField(OsiPresPduNormalModeParametersCpa)
			])
	],
	new InlineChoice(
		numeric('_tag', 'u8')
	)
)
structs.push(OsiPresPduNormalModeParametersCpaChoice)

const OsiPresCp = new Struct(
	'OsiPresCp',
	[
		new BlankStructField(new BerTLField('pres_tl')),
		new BlankStructField(new BerTLField('pres_cp_tl')),
		new StructField(SimpleItem, 'pres_cp_mode_selector'),
		new BlankStructField(new BerTLField('normal_mode_parameters_tl')),
		new EnumField(OsiPresPduNormalModeParametersCpChoice, 'normal_mode_parameters')
	]
)
structs.push(OsiPresCp)

const OsiPresCpa = new Struct(
	'OsiPresCpa',
	[
		new BlankStructField(new BerTLField('pres_tl')),
		new BlankStructField(new BerTLField('pres_cpa_tl')),
		new StructField(SimpleItem, 'pres_cp_mode_selector'),
		new BlankStructField(new BerTLField('normal_mode_parameters_tl')),
		new EnumField(OsiPresPduNormalModeParametersCpaChoice, 'normal_mode_parameters')
	]
)
structs.push(OsiPresCpa)

const OsiAcseAarq = new Struct(
	'OsiAcseAarq',
	[
		new BlankStructField(new BerTLField('acse_aarq_tl')),
		new StructField(SimpleItem, 'protocol_version'),
		new StructField(SimpleItem, 'aso_context_name'),
		new StructField(SimpleItem, 'called_ap_title'),
		new StructField(SimpleItem, 'called_ae_qualifier'),
		new CodeField(endent`
			let (_, _tag) = peek(u8)(input)?;
			let mut input = input;
			if _tag.bitand(0xf0) == 0xa0 {
				// parse calling ap title / calling ae qulifier
				(input, ..) = parse_simple_item(input)?;
				(input, ..) = parse_simple_item(input)?;
			}
		`),
		new BlankStructField(new BerTLField('user_information_tl')),
		new BlankStructField(new BerTLField('association_data_tl')),
		new StructField(SimpleItem, 'direct_ref'),
		new StructField(SimpleItem, 'indirect_ref'),
		new BlankStructField(new BerTLField('encoding_tl')),
	]
)
structs.push(OsiAcseAarq)

const OsiAcseAare = new Struct(
	'OsiAcseAare',
	[
		new BlankStructField(new BerTLField('acse_aare_tl')),
		new StructField(SimpleItem, 'protocol_version'),
		new StructField(SimpleItem, 'aso_context_name'),
		new StructField(SimpleItem, 'result'),
		new StructField(SimpleItem, 'result_source_diagnostic'),
		new StructField(SimpleItem, 'responsding_ap_title'),
		new StructField(SimpleItem, 'responsding_ae_qualifier'),
		new StructField(SimpleItem, 'user_information'),
	]
)
structs.push(OsiAcseAare)

const OsiSesChoice = new StructEnum(
	'OsiSesChoice',
	[
		new AnonymousStructVariant(0x0d, 'Request', [
			new StructField(OsiSesConnectRequest, 'connect_accept'),
			new StructField(OsiPresCp, 'pres_cp'),
			new StructField(OsiAcseAarq, 'acse'),
		]),
		new AnonymousStructVariant(0x0e, 'Response', [
			new StructField(OsiSesConnectRequest, 'accept'),
			new StructField(OsiPresCpa, 'pres_cpa'),
			new StructField(OsiAcseAare, 'acse'),
		]),
		new AnonymousStructVariant(0x01, 'GiveTokens', [
			numeric('ses2_type', 'u8'),
			numeric('ses2_len', 'u8'),
			// numeric('pres_cpa_tag', 'u8'),
			// numeric('pres_cpa_length', 'be_u16'),
			new BlankStructField(new BerTLField('pres_cpa_tl')),
			new StructField(OsiPresUserData, 'pres_cpa'),
		]),
	],
	new BasicEnumChoice(
		numeric('ses_type', 'u8')
	)
)
structs.push(OsiSesChoice)

const OsiProtocolStack = new Struct(
	'OsiProtocolStack',
	[
		numeric('ses_type', 'u8'),
		numeric('ses_len', 'u8'),
		new EnumField(OsiSesChoice, 'ses')
	]
)
structs.push(OsiProtocolStack)

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
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('object_class_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(ObjectClass)

const ObjectScope = new StructEnum(
	'ObjectScope',
	[
		new AnonymousStructVariant(0x00, 'ObjectScopeVmd', [
			bytesRef('object_scope_vmd', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x01, 'ObjectScopeDomain', [
			bytesRef('object_scope_domain_id', createCountVar('input.len()')),
			bytesRef('object_scope_item_id', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x02, 'ObjectScopeAaSpecific', [
			bytesRef('object_scope_aa_specific', createCountVar('input.len()'))
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('object_scope_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(ObjectScope)

const ObjectName = new StructEnum(
	'ObjectName',
	[
		new AnonymousStructVariant(0x00, 'ObjectNameVmd', [
			bytesRef('object_name_vmd', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x01, 'ObjectNameDomain', [
			bytesRef('object_name_domain_id', createCountVar('input.len()')),
			bytesRef('object_name_item_id', createCountVar('input.len()'))
		]),
		new AnonymousStructVariant(0x02, 'ObjectNameAaSpecific', [
			bytesRef('object_name_aa_specific', createCountVar('input.len()'))
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('object_name_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(ObjectName)

const ObjectNameStruct = 
	[
		// numeric('object_name_tag', 'u8'),
		// numeric('object_name_length', 'be_u16'),
		new BlankStructField(new BerTLField('object_name_tl')),
		new EnumField(ObjectName, 'object_name')
	]

const VariableSpecification = new StructEnum(
	'VariableSpecification',
	[
		new AnonymousStructVariant(0x00, 'Name', ObjectNameStruct),
		new AnonymousStructVariant(0x01, 'Others', [
			// numeric('tag', 'u8'),
			// numeric('length', 'be_u16'),
			new BlankStructField(new BerTLField('variable_specification_tl')),
			bytesRef('value', createCountVar('_variable_specification_tl.length'))
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('variable_specification_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(VariableSpecification)

const VariableSpecificationStruct = new Struct(
	'VariableSpecificationStruct',
	[
		// numeric('variable_specification_tag', 'u8'),
		// numeric('variable_specification_length', 'be_u16'),
		new BlankStructField(new BerTLField('variable_specification_tl')),
		new EnumField(VariableSpecification, 'variable_specification')
	]
)
structs.push(VariableSpecificationStruct)

const ListOfVariableSpecification = new Struct(
	'ListOfVariableSpecification',
	[
		// numeric('tag', 'u8'),
		// numeric('length', 'be_u16'),
		new BlankStructField(new BerTLField('lovs_tl')),
		new LimitedLenVecLoopField('lovs', createCountVar('_lovs_tl.length'), new StructField(VariableSpecificationStruct))
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
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('data_access_error_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(DataAccessError)

const DataAccessErrorConstruct = 
	[
		new BlankStructField(new BerTLField('data_access_error_tl')),
		new EnumField(DataAccessError, 'data_access_error')
	]

const AccessResult = new StructEnum(
	'AccessResult',
	[
		new AnonymousStructVariant(0x00, 'AccessResultFailure', DataAccessErrorConstruct),
		new AnonymousStructVariant(0x01, 'AccessResultSuccess', [
			new StructField(SimpleItem, 'data')
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('access_result_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(AccessResult)

const AccessResultStruct = new Struct(
	'AccessResultStruct',
	[
		new BlankStructField(new BerTLField('access_result_tl')),
		new EnumField(AccessResult, 'access_result')
	]
)
structs.push(AccessResultStruct)

const ListOfAccessResult = new Struct(
	'ListOfAccessResult',
	[
		new BlankStructField(new BerTLField('loar_tl')),
		new LimitedLenVecLoopField('loar', createCountVar('_loar_tl.length'), new StructField(AccessResultStruct))
	]
)
structs.push(ListOfAccessResult)

const ListOfIdentifier = new Struct(
	'ListOfIdentifier',
	[
		new BlankStructField(new BerTLField('loar_tl')),
		new LimitedLenVecLoopField('loar', createCountVar('_loar_tl.length'), bytesRef('indentifier', createCountVar('input.len()')))
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

const VariableAccessSpecificationChoice = new StructEnum(
	'VariableAccessSpecificationChoice',
	[
		new AnonymousStructVariant(0x00, 'ListOfVariable', [
			new StructField(ListOfVariableSpecification, 'res')
		]),
		new AnonymousStructVariant(0x01, 'VaribaleListName', ObjectNameStruct),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('variable_access_specification_choice_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
	// new NumericBitOperatorChoice(
	// 	numeric('variable_access_specification_choice_tl.tag', 'u8'),
	// 	'and',
	// 	'0x1f'
	// )
)
structs.push(VariableAccessSpecificationChoice)

const VariableAccessSpecificationChoiceFields = 
	[
		new BlankStructField(new BerTLField('variable_access_specification_choice_tl')),
		new EnumField(VariableAccessSpecificationChoice, 'variable_access_specification_choice')
	]

const ReadRequestChoice = new StructEnum(
	'ReadRequestChoice',
	[
		new AnonymousStructVariant(0x81, 'ReadRequestChoiceDefault', VariableAccessSpecificationChoiceFields),
		new AnonymousStructVariant(0x80, 'ReadRequestChoiceOtherwise', (<Field[]>[
			numeric('specification_with_result', 'u8'),
			new BlankStructField(new BerTLField('variable_access_specification_choice_struct_tl')),
		]).concat(VariableAccessSpecificationChoiceFields)),
	],
	new StructChoice(
		new BlankStructField(new BerTLField('read_request_choice_tl')), 
		'tag'
	)
)
structs.push(ReadRequestChoice)

const ReadResponseChoice = new StructEnum(
	'ReadResponseChoice',
	[
		new AnonymousStructVariant(0x00, 'ReadResponseChoiceNone', [
		]),
		new AnonymousStructVariant('_', 'ReadResponseChoiceWithData', [
			new BlankStructField(new BerTLField('list_of_access_result_tl')),
			new StructField(ListOfAccessResult, 'list_of_access_result')
		]),
	],
	new InputLengthChoice()
)
structs.push(ReadResponseChoice)

const WriteResponseChoice = new StructEnum(
	'WriteResponseChoice',
	[
		new AnonymousStructVariant(0x00, 'WriteResponseChoiceFailure', DataAccessErrorConstruct),
		new EmptyVariant(0x01, 'WriteResponseChoiceSuccess'),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('write_response_choice_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(WriteResponseChoice)

const ConfirmedServiceRequestChoice = new StructEnum(
	'ConfirmedServiceRequestChoice',
	[
		new AnonymousStructVariant(0x00, 'GetNameListRequest', [
			new BlankStructField(new BerTLField('object_class_tl')),
			new EnumField(ObjectClass, 'object_class'),
			new BlankStructField(new BerTLField('object_scope_tl')),
			new EnumField(ObjectScope, 'object_scope'),
		]),
		new EmptyVariant(0x02, 'IdentifyRequest'),
		new AnonymousStructVariant(0x04, 'ReadRequest', [
			new BlankStructField(new BerTLField('read_request_choice_tl')),
			new EnumField(ReadRequestChoice, 'read_request_choice')
		]),
		new AnonymousStructVariant(0x05, 'WriteRequest', [
			new BlankStructField(new BerTLField('variable_access_specification_choice_tl')),
			new EnumField(VariableAccessSpecificationChoice, 'variable_access_specification_choice'),
			new BlankStructField(new BerTLField('list_of_data_tl')),
			new BlankStructField(new BerTLField('lod_tl')),
			new LimitedLenVecLoopField('lod', createCountVar('_lod_tl.length'), new StructField(SimpleItem))
		]),
		new AnonymousStructVariant(0x0c, 'GetNamedVariableListAttributesRequest', [
			new BlankStructField(new BerTLField('object_name_tl')),
			new EnumField(ObjectName, 'object_name')
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('service_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)

structs.push(ConfirmedServiceRequestChoice)

const ConfirmedServiceResponseChoice = new StructEnum(
	'ConfirmedServiceResponseChoice',
	[
		new AnonymousStructVariant(0x00, 'GetNameListResponse', [
			new BlankStructField(new BerTLField('list_of_identifier_tl')),
			new StructField(ListOfIdentifier, 'list_of_identifier'),
			new BlankStructField(new BerTLField('more_follows_tl')),
			numeric('more_follows', 'u8'),
		]),
		new AnonymousStructVariant(0x02, 'IdentifyResponse', [
			new BlankStructField(new BerTLField('vendor_name_tl')),
			new StructField(SimpleItem, 'vendor_name'),
			new BlankStructField(new BerTLField('model_name_tl')),
			new StructField(SimpleItem, 'model_name'),
			new BlankStructField(new BerTLField('revision_tl')),
			new StructField(SimpleItem, 'revision'),
		]),
		new AnonymousStructVariant(0x04, 'ReadResponse', [
			new BlankStructField(new BerTLField('read_response_choice_tl')),
			new EnumField(ReadResponseChoice, 'read_response_choice')
		]),
		new AnonymousStructVariant(0x05, 'WriteResponse', [
			new BlankStructField(new BerTLField('write_response_choice_tl')),
			new EnumField(WriteResponseChoice, 'write_response_choice')
		]),
		new AnonymousStructVariant(0x0c, 'GetNamedVariableListAttributesResponse', [
			new BlankStructField(new BerTLField('mms_deleteable_tl')),
			numeric('mms_deleteable', 'u8'),
			new BlankStructField(new BerTLField('list_of_variable_specification_tl')),
			new StructField(ListOfVariableSpecification, 'list_of_variable_specification')
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('service_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(ConfirmedServiceResponseChoice)

const ConfirmedServiceResponseStruct = new StructEnum(
	'ConfirmedServiceResponseStruct',
	[
		new AnonymousStructVariant(0x00, 'ConfirmedServiceResponseStructNone', [
		]),
		new AnonymousStructVariant('_', 'ConfirmedServiceResponseStructWithData', [
			new BlankStructField(new BerTLField('service_tl')),
			new EnumField(ConfirmedServiceResponseChoice, 'service')
		]),
	],
	new InputLengthChoice()
)
structs.push(ConfirmedServiceResponseStruct)

const UnConfirmedChoice = new StructEnum(
	'UnConfirmedChoice',
	[
		new AnonymousStructVariant(0x00, 'InformationReport', [
			new BlankStructField(new BerTLField('variable_access_specification_choice_tl')),
			new EnumField(VariableAccessSpecificationChoice, 'variable_access_specification_choice'),
			new BlankStructField(new BerTLField('list_of_access_result_tl')),
			new StructField(ListOfAccessResult, 'list_of_access_result'),
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('service_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(UnConfirmedChoice)

const ConfirmedRequestPDU = 
	[
		new BlankStructField(new BerTLField('invoke_id_tl')),
		new StructField(InvokeId, 'invoke_id'),
		new BlankStructField(new BerTLField('service_tl')),
		new EnumField(ConfirmedServiceRequestChoice, 'service'),
	]

const ConfirmedResponsePDU = 
	[
		new BlankStructField(new BerTLField('invoke_id_tl')),
		new StructField(InvokeId, 'invoke_id'),
		new EnumField(ConfirmedServiceResponseStruct, 'service'),
	]

const UnConfirmedPDU = 
	[
		new BlankStructField(new BerTLField('service_tl')),
		new EnumField(UnConfirmedChoice, 'service'),
	]

const InitiateRequestPDU = 
	[
		new StructField(SimpleItem, 'local_detail_calling'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_calling'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_called'),
		new StructField(SimpleItem, 'proposed_data_structure_nesting_level'),
		new BlankStructField(new BerTLField('init_request_detail_tl')),
		new StructField(InitDetailRequest, 'init_request_detail'),
	]

const InitiateResponsePDU = 
	[
		new StructField(SimpleItem, 'local_detail_called'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_calling'),
		new StructField(SimpleItem, 'proposed_max_serv_outstanding_called'),
		new StructField(SimpleItem, 'proposed_data_structure_nesting_level'),
		new BlankStructField(new BerTLField('init_response_detail_tl')),
		new StructField(InitDetailResponse, 'init_response_detail'),
	]

const MmsPduChoice = new StructEnum(
	'MmsPduChoice',
	[
		new AnonymousStructVariant(0x00, 'ConfirmedRequest', ConfirmedRequestPDU),
		new AnonymousStructVariant(0x01, 'ConfirmedResponse', ConfirmedResponsePDU),
		new AnonymousStructVariant(0x03, 'UnConfirmed', UnConfirmedPDU),
		new AnonymousStructVariant(0x08, 'InitiateRequest', InitiateRequestPDU),
		new AnonymousStructVariant(0x09, 'InitiateResponse', InitiateResponsePDU),
		new EmptyVariant(0x0b, 'ConcludeRequest'),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('mms_pdu_choice_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(MmsPduChoice)

const PDU = new Struct(
	'MmsPdu',
	[
		new BlankStructField(new BerTLField('mms_pdu_choice_tl')),
		new EnumField(MmsPduChoice, 'mms_pdu_choice')
	]
)
structs.push(PDU)

const header = new Struct(
	`${headerName}`,
	[
		new StructField(OsiProtocolStack),
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