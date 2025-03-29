export interface DataItem {
	id: number;
	text: string;
	value: string;
}

export interface State {
	isOpen: boolean;
	selectedItem: DataItem | null;
}

type Key = keyof State;

export type Subscriber<K extends Key> = (data: State[K]) => void;

export class ComboboxState {
	readonly #state: State;
	#subscribers = new Map<Key, Subscriber<any>[]>();

	constructor(initialState: State) {
		this.#state = new Proxy(initialState, {
			set: <K extends Key>(target: State, prop: K, value: State[K]) => {
				if (!(prop in target)) return false; // Гарантируем, что ключ существует
				if (target[prop] === value) return true;

				const result = Reflect.set(target, prop, value);
				this.#notify(prop, value);
				return result;
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
		if (!this.#subscribers.has(key)) {
			this.#subscribers.set(key, []);
		}
		this.#subscribers.get(key)?.push(callback);
	}

	#notify<K extends Key>(key: K, value: State[K]) {
		this.#subscribers.get(key)?.forEach(cb => cb(value))
	}
}
