# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory inside the container
WORKDIR /app

# Define build arguments for environment variables
ARG NEXT_PUBLIC_MAP_KEY
ARG NEXT_PUBLIC_S3_PROXY_PREFIX
ARG NEXT_PUBLIC_RERUM_PREFIX
ARG NEXT_PUBLIC_PLACES_KEY
ARG NEXT_PUBLIC_ADMIN_PASKEY
ARG API_PORT
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_OPENAI_API_KEY
ARG NEXT_PUBLIC_OPENAI_API_URL
ARG RERUM_PREFIX

# Set environment variables using build arguments
ENV NEXT_PUBLIC_MAP_KEY=$NEXT_PUBLIC_MAP_KEY
ENV NEXT_PUBLIC_S3_PROXY_PREFIX=$NEXT_PUBLIC_S3_PROXY_PREFIX
ENV NEXT_PUBLIC_RERUM_PREFIX=$NEXT_PUBLIC_RERUM_PREFIX
ENV NEXT_PUBLIC_PLACES_KEY=$NEXT_PUBLIC_PLACES_KEY
ENV NEXT_PUBLIC_ADMIN_PASKEY=$NEXT_PUBLIC_ADMIN_PASKEY
ENV API_PORT=$API_PORT
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_OPENAI_API_KEY=$NEXT_PUBLIC_OPENAI_API_KEY
ENV NEXT_PUBLIC_OPENAI_API_URL=$NEXT_PUBLIC_OPENAI_API_URL
ENV RERUM_PREFIX=$RERUM_PREFIX

# Copy the package.json and pnpm-lock.yaml to the container
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the Next.js app (this will create the .next folder in /app)
RUN pnpm build

# Stage 2: Set up the production environment
FROM node:18-alpine AS runner

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory inside the container
WORKDIR /app

# Copy the necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js runs on
EXPOSE $API_PORT

# Set environment variable to production
ENV NODE_ENV=production

# Run the Next.js application
CMD ["pnpm", "start"]
