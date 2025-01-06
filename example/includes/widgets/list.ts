import { WidgetBtn, WidgetList } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

class SimpleListItem extends UI.WidgetListItem<number> {
	#data = 0;
	get data() {
		return this.#data;
	}
	set data(value: number) {
		this.#data = value;
		this.textContent = this.#data.toString();
	}
	equals(data: number): boolean {
		return data === this.#data;
	}
	static create(data: number): SimpleListItem {
		return UI.$new<SimpleListItem>('dev-list-item', { prop: { data } });
	}
	_prop?: { data?: number };
}
customElements.define('dev-list-item', SimpleListItem);

function genItems(): number[] {
	const items: number[] = [];
	for (const i of UI.range(20)) {
		if (Math.random() > 0.5) items.push(i);
	}
	return UI.shuffle(items);
}

export function widgetList() {
	const list = UI.$new<WidgetList<number>>('w-list', {
		prop: {
			itemClass: SimpleListItem,
			items: genItems(),
		},
	});
	const refresh = UI.$new<WidgetBtn>('w-btn', 'Refresh');
	const shuffleBtn = UI.$new<WidgetBtn>('w-btn', 'Shuffle');
	refresh.on('active', () => {
		list.items = genItems();
	});
	shuffleBtn.on('active', () => {
		list.items = UI.shuffle(list.items);
	});
	$panel(
		'list',
		list,
		[
			{ type: 'boolean', key: 'sortable' },
			{
				type: 'enum',
				key: 'selectType',
				options: [null, 'single', 'multi'],
			},
		],
		['sort', 'select'],
	).children[1].append(
		UI.$new('h6', UI.$new('w-lang', 'dev.ops')),
		UI.$div({ attr: { 'ui-layout': 'flow' } }, refresh, shuffleBtn),
	);
}
