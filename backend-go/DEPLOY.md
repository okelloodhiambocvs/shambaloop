# ShambaLoop Kenya MVP - Deployment & Infrastructure Manual

This guide describes how to run the production Go micro-monolith backend and database migrations.

---

## 🏗️ 1. Project Topology

```
/backend-go
├── cmd/
│   └── main.go                 # Go application entrypoint & routing setup
├── internal/
│   ├── models/
│   │   └── models.go           # GORM PostgreSQL mapping definitions
│   └── handlers/
│       └── payments.go         # Safaricom Daraja SDK API STK Push logic
├── schema.sql                  # PostgreSQL native migrations script
└── DEPLOY.md                   # This deployment guide
```

---

## 🗄️ 2. PostgreSQL Schema Provisioning

1. Run the `schema.sql` file against your PostgreSQL database instance:
   ```bash
   psql -h <HOST_ADDRESS> -U <USER_NAME> -d shambaloop_db -f schema.sql
   ```
2. The schema creates primary tables (`users`, `listings`, `land_leases`, `livestock_partnerships`, etc.) and sets up custom PostgreSQL indices to guarantee optimal sub-millisecond querying when filtering by Kenyan Counties.

---

## 🚀 3. Environment Variables

Create a secure `.env` file in your Go directory:

```env
PORT=8080
GIN_MODE=release
DATABASE_URL="postgres://username:password@localhost:5432/shambaloop_db?sslmode=disable"

# Safaricom M-Pesa API Keys (Daraja Sandbox or Production)
MPESA_BUSINESS_SHORTCODE="174379"
MPESA_PASSKEY="bfb272f961c074e12cbe7b419182229211100bc86302381e9f6222b9414c1d41"
MPESA_CONSUMER_KEY="YourDarajaConsumerKey"
MPESA_CONSUMER_SECRET="YourDarajaConsumerSecret"
MPESA_CALLBACK_URL="https://yourdomain.com/api/payments/callback"
```

---

## 🐳 4. Production Docker Containerization

To package the Go REST API as an ultra-lightweight Docker image (~15MB using Alpine multi-stage builds):

Create a `Dockerfile`:

```dockerfile
# Multi-stage build
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o shambaloop-api ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/shambaloop-api .
EXPOSE 8080
CMD ["./shambaloop-api"]
```

Build and run:
```bash
docker build -t shambaloop-api .
docker run -p 8080:8080 --env-file .env shambaloop-api
```
