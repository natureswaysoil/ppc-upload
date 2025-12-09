# Amazon API Connection Test Guide

This guide explains how to use the `test_amazon_connection.py` script to verify your Amazon Advertising API credentials and connection before running the PPC optimizer.

---

## Why Test the Connection?

Testing your API connection **before** running the optimizer helps you:

✅ Verify that your API credentials are correct  
✅ Confirm your refresh token hasn't expired  
✅ Check that you have proper API access  
✅ Validate network connectivity to Amazon endpoints  
✅ Ensure your profile ID is accessible  

This saves time by catching authentication issues early, before attempting to run the full optimizer.

---

## Prerequisites

1. Python 3.7 or higher installed
2. `requests` library installed (`pip install requests`)
3. Amazon Advertising API credentials configured in `config.json`

---

## Quick Start

### Basic Connection Test

Test your API connection with just the config file:

```bash
python test_amazon_connection.py --config config.json
```

### Test with Specific Profile

Test connection and verify access to a specific profile:

```bash
python test_amazon_connection.py --config config.json --profile-id YOUR_PROFILE_ID
```

---

## Understanding the Output

### ✅ Successful Connection

```
======================================================================
Amazon Advertising API Connection Test
======================================================================

ℹ️  Loading configuration from: config.json
✅ Configuration loaded
ℹ️  Region: NA
ℹ️  Endpoint: https://advertising-api.amazon.com

======================================================================
Step 1: Testing OAuth Authentication
======================================================================

ℹ️  Requesting access token from Amazon...
✅ Access token obtained (expires in 3600 seconds)

======================================================================
Step 2: Testing Profiles API
======================================================================

ℹ️  Testing profiles API at: https://advertising-api.amazon.com/v2/profiles
✅ Profiles API responded successfully (2 profiles found)
ℹ️  Found 2 profile(s):
    • Profile ID: 1234567890
      Marketplace: ATVPDKIKX0DER
      Name: My Store
      Type: seller

======================================================================
Step 3: Testing Specific Profile Access
======================================================================

ℹ️  Testing access to profile: 1234567890
✅ Successfully accessed profile: 1234567890
ℹ️  Profile details:
    Name: My Store
    Marketplace: ATVPDKIKX0DER
    Type: seller

======================================================================
Connection Test Summary
======================================================================

✅ OAuth authentication successful
✅ Profiles API accessible
✅ Profile access verified

🎉 Amazon Advertising API connection is working!
ℹ️  You can now run the PPC optimizer with confidence
```

### ❌ Placeholder Credentials Detected

```
❌ Configuration contains placeholder values
⚠️  Please update config.json with your actual Amazon API credentials:
⚠️    - client_id: Your Amazon Advertising API client ID
⚠️    - client_secret: Your client secret
⚠️    - refresh_token: Your refresh token
⚠️    - profile_id: Your profile ID

ℹ️  See API_SETUP_GUIDE.md for instructions on obtaining credentials
```

**Action:** Update your `config.json` with real API credentials.

### ❌ Authentication Failed

```
❌ Failed to obtain access token: HTTP 400: {"error":"invalid_grant"}
⚠️  Common issues:
⚠️    - Refresh token expired (they expire after a period of time)
⚠️    - Invalid client credentials
⚠️    - Network connectivity issues
```

**Common Causes:**
1. **Expired Refresh Token** - Refresh tokens expire after a period of inactivity. You need to generate a new one.
2. **Invalid Credentials** - Double-check your `client_id`, `client_secret`, and `refresh_token` in `config.json`.
3. **Network Issues** - Check your internet connection and firewall settings.

**Solutions:**
- Regenerate your refresh token using the Amazon Advertising API authorization flow
- Verify credentials in Amazon Advertising Console
- Check API_SETUP_GUIDE.md for credential setup instructions

### ❌ API Access Issues

```
❌ Profiles API test failed: HTTP 403: Forbidden
⚠️  This may indicate:
⚠️    - Access token is valid but API permissions are insufficient
⚠️    - Account not properly set up for Advertising API
```

**Common Causes:**
1. **Insufficient Permissions** - Your API application doesn't have the required permissions.
2. **Account Not Approved** - Your Amazon Advertising API application needs approval.

**Solutions:**
- Review your API application permissions in Amazon Advertising Console
- Ensure your account has access to Amazon Advertising API
- Contact Amazon Advertising API support if needed

---

## Configuration Setup

Your `config.json` should contain valid Amazon API credentials:

