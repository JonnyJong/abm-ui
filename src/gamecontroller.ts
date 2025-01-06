import { Vector2 } from 'abm-utils/vector';
import { EventBase, IEventBaseCreateOptions } from 'event/api/base';
import { EventValue, IEventValueCreateOptions } from 'event/api/value';
import { EventVector, IEventVectorCreateOptions } from 'event/api/vector';
import { EventHandler, Events, IEventSource } from 'event/events';
import { AnimationFrameController } from 'utils/timer';

export interface GameControllerRumbleOptions {
	type: GamepadHapticEffectType;
	leftTrigger?: number;
	rightTrigger?: number;
	strongMagnitude?: number;
	weakMagnitude?: number;
}

type GamepadButtons = [
	A: boolean,
	B: boolean,
	X: boolean,
	Y: boolean,
	LB: boolean,
	RB: boolean,
	LT: number,
	RT: number,
	Back: boolean,
	Start: boolean,
	LSB: boolean,
	RSB: boolean,
	Up: boolean,
	Down: boolean,
	Left: boolean,
	Right: boolean,
	Home: boolean,
];

export interface GameControllerEvents {
	a: IEventValueCreateOptions<GameController, boolean>;
	b: IEventValueCreateOptions<GameController, boolean>;
	x: IEventValueCreateOptions<GameController, boolean>;
	y: IEventValueCreateOptions<GameController, boolean>;
	lb: IEventValueCreateOptions<GameController, boolean>;
	rb: IEventValueCreateOptions<GameController, boolean>;
	lt: IEventValueCreateOptions<GameController, number>;
	rt: IEventValueCreateOptions<GameController, number>;
	back: IEventValueCreateOptions<GameController, boolean>;
	start: IEventValueCreateOptions<GameController, boolean>;
	lsb: IEventValueCreateOptions<GameController, boolean>;
	rsb: IEventValueCreateOptions<GameController, boolean>;
	up: IEventValueCreateOptions<GameController, boolean>;
	down: IEventValueCreateOptions<GameController, boolean>;
	left: IEventValueCreateOptions<GameController, boolean>;
	right: IEventValueCreateOptions<GameController, boolean>;
	home: IEventValueCreateOptions<GameController, boolean>;
	ls: IEventVectorCreateOptions<GameController>;
	rs: IEventVectorCreateOptions<GameController>;
	arrow: IEventBaseCreateOptions<GameController>;
	connectivity: IEventValueCreateOptions<GameController, boolean>;
}

const BUTTONS = [
	'a',
	'b',
	'x',
	'y',
	'lb',
	'rb',
	'lt',
	'rt',
	'back',
	'start',
	'lsb',
	'rsb',
	'up',
	'down',
	'left',
	'right',
	'home',
];
const EVENTS_TYPES = [...BUTTONS, 'ls', 'rs', 'arrow', 'connectivity'] as (keyof GameControllerEvents)[];

const insideValidate = Symbol();
const gameControllerInstances: GameController[] = [];

