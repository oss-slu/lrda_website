FROM node:18-alpine
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production --silent || true

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD [ "node", "index.js" ]
