export const DEFAULT_ATTRIBUTES = [`Debug`, `PartialEq`]

export function generateAttributesCode(attributes: string[] = DEFAULT_ATTRIBUTES) {
    return `#[derive(${attributes.join(', ')})]`
}

export function removeDuplicateByKey<Key, T>(array: T[], getKey: (item: T) => Key): T[] {
    const keys = array.map(item => getKey(item))
    const uniqueItems = array.filter((item, index) => {
        const key = getKey(item)
        return keys.includes(key, index + 1) === false
    })
    return uniqueItems
}