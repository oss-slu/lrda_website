#!/bin/bash
# EC2 bootstrap script for LRDA API server
set -e

# Log everything
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting LRDA server setup..."

# Update system
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL 16
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y postgresql-16

# Install Nginx
apt-get install -y nginx

# Install PM2
npm install -g pm2

# Create directory for Cloudflare Origin CA cert
mkdir -p /etc/ssl/cloudflare

# Configure PostgreSQL
sudo -u postgres psql << EOF
CREATE USER lrda_app WITH PASSWORD '${db_password}';
CREATE DATABASE lrda_${environment} OWNER lrda_app;
GRANT ALL PRIVILEGES ON DATABASE lrda_${environment} TO lrda_app;
\c lrda_${environment}
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

# Configure PostgreSQL to allow local connections
echo "host lrda_${environment} lrda_app 127.0.0.1/32 md5" >> /etc/postgresql/16/main/pg_hba.conf
systemctl restart postgresql

# Create app directory
mkdir -p /home/ubuntu/lrda
chown ubuntu:ubuntu /home/ubuntu/lrda

# Create environment file
cat > /home/ubuntu/lrda/.env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://lrda_app:${db_password}@localhost:5432/lrda_${environment}
AWS_REGION=${aws_region}
DOMAIN=${domain_name}
ENVIRONMENT=${environment}

# Keep using RERUM S3 proxy for media (no migration needed initially)
S3_PROXY_URL=http://s3-proxy.rerum.io/S3/

# Uncomment below when ready to use your own S3 bucket
# S3_BUCKET=your-bucket-name
EOF
chown ubuntu:ubuntu /home/ubuntu/lrda/.env
chmod 600 /home/ubuntu/lrda/.env

# Configure Nginx for API-only (frontend is on Cloudflare Workers)
# server_name is environment-aware:
#   staging:    api-staging.wheresreligion.org
#   production: api.wheresreligion.org
#
# SSL: Cloudflare Origin CA cert. Install cert/key after terraform apply:
#   terraform output -raw origin_ca_certificate > /etc/ssl/cloudflare/origin.pem
#   terraform output -raw origin_ca_private_key > /etc/ssl/cloudflare/origin-key.pem
#
# Note: Terraform templatefile uses $${var}, Nginx uses $var (escaped as \$var)
cat > /etc/nginx/sites-available/lrda << NGINX
# Redirect HTTP to HTTPS (Cloudflare also does this, but belt-and-suspenders)
server {
    listen 80;
    server_name ${api_subdomain}.${domain_name};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${api_subdomain}.${domain_name};

    # Cloudflare Origin CA certificate
    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin-key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # API routes - proxy to Hono
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # CORS headers for frontend on Cloudflare Workers
        add_header Access-Control-Allow-Origin "https://${frontend_origin}" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://${frontend_origin}" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/lrda /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Set up PM2 to run on boot
sudo -u ubuntu pm2 startup systemd -u ubuntu --hp /home/ubuntu
systemctl enable pm2-ubuntu

echo "LRDA server setup complete!"
echo "Next steps:"
echo "1. Install Origin CA cert from Terraform outputs:"
echo "   terraform output -raw origin_ca_certificate | sudo tee /etc/ssl/cloudflare/origin.pem"
echo "   terraform output -raw origin_ca_private_key | sudo tee /etc/ssl/cloudflare/origin-key.pem"
echo "   sudo chmod 600 /etc/ssl/cloudflare/origin-key.pem"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "2. Deploy application code"
