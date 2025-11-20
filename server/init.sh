#!/bin/bash
set -e  # exit on any error

# Update packages
# sudo yum update -y

# Install Git
# sudo yum install git -y

# Install Docker
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Set up environment variables
if [ -f .env.example ]; then
    cp .env.example .env
    echo ".env file created from .env.example"
fi

# Start Docker Compose
docker-compose up -d --build