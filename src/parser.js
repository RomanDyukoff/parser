const fs = require('fs');
const pdf = require('pdf-parse');

const doc = './assets/pdf/Dubai Hills Estate.pdf';

const formatDate = dateString => {
	const date = new Date(dateString);
	if (isNaN(date)) return '';
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${day}.${month}.${year}`;
};

convertParserData = (data, sortStr) => {
	const base = [
		'Адрес',
		'Статус',
		'Номер апартаментов',
		'Дата продажи',
		'Тип продажи',
		'Общая стоимость',
		'Стоимость за кв. м.',
		'Количество комнат',
		'Общая площадь',
		'Процент',
	];

	return data.length
		? [
				base,
				...data
					.filter(item =>
						sortStr.trim() ? item.address.includes(sortStr) : true
					)
					.map(item => [
						item.address.split(',')[0],
						item.status,
						item.number,
						item.date,
						item.type,
						item.price,
						item.pricePerSquare,
						item.rooms,
						item.square,
						item.percent,
					]),
			]
		: base;
};

async function parser(sortStr) {
	try {
		const data = fs.readFileSync(doc);
		const pdfData = await pdf(data);

		const text = pdfData.text;
		const lines = text.split('\n');

		const properties = [];
		let currentEntry = [];

		lines.forEach(line => {
			const trimmedLine = line.trim();
			if (trimmedLine.length > 0) {
				currentEntry.push(trimmedLine);

				if (currentEntry.length === 8) {
					const percentMatch = currentEntry[4].match(/\((-\d+(\.\d+)?)%\)/);
					const percent = percentMatch ? percentMatch[1] + '%' : '';
					const numberField = currentEntry[1].split(', ')[1] || '';
					const number = numberField.match(/\d+/)
						? numberField.match(/\d+/)[0]
						: '';

					const property = {
						address: currentEntry[0],
						status: currentEntry[1].includes('Offplan') ? 'Offplan' : 'Ready',
						// number: currentEntry[1].split(',')[1].split('.')[1] || '',
						number: number,
						date: formatDate(currentEntry[2]),
						type: currentEntry[3].split(' ')[1] || currentEntry[3],
						price: currentEntry[4].split(' ')[0],
						pricePerSquare: currentEntry[5].split(' ')[0],
						rooms: currentEntry[6].split(' ')[0] || '',
						square: currentEntry[7].split(' ')[0],
						percent: percent,
					};

					properties.push(property);
					currentEntry = [];
				}
			}
		});

		return convertParserData(properties, sortStr);
	} catch (error) {
		console.error('Error processing PDF:', error);
		return [];
	}
}

const run = async () => {
	const data = await parser('');

	console.log(data);
};

run();
