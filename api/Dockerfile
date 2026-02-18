FROM node:20-alpine as builder
WORKDIR /home/node
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine
ENV NODE_ENV production
WORKDIR /home/node
COPY --from=builder /home/node/package*.json ./
COPY --from=builder /home/node/node_modules/ ./node_modules/
COPY --from=builder /home/node/dist/ ./dist/

CMD ["npm", "run", "start:prod"]
