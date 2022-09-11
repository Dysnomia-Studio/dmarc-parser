import { Base64Decode } from  'base64-stream';
import fs from 'fs';
import Imap from 'imap';
import { inspect } from 'util';

export default class MailReader {
	#imap = null;
	#directory = null;

	constructor(credentials, readyCb, directory = 'INBOX') {
		this.#imap = new Imap(credentials);
		this.#directory = directory;

		this.#imap.once('ready', readyCb);

		this.#imap.once('error', function(err) {
			console.log(err);
		});

		this.#imap.once('end', function() {
			console.log('Connection ended');
		});

		this.#imap.connect();
	}

	#openInbox(cb) {
		this.#imap.openBox(this.#directory, true, cb);
	}

	#findAttachmentParts(struct, attachments) {
		attachments = attachments ||  [];
		for (var i = 0, len = struct.length, r; i < len; ++i) {
			if (Array.isArray(struct[i])) {
				this.#findAttachmentParts(struct[i], attachments);
			} else {
				if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(struct[i].disposition.type.toUpperCase()) > -1) {
					attachments.push(struct[i]);
				}
			}
		}
		return attachments;
	}

	#buildAttMessageFunction(attachment, filename) {
		var encoding = attachment.encoding;

		return function (msg, seqno) {
			var prefix = '(#' + seqno + ') ';
			msg.on('body', function(stream, info) {
				//Create a write stream so that we can stream the attachment to file;
				//console.log(prefix + 'Streaming this attachment to file', filename, info);
				var writeStream = fs.createWriteStream('rawdata/' + filename);
				writeStream.on('finish', function() {
					//console.log(prefix + 'Done writing to file %s', filename);
				});

				//stream.pipe(writeStream); this would write base64 data to the file.
				//so we decode during streaming using 
				if (encoding.toUpperCase() === 'BASE64') {
					//the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
					stream.pipe(new Base64Decode()).pipe(writeStream);
				} else  {
					//here we have none or some other decoding streamed directly to the file which renders it useless probably
					stream.pipe(writeStream);
				}
			});
			msg.once('end', function() {
				//console.log(prefix + 'Finished attachment %s', filename);
			});
		};
	}	

	async retrieveLastMail() {
		const job = new Promise((resolve, reject) => {
			let timeoutId;

			this.#openInbox((err, box) => {
				if (err) throw err;

				const data = {};

				let f = this.#imap.seq.fetch('1:*', {
					bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
					struct: true
				});
				f.on('message', (msg, seqno) => {
					//console.log('Message #%d', seqno);
					let prefix = '(#' + seqno + ') ';
					msg.on('body', function(stream, info) {
						let buffer = '';
						stream.on('data', function(chunk) {
							buffer += chunk.toString('utf8');
						});
						stream.once('end', function() {
							data.header = Imap.parseHeader(buffer);
							//console.log(prefix + 'Parsed header: %s', inspect(data.header));
						});
					});
					msg.once('attributes', (attrs) => {
						data.attrs = attrs;
						//console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));

						const attachments = this.#findAttachmentParts(attrs.struct);

						//console.log(prefix + 'Has attachments: %d', attachments.length);

						for (let i = 0; i < attachments.length; ++i) {
							const attachment = attachments[i];
							let filename;
							if(attachment.params && attachment.params.name) {
								filename = attachment.params.name.replaceAll('!', '-');
							}
							if(attachment.disposition && attachment.disposition.params && attachment.disposition.params.filename) {
								filename = attachment.disposition.params.filename.replaceAll('!', '-');
							}

							if(!filename) {
								console.log(`Invalid attachment, ${i + 1}/${attachments.length}`, attachment, data.attrs, data.header);
								continue;
							}

							console.log(prefix + 'Fetching attachment %s', filename);
							const attachmentFetch = this.#imap.fetch(attrs.uid , {
								bodies: [attachment.partID],
								struct: true
							});

							//build function to process attachment message
							attachmentFetch.on('message', this.#buildAttMessageFunction(attachment, filename));

							clearTimeout(timeoutId);
							timeoutId = setTimeout(resolve, 5000);
						}
					});
					msg.once('end', function() {
						//console.log(prefix + 'Finished');

							clearTimeout(timeoutId);
							timeoutId = setTimeout(resolve, 5000);
					});
				});
				f.once('error', function(err) {
					console.log('Fetch error: ' + err);
				});
				f.once('end', () => {
					//console.log('Done fetching all messages!');

					clearTimeout(timeoutId);
					timeoutId = setTimeout(resolve, 5000);

					//this.#imap.end();
				});
			});
		});

		return await job;
	}

	closeConnection() {
		this.#imap.end();
	}
}