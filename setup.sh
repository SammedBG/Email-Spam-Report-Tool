#!/bin/bash

echo "🚀 Setting up Email Spam Report Tool - Phase 1 Complete"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

if [ $? -eq 0 ]; then
    echo "✅ Server dependencies installed successfully"
else
    echo "❌ Failed to install server dependencies"
    exit 1
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install

if [ $? -eq 0 ]; then
    echo "✅ Client dependencies installed successfully"
else
    echo "❌ Failed to install client dependencies"
    exit 1
fi

# Create environment files
echo "⚙️ Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env from template"
    echo "⚠️  Please edit server/.env with your API credentials"
else
    echo "ℹ️  server/.env already exists"
fi

# Client environment
if [ ! -f "client/.env" ]; then
    echo "VITE_API_URL=http://localhost:5000" > client/.env
    echo "✅ Created client/.env"
else
    echo "ℹ️  client/.env already exists"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Edit server/.env with your API credentials (see API_SETUP_GUIDE.md)"
echo "2. Start the server: cd server && npm run dev"
echo "3. Start the client: cd client && npm run dev"
echo "4. Open http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "- API_SETUP_GUIDE.md - API configuration instructions"
echo "- README.md - Project overview and features"
echo "- PHASE1_COMPLETE.md - Implementation summary"
echo ""
echo "🔐 Required API Setups:"
echo "- Gmail API (Google Cloud Console)"
echo "- Microsoft Graph API (Azure Portal)"
echo "- Yahoo Mail API (Yahoo Developer Network)"
echo "- iCloud Mail API (Apple Developer Portal)"
echo "- ProtonMail API (ProtonMail Developer)"
echo ""
echo "Happy coding! 🚀"
