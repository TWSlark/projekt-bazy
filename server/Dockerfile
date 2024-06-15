FROM node:14

WORKDIR /usr/src/server

COPY package*.json ./
RUN npm install

COPY . .

RUN rm -rf node_modules && npm install

EXPOSE 5000

CMD ["npm", "run", "dev"]