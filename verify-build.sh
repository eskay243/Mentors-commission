#!/bin/bash

# Build Verification Script
# This script verifies that the application can be built successfully
# Run this before deploying to catch build issues early

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info "🔍 Starting build verification..."

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 2: Check if .env file exists (or create from example)
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f "env.example" ]; then
        print_info "Creating .env from env.example..."
        cp env.example .env
        print_warning "Please update .env with your actual values before building"
    else
        print_error "env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Step 3: Verify Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    print_error "prisma/schema.prisma not found!"
    exit 1
fi
print_info "✅ Prisma schema found"

# Step 4: Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
print_info "Node.js version: $NODE_VERSION"

# Step 5: Install dependencies
print_info "📦 Installing dependencies..."
if npm ci --legacy-peer-deps 2>&1 | tee /tmp/npm-install.log; then
    print_info "✅ Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    echo "Last 50 lines of npm install output:"
    tail -n 50 /tmp/npm-install.log
    exit 1
fi

# Step 6: Generate Prisma Client
print_info "🔧 Generating Prisma Client..."
if npx prisma generate; then
    print_info "✅ Prisma Client generated successfully"
else
    print_error "Failed to generate Prisma Client"
    exit 1
fi

# Step 7: Verify environment variables
print_info "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set, using default for build"
    export DATABASE_URL="file:./prisma/dev.db"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    print_warning "NEXTAUTH_SECRET not set, using default for build"
    export NEXTAUTH_SECRET="build-time-secret-minimum-32-characters-long-for-validation"
fi

if [ -z "$NEXTAUTH_URL" ]; then
    print_warning "NEXTAUTH_URL not set, using default"
    export NEXTAUTH_URL="http://localhost:3000"
fi

# Step 8: Run build
print_info "🏗️  Building application..."
if npm run build 2>&1 | tee /tmp/build.log; then
    print_info "✅ Build completed successfully!"
    echo ""
    print_info "Build verification passed! ✅"
    echo ""
    print_info "Next steps:"
    echo "  1. Review the build output above"
    echo "  2. Test locally: npm run dev"
    echo "  3. Build Docker image: docker build -t mentors-commission-app:latest ."
    exit 0
else
    print_error "Build failed!"
    echo ""
    echo "========================================="
    echo "❌ BUILD FAILED - ERROR DETAILS:"
    echo "========================================="
    echo "Last 100 lines of build output:"
    tail -n 100 /tmp/build.log
    echo ""
    echo "Error summary:"
    grep -i "error\|failed" /tmp/build.log | tail -n 20 || echo "No specific errors found"
    echo "========================================="
    exit 1
fi

