FROM node:12

WORKDIR /srv/app

COPY ./src/package*.json ./
RUN npm install

COPY ./src ./

CMD node ./trellobot.js