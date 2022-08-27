const config = {
	mail: {
		credentials: {
			user: 'user@domain.tld',
			password: 'PASSWORDHERE',
			host: 'mail.domain.tld',
			port: 993,
			tls: true,
		},
		directory: 'MyFolder', // Optionnal, mail box directory to read, default goes to INBOX if not specified
	},
	postgres: {
		user: "DBUSER",
		host: "localhost",
		database: "DBUSER",
		password: "PASSWORDHERE",
		port: 5432
	}
};

export default config;