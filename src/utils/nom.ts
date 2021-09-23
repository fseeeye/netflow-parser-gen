import endent from "endent"

export enum NomBytesFunction {
	take = 'take',
	tag = 'tag',
}

export enum NomBitsFunction {
	// warning: must use with `use nom::bits::complete::take as take_bits;`
	take = 'take_bits'
}

export enum NomMultiFunction {
	count = 'count',
	bits = 'bits'
}

export enum NomNumberFunction {
	u8 = 'u8',
	be_u16 = 'be_u16',
	be_u32 = 'be_u32',
	be_u64 = 'be_u64',
	le_u16 = 'le_u16',
	le_u32 = 'le_u32',
	le_u64 = 'le_u64',
	be_u24 = 'be_u24',
	usize = 'usize',
}

export enum NomCombinatorFunction {
	eof = 'eof'
}

export function generateNomImport(): string {
	const allow = `#[allow(unused)]`
	const nom_imports = [
		'nom::bits::bits',
		'nom::bits::complete::take as take_bits',
		'nom::bytes::complete::{tag, take}',
		'nom::combinator::{eof, map, peek}',
		'nom::error::{ErrorKind, Error}',
		'nom::multi::count',
		'nom::number::complete::{be_u16, be_u24, be_u32, u8}',
		'nom::sequence::tuple',
		'nom::IResult',
	]

	const nom_imports_code = nom_imports.map(v => {
		return endent`${allow}
        use ${v};
        `
	}).join('\n')

	const crate_imports = [
		'crate::errors::ParseError',
		'crate::layer::{ApplicationLayer, LinkLayer, NetworkLayer, TransportLayer}',
		'crate::packet_level::{L1Packet, L2Packet, L3Packet, L4Packet, L5Packet}',
		'crate::packet_quin::{QuinPacket, QuinPacketOptions}',
		'crate::LayerType',
		'crate::field_type::*',
		'crate::layer_type::*',
	]

	const crate_imports_code = crate_imports.map(v => {
		return endent`${allow}
        use ${v};`
	}).join('\n')

	const std_imports = [
		'std::ops::BitAnd',
		'std::ops::BitOr',
		'std::ops::BitXor',

	]

	const std_imports_code = std_imports.map(v => {
		return endent`${allow}
        use ${v};`
	}).join('\n')

	return [nom_imports_code, crate_imports_code, std_imports_code].join('\n\n').concat('\n')
}