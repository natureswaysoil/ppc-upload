#!/usr/bin/env python3
"""
Amazon Advertising API Connection Test
========================================

This script tests the connection to the Amazon Advertising API to verify:
1. API credentials are valid
2. Can obtain access token
3. Can retrieve profile information
4. Can make basic API calls

Usage:
    python test_amazon_connection.py --config config.json
    python test_amazon_connection.py --config config.json --profile-id YOUR_PROFILE_ID
"""

import argparse
import json
import sys
import time
from typing import Dict, Optional, Tuple

try:
    import requests
except ImportError:
    print("ERROR: requests library is required. Install with: pip install requests")
    sys.exit(1)

# Amazon Advertising API endpoints
ENDPOINTS = {
    "NA": "https://advertising-api.amazon.com",
    "EU": "https://advertising-api-eu.amazon.com",
    "FE": "https://advertising-api-fe.amazon.com",
}

TOKEN_URL = "https://api.amazon.com/auth/o2/token"
USER_AGENT = "PPC-Connection-Test/1.0"

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")


def print_error(text: str):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{YELLOW}⚠️  {text}{RESET}")


def print_info(text: str):
    """Print info message"""
    print(f"{BLUE}ℹ️  {text}{RESET}")


def print_header(text: str):
    """Print formatted header"""
    print(f"\n{BLUE}{'=' * 70}")
    print(f"{text}")
    print(f"{'=' * 70}{RESET}\n")


def load_config(config_path: str) -> Dict:
    """Load configuration from JSON file"""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print_warning(f"Configuration file not found: {config_path}")
        return {}
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON in configuration file: {e}")
        sys.exit(1)


