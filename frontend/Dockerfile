FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Build stage
FROM base AS builder
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
RUN npm prune --production  # Remove dev dependencies
CMD ["npm", "start"]