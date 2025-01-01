import { wrapInRange } from './math';

export type Arrayable<T> = T | T[];

export function toArray<T>(value: Arrayable<T>): T[] {
	if (Array.isArray(value)) return value;
	return [value];
}

export function insertAt<T>(array: T[], index: number, value: T): T[] {
	index = wrapInRange(index, array.length + 1);
	return array.splice(index, 0, value);
}

export function equalsSet(a: Set<any>, b: Set<any>): boolean {
	const pool = new Set([...a]);
	for (const i of b) {
		if (!pool.delete(i)) return false;
	}
	return pool.size === 0;
}
