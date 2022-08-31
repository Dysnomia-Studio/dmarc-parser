import fs from 'fs';
import jszip from 'jszip';
import { inspect } from 'util';
import { parseString } from 'xml2js';
import zlib from 'node:zlib';

import Database from './Database.js'; 
import MailReader from './MailReader.js'; 

const PROCESSED_DATA_FOLDER = 'processedData/';
const RAW_DATA_FOLDER = 'rawdata/';

import config from './config.js';

async function doWork() {
	const db = new Database(config.postgres);

	fs.mkdirSync(RAW_DATA_FOLDER);

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

	/// Extract archives
	for(const file of fs.readdirSync(RAW_DATA_FOLDER)) {
		if(file.endsWith('.zip')) {
			const filename = RAW_DATA_FOLDER + file;
			const newFilename = PROCESSED_DATA_FOLDER + file;

			console.log('Unzipping ' + file);

			const fileContent = fs.readFileSync(filename);
			const jszipInstance = new jszip();
			const res = await jszipInstance.loadAsync(fileContent);

			fs.mkdirSync(newFilename);

			for(const insideFileName in res.files) {
				const insideFile = res.files[insideFileName]; 

				if(insideFile.dir) {
					fs.mkdirSync(newFilename + '/' + insideFile.name);
				} else {
					fs.writeFileSync(`${newFilename}/${insideFile.name}`, Buffer.from(await insideFile.async('arraybuffer')));
				}
			}
		} else if(file.endsWith('.gz')) {
			console.log('Gunzipping ' + file);

			const name = file.replaceAll('.gz', '');
			const folder = name.replace('.xml', '');
			fs.mkdirSync(PROCESSED_DATA_FOLDER + folder);

			const writeStream = fs.createWriteStream(PROCESSED_DATA_FOLDER + folder + '/' + name);
			fs.createReadStream(RAW_DATA_FOLDER + file)
			    .pipe(zlib.createGunzip())
			    .pipe(writeStream);
		} else {
			console.log('Invalid file: ' + file);
		}
	}

	/// PARSE XML
	const dbData = await db.selectAll();

	for(const dir of fs.readdirSync(PROCESSED_DATA_FOLDER)) {
		if(!fs.lstatSync(PROCESSED_DATA_FOLDER + dir).isDirectory()) {
			console.log(dir + ' is not a directory !');
			continue;
		}

		for(const file of fs.readdirSync(PROCESSED_DATA_FOLDER + dir)) {
			const path = PROCESSED_DATA_FOLDER + dir + '/' + file;
			if(!path.endsWith('.xml')) {
				console.log('Invalid extracted file: ', file);
				continue;
			}

			const xml = fs.readFileSync(path, 'utf8');
			parseString(xml, function (err, result) {
				if(err) {
					console.error(err);
				}

				if(dbData.find((elt) =>
					elt.report_id === result.feedback.report_metadata[0].report_id[0] &&
					elt.org_name === result.feedback.report_metadata[0].org_name[0]
				)) {
					return;
				}

				try {
			    	db.insertData(result, path);
			    } catch(e) {
			    	console.error(e);
			    }
			});
		}
	}
}

doWork();

setInterval(doWork, 1000 * 60 * 60 * 12); // Run every 12 hours