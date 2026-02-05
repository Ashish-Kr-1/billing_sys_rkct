#!/bin/bash

# Test Company Config API Endpoint
# This script tests if the company config endpoint is working

echo "🧪 Testing Company Config API Endpoints..."
echo ""

# Test Company 1
echo "=== Company 1 ==="
curl -s http://localhost:5000/companies/1/config \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  | jq '.' 2>/dev/null || echo "Note: Install jq for formatted output, or remove '| jq' from script"

echo ""
echo "=== Company 2 ==="
curl -s http://localhost:5000/companies/2/config \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  | jq '.' 2>/dev/null || echo "Note: Install jq for formatted output"

echo ""
echo "=== Company 3 ==="
curl -s http://localhost:5000/companies/3/config \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  | jq '.' 2>/dev/null || echo "Note: Install jq for formatted output"

echo ""
echo "✅ Test complete!"
echo ""
echo "Note: If you see 401 errors, you need to:"
echo "1. Login to get auth token"
echo "2. Replace 'YOUR_TOKEN_HERE' with actual token in this script"
