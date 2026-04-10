#!/bin/bash
# Automated installer for opencode Telegram bot plugin

set -e

echo "🤖 opencode Telegram Bot Plugin Installer"
echo "=========================================="
echo ""

# Check if opencode is installed
if ! command -v opencode &> /dev/null; then
    if [ ! -f "$HOME/.opencode/bin/opencode" ]; then
        echo "❌ opencode not found. Please install opencode first:"
        echo "   curl -fsSL https://opencode.ai/install | bash"
        exit 1
    fi
fi

OPENCODE_BIN="$HOME/.opencode/bin/opencode"
CONFIG_DIR="$HOME/.config/opencode-bot"
PLUGINS_DIR="$CONFIG_DIR/plugins"

echo "✅ opencode found: $OPENCODE_BIN"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$PLUGINS_DIR"
echo "   Created: $CONFIG_DIR"
echo "   Created: $PLUGINS_DIR"
echo ""

# Copy plugin files
echo "📦 Installing plugin files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/plugins/"*.ts "$PLUGINS_DIR/" 2>/dev/null || {
    echo "   ⚠️  No plugin files found in $SCRIPT_DIR/plugins/"
    echo "   Please download them from the repository"
    exit 1
}
cp "$SCRIPT_DIR/AGENTS.md" "$CONFIG_DIR/" 2>/dev/null || echo "   ⚠️  AGENTS.md not found"
echo "   ✅ Plugins installed"
echo ""

# Create .env file
if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo "🔧 Creating .env file..."
    cp "$SCRIPT_DIR/.env.example" "$CONFIG_DIR/.env"
    echo "   Created: $CONFIG_DIR/.env"
    echo ""
    echo "⚠️  IMPORTANT: Edit $CONFIG_DIR/.env and add:"
    echo "   1. Your Telegram bot token (get from @BotFather)"
    echo "   2. Your Telegram chat ID"
    echo ""
    read -p "Press Enter after you've edited the .env file..."
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create opencode.json
if [ ! -f "$CONFIG_DIR/opencode.json" ]; then
    echo "📝 Creating opencode.json..."
    cp "$SCRIPT_DIR/opencode.json.example" "$CONFIG_DIR/opencode.json"
    echo "   Created: $CONFIG_DIR/opencode.json"
    echo ""
fi

# Enable linger
echo "🔓 Enabling user linger (for 24/7 operation)..."
if command -v loginctl &> /dev/null; then
    loginctl enable-linger $(whoami) 2>/dev/null || echo "   ⚠️  Could not enable linger (may require sudo)"
    echo "   ✅ Linger enabled"
else
    echo "   ⚠️  loginctl not found (systemd not available)"
fi
echo ""

# Setup systemd service
if command -v sudo &> /dev/null; then
    echo "🔧 Setting up systemd service..."
    
    # Create service file
    SERVICE_FILE="/etc/systemd/system/opencode.service"
    if [ ! -f "$SERVICE_FILE" ]; then
        cp "$SCRIPT_DIR/opencode.service.example" "$SERVICE_FILE.tmp"
        sed -i "s/YOUR_USERNAME/$(whoami)/g" "$SERVICE_FILE.tmp"
        sudo mv "$SERVICE_FILE.tmp" "$SERVICE_FILE"
        echo "   ✅ Service file created"
    else
        echo "   ℹ️  Service file already exists"
    fi
    
    # Reload and enable
    echo "   🔄 Reloading systemd..."
    sudo systemctl daemon-reload
    sudo systemctl enable opencode 2>/dev/null || echo "   ⚠️  Could not enable service"
    
    echo ""
    echo "🚀 Starting bot service..."
    sudo systemctl start opencode
    sudo systemctl status opencode --no-pager | head -10
    
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "📱 Test your bot:"
    echo "   1. Send a message to your bot on Telegram"
    echo "   2. Check status: sudo systemctl status opencode"
    echo "   3. View logs: sudo journalctl -u opencode -f"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   /clear  - Reset conversation session"
    echo "   /queue  - Check pending messages"
    echo "   /session - Show current session ID"
else
    echo "⚠️  sudo not available - systemd service not configured"
    echo "   You can run the bot manually with:"
    echo "   OPENCODE_CONFIG_DIR=$CONFIG_DIR $OPENCODE_BIN"
    echo ""
fi

echo ""
echo "📚 Documentation: See README.md for more details"
echo ""
