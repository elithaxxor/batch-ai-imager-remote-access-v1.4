#!/bin/bash

# This script tests API key authentication and error handling for the WSB Trading backend
API_URL="http://localhost:3001/api/health"
VALID_API_KEY="your_valid_api_key_here" # <-- Replace with a valid key if available
INVALID_API_KEY="invalid_key"

# 1. Test with valid API key
echo "\n[1] Valid API Key: Should return 200 OK and health status"
curl -i -H "x-api-key: $VALID_API_KEY" "$API_URL"

# 2. Test with invalid API key
echo "\n[2] Invalid API Key: Should return 401 Unauthorized"
curl -i -H "x-api-key: $INVALID_API_KEY" "$API_URL"

# 3. Test with missing API key
echo "\n[3] Missing API Key: Should return 401 Unauthorized"
curl -i "$API_URL"

# 4. Test error handling: non-existent endpoint
echo "\n[4] Non-existent Endpoint: Should return 404 Not Found with error message"
curl -i -H "x-api-key: $VALID_API_KEY" "http://localhost:3001/api/doesnotexist"

# 5. Test malformed request (if applicable)
# Add more curl commands here if you have endpoints that expect POST data, etc.
