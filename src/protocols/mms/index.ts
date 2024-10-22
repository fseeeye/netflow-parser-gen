import {
	createNumericFieldSimple as numeric,
	createBytesReferenceFieldSimple as bytesRef,
	createCountVar,
} from "../../api/input"
import { BasicEnumChoice, StructBitOperatorChoice, InlineChoice, StructChoice, EnumMultiChoice, InputLengthChoice } from "../../field/choice"
import { EnumField } from "../../field/enum"
import { BerTLField, BerVField } from "../../field/ber-tlv"
import { StructField, StructMemberField } from "../../field/struct"
import { LimitedLenVecLoopField } from "../../field/vec"
import { AnonymousStructVariant, StructEnum, EmptyPayloadEnum, EmptyVariant, IfStructEnum } from "../../types/enum"
import { Struct } from "../../types/struct"
import { ProtocolInfo } from "../protocol-info"
import { Protocol } from "../protocol"
import { BlankStructField, CodeField, CodeVarField } from "../../field/special"
import endent from "endent"
import { Field } from "../../field/base"

const protocolName = 'Mms'
const headerName = `${protocolName}Header`
const payloadName = `${protocolName}Payload`

const structs: (Struct | StructEnum)[] = []

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

const OsiSesConnectResponse = new Struct(
	'OsiSesConnectResponse',
	[
		new StructField(OsiSesConnectAcceptItem, 'connect_accept_item'),
		new StructField(OsiSesSessionRequirement, 'session_requirement'),
		new StructField(OsiSesSessionUserData, 'session_user_data'),
	]
)
structs.push(OsiSesConnectResponse)

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
		new BerVField('protocol_version'),
		new BerVField('calling_presentation_selector'),
		new BerVField('called_presentation_selector'),
		new BerVField('presentation_context_definition_list'),
		new BerVField('presentation_requirements'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(NormalModeParametersCpWithProtocolVersion)

const NormalModeParametersCpaWithProtocolVersion = new Struct(
	'NormalModeParametersCpaWithProtocolVersion',
	[
		new BerVField('protocol_version'),
		new BerVField('responding_presentation_selector'),
		new BerVField('presentation_context_definition_result_list'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(NormalModeParametersCpaWithProtocolVersion)

const OsiPresPduNormalModeParametersCp = new Struct(
	'OsiPresPduNormalModeParametersCp',
	[
		new BerVField('calling_presentation_selector'),
		new BerVField('called_presentation_selector'),
		new BerVField('presentation_context_definition_list'),
		new BerVField('presentation_requirements'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(OsiPresPduNormalModeParametersCp)

const OsiPresPduNormalModeParametersCpa = new Struct(
	'OsiPresPduNormalModeParametersCpa',
	[
		new BerVField('responding_presentation_selector'),
		new BerVField('presentation_context_definition_result_list'),
		new BlankStructField(new BerTLField('user_data_tl')),
		new StructField(OsiPresUserData, 'user_data')
	]
)
structs.push(OsiPresPduNormalModeParametersCpa)

const OsiPresPduNormalModeParametersCpEnum = new StructEnum(
	'OsiPresPduNormalModeParametersCpEnum',
	[
		new AnonymousStructVariant(0x80, 'WithProtocolVersion',
			[
				new StructField(NormalModeParametersCpWithProtocolVersion),
			]
		),
		new AnonymousStructVariant('_', 'WithoutProtocolVersion',
			[
				new StructField(OsiPresPduNormalModeParametersCp)
			]
		)
	],
	new InlineChoice(
		numeric('_tag', 'u8')
	)
)
structs.push(OsiPresPduNormalModeParametersCpEnum)

const OsiPresPduNormalModeParametersCpaEnum = new StructEnum(
	'OsiPresPduNormalModeParametersCpaEnum',
	[
		new AnonymousStructVariant(0x80, 'WithProtocolVersion',
			[
				new StructField(NormalModeParametersCpaWithProtocolVersion),
			]
		),
		new AnonymousStructVariant('_', 'WithoutProtocolVersion',
			[
				new StructField(OsiPresPduNormalModeParametersCpa)
			])
	],
	new InlineChoice(
		numeric('_tag', 'u8')
	)
)
structs.push(OsiPresPduNormalModeParametersCpaEnum)

const OsiPresCp = new Struct(
	'OsiPresCp',
	[
		new BlankStructField(new BerTLField('pres_tl')),
		new BlankStructField(new BerTLField('pres_cp_tl')),
		new BerVField('pres_cp_mode_selector'),
		new BlankStructField(new BerTLField('normal_mode_parameters_tl')),
		new EnumField(OsiPresPduNormalModeParametersCpEnum, 'normal_mode_parameters')
	]
)
structs.push(OsiPresCp)

const OsiPresCpa = new Struct(
	'OsiPresCpa',
	[
		new BlankStructField(new BerTLField('pres_tl')),
		new BlankStructField(new BerTLField('pres_cpa_tl')),
		new BerVField('pres_cp_mode_selector'),
		new BlankStructField(new BerTLField('normal_mode_parameters_tl')),
		new EnumField(OsiPresPduNormalModeParametersCpaEnum, 'normal_mode_parameters')
	]
)
structs.push(OsiPresCpa)

const OsiAcseAarq = new Struct(
	'OsiAcseAarq',
	[
		new BlankStructField(new BerTLField('acse_aarq_tl')),
		new BerVField('protocol_version'),
		new BerVField('aso_context_name'),
		new BerVField('called_ap_title'),
		new BerVField('called_ae_qualifier'),
		new CodeField(endent`
			// parse optional "calling ap title" & "calling ae qulifier"
			let (_, _tag) = peek(u8)(input)?;
			let mut input = input;
			if _tag.bitand(0xf0) == 0xa0 {
				(input, ..) = ber_tl_v(input)?; // calling_ap_title
				(input, ..) = ber_tl_v(input)?; // calling_ae_qulifier
			}
		`),
		/* user information - request */
		new BlankStructField(new BerTLField('user_information_tl')),
		new BlankStructField(new BerTLField('association_data_tl')),
		new BerVField('direct_ref'),
		new BerVField('indirect_ref'),
		new BlankStructField(new BerTLField('encoding_tl')),
	]
)
structs.push(OsiAcseAarq)

const OsiAcseAare = new Struct(
	'OsiAcseAare',
	[
		new BlankStructField(new BerTLField('acse_aare_tl')),
		new BerVField('protocol_version'),
		new BerVField('aso_context_name'),
		new BerVField('result'),
		new BerVField('result_source_diagnostic'),
		new BerVField('responsding_ap_title'),
		new BerVField('responsding_ae_qualifier'),
		/* user information - response */
		new BlankStructField(new BerTLField('user_information_tl')),
		new BlankStructField(new BerTLField('association_data_tl')),
		new BerVField('indirect_ref'),
		new BlankStructField(new BerTLField('encoding_tl')),
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
			new StructField(OsiSesConnectResponse, 'accept'),
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
			new BerVField('named_variable'),
		]),
		new AnonymousStructVariant(0x01, 'ScatteredAccess', [
			new BerVField('scattered_access'),
		]),
		new AnonymousStructVariant(0x02, 'NamedVariableList', [
			new BerVField('named_variable_list'),
		]),
		new AnonymousStructVariant(0x03, 'NamedType', [
			new BerVField('named_type'),
		]),
		new AnonymousStructVariant(0x04, 'Semaphore', [
			new BerVField('semaphore'),
		]),
		new AnonymousStructVariant(0x05, 'EventCondition', [
			new BerVField('event_condition'),
		]),
		new AnonymousStructVariant(0x06, 'EventAction', [
			new BerVField('event_action'),
		]),
		new AnonymousStructVariant(0x07, 'EventEnrollment', [
			new BerVField('event_enrollment'),
		]),
		new AnonymousStructVariant(0x08, 'Journal', [
			new BerVField('journal'),
		]),
		new AnonymousStructVariant(0x09, 'Domain', [
			new BerVField('domain'),
		]),
		new AnonymousStructVariant(0x0a, 'ProgramInvocation', [
			new BerVField('program_invocation'),
		]),
		new AnonymousStructVariant(0x0b, 'OperatorStation', [
			new BerVField('operator_station'),
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
		new EnumField(ObjectName)
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
		new EnumField(DataAccessError)
	]

const AccessResult = new StructEnum(
	'AccessResult',
	[
		new AnonymousStructVariant(0x00, 'AccessResultFailure', DataAccessErrorConstruct),
		new AnonymousStructVariant(0x01, 'AccessResultSuccess', [
			new BerVField('data')
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
		new EnumField(AccessResult)
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
		new BerVField('proposed_version_number'),
		new BerVField('proposed_parameter_cbb'),
		new BerVField('service_supported_calling'),
	]
)
structs.push(InitDetailRequest)

const InitDetailResponse = new Struct(
	'InitDetailResponse',
	[
		new BerVField('proposed_version_number'),
		new BerVField('proposed_parameter_cbb'),
		new BerVField('service_supported_called'),
	]
)
structs.push(InitDetailResponse)

const VariableAccessSpecificationEnum = new StructEnum(
	'VariableAccessSpecificationEnum',
	[
		new AnonymousStructVariant(0x00, 'ListOfVariable', [
			new StructField(ListOfVariableSpecification, 'res')
		]),
		new AnonymousStructVariant(0x01, 'VaribaleListName', ObjectNameStruct),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('variable_access_specification_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
	// new NumericBitOperatorChoice(
	// 	numeric('variable_access_specification_choice_tl.tag', 'u8'),
	// 	'and',
	// 	'0x1f'
	// )
)
structs.push(VariableAccessSpecificationEnum)

const VariableAccessSpecificationFields = 
	[
		new BlankStructField(new BerTLField('variable_access_specification_tl')),
		new EnumField(VariableAccessSpecificationEnum)
	]

const ReadRequestEnum = new StructEnum(
	'ReadRequestEnum',
	[
		new AnonymousStructVariant(0x01, 'Default', VariableAccessSpecificationFields),
		new AnonymousStructVariant(0x00, 'Otherwise', (<Field[]>[
			numeric('specification_with_result', 'u8'),
			new BlankStructField(new BerTLField('variable_access_specification_choice_struct_tl')),
		]).concat(VariableAccessSpecificationFields)),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('read_request_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(ReadRequestEnum)

// const ReadResponseChoice = new StructEnum(
// 	'ReadResponseChoice',
// 	[
// 		new AnonymousStructVariant(0x00, 'None', [
// 		]),
// 		new AnonymousStructVariant('_', 'WithData', [
// 			new BlankStructField(new BerTLField('list_of_access_result_tl')),
// 			new StructField(ListOfAccessResult, 'list_of_access_result')
// 		]),
// 	],
// 	new InputLengthChoice()
// )
// structs.push(ReadResponseChoice)

const WriteResponseEnum = new StructEnum(
	'WriteResponseEnum',
	[
		new AnonymousStructVariant(0x00, 'WriteResponseChoiceFailure', DataAccessErrorConstruct),
		new EmptyVariant(0x01, 'WriteResponseChoiceSuccess'),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('write_response_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(WriteResponseEnum)

const ConfirmedServiceRequestEnum = new StructEnum(
	'ConfirmedServiceRequestEnum',
	[
		new AnonymousStructVariant(0x00, 'GetNameListRequest', [
			new BlankStructField(new BerTLField('object_class_tl')),
			new EnumField(ObjectClass),
			new BlankStructField(new BerTLField('object_scope_tl')),
			new EnumField(ObjectScope),
		]),
		new EmptyVariant(0x02, 'IdentifyRequest'),
		new AnonymousStructVariant(0x04, 'ReadRequest', [
			new BlankStructField(new BerTLField('read_request_tl')),
			new EnumField(ReadRequestEnum)
		]),
		new AnonymousStructVariant(0x05, 'WriteRequest', [
			new BlankStructField(new BerTLField('variable_access_specification_tl')),
			new EnumField(VariableAccessSpecificationEnum),
			new BlankStructField(new BerTLField('list_of_data_tl')),
			new BlankStructField(new BerTLField('lod_tl')),
			new LimitedLenVecLoopField('lod', createCountVar('_lod_tl.length'), new BerVField('tmp'))
		]),
		new AnonymousStructVariant(0x0c, 'GetNamedVariableListAttributesRequest', [
			new BlankStructField(new BerTLField('object_name_tl')),
			new EnumField(ObjectName)
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('service_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(ConfirmedServiceRequestEnum)

const ConfirmedServiceResponseEnum = new StructEnum(
	'ConfirmedServiceResponseEnum',
	[
		new AnonymousStructVariant(0x00, 'GetNameListResponse', [
			new BlankStructField(new BerTLField('list_of_identifier_tl')),
			new StructField(ListOfIdentifier, 'list_of_identifier'),
			new BlankStructField(new BerTLField('more_follows_tl')),
			numeric('more_follows', 'u8'),
		]),
		new AnonymousStructVariant(0x02, 'IdentifyResponse', [
			new BerVField('vendor_name'),
			new BerVField('model_name'),
			new BerVField('revision'),
		]),
		new AnonymousStructVariant(0x04, 'ReadResponse', [
			new BlankStructField(new BerTLField('read_response_tl')),
			new CodeField(endent`
			if _read_response_tl.length == 0 {
				return Ok((
					input,
					ConfirmedServiceResponseEnum::ReadResponse {
						list_of_access_result: vec![]
					},
				))
			}
			`),
			new BlankStructField(new BerTLField('list_of_access_result_tl')),
			new LimitedLenVecLoopField('list_of_access_result', createCountVar('_list_of_access_result_tl.length'), new StructField(AccessResultStruct))
		]),
		new AnonymousStructVariant(0x05, 'WriteResponse', [
			new BlankStructField(new BerTLField('write_response_tl')),
			new EnumField(WriteResponseEnum)
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
structs.push(ConfirmedServiceResponseEnum)

const ConfirmedServiceResponse = new StructEnum(
	'ConfirmedServiceResponse',
	[
		new AnonymousStructVariant(0x00, 'None', [
		]),
		new AnonymousStructVariant('_', 'WithData', [
			new BlankStructField(new BerTLField('service_tl')),
			new EnumField(ConfirmedServiceResponseEnum, 'service')
		]),
	],
	new InputLengthChoice()
)
structs.push(ConfirmedServiceResponse)

const UnConfirmedEnum = new StructEnum(
	'UnConfirmedEnum',
	[
		new AnonymousStructVariant(0x00, 'InformationReport', [
			new BlankStructField(new BerTLField('variable_access_specification_tl')),
			new EnumField(VariableAccessSpecificationEnum),
			new BlankStructField(new BerTLField('list_of_access_result_tl')),
			new LimitedLenVecLoopField('list_of_access_result', createCountVar('_list_of_access_result_tl.length'), new StructField(AccessResultStruct))
		]),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('service_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	)
)
structs.push(UnConfirmedEnum)

const ConfirmedBasicPDU: Field[] = 
	[
		new BlankStructField(new BerTLField('invoke_id_tl')),
		new CodeField(endent`
			let invoke_id: u16;
			let _invoke_id_u8: u8;
			let mut input = input;
			if _invoke_id_tl.length == 1 {
				(input, _invoke_id_u8) = u8(input)?;
				invoke_id = _invoke_id_u8 as u16;
			} else if _invoke_id_tl.length == 2 {
				(input, invoke_id) = be_u16(input)?;
			} else {
				return Err(nom::Err::Error(nom::error::Error::new(
					input,
					nom::error::ErrorKind::Verify,
				)));
			}
		`),
		new CodeVarField(numeric('invoke_id', 'be_u16')),
	]

const ConfirmedRequestPDU = 
	ConfirmedBasicPDU
	.concat(
		[
			new BlankStructField(new BerTLField('service_tl')),
			new EnumField(ConfirmedServiceRequestEnum, 'service'),
		]
	)

const ConfirmedResponsePDU = 
	ConfirmedBasicPDU
	.concat(
		[
			new EnumField(ConfirmedServiceResponse, 'service'),
		]
	)

const UnConfirmedPDU = 
	[
		new BlankStructField(new BerTLField('service_tl')),
		new EnumField(UnConfirmedEnum, 'service'),
	]

const InitiateRequestPDU = 
	[
		new BerVField('local_detail_calling'),
		new BerVField('proposed_max_serv_outstanding_calling'),
		new BerVField('proposed_max_serv_outstanding_called'),
		new BerVField('proposed_data_structure_nesting_level'),
		new BlankStructField(new BerTLField('init_request_detail_tl')),
		new StructField(InitDetailRequest, 'init_request_detail'),
	]

const InitiateResponsePDU = 
	[
		new BerVField('local_detail_called'),
		new BerVField('proposed_max_serv_outstanding_calling'),
		new BerVField('proposed_max_serv_outstanding_called'),
		new BerVField('proposed_data_structure_nesting_level'),
		new BlankStructField(new BerTLField('init_response_detail_tl')),
		new StructField(InitDetailResponse, 'init_response_detail'),
	]

const MmsPduEnum = new StructEnum(
	'MmsPduEnum',
	[
		new AnonymousStructVariant(0x00, 'ConfirmedRequestPDU', ConfirmedRequestPDU),
		new AnonymousStructVariant(0x01, 'ConfirmedResponsePDU', ConfirmedResponsePDU),
		new AnonymousStructVariant(0x03, 'UnConfirmedPDU', UnConfirmedPDU),
		new AnonymousStructVariant(0x08, 'InitiateRequestPDU', InitiateRequestPDU),
		new AnonymousStructVariant(0x09, 'InitiateResponsePDU', InitiateResponsePDU),
		new EmptyVariant(0x0b, 'ConcludeRequest'),
	],
	new StructBitOperatorChoice(
		new StructMemberField(new BlankStructField(new BerTLField('mms_pdu_tl')), numeric('tag', 'u8')),
		'and',
		'0x1f'
	),
)
structs.push(MmsPduEnum)

const PDU = new Struct(
	'MmsPdu',
	[
		new BlankStructField(new BerTLField('mms_pdu_tl')),
		new EnumField(MmsPduEnum)
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