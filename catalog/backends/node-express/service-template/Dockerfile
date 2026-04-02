FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
ENV DD_LOGS_INJECTION=true
CMD ["node", "server.js"]
