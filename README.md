# dmarc-parser

A simple job that query, parse and save to database dmarc aggregate reports.

![](dashboard.png)

## How to use ?

- Create a config.js file, using [config.default.js](https://github.com/Dysnomia-Studio/dmarc-parser/blob/main/config.default.js) as a model. 

- Create postgresql database, and fill it using [this script](https://github.com/Dysnomia-Studio/dmarc-parser/blob/main/database/createDB.sql). Beware of permissions, by default it will have creating user permissions

- Then, start the container: `docker run -tid --name dmarc-parser -v "$PWD/config.js:/usr/src/app/config.js" dysnomiastudio/dmarc-parser:latest`

- Finally, add datasource and dashboard on Grafana. Check out my [model](https://github.com/Dysnomia-Studio/dmarc-parser/blob/main/grafana/dashboard.json) on the repository.
