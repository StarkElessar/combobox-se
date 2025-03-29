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
	dropdownVisibleClass?: string;
	listClass?: string;
	itemClass?: string;
	selectedItemClass?: string;
	placeholder?: string;
	emptyPlaceholder?: string;
	emptyItemClass?: string;
	onInit?: (props: { sender: ComboboxSE, input: HTMLInputElement }) => void;
}

const DEFAULT_OPTIONS: Required<Omit<Options, 'dataItems'>> = {
	wrapperClass: 'combobox-se-wrapper',
	inputClass: 'combobox-se-input',
	inputWrapperClass: 'combobox-se-input-wrapper',
	triggerClass: 'combobox-se-trigger',
	dropdownClass: 'combobox-se-dropdown',
	dropdownVisibleClass: 'combobox-se-dropdown-visible',
	listClass: 'combobox-se-list',
	itemClass: 'combobox-se-item',
	selectedItemClass: 'combobox-se-selected',
	emptyItemClass: 'combobox-se-empty-item',
	placeholder: 'Введите значение',
	emptyPlaceholder: 'Нет элементов для отображения',
	onInit: () => {}
};

const INITIAL_STATE: State = {
	isOpen: null,
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
		this.#state.set('isOpen', false);
	}

	#handleIsOpenChange: Subscriber<'isOpen'> = (isOpen) => {
		const { dropdownVisibleClass } = this.#options;

		if (isOpen) {
			this.#dropdown.classList.add(dropdownVisibleClass);
			document.addEventListener('click', this.#handleDocumentClick);
			this.#scrollToSelectedItem();
		}
		else {
			this.#dropdown.classList.remove(dropdownVisibleClass);
			document.removeEventListener('click', this.#handleDocumentClick);
		}
	};

	#handleSelectedItemChange: Subscriber<'selectedItem'> = (data) => {
		this.#setInputValue(data?.text);
		this.#renderList(this.#options.dataItems);
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
}
