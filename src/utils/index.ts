import endent from "endent"

export const DEFAULT_ATTRIBUTES = ['Debug', 'PartialEq', 'Eq', 'Clone']
export const DEFAULT_ALLOW_ATTRIBUTES = ['non_camel_case_types']

export function generateAttributesCode(attributes: string[] = DEFAULT_ATTRIBUTES): string {
    return `#[derive(${attributes.join(', ')})]`
}

export function generateSerdeAttributesCode(attributes: string[]): string {
    return `#[serde(${attributes.join(', ')})]`
}

export function generateSerdeImports(modName: string): string {
    return endent`
        use crate::parsers::${modName};

        use serde::{Serialize, Deserialize};
    `
}

export function generateAllowAttributesCode(attributes: string[] = DEFAULT_ALLOW_ATTRIBUTES): string {
    return attributes.map(att => `#[allow(${att})]`).join('\n')
}

export function removeDuplicateByKey<Key, T>(array: T[], getKey: (item: T) => Key): T[] {
    const keys = array.map(item => getKey(item))
    const uniqueItems = array.filter((item, index) => {
        const key = getKey(item)
        return keys.includes(key, index + 1) === false
    })
    return uniqueItems
}