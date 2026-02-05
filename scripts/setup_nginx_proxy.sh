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
cat << 'EOF' > /etc/nginx/sites-available/billing
server {
    listen 80;
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

# 2. Patch SSL Block (Dynamic Detection)
# We assume Certbot created a file. We search for it.
echo "🔍 Searching for SSL configuration..."

# Try to find a file in sites-available that contains the domain and 'ssl' or '443'
# This covers 'billing-le-ssl.conf', 'default-le-ssl.conf', 'billing.rkcasting.in.conf', etc.
SSL_CONF=$(grep -l "listen 443" /etc/nginx/sites-available/* | head -n 1)

if [ -z "$SSL_CONF" ]; then
    # Fallback: look for any -le-ssl.conf
    SSL_CONF=$(find /etc/nginx/sites-available -name "*-le-ssl.conf" | head -n 1)
fi

if [ -n "$SSL_CONF" ]; then
    echo "✅ Found SSL config: $SSL_CONF"
    
    # Enable SSL site (CRITICAL: Ensure it is linked)
    ln -sf "$SSL_CONF" /etc/nginx/sites-enabled/
    echo "🔗 Symlinked SSL config to sites-enabled"
    
    # SAFETY: Clean up
    if grep -q "location /api/" "$SSL_CONF"; then
        echo "🧹 Cleaning up old /api/ block..."
        sudo sed -i '/location \/api\/ {/,/}/d' "$SSL_CONF"
    fi

    echo "💉 Injecting fresh /api/ block..."
    
    get_api_location_block > /tmp/nginx_api_block.txt
    
    # Inject BEFORE 'location / {'
    sudo sed -i '/location \/ {/e cat /tmp/nginx_api_block.txt' "$SSL_CONF"
    
    rm /tmp/nginx_api_block.txt
    echo "✅ Patched $SSL_CONF"

else
    echo "⚠️ CRITICAL: No SSL configuration found listening on port 443!"
    echo "   The site will only work via HTTP (http://billing.rkcasting.in)"
    echo "   To fix HTTPS, you must SSH in and run: certbot --nginx -d billing.rkcasting.in"
fi

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
echo "Testing Nginx configuration..."
nginx -t

# RESTART Nginx (Systemctl)
echo "Restarting Nginx..."
service nginx restart || systemctl restart nginx
# Check status
systemctl status nginx --no-pager || true

echo "✅ Nginx Proxy Configured Successfully!"
