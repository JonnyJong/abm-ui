import { WidgetSelect } from '../../../dist';
import { UI, numberToChinese } from '../../base';
import { $panel } from './base';

export function widgetSelect() {
	const select = UI.$new<WidgetSelect>('w-select');
	select.options = UI.range(120).map((i) => {
		return {
			value: i,
			label: numberToChinese(i),
		};
	});
	$panel(
		'select',
		select,
		[
			{
				type: 'boolean',
				key: 'disabled',
			},
		],
		['change'],
	);
}
