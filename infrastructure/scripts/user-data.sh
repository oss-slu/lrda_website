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

# Install certbot
apt-get install -y certbot python3-certbot-nginx

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

# Configure Nginx for API-only (frontend is on Vercel)
# server_name is environment-aware:
#   staging:    api-staging.wherereligion.org
#   production: api.wherereligion.org
# Note: Terraform variables use ${var}, Nginx variables use $var (escaped as $$var in Terraform templatefile)
cat > /etc/nginx/sites-available/lrda << NGINX
server {
    listen 80;
    server_name ${api_subdomain}.${domain_name};

    # API routes - proxy to Fastify
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # CORS headers for frontend on different domain
        # Staging: https://staging.wherereligion.org
        # Production: https://wherereligion.org
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
echo "1. Point DNS to this server's IP"
echo "2. Run: sudo certbot --nginx -d ${api_subdomain}.${domain_name}"
echo "3. Deploy application code"
