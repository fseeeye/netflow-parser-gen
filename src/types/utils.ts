export const DEFAULT_ATTRIBUTES = [`Debug`, `PartialEq`]

export function generateAttributesCode(attributes: string[] = DEFAULT_ATTRIBUTES) {
    return `#[derive(${attributes.join(',')})]`
}
