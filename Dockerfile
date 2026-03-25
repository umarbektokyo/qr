# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend
WORKDIR /app
COPY backend/ ./backend/
WORKDIR /app/backend
RUN go build -o /qr-server .

# Stage 3: Production
FROM alpine:3.21
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=backend /qr-server ./qr-server
COPY --from=frontend /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./qr-server"]
