import { ComboboxState, type State, type DataItem, type Subscriber } from './combobox-state';

export type EventsComboboxSE = 'init' | 'dataBound' | 'open' | 'close';

type Selector = HTMLInputElement | string;

interface Options {
	dataItems: DataItem[];
	wrapperClass?: string;
	inputClass?: string;
	inputWrapperClass?: string;
	triggerClass?: string;
	dropdownClass?: string;
	listClass?: string;
	itemClass?: string;
	selectedItemClass?: string;
	placeholder?: string;
	onInit?: (props: { sender: ComboboxSE, input: HTMLInputElement }) => void;
}

const DEFAULT_OPTIONS: Required<Omit<Options, 'dataItems'>> = {
	wrapperClass: 'combobox-se-wrapper',
	inputClass: 'combobox-se-input',
	inputWrapperClass: 'combobox-se-input-wrapper',
	triggerClass: 'combobox-se-trigger',
	dropdownClass: 'combobox-se-dropdown',
	listClass: 'combobox-se-list',
	itemClass: 'combobox-se-item',
	selectedItemClass: 'combobox-se-selected',
	placeholder: 'Введите значение',
	onInit: () => {}
};

const INITIAL_STATE: State = {
	isOpen: false,
	selectedItem: null
};

export class ComboboxSE {
	readonly #options: Required<Options>;
	readonly #input: HTMLInputElement | null;
	readonly #wrapper = document.createElement('span');
	readonly #inputWrapper = document.createElement('span');
	readonly #trigger = document.createElement('button');
	readonly #dropdown = document.createElement('div');
	readonly #list = document.createElement('ul');
	readonly #state: ComboboxState;
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
		this.#updateUI();

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

		this.#trigger.classList.add(triggerClass);
		this.#trigger.type = 'button';
		this.#trigger.innerHTML = `<svg><use href="/chevron.svg#chevron-down"></use></svg>`;
		this.#trigger.addEventListener('click', this.#toggleVisible);

		this.#inputWrapper.classList.add(inputWrapperClass);
		this.#inputWrapper.append(input, this.#trigger);
		this.#list.classList.add(listClass);

		this.#dropdown.classList.add(dropdownClass);
		this.#dropdown.appendChild(this.#list);

		this.#wrapper.append(this.#inputWrapper, this.#dropdown);
		this.#renderList(this.#options.dataItems);
	}

	#handleIsOpenChange: Subscriber<'isOpen'> = (isOpen) => {
		if (isOpen) {
			this.#dropdown.style.display = 'block';
			document.addEventListener('click', this.#handleDocumentClick);
			this.#scrollToSelectedItem();
		}
		else {
			this.#dropdown.style.display = 'none';
			document.removeEventListener('click', this.#handleDocumentClick);
		}
	};

	#handleSelectedItemChange: Subscriber<'selectedItem'> = (data) => {
		this.#setInputValue(data?.text);
		this.#renderList(this.#options.dataItems);
	};

	#renderList(items: DataItem[]) {
		const { itemClass, selectedItemClass } = this.#options;
		const selectedId = this.#state.get('selectedItem')?.id;

		// Используем дифф для минимального обновления DOM
		items.forEach(item => {
			const existingItem = this.#list.querySelector(`[data-id="${item.id}"]`);

			if (existingItem) {
				// Обновляем класс только если изменился выбор
				existingItem.classList.toggle(selectedItemClass, item.id === selectedId);
				return;
			}

			const li = document.createElement('li');
			li.classList.add(itemClass);
			li.dataset.id = String(item.id);
			li.dataset.value = item.value;
			li.textContent = item.text;
			li.addEventListener('click', () => this.#handleItemClick(item.id));
			this.#list.appendChild(li);
		});

		// Удаляем несуществующие элементы
		Array.from(this.#list.children).forEach(child => {
			const id = parseInt(child.getAttribute('data-id') || '');
			if (!items.some(item => item.id === id)) {
				child.remove();
			}
		});
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

	#updateUI = () => {
		console.log('#updateUI');
		const isOpen = this.#state.get('isOpen');

		if (isOpen) {
			this.#dropdown.style.display = 'block';
			document.addEventListener('click', this.#handleDocumentClick);
			(this.#list.childElementCount !== this.#options.dataItems.length) && (
				this.#renderList(this.#options.dataItems)
			);
			this.#scrollToSelectedItem();
		}
		else {
			this.#dropdown.style.display = 'none';
			document.removeEventListener('click', this.#handleDocumentClick);
		}

		const selectedItem = this.#state.get('selectedItem');
		this.#setInputValue(selectedItem?.text);

	};

	#handleDocumentClick = ({ target }: MouseEvent) => {
		if (target instanceof Node && !this.#wrapper.contains(target)) {
			this.#state.set('isOpen', false);
			document.removeEventListener('click', this.#handleDocumentClick);
		}
	};

	#handleItemClick = (id: number) => {
		console.log('#handleItemClick');
		const { dataItems, selectedItemClass } = this.#options;
		const currentItem = dataItems.find(item => item.id === id);

		if (currentItem) {
			this.#state.set('selectedItem', currentItem);
			this.#state.set('isOpen', false);
			requestAnimationFrame(() => {
				this.#list.querySelector(selectedItemClass)?.classList.remove(selectedItemClass);
			});
		}
	};

	#setInputValue(value?: string) {
		(this.#input && value) && (
			this.#input.value = value
		);
	}
}
