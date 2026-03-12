#!/bin/bash
# Lightsail bootstrap script for LRDA API server
# Installs: Node.js 24, pnpm, PostgreSQL 17, Nginx, PM2
# API runs on port 3002 via PM2, proxied through Nginx with Cloudflare Origin CA
set -e

# Log everything (POSIX-compatible -- Lightsail prepends a #!/bin/sh wrapper)
exec > /var/log/user-data.log 2>&1

echo "Starting LRDA server setup..."

# Update system
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# Install pnpm and PM2
npm install -g pnpm pm2

# Install PostgreSQL 17
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y postgresql-17

# Install Nginx and git
apt-get install -y nginx git

# Create directory and placeholder self-signed cert for Cloudflare Origin CA
# (nginx needs a cert to start; replace with real Origin CA cert after terraform apply)
mkdir -p /etc/ssl/cloudflare
openssl req -x509 -newkey rsa:2048 -keyout /etc/ssl/cloudflare/origin-key.pem \
  -out /etc/ssl/cloudflare/origin.pem -days 1 -nodes \
  -subj "/CN=placeholder.${domain_name}" 2>/dev/null
chmod 600 /etc/ssl/cloudflare/origin-key.pem

# Configure PostgreSQL
# Quoted heredocs ('EOF') prevent shell from expanding $ in Terraform-resolved values
sudo -u postgres psql << 'EOF'
CREATE USER lrda_app;
CREATE DATABASE lrda_${environment} OWNER lrda_app;
GRANT ALL PRIVILEGES ON DATABASE lrda_${environment} TO lrda_app;
\c lrda_${environment}
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

# Set password with quoted heredoc (password may contain $ or other shell-special chars)
sudo -u postgres psql << 'EOF'
ALTER USER lrda_app PASSWORD '${db_password}';
EOF

# Configure PostgreSQL to allow local connections
echo "host lrda_${environment} lrda_app 127.0.0.1/32 md5" >> /etc/postgresql/17/main/pg_hba.conf
systemctl restart postgresql

# Create app directory
mkdir -p /home/ubuntu/lrda
chown ubuntu:ubuntu /home/ubuntu/lrda

# Generate a real BETTER_AUTH_SECRET
AUTH_SECRET=$(openssl rand -hex 32)

# Create environment file
# Quoted heredoc ('EOF') prevents shell expansion of $ in password and other values
cat > /home/ubuntu/lrda/.env << 'EOF'
ENVIRONMENT=${environment}
PORT=3002
DATABASE_URL=postgresql://lrda_app:${db_password}@localhost:5432/lrda_${environment}

# Better Auth
BETTER_AUTH_SECRET=__AUTH_SECRET__
BETTER_AUTH_URL=https://${api_subdomain}.${domain_name}
WEB_URL=https://${frontend_origin}

# CORS
CORS_ORIGINS=https://${frontend_origin}

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@wheresreligion.org

# Google Maps (for reverse geocoding)
GOOGLE_MAPS_API_KEY=
EOF

# Inject generated auth secret (openssl rand -hex only produces [0-9a-f], safe for sed)
sed -i "s/__AUTH_SECRET__/$AUTH_SECRET/" /home/ubuntu/lrda/.env

chown ubuntu:ubuntu /home/ubuntu/lrda/.env
chmod 600 /home/ubuntu/lrda/.env

# Create PM2 ecosystem file
cat > /home/ubuntu/lrda/ecosystem.config.cjs << 'PMCONF'
module.exports = {
  apps: [{
    name: 'lrda-api',
    cwd: '/home/ubuntu/lrda/packages/api',
    script: 'src/index.ts',
    interpreter: 'node',
    interpreter_args: '--env-file=/home/ubuntu/lrda/.env --import tsx',
    instances: 1,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
PMCONF
chown ubuntu:ubuntu /home/ubuntu/lrda/ecosystem.config.cjs

# Configure Nginx for API-only (frontend is on Cloudflare Workers)
# SSL: Cloudflare Origin CA cert. Install cert/key after terraform apply:
#   terraform output -raw origin_ca_certificate > /etc/ssl/cloudflare/origin.pem
#   terraform output -raw origin_ca_private_key > /etc/ssl/cloudflare/origin-key.pem
# NOTE: This heredoc is intentionally UNQUOTED so \$ becomes $ in the nginx config
cat > /etc/nginx/sites-available/lrda << NGINX
server {
    listen 80;
    server_name ${api_subdomain}.${domain_name};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${api_subdomain}.${domain_name};

    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin-key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/lrda /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Set up PM2 to run on boot (user-data runs as root, so this installs the systemd unit directly)
pm2 startup systemd -u ubuntu --hp /home/ubuntu
systemctl enable pm2-ubuntu

echo "LRDA server setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Origin CA cert from Terraform outputs:"
echo "   tofu output -raw origin_ca_certificate | ssh ubuntu@<IP> 'sudo tee /etc/ssl/cloudflare/origin.pem > /dev/null'"
echo "   tofu output -raw origin_ca_private_key | ssh ubuntu@<IP> 'sudo tee /etc/ssl/cloudflare/origin-key.pem > /dev/null && sudo chmod 600 /etc/ssl/cloudflare/origin-key.pem'"
echo "   ssh ubuntu@<IP> 'sudo nginx -t && sudo systemctl reload nginx'"
echo "2. Run deploy.sh on the server"
