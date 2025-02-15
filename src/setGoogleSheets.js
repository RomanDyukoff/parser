const { google } = require('googleapis');
const fs = require('fs');

const locals = [
	'Dubai Marina',
	'Downtown Dubai',
	'Palm Jumeirah',
	'Business Bay',
	'Palm Jebel Ali',
	'Marsa Dubai',
	'Dubai Harbour',
	'Emaar Beachfront',
	'Bluewaters Island',
	'Dubai Creek Harbour',
	'Jumeirah Beach Residence',
	'Dubai Hills Estate',
	'Villanova',
];
const local = locals[12];

// const parser = require('./parser');
const parserPdf = require('./upParser');

const credentials = JSON.parse(
	fs.readFileSync('./assets/xenon-tracer-402920-4869c540a86f.json')
);

const auth = new google.auth.GoogleAuth({
	credentials,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = '';

async function readFromSheet() {
	try {
		const client = await auth.getClient();

		const sheets = google.sheets({ version: 'v4', auth: client });

		const range = `${local}!A1:J`;

		const values = await parserPdf();

		// для получения данных из таблицы
		// const response = await sheets.spreadsheets.values.get({
		// 	spreadsheetId,
		// 	range,
		// });

		// для записи данных из таблицы
		const response = await sheets.spreadsheets.values.append({
			spreadsheetId,
			range,
			valueInputOption: 'RAW',
			requestBody: {
				values,
			},
		});

		console.log('Данные успешно записаны в таблицу!');
	} catch (error) {
		console.error('ошибка чтения таблицы', error);
	}
}

readFromSheet();
