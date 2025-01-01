export function clamp(min: number, target: number, max: number) {
	if (min > max) [min, max] = [max, min];
	return Math.max(min, Math.min(target, max));
}

export function range(to: number): number[];
export function range(from: number, to: number): number[];
export function range(from: number, to: number, step: number): number[];
export function range(arg0: number, to?: number, step?: number): number[] {
	let from = arg0;
	if (to === undefined) {
		to = arg0;
		from = 0;
	}
	if (step === undefined) {
		step = from < to ? 1 : -1;
	}
	const result: number[] = [];
	for (let i = from; from < to ? i < to : i > to; i += step) {
		result.push(i);
	}
	return result;
}

export function wrapInRange(target: number, max: number, min = 0): number {
	const range = max - min;
	const wrappedValue = ((((target - min) % range) + range) % range) + min;
	return wrappedValue;
}

export function genFitter(from: number, to: number, step = 0) {
	if (typeof from !== 'number' || isNaN(from)) throw new Error('Invalid from value');
	if (typeof to !== 'number' || isNaN(to)) throw new Error('Invalid to value');
	if (typeof step !== 'number' || isNaN(step)) step = 0;
	if (step < 0) step = -step;
	if (from > to) [from, to] = [to, from];

	if (step === 0) {
		return function fit(value: number): number {
			if (typeof value !== 'number' || isNaN(value)) return NaN;
			return clamp(from, value, to);
		};
	}

	if (from === -Infinity) {
		return function fit(value: number): number {
			if (typeof value !== 'number' || isNaN(value)) return NaN;
			return clamp(from, value, to);
		};
	}

	const range = to - from;
	if (step >= to - from) {
		const middle = from + range / 2;
		return function fit(value: number): number {
			if (typeof value !== 'number' || isNaN(value)) return NaN;
			value = clamp(from, value, to);
			if (value >= middle) return to;
			return from;
		};
	}

	return function fit(value: number): number {
		if (typeof value !== 'number' || isNaN(value)) return NaN;
		value = clamp(from, value, to);
		if (value === from || value === to) return value;

		const stepsCount = Math.round((value - from) / step);
		const fittedValue = from + stepsCount * step;

		return clamp(from, fittedValue, to);
	};
}
