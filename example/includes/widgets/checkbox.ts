import { WidgetCheckbox } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetCheckbox() {
	$panel(
		'checkbox',
		UI.$new<WidgetCheckbox>('w-checkbox', 'Hello world'),
		[
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'checked',
			},
		],
		['change'],
	);
}
