#!/bin/bash
# Setup opencode as a 24/7 service for Telegram bot

set -e

echo "🤖 Setting up opencode Telegram bot service..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Linux detected - creating systemd service"
    
    SERVICE_FILE="/etc/systemd/system/opencode-bot.service"
    
    sudo tee "$SERVICE_FILE" > /dev/null << SERVICEEOF
[Unit]
Description=OpenCode Telegram Bot
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
Environment=PATH=$HOME/.opencode/bin:/usr/local/bin:/usr/bin:/bin
Environment=HOME=$HOME
Environment=OPENCODE_CONFIG_DIR=$HOME/.config/opencode-bot
Environment=NODE_NO_WARNINGS=1
Environment=CI=true
StandardOutput=journal
StandardError=journal
SyslogIdentifier=opencode-bot
KillMode=mixed
KillSignal=SIGTERM
SendSIGKILL=yes
FinalKillSignal=SIGKILL

[Install]
WantedBy=multi-user.target
SERVICEEOF

    # Enable linger for 24/7 operation
    echo "📌 Enabling user linger for 24/7 operation..."
    sudo loginctl enable-linger $(whoami) 2>/dev/null || true
    
    # Start service
    echo "🚀 Starting service..."
    sudo systemctl daemon-reload
    sudo systemctl enable opencode-bot
    sudo systemctl start opencode-bot
    
    # Show status
    echo ""
    echo "✅ Service installed and started!"
    sudo systemctl status opencode-bot --no-pager | head -15
    
    echo ""
    echo "📝 Useful commands:"
    echo "   sudo systemctl status opencode-bot"
    echo "   sudo journalctl -u opencode-bot -f"
    echo "   sudo systemctl restart opencode-bot"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS detected - creating launchd service"
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.opencode.bot.plist"
    
    cat > "$PLIST_FILE" << PLISTEOF
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
        <string>$HOME/.config/opencode-bot</string>
        <key>CI</key>
        <string>true</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
    <key>StandardOutPath</key>
    <string>$HOME/.config/opencode-bot/opencode.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.config/opencode-bot/opencode.err</string>
    <key>SoftResourceLimits</key>
    <dict>
        <key>Memory</key>
        <integer>2147483648</integer>
    </dict>
</dict>
</plist>
PLISTEOF

    # Start service
    echo "🚀 Starting service..."
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    # Show status
    echo ""
    echo "✅ Service installed and started!"
    launchctl list | grep opencode || echo "   (Service may take a moment to start)"
    
    echo ""
    echo "📝 Useful commands:"
    echo "   launchctl list | grep opencode"
    echo "   tail -f $HOME/.config/opencode-bot/opencode.log"
    echo "   launchctl unload/load $PLIST_FILE"
    
else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "   Please set up opencode to run manually or create your own service"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Send a message to your Telegram bot to test it."
