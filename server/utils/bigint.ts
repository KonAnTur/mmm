export function bigIntReplacer (_key: string, value: unknown) {
    return typeof value === 'bigint' ? value.toString() : value
}