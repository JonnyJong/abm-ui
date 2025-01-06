import { run } from 'abm-utils/function';
import { IEventBaseCreateOptions, IEventBasic } from './api/base';
//#region Self-Host Events API

type Keys<List extends Record<string, any>> = keyof List & string;

export type EventsList<List extends Record<string, IEventBaseCreateOptions<Target>>, Target = any> = {
	[Type in Keys<List>]: IEventBaseCreateOptions<Target>;
};

export type EventHandler<Type extends string, Event extends IEventBaseCreateOptions<Target>, Target = any> = (
	event: Event & IEventBasic<Type>,
) => any;

export type EventSubscriptions<List extends EventsList<List>> = {
	[Type in Keys<List>]: Set<EventHandler<Type, List[Type]>>;
};

export interface IEventSource<List extends EventsList<List>> {
	on<Type extends Keys<List>>(type: Type, handler: EventHandler<Type, List[Type]>): void;
	off<Type extends Keys<List>>(type: Type, handler: EventHandler<Type, List[Type]>): void;
}

export class Events<List extends EventsList<List>, Types extends Keys<List> = Keys<List>>
	implements IEventSource<List>
{
	#subscriptions: EventSubscriptions<List> = {} as any;
	constructor(eventTypes: Types[]) {
		for (const type of eventTypes) {
			this.#subscriptions[type] = new Set();
		}
	}
	emit<Type extends Keys<List>>(event: List[Type] & IEventBasic<Type>) {
		for (const handler of this.#subscriptions[event.type] ?? []) {
			run(handler, event);
		}
	}
	on<Type extends Keys<List>>(type: Type, handler: EventHandler<Type, List[Type]>) {
		this.#subscriptions[type]?.add(handler);
	}
	off<Type extends Keys<List>>(type: Type, handler: EventHandler<Type, List[Type]>) {
		this.#subscriptions[type]?.delete(handler);
	}
}
