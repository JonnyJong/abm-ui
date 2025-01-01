import { EventBase, IEventBase, IEventBaseCreateOptions } from './base';

export interface IEventCustomCreateOptions<Target = any, Details = any> extends IEventBaseCreateOptions<Target> {
	details: Details;
}

export interface IEventCustom<Type extends string = string, Target = any, Details = any>
	extends IEventBase<Type, Target> {
	readonly details: Details;
}

export class EventCustom<Type extends string = string, Target = any, Details = any>
	extends EventBase<Type, Target>
	implements IEventCustom<Type, Target, Details>
{
	#details: Details;
	constructor(type: Type, options: IEventCustomCreateOptions<Target, Details>) {
		super(type, options);
		this.#details = options.details;
	}
	get details() {
		return this.#details;
	}
}
