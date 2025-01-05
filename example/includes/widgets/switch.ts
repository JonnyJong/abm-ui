import { WidgetSwitch } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetSwitch() {
	$panel(
		'switch',
		UI.$new<WidgetSwitch>('w-switch'),
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