```json
{
  "amazon_api": {
    "region": "NA",
    "profile_id": "1234567890",
    "client_id": "amzn1.application-oa2-client.xxxxxxxxxxxxx",
    "client_secret": "your_actual_client_secret_here",
    "refresh_token": "Atzr|IwEBIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `region` | Amazon region (NA, EU, or FE) | `"NA"` |
| `profile_id` | Your advertising profile ID | `"1234567890"` |
| `client_id` | OAuth client ID from Amazon | `"amzn1.application-oa2-client.xxx"` |
| `client_secret` | OAuth client secret | Your secret key |
| `refresh_token` | OAuth refresh token | `"Atzr\|IwEBIxxx"` |

---

## Regions and Endpoints

The script automatically selects the correct endpoint based on your region:

| Region | Code | Endpoint |
|--------|------|----------|
| North America | `NA` | `https://advertising-api.amazon.com` |
| Europe | `EU` | `https://advertising-api-eu.amazon.com` |
| Far East | `FE` | `https://advertising-api-fe.amazon.com` |

---

## What the Script Tests

### 1. OAuth Authentication

Tests the refresh token flow to obtain an access token:
- Sends refresh token to Amazon OAuth endpoint
- Validates client credentials
- Checks token response
- Verifies token expiration time

### 2. Profiles API

Tests basic API access:
- Calls the profiles endpoint
- Validates API permissions
- Lists available profiles
- Shows profile details (marketplace, type, name)

### 3. Profile Access (Optional)

If a profile ID is provided:
- Tests direct profile access
- Verifies profile-specific permissions
- Confirms profile configuration

---

## Troubleshooting

### "Module not found: requests"

**Solution:**
```bash
pip install requests
```

### "Configuration file not found"

**Solution:**
Make sure you're running the script from the correct directory or specify the full path:
```bash
python test_amazon_connection.py --config /path/to/config.json
```

### "Invalid JSON in configuration file"

**Solution:**
Check your `config.json` for syntax errors:
```bash
python -c "import json; json.load(open('config.json'))"
```

### Refresh Token Expired

**Solution:**
1. Go to Amazon Advertising API console
2. Regenerate your refresh token
3. Update `config.json` with the new token
4. Run the test again

### Network Timeout

**Solution:**
- Check your internet connection
- Verify firewall isn't blocking Amazon API endpoints
- Try again in a few minutes

---

## Integration with PPC Optimizer

After successfully testing the connection, you can run the PPC optimizer:

```bash
# Test connection first
python test_amazon_connection.py --config config.json

# If connection test passes, run optimizer in dry-run mode
python amazon_ppc_optimizer.py --config config.json --profile-id YOUR_PROFILE_ID --dry-run

# When satisfied, run live
python amazon_ppc_optimizer.py --config config.json --profile-id YOUR_PROFILE_ID
```

---

## Security Notes

⚠️ **Never commit `config.json` with real credentials to version control**

✅ **Best Practices:**
- Keep `config.json` out of git (use `.gitignore`)
- Use environment variables for production
- Rotate credentials regularly
- Restrict API application permissions to minimum required

---

## Getting Help

If the connection test fails:

1. **Check the error message** - It usually indicates the problem
2. **Review API_SETUP_GUIDE.md** - Comprehensive credential setup guide
3. **Verify credentials** - Double-check all values in `config.json`
4. **Test network** - Ensure you can reach Amazon's API endpoints
5. **Check API status** - Visit Amazon Advertising API status page

---

## Command-Line Options

```
usage: test_amazon_connection.py [-h] [--config CONFIG] [--profile-id PROFILE_ID]

Test Amazon Advertising API Connection

optional arguments:
  -h, --help            show this help message and exit
  --config CONFIG       Path to configuration file (default: config.json)
  --profile-id PROFILE_ID
                        Optional: Test access to a specific profile ID
```

---

## Exit Codes

The script returns different exit codes based on the test result:

- `0` - All tests passed successfully
- `1` - Test failed or error occurred

You can use this in scripts:

```bash
if python test_amazon_connection.py --config config.json; then
    echo "Connection successful, proceeding with optimizer"
    python amazon_ppc_optimizer.py --config config.json --profile-id YOUR_ID
else
    echo "Connection failed, please check credentials"
    exit 1
fi
```

---

## Next Steps

After successful connection test:

1. ✅ Run the PPC optimizer in dry-run mode
2. ✅ Review proposed changes
3. ✅ Run the optimizer live
4. ✅ Monitor logs and results
5. ✅ Schedule automatic runs

---

**Connection test successful?** You're ready to optimize! 🚀
