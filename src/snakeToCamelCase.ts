export type ObjectOrArray =
	| { [key: string]: unknown }
	| { [key: string]: unknown }[]

export function snakeToCamelCase(obj: ObjectOrArray): ObjectOrArray {
	if (typeof obj !== `object` || obj === null) {
		return obj
	}

	if (Array.isArray(obj)) {
		return obj.map((i) => snakeToCamelCase(i)) as ObjectOrArray
	}

	return Object.keys(obj).reduce(
		(result: { [key: string]: ObjectOrArray }, key: string) => {
			const newKey = stringSnakeToCamel(key)
			result[newKey] = snakeToCamelCase(obj[key] as ObjectOrArray)
			return result
		},
		{}
	)
}

function stringSnakeToCamel(str: string) {
	return str.replace(/([-_][a-z])/g, (group) =>
		group.toUpperCase().replace(`-`, ``).replace(`_`, ``)
	)
}
