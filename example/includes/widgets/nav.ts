import { WidgetNav } from '../../../dist';
import { UI } from '../../base';
import { $panel } from './base';

export function widgetNav() {
	$panel(
		'nav',
		UI.$new<WidgetNav>('w-nav', {
			prop: {
				items: [
					{ id: 'home', content: { icon: 'Home', text: 'Home' } },
					{ id: 'mail', content: { icon: 'Mail', text: 'Mail' } },
					{ id: 'video', content: { icon: 'Video', text: 'Video' } },
				],
				endItems: [{ id: 'settings', content: { icon: 'Settings', text: 'Settings' } }],
			},
			style: { height: '100%' },
		}),
		[
			{
				type: 'enum',
				key: 'display',
				options: ['all', 'icon', 'text'],
			},
			{
				type: 'boolean',
				key: 'disabled',
			},
			{
				type: 'boolean',
				key: 'vertical',
			},
		],
		['change'],
	);
}
