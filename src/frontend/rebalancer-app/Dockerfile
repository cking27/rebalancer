# Install dependencies
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build the application
COPY . .
RUN npm run build

# Serve the application
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "dev"]