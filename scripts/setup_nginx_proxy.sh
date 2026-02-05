#!/bin/bash
set -e

# Function to generate the location block content
get_api_location_block() {
    cat <<EOF

    # API Proxy added by setup script
    location /api/ {
        # Trailing slash is CRITICAL here to strip /api/ from the request
        proxy_pass http://localhost:5000/; 
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
EOF
}

echo "Configuring Nginx Proxy..."

# 1. Configure HTTP Block (billing)
# We overwrite this file completely to ensure it has the correct base config.
# NOTE: If you wanted valid HTTPS redirection, Certbot might have modified this. 
# For now, we ensure it proxies correctly for HTTP OR serves as the base.
# If Certbot is used, it usually creates a separate -le-ssl.conf file for HTTPS.

cat << 'EOF' > /etc/nginx/sites-available/billing
server {
    server_name billing.rkcasting.in;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site (force link)
ln -sf /etc/nginx/sites-available/billing /etc/nginx/sites-enabled/

# 2. Patch SSL Block (billing-le-ssl.conf)
# This is where the HTTPS traffic lives. We must inject the /api/ block here too.
SSL_CONF="/etc/nginx/sites-available/billing-le-ssl.conf"

if [ -f "$SSL_CONF" ]; then
    echo "Found SSL config: $SSL_CONF"
    
    # Check if /api/ block already exists to avoid duplication
    if grep -q "location /api/" "$SSL_CONF"; then
        echo "✅ /api/ location block already exists in SSL config."
    else
        echo "⚠️ /api/ location missing in SSL config. Injecting it..."
        
        # We inject the API block BEFORE the 'location /' block.
        # We use a temporary file to construct the new config
        
        # 1. Create a temp file with the API block
        get_api_location_block > /tmp/nginx_api_block.txt
        
        # 2. Insert the content of the temp file before "location / {" using sed
        # Note: We use a safe delimiter for sed if needed, but here standard works.
        # We look for the line containing "location / {" and insert our block before it.
        sudo sed -i '/location \/ {/e cat /tmp/nginx_api_block.txt' "$SSL_CONF"
        
        rm /tmp/nginx_api_block.txt
        echo "✅ Injected /api/ block into $SSL_CONF"
    fi
else
    echo "ℹ️ No SSL config found at $SSL_CONF. If you use HTTPS, ensure the /api/ block is added to your SSL server block manually."
fi

# Remove default Nginx site if it exists to avoid conflicts
rm -f /etc/nginx/sites-enabled/default

# Test configuration
echo "Testing Nginx configuration..."
nginx -t

# Restart Nginx to apply changes
echo "Restarting Nginx..."
systemctl restart nginx

echo "✅ Nginx Proxy Configured Successfully!"
