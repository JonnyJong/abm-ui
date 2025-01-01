import { EventBase, IEventBase, IEventBaseCreateOptions } from './base';

export interface IEventVectorCreateOptions<Target = any> extends IEventBaseCreateOptions<Target> {
	x: number;
	y: number;
}

export interface IEventVector<Type extends string = string, Target = any> extends IEventBase<Type, Target> {
	readonly x: number;
	readonly y: number;
}

export class EventVector<Type extends string = string, Target = any>
	extends EventBase<Type, Target>
	implements IEventVector<Type, Target>
{
	#x: number;
	#y: number;
	constructor(type: Type, options: IEventVectorCreateOptions<Target>) {
		super(type, options);
		this.#x = options.x;
		this.#y = options.y;
	}
	get x() {
		return this.#x;
	}
	get y() {
		return this.#y;
	}
}
