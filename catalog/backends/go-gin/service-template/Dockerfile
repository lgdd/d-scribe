FROM golang:1.25 AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go install github.com/DataDog/orchestrion@latest
RUN orchestrion go build -o=main .

FROM debian:bookworm-slim
COPY --from=build /app/main /usr/local/bin/
ENV DD_LOGS_INJECTION=true
ENTRYPOINT ["/usr/local/bin/main"]
