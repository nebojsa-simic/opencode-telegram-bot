#!/usr/bin/env bash
set -e

# Telegram Bot Plugin Installer
# Supports: Linux, macOS, Windows (Git Bash/WSL)

PLUGIN_NAME="opencode-telegram-bot"
REPO_URL="https://github.com/nebojsa-simic/opencode-telegram-bot.git"
TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'opencode-telegram-bot')

# Detect OS
detect_os() {
  case "$(uname -s | tr '[:upper:]' '[:lower:]')" in
    linux*)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
    darwin*)
      echo "macos"
      ;;
    mingw*|msys*|cygwin*)
      echo "windows"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# Detect config directory
find_config_dir() {
  local os="$1"
  
  case "$os" in
    linux|wsl)
      if [ -n "$XDG_CONFIG_HOME" ]; then
        echo "$XDG_CONFIG_HOME/opencode-bot"
      else
        echo "$HOME/.config/opencode-bot"
      fi
      ;;
    macos)
      echo "$HOME/.config/opencode-bot"
      ;;
    windows)
      if [ -n "$APPDATA" ]; then
        echo "$APPDATA/opencode-bot"
      else
        echo "$HOME/.config/opencode-bot"
      fi
      ;;
  esac
}

# Check dependencies
check_deps() {
  if ! command -v git &> /dev/null; then
    echo "❌ git is required but not installed"
    exit 1
  fi
  
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
  fi
}

# Create config directory
setup_config_dir() {
  local config_dir="$1"
  
  echo "📁 Creating config directory: $config_dir"
  mkdir -p "$config_dir/plugins"
  
  # Create .env template if missing
  if [ ! -f "$config_dir/.env" ]; then
    echo "📝 Creating .env template"
    cat > "$config_dir/.env.example" << EOF
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ALLOWLIST=your_chat_id_here
CI=true
EOF
  fi
}

# Install plugin
install_plugin() {
  local config_dir="$1"
  
  echo "⬇️  Cloning plugin repository..."
  cd "$TEMP_DIR"
  git clone --depth 1 "$REPO_URL" "$PLUGIN_NAME" 2>/dev/null || {
    echo "❌ Failed to clone repository"
    exit 1
  }
  
  echo "📦 Copying plugin files..."
  cp "$TEMP_DIR/$PLUGIN_NAME/telegram.ts" "$config_dir/plugins/"
  cp "$TEMP_DIR/$PLUGIN_NAME/mcp-deferred.ts" "$config_dir/plugins/" 2>/dev/null || true
  cp "$TEMP_DIR/$PLUGIN_NAME/AGENTS.md" "$config_dir/" 2>/dev/null || true
  
  # Update opencode.json
  echo "⚙️  Updating opencode.json..."
  local config_file="$config_dir/opencode.json"
  
  if [ ! -f "$config_file" ]; then
    # Create new config
    cat > "$config_file" << EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": [
    "./plugins/mcp-deferred.ts",
    "./plugins/telegram.ts"
  ],
  "instructions": ["AGENTS.md"]
}
EOF
  else
    # Check if telegram plugin already in config
    if ! grep -q "telegram.ts" "$config_file" 2>/dev/null; then
      # Backup and update
      cp "$config_file" "$config_file.bak"
      
      # Add telegram plugin using node for JSON manipulation
      node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$config_file', 'utf8'));
        if (!config.plugin) config.plugin = [];
        if (!config.plugin.includes('./plugins/telegram.ts')) {
          config.plugin.push('./plugins/telegram.ts');
        }
        if (!config.plugin.includes('./plugins/mcp-deferred.ts')) {
          config.plugin.unshift('./plugins/mcp-deferred.ts');
        }
        if (!config.instructions) config.instructions = [];
        if (!config.instructions.includes('AGENTS.md')) {
          config.instructions.push('AGENTS.md');
        }
        fs.writeFileSync('$config_file', JSON.stringify(config, null, 2));
        console.log('✅ Config updated');
      " || {
        echo "⚠️  Could not update config automatically"
        echo "   Please add './plugins/telegram.ts' to plugin array manually"
        mv "$config_file.bak" "$config_file"
      }
    fi
  fi
}

