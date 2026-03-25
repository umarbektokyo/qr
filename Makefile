.PHONY: build run dev dev-all test clean install

# Install frontend dependencies
install:
	cd frontend && npm install

# Build frontend then backend
build: install
	cd frontend && npm run build
	cd backend && go build -o ../qr-server .

# Run the server (production)
run: build
	./qr-server

# Development: run backend + frontend dev server concurrently
dev:
	cd backend && go run . &
	cd frontend && npm run dev

# Run all tests
test:
	cd frontend && npm test
	cd backend && go test -v ./...

clean:
	rm -f qr-server
	rm -rf frontend/dist
