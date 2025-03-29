export interface DataItem {
	id: number;
	text: string;
	value: string;
}

export interface State {
	isOpen: boolean | null;
	selectedItem: DataItem | null;
}

type Key = keyof State;

export type Subscriber<K extends Key> = (data: State[K]) => void;

type Subscribers = {
	[K in Key]?: Subscriber<K>[];
};

export class ComboboxState {
	readonly #state: State;
	#subscribers: Subscribers = {};

	constructor(initialState: State) {
		this.#state = new Proxy(initialState, {
			set: <K extends Key>(target: State, prop: K, value: State[K]) => {
				if (prop in target) {
					if (target[prop] === value) {
						return true;
					}

					const result = Reflect.set(target, prop, value);
					this.#notify(prop, value);
					return result;
				}

				return false;
			}
		});
	}

	get<K extends Key>(key: K) {
		return this.#state[key];
	}

	set<K extends Key>(key: K, value: State[K]) {
		this.#state[key] = value;
	}

	subscribe<K extends Key>(key: K, callback: Subscriber<K>) {
		this.#subscribers[key] ??= [];
		this.#subscribers[key]?.push(callback);
	}

	#notify<K extends Key>(key: K, value: State[K]) {
		this.#subscribers[key]?.forEach(cb => cb(value));
	}
}
