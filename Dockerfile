FROM node:latest

WORKDIR /usr/src/app

ENV DUCKDB_HOME=/usr/src/app/.duckdb

COPY . .

RUN npm install

RUN npm run build

RUN npm test

CMD [ "node", "dist/main.js" ]