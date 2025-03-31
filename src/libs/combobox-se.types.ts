import type { DataItem } from './combobox-state.types';
import type { ComboboxSE } from './combobox-se';

export interface DefaultDataEvents {
	sender: ComboboxSE;
}

export interface PublicEvents {
	open: DefaultDataEvents & { isOpen: boolean };
	close: DefaultDataEvents & { isOpen: boolean };
	change: DefaultDataEvents & { dataItem: DataItem}
}

export type EventKey = keyof PublicEvents;

export type ComboboxSubscriber<K extends EventKey> = (data: PublicEvents[K]) => void;

export type Subscribers = {
	[K in EventKey]?: ComboboxSubscriber<K>[];
}

export type Selector = HTMLInputElement | string;

export interface Options {
	dataItems: DataItem[];
	wrapperClass?: string;
	inputClass?: string;
	inputWrapperClass?: string;
	triggerClass?: string;
	dropdownClass?: string;
	dropdownVisibleClass?: string;
	listClass?: string;
	itemClass?: string;
	selectedItemClass?: string;
	placeholder?: string;
	emptyPlaceholder?: string;
	emptyItemClass?: string;
	onInit?: (props: { sender: ComboboxSE, input: HTMLInputElement }) => void;
}
