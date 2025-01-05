import { WidgetSlider } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetSlider() {
	$panel(
		'slider',
		UI.$new<WidgetSlider>('w-slider'),
		[
			{
				type: 'number',
				key: 'from',
			},
			{
				type: 'number',
				key: 'to',
			},
			{
				type: 'number',
				key: 'step',
			},
			{
				type: 'number',
				key: 'value',
			},
			{
				type: 'boolean',
				key: 'disabled',
			},
		],
		['change', 'input'],
	);
}
