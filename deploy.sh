#!/bin/bash

# Deployment script for EdTech Payment Platform on Hostinger VPS
# This script handles building, migrating, and deploying the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="edtech-app"
IMAGE_NAME="edtech-payment-platform:latest"
PORT="3000"
PROJECT_DIR="/opt/apps/Mentors-commission"

# Functions
print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_warning "Not running as root. Some commands may require sudo."
fi

# Navigate to project directory
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    print_info "Changed to project directory: $PROJECT_DIR"
else
    print_error "Project directory not found: $PROJECT_DIR"
    print_info "Please update PROJECT_DIR in this script or run from project directory"
    cd "$(dirname "$0")"
    print_info "Using current directory: $(pwd)"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Please create .env file with required environment variables"
    exit 1
fi

print_info "Starting deployment process..."

# Step 1: Stop and remove existing container
print_info "Step 1: Stopping existing container..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    print_info "Container stopped and removed"
else
    print_info "No existing container found"
fi

# Step 2: Pull latest code
print_info "Step 2: Pulling latest code..."
if [ -d .git ]; then
    git pull || print_warning "Git pull failed or not a git repository"
else
    print_warning "Not a git repository, skipping git pull"
fi

# Step 3: Build Docker image
print_info "Step 3: Building Docker image..."
if docker build -t "$IMAGE_NAME" .; then
    print_info "Docker image built successfully"
else
    print_error "Docker build failed!"
    exit 1
fi

# Step 4: Run database migrations
print_info "Step 4: Running database migrations..."
if docker run --rm \
    -v "$(pwd)/prisma:/app/prisma" \
    --env-file .env \
    "$IMAGE_NAME" \
    npx prisma migrate deploy; then
    print_info "Migrations completed successfully"
else
    print_warning "Migration failed or no migrations to run"
    print_info "This is normal if migrations are already up to date"
fi

# Step 5: Start new container
print_info "Step 5: Starting new container..."
if docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$PORT:3000" \
    --env-file .env \
    -v "$(pwd)/prisma:/app/prisma" \
    --restart unless-stopped \
    "$IMAGE_NAME"; then
    print_info "Container started successfully"
else
    print_error "Failed to start container!"
    exit 1
fi

# Step 6: Wait for container to be ready
print_info "Step 6: Waiting for container to be ready..."
sleep 5

# Step 7: Check container status
print_info "Step 7: Checking container status..."
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "✅ Container is running"
else
    print_error "Container is not running!"
    print_info "Checking logs..."
    docker logs "$CONTAINER_NAME" || true
    exit 1
fi

# Step 8: Health check
print_info "Step 8: Performing health check..."
sleep 3
if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
    print_info "✅ Health check passed"
else
    print_warning "Health check failed or endpoint not responding"
    print_info "Container may still be starting up. Check logs with: docker logs $CONTAINER_NAME"
fi

# Step 9: Show logs
print_info "Step 9: Recent container logs:"
echo "----------------------------------------"
docker logs --tail 20 "$CONTAINER_NAME"
echo "----------------------------------------"

# Summary
echo ""
print_info "🎉 Deployment complete!"
echo ""
print_info "Container Name: $CONTAINER_NAME"
print_info "Image: $IMAGE_NAME"
print_info "Port: $PORT"
echo ""
print_info "Useful commands:"
echo "  View logs:        docker logs -f $CONTAINER_NAME"
echo "  Stop container:   docker stop $CONTAINER_NAME"
echo "  Start container:  docker start $CONTAINER_NAME"
echo "  Restart:          docker restart $CONTAINER_NAME"
echo "  Container stats:  docker stats $CONTAINER_NAME"
echo ""

