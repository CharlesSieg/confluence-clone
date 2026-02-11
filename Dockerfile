# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + serve frontend
FROM node:20-alpine
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production && apk del python3 make g++

COPY backend/ ./

# Copy built frontend into backend's public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PORT=3033
ENV DB_PATH=/app/data/wiki.db
ENV NODE_ENV=production

EXPOSE 3033

CMD ["node", "server.js"]
