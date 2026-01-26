#!/bin/bash
set -e

echo "Starting Docker VPS Setup..."

# Update
sudo apt update && sudo apt upgrade -y

# Install tools
sudo apt install -y curl git nginx

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose (plugin is usually included now, but ensuring)
sudo apt install -y docker-compose-plugin

# Check
docker --version
docker compose version

# Install Certbot (for Host Nginx SSL)
sudo apt install -y certbot python3-certbot-nginx

echo "Docker Setup Complete! Please log out and back in for group changes to take effect."
