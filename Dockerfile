FROM node:current-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN apk add  --no-cache ffmpeg && npm install

COPY . .

ENV PORT=3000

CMD [ "npm", "run", "dev" ]
