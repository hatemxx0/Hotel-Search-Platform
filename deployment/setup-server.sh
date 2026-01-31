#!/bin/bash

# Server setup script for Hotel Search Platform
# Run this script on a fresh Ubuntu 20.04+ server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run this script as root (use sudo)"
fi

log "Starting server setup for Hotel Search Platform..."

# Update system packages
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18.x
log "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js version: $NODE_VERSION"
log "NPM version: $NPM_VERSION"

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2

# Install Nginx
log "Installing Nginx..."
apt install -y nginx

# Install Redis
log "Installing Redis..."
apt install -y redis-server

# Configure Redis
log "Configuring Redis..."
sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl restart redis-server
systemctl enable redis-server

# Install Certbot for SSL
log "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install Fail2Ban for security
log "Installing Fail2Ban..."
apt install -y fail2ban

# Configure Fail2Ban
log "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# Configure UFW firewall
log "Configuring UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw deny 3001  # Block direct access to Node.js

# Create deploy user
log "Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    
    # Set up SSH for deploy user
    mkdir -p /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chown deploy:deploy /home/deploy/.ssh
    
    info "Deploy user created. You'll need to add your SSH public key to /home/deploy/.ssh/authorized_keys"
fi

# Create application directory
log "Creating application directory..."
mkdir -p /var/www/hotel-search
chown deploy:deploy /var/www/hotel-search

# Create log directories
log "Creating log directories..."
mkdir -p /var/log/hotel-search
mkdir -p /var/www/hotel-search/logs
chown deploy:deploy /var/www/hotel-search/logs

# Configure log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/hotel-search << 'EOF'
/var/www/hotel-search/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reload hotel-search-api
    endscript
}

/var/log/hotel-search/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}
EOF

# Configure Nginx
log "Configuring Nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Copy our nginx configuration
cp deployment/nginx.conf /etc/nginx/nginx.conf
cp deployment/proxy_params /etc/nginx/proxy_params

# Test Nginx configuration
nginx -t || error "Nginx configuration test failed"

# Start and enable services
log "Starting and enabling services..."
systemctl start nginx
systemctl enable nginx
systemctl start redis-server
systemctl enable redis-server

# Configure PM2 startup
log "Configuring PM2 startup..."
sudo -u deploy pm2 startup systemd -u deploy --hp /home/deploy

# Install monitoring tools
log "Installing monitoring tools..."
apt install -y htop iotop nethogs

# Configure system limits
log "Configuring system limits..."
cat >> /etc/security/limits.conf << 'EOF'
deploy soft nofile 65536
deploy hard nofile 65536
deploy soft nproc 32768
deploy hard nproc 32768
EOF

# Configure sysctl for better performance
log "Configuring sysctl..."
cat >> /etc/sysctl.conf << 'EOF'
# Network performance tuning
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 12582912 16777216
net.ipv4.tcp_wmem = 4096 12582912 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# File system performance
fs.file-max = 2097152
vm.swappiness = 10
EOF

sysctl -p

# Create backup directory
log "Creating backup directory..."
mkdir -p /var/backups/hotel-search
chown deploy:deploy /var/backups/hotel-search

# Set up automatic security updates
log "Configuring automatic security updates..."
apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# Create deployment script
log "Creating deployment script..."
cp deployment/deploy.sh /usr/local/bin/deploy-hotel-search
chmod +x /usr/local/bin/deploy-hotel-search

# Create environment file template
log "Creating environment file template..."
sudo -u deploy cp /var/www/hotel-search/.env.example /var/www/hotel-search/.env 2>/dev/null || true

# Final security hardening
log "Applying security hardening..."

# Disable root SSH login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (uncomment if using SSH keys only)
# sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

systemctl restart sshd

# Show status
log "Server setup completed successfully!"
echo
info "=== Server Setup Summary ==="
info "Node.js version: $(node --version)"
info "NPM version: $(npm --version)"
info "PM2 installed: $(pm2 --version)"
info "Nginx status: $(systemctl is-active nginx)"
info "Redis status: $(systemctl is-active redis-server)"
info "Fail2Ban status: $(systemctl is-active fail2ban)"
info "UFW status: $(ufw status | head -1)"
echo
warn "=== Next Steps ==="
warn "1. Add your SSH public key to /home/deploy/.ssh/authorized_keys"
warn "2. Clone your repository to /var/www/hotel-search"
warn "3. Configure your .env file with actual API keys"
warn "4. Update deployment/nginx.conf with your domain name"
warn "5. Run: certbot --nginx -d yourdomain.com"
warn "6. Deploy your application: /usr/local/bin/deploy-hotel-search"
echo
info "Reboot recommended to ensure all changes take effect."