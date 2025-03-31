export interface DataItem {
	id: number;
	text: string;
	value: string;
}

export interface State {
	isOpen: boolean | null;
	selectedItem: DataItem | null;
}

export type Key = keyof State;

export type Subscriber<K extends Key> = (data: State[K]) => void;

export type Subscribers = {
	[K in Key]?: Subscriber<K>[];
};
