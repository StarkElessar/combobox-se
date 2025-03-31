import chevronIcon from '../assets/chevron.svg';
import { ComboboxState } from './combobox-state';
import type { State, DataItem, Subscriber } from './combobox-state.types';
import type { Options, Subscribers, Selector, ComboboxSubscriber, EventKey, PublicEvents } from './combobox-se.types';
import { DEFAULT_OPTIONS } from './default-options';

const INITIAL_STATE: State = {
	isOpen: null,
	selectedItem: null
};

export class ComboboxSE {
	readonly #options: Required<Options>;
	readonly #input: HTMLInputElement | null;
	readonly #wrapper = document.createElement('span');
	readonly #inputWrapper = document.createElement('span');
	readonly #triggerButton = document.createElement('button');
	readonly #dropdown = document.createElement('div');
	readonly #list = document.createElement('ul');
	readonly #state: ComboboxState;
	#subscribers: Subscribers = {};
	static #instances = new Map<string, ComboboxSE>();

	static get(id: string): ComboboxSE | null {
		return ComboboxSE.#instances.get(id) ?? null;
	}

	constructor(selector: Selector, options: Options) {
		this.#input = selector instanceof HTMLInputElement ? selector : document.querySelector(selector);

		if (!this.#input) {
			throw new Error(`No input element found for selector "${selector}"`);
		}

		if (!this.#input.name) {
			throw new Error(`No input name found for selector "${selector}"`);
		}

		this.#options = { ...DEFAULT_OPTIONS, ...options };
		this.#state = new ComboboxState(INITIAL_STATE);

		this.#state.subscribe('isOpen', this.#handleIsOpenChange);
		this.#state.subscribe('selectedItem', this.#handleSelectedItemChange);

		this.#init(this.#input);
		this.#options.onInit?.({ sender: this, input: this.#input });
		ComboboxSE.#instances.set(this.#input.id, this);
	}

	#init(input: HTMLInputElement) {
		const {
			wrapperClass,
			inputClass,
			placeholder,
			inputWrapperClass,
			dropdownClass,
			triggerClass,
			listClass
		} = this.#options;

		this.#wrapper.classList.add(wrapperClass);
		input.classList.add(inputClass);
		input.placeholder = this.#input?.placeholder || placeholder;
		input.autocomplete = 'off';
		input.addEventListener('input', this.#handleInput);
		input.addEventListener('focus', () => input.select());
		input.addEventListener('click', () => this.#state.set('isOpen', true));
		input.parentNode?.insertBefore(this.#wrapper, input);

		this.#triggerButton.classList.add(triggerClass);
		this.#triggerButton.type = 'button';
		this.#triggerButton.innerHTML = `<img src="${chevronIcon}" width="12" height="12" alt="chevron icon">`;
		this.#triggerButton.addEventListener('click', this.#toggleVisible);

		this.#inputWrapper.classList.add(inputWrapperClass);
		this.#inputWrapper.append(input, this.#triggerButton);
		this.#list.classList.add(listClass);

		this.#dropdown.classList.add(dropdownClass);
		this.#dropdown.appendChild(this.#list);

		this.#wrapper.append(this.#inputWrapper, this.#dropdown);
		this.#renderList(this.#options.dataItems);
		this.#state.set('isOpen', false);
	}

	#handleIsOpenChange: Subscriber<'isOpen'> = (isOpen) => {
		const { dropdownVisibleClass } = this.#options;

		if (isOpen) {
			this.#dropdown.classList.add(dropdownVisibleClass);
			document.addEventListener('click', this.#handleDocumentClick);
			this.#scrollToSelectedItem();
			this.#trigger('open', { sender: this, isOpen: true });
		}
		else {
			this.#dropdown.classList.remove(dropdownVisibleClass);
			document.removeEventListener('click', this.#handleDocumentClick);
			this.#trigger('close', { sender: this, isOpen: false });
		}
	};

	#handleSelectedItemChange: Subscriber<'selectedItem'> = (data) => {
		if (data) {
			this.#setInputValue(data.text);
			this.#renderList(this.#options.dataItems);
			this.#trigger('change', { sender: this, dataItem: data });
		}
	};

	#renderList(items: DataItem[]) {
		const { itemClass, selectedItemClass, emptyPlaceholder, emptyItemClass } = this.#options;
		const selectedId = this.#state.get('selectedItem')?.id;
		const fragment = document.createDocumentFragment();

		this.#list.innerHTML = '';

		if (items.length === 0) {
			const li = document.createElement('li');
			li.classList.add(emptyItemClass);
			li.textContent = emptyPlaceholder;
			li.dataset.placeholder = 'true';
			this.#list.appendChild(li);
			return;
		}

		items.forEach(item => {
			const li = document.createElement('li');
			li.classList.add(itemClass);
			li.dataset.id = String(item.id);
			li.dataset.value = item.value;
			li.textContent = item.text;
			li.classList.toggle(selectedItemClass, item.id === selectedId);
			li.addEventListener('click', () => this.#handleItemClick(item));
			fragment.appendChild(li);
		});

		this.#list.appendChild(fragment);
	}

	#scrollToSelectedItem = () => {
		const selector = `.${this.#options.selectedItemClass}`;
		const selectedItem = this.#list.querySelector(selector);

		selectedItem?.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest'
		});
	};

	#handleInput = () => {
		const searchTerm = this.#input?.value.trim().toLowerCase() || '';
		const dataItems = this.#options.dataItems;

		if (searchTerm === '') {
			this.#renderList(dataItems);
			return;
		}

		const filteredItems = dataItems.filter(item =>
			item.text.toLowerCase().includes(searchTerm) ||
			item.value.toLowerCase().includes(searchTerm)
		);

		this.#renderList(filteredItems);
	};

	#toggleVisible = () => {
		const isOpen = this.#state.get('isOpen');
		this.#state.set('isOpen', !isOpen);
	};

	#handleDocumentClick = ({ target }: MouseEvent) => {
		if (target instanceof Node && !this.#wrapper.contains(target)) {
			this.#state.set('isOpen', false);
		}
	};

	#handleItemClick = (selectedItem: DataItem) => {
		this.#state.set('selectedItem', selectedItem);
		this.#state.set('isOpen', false);
	};

	#setInputValue(value?: string) {
		(this.#input && value) && (
			this.#input.value = value
		);
	}

	bind<K extends EventKey>(event: K, callback: ComboboxSubscriber<K>) {
		this.#subscribers[event] ??= [];
		this.#subscribers[event]?.push(callback);
	}

	#trigger<K extends EventKey>(event: K, data: PublicEvents[K]) {
		this.#subscribers[event]?.forEach(subscriber => subscriber(data));
	}
}
