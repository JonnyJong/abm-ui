export function run<T extends any[], R = any>(fn: (...args: T) => R | Promise<R>, ...args: T): Promise<R | Error>;
export function run(fn: Function, ...args: any): Promise<any>;
export function run(...args: any): any;
export function run(fn: any, ...args: any): Promise<any> {
	return new Promise((resolve) => {
		try {
			resolve(fn(...args));
		} catch (error) {
			let err: Error;
			if (error instanceof Error) {
				err = error;
			} else {
				err = new Error('Failed attempt to execute function', {
					cause: error,
				});
			}
			resolve(err);
		}
	});
}

export function runSync<T extends any[], R = any>(fn: (...args: T) => R | Promise<R>, ...args: T): R | Error;
export function runSync(fn: Function, ...args: any): any;
export function runSync(...args: any): any;
export function runSync(fn: any, ...args: any): any {
	try {
		return fn(...args);
	} catch (error) {
		return error;
	}
}