# Setup systemd service (Linux only)
setup_service() {
  local os="$1"
  local config_dir="$2"
  
  if [ "$os" = "linux" ] || [ "$os" = "wsl" ]; then
    echo ""
    read -p "🔧 Set up systemd service for 24/7 operation? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if command -v systemctl &> /dev/null; then
        echo "🔧 Creating systemd service..."
        
        local service_file="/etc/systemd/system/opencode-bot.service"
        
        sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=Opencode Telegram Bot
After=network.target network-online.target

[Service]
Type=simple
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$HOME
ExecStart=$HOME/.opencode/bin/opencode
Restart=always
RestartSec=10

TimeoutStartSec=120
TimeoutStopSec=60

MemoryMax=2G
MemoryHigh=1536M

Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=HOME=$HOME
Environment=OPENCODE_CONFIG_DIR=$config_dir
Environment=NODE_NO_WARNINGS=1
Environment=CI=true

StandardOutput=journal
StandardError=journal
SyslogIdentifier=opencode-bot

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable opencode-bot
        
        echo "✅ Systemd service created"
        echo ""
        echo "📋 Commands:"
        echo "   sudo systemctl start opencode-bot    # Start service"
        echo "   sudo systemctl stop opencode-bot     # Stop service"
        echo "   sudo systemctl status opencode-bot   # Check status"
        echo "   sudo journalctl -u opencode-bot -f   # View logs"
      else
        echo "⚠️  systemctl not available, skipping service setup"
      fi
    fi
  elif [ "$os" = "macos" ]; then
    echo ""
    read -p "🔧 Set up launchd service for 24/7 operation? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "🔧 Creating launchd service..."
      
      local plist_file="$HOME/Library/LaunchAgents/com.opencode.bot.plist"
      mkdir -p "$(dirname "$plist_file")"
      
      cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.opencode.bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.opencode/bin/opencode</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$HOME</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OPENCODE_CONFIG_DIR</key>
        <string>$config_dir</string>
        <key>CI</key>
        <string>true</string>
        <key>NODE_NO_WARNINGS</key>
        <string>1</string>
    </dict>
</dict>
</plist>
EOF
      
      launchctl unload "$plist_file" 2>/dev/null || true
      launchctl load "$plist_file"
      
      echo "✅ Launchd service created"
      echo ""
      echo "📋 Commands:"
      echo "   launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist    # Start"
      echo "   launchctl unload ~/Library/LaunchAgents/com.opencode.bot.plist  # Stop"
      echo "   tail -f $config_dir/opencode.log                                # View logs"
    fi
  fi
}

# Cleanup
cleanup() {
  rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

# Main
main() {
  echo "╔═══════════════════════════════════════════════╗"
  echo "║     Opencode Telegram Bot Plugin Installer    ║"
  echo "╚═══════════════════════════════════════════════╝"
  echo ""
  
  local os=$(detect_os)
  echo "💻 Detected OS: $os"
  
  check_deps
  
  local config_dir=$(find_config_dir "$os")
  echo "📂 Config directory: $config_dir"
  echo ""
  
  setup_config_dir "$config_dir"
  install_plugin "$config_dir"
  setup_service "$os" "$config_dir"
  
  echo ""
  echo "╔═══════════════════════════════════════════════╗"
  echo "║               ✅ Installation Complete!       ║"
  echo "╚═══════════════════════════════════════════════╝"
  echo ""
  echo "📋 Next Steps:"
  echo ""
  echo "1. Get your Telegram bot token from @BotFather"
  echo "2. Get your chat ID (message your bot, then check getUpdates)"
  echo "3. Edit: $config_dir/.env"
  echo "   TELEGRAM_BOT_TOKEN=your_token"
  echo "   TELEGRAM_ALLOWLIST=your_chat_id"
  echo ""
  echo "4. Restart opencode or start the service"
  echo ""
  if [ "$os" = "linux" ] || [ "$os" = "wsl" ]; then
    echo "   sudo systemctl start opencode-bot"
  elif [ "$os" = "macos" ]; then
    echo "   launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist"
  else
    echo "   Restart opencode manually"
  fi
  echo ""
  echo "📖 Documentation: https://github.com/nebojsa-simic/opencode-telegram-bot"
  echo ""
}

main "$@"
