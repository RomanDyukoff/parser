const fs = require('fs');
const pdf = require('pdf-parse');

const doc = './assets/pdf/Villanova.pdf';

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

const formatDate = dateString => {
	let propDate = dateString;

	if (propDate.length === 9) {
		propDate = dateString
			.split('/')
			.map(str => {
				if (str.length === 1) {
					return `0${str}`;
				}
				return str;
			})
			.join('/');
	}

	const date = new Date(propDate);
	if (isNaN(date)) return '';
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${day}.${month}.${year}`;
};

const getNumberApartment = str => {
	const numberMatch = str.match(/No\. (.+)$/);
	return numberMatch ? numberMatch[1].trim() : '';
};

const getStatusApartment = str => {
	return str.includes('Ready') ? 'Ready' : 'Offplan';
};

const getRoomApartment = str => {
	if (str.includes('Studio') || str.includes('Office')) {
		return str;
	} else if (/^[1-9]$/.test(str)) {
		return str;
	} else {
		return str.split(' ')[0];
	}
};

const getTypeApartment = str => {
	return str.includes('ReSale') ? 'ReSale' : 'Sale';
};

const getSquareApartment = str => {
	return str.split(' ')[0];
};

const getPercentApartment = str => {
	const percentMatch = str.match(/\(([-+]\d+%)\)/);

	return percentMatch && percentMatch[1].startsWith('-') ? percentMatch[1] : '';
};

const extractDataFromLines = lines => {
	const properties = [];
	let currentProperty = {};
	let previousLine = '';

	lines.forEach(line => {
		const trimmed = line.trim();

		if (trimmed.includes('Ready') || trimmed.includes('Offplan')) {
			if (Object.keys(currentProperty).length > 0) {
				properties.push(currentProperty);
				currentProperty = {};
			}

			currentProperty.address = previousLine;
			currentProperty.status = getStatusApartment(trimmed);
			currentProperty.number = getNumberApartment(trimmed);
		} else if (trimmed.match(/\d{2}\/\d{1,2}\/\d{4}/)) {
			currentProperty.date = formatDate(trimmed);
		} else if (trimmed.includes('ReSale') || trimmed.includes('Sale')) {
			currentProperty.type = getTypeApartment(trimmed);
		} else if (trimmed.match(/^\d|^Studio$|^Office$/)) {
			if (!currentProperty.rooms) {
				currentProperty.rooms = '';
			}

			if (trimmed.includes('per sqft')) {
				currentProperty.pricePerSquare = getSquareApartment(trimmed);
			} else if (trimmed.includes('sqft')) {
				currentProperty.square = getSquareApartment(trimmed);
			} else if (
				trimmed.includes('Beds') ||
				trimmed.includes('Bed') ||
				trimmed.includes('Studio') ||
				trimmed.includes('Office') ||
				/^[1-9]$/.test(trimmed)
			) {
				currentProperty.rooms = getRoomApartment(trimmed);
			} else {
				currentProperty.price = getSquareApartment(trimmed);
				currentProperty.percent = getPercentApartment(trimmed);
			}
		} else {
			previousLine = trimmed;
		}
	});

	if (Object.keys(currentProperty).length > 0) {
		properties.push(currentProperty);
	}

	return properties;
};

const parsePdf = async () => {
	try {
		const dataBuffer = fs.readFileSync(doc);
		const pdfData = await pdf(dataBuffer);

		const lines = pdfData.text
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.length > 0);
		const properties = extractDataFromLines(lines);

		return convertParserData(properties, '');
	} catch (error) {
		console.error('Error parsing PDF:', error);
	}
};
// parsePdf();

module.exports = parsePdf;