def get_access_token(client_id: str, client_secret: str, refresh_token: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Obtain access token from Amazon using refresh token
    
    Returns:
        Tuple of (access_token, error_message)
    """
    try:
        print_info("Requesting access token from Amazon...")
        
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': client_id,
            'client_secret': client_secret
        }
        
        response = requests.post(TOKEN_URL, data=data, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            expires_in = token_data.get('expires_in', 3600)
            
            print_success(f"Access token obtained (expires in {expires_in} seconds)")
            return access_token, None
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            return None, error_msg
            
    except requests.exceptions.Timeout:
        return None, "Request timed out after 10 seconds"
    except requests.exceptions.RequestException as e:
        return None, f"Network error: {str(e)}"
    except Exception as e:
        return None, f"Unexpected error: {str(e)}"


def test_profiles_api(access_token: str, region: str, client_id: str) -> Tuple[bool, Optional[str], Optional[list]]:
    """
    Test the profiles API endpoint
    
    Returns:
        Tuple of (success, error_message, profiles_list)
    """
    try:
        endpoint = ENDPOINTS.get(region, ENDPOINTS["NA"])
        url = f"{endpoint}/v2/profiles"
        
        print_info(f"Testing profiles API at: {url}")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Amazon-Advertising-API-ClientId': client_id,
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            profiles = response.json()
            print_success(f"Profiles API responded successfully ({len(profiles)} profiles found)")
            return True, None, profiles
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            return False, error_msg, None
            
    except requests.exceptions.Timeout:
        return False, "Request timed out after 10 seconds", None
    except requests.exceptions.RequestException as e:
        return False, f"Network error: {str(e)}", None
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", None


def test_specific_profile(access_token: str, region: str, profile_id: str, client_id: str) -> Tuple[bool, Optional[str], Optional[Dict]]:
    """
    Test access to a specific profile
    
    Returns:
        Tuple of (success, error_message, profile_data)
    """
    try:
        endpoint = ENDPOINTS.get(region, ENDPOINTS["NA"])
        url = f"{endpoint}/v2/profiles/{profile_id}"
        
        print_info(f"Testing access to profile: {profile_id}")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Amazon-Advertising-API-ClientId': client_id,
            'Amazon-Advertising-API-Scope': profile_id,
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            profile = response.json()
            print_success(f"Profile access successful")
            return True, None, profile
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            return False, error_msg, None
            
    except requests.exceptions.Timeout:
        return False, "Request timed out after 10 seconds", None
    except requests.exceptions.RequestException as e:
        return False, f"Network error: {str(e)}", None
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", None


def _get_secret_manager_value(secret_name: str, project_id: Optional[str] = None) -> Optional[str]:
    """Fetch a secret value from Google Secret Manager if available."""
    try:
        # Lazy import to avoid hard dependency when not needed
        from google.cloud import secretmanager  # type: ignore
        import os
        pid = project_id or os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('GCLOUD_PROJECT')
        if not pid:
            return None
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{pid}/secrets/{secret_name}/versions/latest"
        response = client.access_secret_version(request={"name": name})
        payload = response.payload.data.decode('utf-8')
        return payload.strip()
    except Exception:
        return None


def _get_credential(name: str, default: str = "") -> str:
    """Resolve a credential from ENV first, then Secret Manager, else default."""
    import os
    val = os.environ.get(name)
    if val:
        return val.strip()
    # Try Secret Manager
    sm_val = _get_secret_manager_value(name)
    if sm_val:
        return sm_val.strip()
    return default


def main():
    parser = argparse.ArgumentParser(
        description='Test Amazon Advertising API Connection'
    )
    parser.add_argument(
        '--config',
        default='config.json',
        help='Path to configuration file (default: config.json)'
    )
    parser.add_argument(
        '--profile-id',
        help='Optional: Test access to a specific profile ID'
    )
    
    args = parser.parse_args()
    
    print_header("Amazon Advertising API Connection Test")
    
    # Step 1: Load configuration
    print_info(f"Loading configuration from: {args.config}")
    config = load_config(args.config)
    
    # Check if credentials are placeholders
    api_config = config.get('amazon_api', {})
    # Resolve credentials from ENV/Secret Manager if config missing or placeholders
    client_id = api_config.get('client_id', '') or _get_credential('AMAZON_CLIENT_ID')
    client_secret = api_config.get('client_secret', '') or _get_credential('AMAZON_CLIENT_SECRET')
    refresh_token = api_config.get('refresh_token', '') or _get_credential('AMAZON_REFRESH_TOKEN')
    region = api_config.get('region', 'NA')
    config_profile_id = api_config.get('profile_id', '') or _get_credential('AMAZON_PROFILE_ID')
    
    if (not client_id or not client_secret or not refresh_token) or \
       ('YOUR_' in client_id or 'YOUR_' in client_secret or 'YOUR_' in refresh_token):
        print_error("Missing or placeholder credentials. Set ENV or Secrets:")
        print_warning("ENV variables (preferred): AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN, AMAZON_PROFILE_ID")
        print_warning("Or store them in Google Secret Manager with the same names.")
        sys.exit(1)
    
    print_success("Configuration loaded")
    print_info(f"Region: {region}")
    print_info(f"Endpoint: {ENDPOINTS.get(region, ENDPOINTS['NA'])}")
    
    # Step 2: Get access token
    print_header("Step 1: Testing OAuth Authentication")
    access_token, error = get_access_token(client_id, client_secret, refresh_token)
    
    if not access_token:
        print_error(f"Failed to obtain access token: {error}")
        print_warning("Common issues:")
        print_warning("  - Refresh token expired (they expire after a period of time)")
        print_warning("  - Invalid client credentials")
        print_warning("  - Network connectivity issues")
        sys.exit(1)
    
    # Step 3: Test profiles API
    print_header("Step 2: Testing Profiles API")
    success, error, profiles = test_profiles_api(access_token, region, client_id)
    
    if not success:
        print_error(f"Profiles API test failed: {error}")
        print_warning("This may indicate:")
        print_warning("  - Access token is valid but API permissions are insufficient")
        print_warning("  - Account not properly set up for Advertising API")
        sys.exit(1)
    
    # Display profiles if any
    if profiles:
        print_info(f"Found {len(profiles)} profile(s):")
        for profile in profiles:
            profile_id = profile.get('profileId', 'N/A')
            account_info = profile.get('accountInfo', {})
            marketplace = account_info.get('marketplaceStringId', 'N/A')
            name = account_info.get('name', 'N/A')
            profile_type = account_info.get('type', 'N/A')
            
            print(f"    • Profile ID: {profile_id}")
            print(f"      Marketplace: {marketplace}")
            print(f"      Name: {name}")
            print(f"      Type: {profile_type}")
            print()
    
    # Step 4: Test specific profile if provided
    profile_to_test = args.profile_id or config_profile_id
    profile_test_passed = True
    
    if profile_to_test and profile_to_test != 'YOUR_PROFILE_ID_HERE':
        print_header("Step 3: Testing Specific Profile Access")
        success, error, profile_data = test_specific_profile(access_token, region, profile_to_test, client_id)
        
        if not success:
            print_error(f"Profile access test failed: {error}")
            print_warning(f"Unable to access profile: {profile_to_test}")
            print_warning("Check that the profile ID is correct")
            profile_test_passed = False
        else:
            print_success(f"Successfully accessed profile: {profile_to_test}")
            if profile_data:
                print_info("Profile details:")
                account_info = profile_data.get('accountInfo', {})
                print(f"    Name: {account_info.get('name', 'N/A')}")
                print(f"    Marketplace: {account_info.get('marketplaceStringId', 'N/A')}")
                print(f"    Type: {account_info.get('type', 'N/A')}")
    else:
        print_warning("No profile ID provided, skipping profile-specific tests")
        print_info("Use --profile-id to test access to a specific profile")
    
    # Final summary
    print_header("Connection Test Summary")
    print_success("✅ OAuth authentication successful")
    print_success("✅ Profiles API accessible")
    
    if profile_to_test and profile_to_test != 'YOUR_PROFILE_ID_HERE':
        if profile_test_passed:
            print_success("✅ Profile access verified")
        else:
            print_error("❌ Profile access failed")
            print()
            print_error("Connection test failed - profile access could not be verified")
            return 1
    
    print()
    print_success("🎉 Amazon Advertising API connection is working!")
    print_info("You can now run the PPC optimizer with confidence")
    
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print()
        print_warning("Connection test cancelled by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
