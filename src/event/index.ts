import { UIEventActiveManager } from './ui/active';
import { UIEventHoverManager } from './ui/hover';
import { UIEventSlideManager } from './ui/slide';

//#region Provided Event API
class ProvidedEvents {
	#hover = new UIEventHoverManager();
	#active = new UIEventActiveManager();
	#slide = new UIEventSlideManager();
	get hover() {
		return this.#hover;
	}
	get active() {
		return this.#active;
	}
	get slide() {
		return this.#slide;
	}
}

export const events = new ProvidedEvents();

export { UIEventHover, UIEventHoverHandler } from './ui/hover';
export { UIEventActive, UIEventActiveHandler } from './ui/active';
export { UIEventSlide, UIEventSlideHandler, UIEventSlideState } from './ui/slide';
