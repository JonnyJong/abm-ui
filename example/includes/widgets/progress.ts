import { WidgetNumber, WidgetProgressBar, WidgetProgressRing } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetProgress() {
	$panel(
		'progress-bar',
		UI.$new<WidgetProgressBar>('w-progress-bar'),
		[
			{
				type: 'number',
				key: 'value',
				default: NaN,
				min: 0,
				max: 100,
			},
			{
				type: 'color',
				key: 'color',
			},
		],
		[],
	);
	const ring = UI.$new<WidgetProgressRing>('w-progress-ring');
	const propPanel = $panel(
		'progress-ring',
		ring,
		[
			{
				type: 'number',
				key: 'value',
				default: NaN,
			},
			{
				type: 'number',
				key: 'thickness',
			},
			{
				type: 'color',
				key: 'color',
			},
		],
		[],
	).children[1].children[0];
	const input = UI.$new<WidgetNumber>('w-number', { prop: { value: 64, min: 0, default: 1 } });
	propPanel.append(UI.$div('Size'), input);
	input.on('input', () => {
		ring.style.setProperty('--w-progress-ring-size', `${input.value}px`);
	});
	input.on('confirm', () => {
		ring.style.setProperty('--w-progress-ring-size', `${input.value}px`);
	});
}
