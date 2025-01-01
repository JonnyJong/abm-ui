import { EventBase, IEventBase, IEventBaseCreateOptions } from './base';

export interface IEventKeyCreateOptions<Target = any, Key extends string = string>
	extends IEventBaseCreateOptions<Target> {
	key: Key;
}

export interface IEventKey<Type extends string = string, Target = any, Key extends string = string>
	extends IEventBase<Type, Target> {
	readonly key: Key;
}

export class EventKey<Type extends string = string, Target = any, Key extends string = string>
	extends EventBase<Type, Target>
	implements IEventKey<Type, Target, Key>
{
	#key: Key;
	constructor(type: Type, options: IEventKeyCreateOptions<Target, Key>) {
		super(type, options);
		this.#key = options.key;
	}
	get key() {
		return this.#key;
	}
}
