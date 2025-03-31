import type { Options } from './combobox-se.types';

export const DEFAULT_OPTIONS: Required<Omit<Options, 'dataItems'>> = {
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
