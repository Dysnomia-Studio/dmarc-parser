import fs from 'fs';
import jszip from 'jszip';
import { parseString } from 'xml2js';

import MailReader from './MailReader.js'; 

const PROCESSED_DATA_FOLDER = 'processedData/';

import config from './config.js';

(async() => {
	/// GET MAILS
	let mailReader;

	let job = new Promise((resolve, _) => {
		mailReader = new MailReader(config.mail.credentials, resolve, config.mail.directory);
	});

	await job;

	//console.log('------------');

	/*console.log(*/await mailReader.retrieveLastMail()/*);*/

	console.log('Did retrieveLastMail !')

	fs.rmSync(PROCESSED_DATA_FOLDER, { recursive: true, force: true });
	fs.mkdirSync(PROCESSED_DATA_FOLDER);

	/// UNZIP files
	for(const file of fs.readdirSync('rawdata')) {
		if(!file.endsWith('.zip')) {
			console.log('Invalid file: ' + file);
			continue;
		}

		const filename = 'rawdata/' + file;
		const newFilename = PROCESSED_DATA_FOLDER + file;

		console.log('Unzipping ' + filename);

		const fileContent = fs.readFileSync(filename);
		const jszipInstance = new jszip();
		const res = await jszipInstance.loadAsync(fileContent);

		fs.mkdirSync(newFilename);

		for(const insideFileName in res.files) {
			const insideFile = res.files[insideFileName]; 
			console.log('Found file ' + insideFile);

			if(insideFile.dir) {
				fs.mkdirSync(newFilename + '/' + insideFile.name);
			} else {
				fs.writeFileSync(`${newFilename}/${insideFile.name}`, Buffer.from(await insideFile.async('arraybuffer')));
			}
		} 
	}

	/// PARSE XML
	for(const dir of fs.readdirSync(PROCESSED_DATA_FOLDER)) {
		if(!fs.lstatSync(PROCESSED_DATA_FOLDER + dir).isDirectory()) {
			console.log(dir + ' is not a directory !');
			continue;
		}

		for(const file of fs.readdirSync(PROCESSED_DATA_FOLDER + dir)) {
			const xml = fs.readFileSync(PROCESSED_DATA_FOLDER + dir + '/' + file, 'utf8');
			parseString(xml, function (err, result) {
			    console.dir(result);
			});
			return;
		}
	}
})();
