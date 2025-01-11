// Global
export * from './configs';

// Utils
export * from './utils/dom';
export * from './utils/timer';

// Event
export * from './event';
// Self-Host Events API
export * from './event/events';
export * from './event/api/base';
export * from './event/api/custom';
export * from './event/api/key';
export * from './event/api/vector';
export * from './event/api/value';
// Provided Event API
export * from './event/ui/base';

// Control
export * from './keyboard';
export * from './gamecontroller';
export * from './navigate';

// Components
export * from './components/content';
export * from './components/tooltips';
export * from './components/dialog';
export * from './components/message';
export * from './components/color-picker';
// Widgets
export * from './components/widgets/lang';
export * from './components/widgets/icon';
export * from './components/widgets/btn';
export * from './components/widgets/input';
export * from './components/widgets/switch';
export * from './components/widgets/select';
export * from './components/widgets/progress';
export * from './components/widgets/checkbox';
export * from './components/widgets/slider';
export * from './components/widgets/nav';
export * from './components/widgets/color';
export * from './components/widgets/list';

// HACK: prevent default menu behavier
window.addEventListener('contextmenu', (ev) => ev.preventDefault());