export class GameController implements IEventSource<GameControllerEvents> {
	static getInstance(index: number) {
		if (index < 0 || index > 3) throw new RangeError('Index must be between 0 and 3');
		if (gameControllerInstances[index]) return gameControllerInstances[index];
		const controller = new GameController(index, insideValidate);
		gameControllerInstances[index] = controller;
		return controller;
	}
	#events = new Events<GameControllerEvents>(EVENTS_TYPES);
	#index: number;
	#timer = new AnimationFrameController(this.#gamepadCycle.bind(this));
	#buttons: GamepadButtons = [
		false,
		false,
		false,
		false,
		false,
		false,
		0,
		0,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
	];
	#ls = new Vector2();
	#rs = new Vector2();
	#vibrationType: GamepadHapticEffectType = 'dual-rumble';
	#leftTrigger?: number;
	#rightTrigger?: number;
	#strongMagnitude?: number;
	#weakMagnitude?: number;
	#vibrating = false;
	#connecting = false;
	private constructor(index: number, validate?: symbol) {
		if (validate !== insideValidate) throw new Error('Cannot instantiate GameController');
		this.#index = index;
		if (navigator.getGamepads()[this.#index]) {
			this.#timer.start();
			this.#updateConnectivity(true);
		}
		addEventListener('gamepadconnected', this.#gamepadconnectedHandler);
		addEventListener('gamepaddisconnected', this.#gamepaddisconnectedHandler);
	}
	#updateConnectivity(connecting: boolean) {
		this.#connecting = connecting;
		this.#events.emit(
			new EventValue('connectivity', {
				target: this,
				value: connecting,
			}),
		);
	}
	get connecting() {
		return this.#connecting;
	}
	#gamepadconnectedHandler = ({ gamepad }: GamepadEvent) => {
		if (gamepad.index !== this.#index) return;
		this.#timer.start();
		this.#updateConnectivity(true);
	};
	#gamepaddisconnectedHandler = ({ gamepad }: GamepadEvent) => {
		if (gamepad.index !== this.#index) return;
		this.#timer.stop();
		this.#vibrating = false;
		this.#updateConnectivity(false);
	};
	on<Type extends keyof GameControllerEvents>(
		type: Type,
		handler: EventHandler<Type, GameControllerEvents[Type], any>,
	): void {
		this.#events.on(type, handler);
	}
	off<Type extends keyof GameControllerEvents>(
		type: Type,
		handler: EventHandler<Type, GameControllerEvents[Type], any>,
	): void {
		this.#events.off(type, handler);
	}
	get a() {
		return this.#buttons[0];
	}
	get b() {
		return this.#buttons[1];
	}
	get x() {
		return this.#buttons[2];
	}
	get y() {
		return this.#buttons[3];
	}
	get lb() {
		return this.#buttons[4];
	}
	get rb() {
		return this.#buttons[5];
	}
	get lt() {
		return this.#buttons[6];
	}
	get rt() {
		return this.#buttons[7];
	}
	get back() {
		return this.#buttons[8];
	}
	get start() {
		return this.#buttons[9];
	}
	get lsb() {
		return this.#buttons[10];
	}
	get rsb() {
		return this.#buttons[11];
	}
	get up() {
		return this.#buttons[12];
	}
	get down() {
		return this.#buttons[13];
	}
	get left() {
		return this.#buttons[14];
	}
	get right() {
		return this.#buttons[15];
	}
	get home() {
		return this.#buttons[16];
	}
	get ls(): Vector2 {
		return this.#ls.clone();
	}
	get rs(): Vector2 {
		return this.#rs.clone();
	}
	get vibrating() {
		return this.#vibrating;
	}
	rumble({ type, leftTrigger, rightTrigger, strongMagnitude, weakMagnitude }: GameControllerRumbleOptions) {
		this.#vibrationType = type;
		this.#leftTrigger = leftTrigger;
		this.#rightTrigger = rightTrigger;
		this.#strongMagnitude = strongMagnitude;
		this.#weakMagnitude = weakMagnitude;
		this.#vibrating = true;
	}
	stopRumble() {
		this.#vibrating = false;
		navigator.getGamepads()[this.#index]?.vibrationActuator.reset();
	}
	rumbleOnce(
		type: GamepadHapticEffectType,
		params?: GamepadEffectParameters,
	): Promise<GamepadHapticsResult> | undefined {
		return navigator.getGamepads()[this.#index]?.vibrationActuator.playEffect(type, params);
	}
	#gamepadCycle() {
		const gamepad = navigator.getGamepads()[this.#index];
		if (!gamepad) return;
		let arrow = false;

		const buttons = gamepad.buttons.map((button, i) => {
			if (['lt', 'rt'].includes(BUTTONS[i])) return button.value;
			return button.pressed;
		}) as GamepadButtons;

		buttons.forEach((value, i) => {
			if (this.#buttons[i] === value) return;
			this.#buttons[i] = value;
			const event = new EventValue(BUTTONS[i], {
				target: this,
				value,
			});
			this.#events.emit(event as any);
			if (['up', 'right', 'down', 'left'].includes(BUTTONS[i])) arrow = true;
		});

		if (arrow) {
			this.#events.emit(new EventBase('arrow', { target: this }));
		}

		const { axes } = gamepad;
		const ls = new Vector2(axes[0], axes[1]);
		ls.length = Math.min(ls.length, 1);
		const rs = new Vector2(axes[2], axes[3]);
		rs.length = Math.min(rs.length, 1);
		if (!this.#ls.equals(ls)) {
			this.#ls = ls;
			this.#events.emit(
				new EventVector('ls', {
					target: this,
					x: this.#ls.x,
					y: this.#ls.y,
				}),
			);
		}
		if (!this.#rs.equals(rs)) {
			this.#rs = rs;
			this.#events.emit(
				new EventVector('rs', {
					target: this,
					x: this.#rs.x,
					y: this.#rs.y,
				}),
			);
		}

		if (!this.#vibrating) return;
		gamepad.vibrationActuator.playEffect(this.#vibrationType, {
			startDelay: 0,
			duration: 200,
			leftTrigger: this.#leftTrigger,
			rightTrigger: this.#rightTrigger,
			strongMagnitude: this.#strongMagnitude,
			weakMagnitude: this.#weakMagnitude,
		});
	}
	// TODO: 摇杆、扳机死区
}
