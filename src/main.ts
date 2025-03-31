import { ComboboxSE } from './libs/combobox-se';

document.addEventListener('DOMContentLoaded', () => {
	console.log('DOMContentLoaded');

	const cbType = new ComboboxSE('#type', {
		onInit(props) {
			console.log('onInit', props);
		},
		dataItems: [...Array(20).fill(null)].map((_, index) => ({
			id: index + 1,
			text: `Item ${index + 1}`,
			value: `item_${index + 1}`
		}))
	});

	cbType.bind('open', (props) => {
		console.log('Combobox is Opened', props);
	});

	cbType.bind('close', (props) => {
		console.log('Combobox is Closed', props);
	});

	cbType.bind('change', (props) => {
		console.log('Combobox change', props);
	});
});
