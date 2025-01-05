import { WidgetColor } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetColor() {
	$panel(
		'color',
		UI.$new<WidgetColor>('w-color'),
		[
			{
				type: 'boolean',
				key: 'readOnly',
			},
			{
				type: 'boolean',
				key: 'alpha',
			},
			{
				type: 'color',
				key: 'value',
			},
		],
		['change'],
	);
}
