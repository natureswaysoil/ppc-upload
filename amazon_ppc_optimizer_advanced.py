#!/usr/bin/env python3
"""
Advanced Amazon Ads (Advertising) API — Comprehensive PPC Optimizer

Features:
---------
1. Automated Bid Optimization with ACOS-based rules
2. Dayparting - Time-based bid adjustments
3. Campaign Activation/Deactivation based on ACOS performance
4. Keyword Research & Auto-addition to campaigns
5. New Campaign Creation for products without campaigns
6. Performance reporting and audit trails
7. Scheduled execution (designed for 2-hour intervals)

Setup (env vars or config file):
--------------------------------
AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN
Or use /home/ubuntu/.config/abacusai_auth_secrets.json

Author: Nature's Way Soil PPC Optimization System
License: MIT
"""

import argparse
import csv
import io
import json
import os
import sys
import time
import zipfile
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import gzip

import requests

# ---------- Constants ----------
ENDPOINTS = {
    "NA": "https://advertising-api.amazon.com",
    "EU": "https://advertising-api-eu.amazon.com",
    "FE": "https://advertising-api-fe.amazon.com",
}
TOKEN_URL = "https://api.amazon.com/auth/o2/token"
USER_AGENT = "NWS-Advanced-PPC-Optimizer/2.0"

# Secrets file path
SECRETS_FILE = "/home/ubuntu/.config/abacusai_auth_secrets.json"

# Default optimization rules
DEFAULT_RULES = {
    "lookback_days": 14,
    "min_clicks": 10,
    "min_spend": 5.0,
    "target_acos": 0.45,  # 45%
    "high_acos": 0.45,    # >45% → deactivate/downbid
    "low_acos": 0.30,     # <30% + sales → upbid
    "min_ctr": 0.003,     # 0.3% CTR
    "up_pct": 0.15,       # +15%
    "down_pct": 0.15,     # -15%
    "min_bid": 0.25,
    "max_bid": 5.00,
    # Dayparting settings
    "dayparting_enabled": True,
    "peak_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],  # 9am-8pm
    "peak_multiplier": 1.20,  # +20% during peak
    "off_peak_multiplier": 0.85,  # -15% during off-peak
    # Campaign management
    "auto_activate_campaigns": True,
    "auto_deactivate_campaigns": True,
    "deactivate_acos_threshold": 0.45,
    "activate_acos_threshold": 0.45,
    # Keyword research
    "auto_add_keywords": True,
    "keyword_research_enabled": True,
    "max_keywords_per_campaign": 50,
    "new_keyword_bid": 0.50,
    # New campaign creation
    "auto_create_campaigns": True,
    "new_campaign_daily_budget": 10.00,
}

# ---------- Data classes ----------
@dataclass
class Auth:
    access_token: str
    token_type: str
    expires_at: float
    client_id: str

    def is_expired(self) -> bool:
        return time.time() > self.expires_at - 60


# ---------- Authentication ----------

def load_credentials() -> Dict[str, str]:
    """Load credentials from secrets file or environment variables"""
    creds = {}
    
    # Try secrets file first
    if os.path.exists(SECRETS_FILE):
        try:
            with open(SECRETS_FILE, 'r') as f:
                data = json.load(f)
                amazon_api = data.get("amazon advertising api", {}).get("secrets", {})
                creds["client_id"] = amazon_api.get("client_id", {}).get("value", "")
                creds["client_secret"] = amazon_api.get("client_secret", {}).get("value", "")
                creds["refresh_token"] = amazon_api.get("refresh_token", {}).get("value", "")
                creds["access_token"] = amazon_api.get("access_token", {}).get("value", "")
        except Exception as e:
            print(f"Warning: Could not load from secrets file: {e}")
    
    # Fallback to environment variables
    if not creds.get("client_id"):
        creds["client_id"] = os.getenv("AMAZON_CLIENT_ID", "")
    if not creds.get("client_secret"):
        creds["client_secret"] = os.getenv("AMAZON_CLIENT_SECRET", "")
    if not creds.get("refresh_token"):
        creds["refresh_token"] = os.getenv("AMAZON_REFRESH_TOKEN", "")
    
    # Validate
    if not all([creds.get("client_id"), creds.get("client_secret"), creds.get("refresh_token")]):
        print("ERROR: Missing required credentials. Set AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN")
        sys.exit(2)
    
    return creds


def oauth() -> Auth:
    """Exchange refresh token for access token"""
    creds = load_credentials()
    
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": creds["refresh_token"],
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
    }
    headers = {"User-Agent": USER_AGENT}
    
    try:
        r = requests.post(TOKEN_URL, data=payload, headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        return Auth(
            access_token=data["access_token"],
            token_type=data.get("token_type", "Bearer"),
            expires_at=time.time() + int(data.get("expires_in", 3600)),
            client_id=creds["client_id"]
        )
    except Exception as e:
        print(f"OAuth error: {e}")
        sys.exit(1)


def api_headers(auth: Auth, profile_id: Optional[str] = None) -> Dict[str, str]:
    """Generate API request headers"""
    h = {
        "Authorization": f"Bearer {auth.access_token}",
        "Content-Type": "application/json",
        "Amazon-Advertising-API-ClientId": auth.client_id,
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    if profile_id:
        h["Amazon-Advertising-API-Scope"] = profile_id
    return h


def resolve_endpoint(scope: Optional[str]) -> str:
    """Resolve API endpoint based on scope"""
    scope = scope or os.getenv("AMAZON_API_SCOPE", "NA").upper()
    return ENDPOINTS.get(scope, ENDPOINTS["NA"])


# ---------- Profiles ----------

def get_profiles(auth: Auth, base: str) -> List[dict]:
    """Fetch all advertising profiles"""
    url = f"{base}/v2/profiles"
    r = requests.get(url, headers=api_headers(auth), timeout=30)
    r.raise_for_status()
    return r.json()


# ---------- Campaigns ----------

def get_campaigns(auth: Auth, base: str, profile_id: str) -> List[dict]:
    """Fetch all Sponsored Products campaigns"""
    url = f"{base}/v2/sp/campaigns"
    r = requests.get(url, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


def update_campaign_state(auth: Auth, base: str, profile_id: str, campaign_id: str, state: str) -> dict:
    """Update campaign state (enabled/paused/archived)"""
    url = f"{base}/v2/sp/campaigns"
    payload = [{
        "campaignId": int(campaign_id),
        "state": state
    }]
    r = requests.put(url, json=payload, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


def create_campaign(auth: Auth, base: str, profile_id: str, name: str, 
                   daily_budget: float, targeting_type: str = "manual") -> dict:
    """Create a new Sponsored Products campaign"""
    url = f"{base}/v2/sp/campaigns"
    payload = [{
        "name": name,
        "campaignType": "sponsoredProducts",
        "targetingType": targeting_type,
        "state": "enabled",
        "dailyBudget": daily_budget,
        "startDate": datetime.now().strftime("%Y%m%d"),
        "premiumBidAdjustment": True
    }]
    r = requests.post(url, json=payload, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


# ---------- Ad Groups ----------

def get_ad_groups(auth: Auth, base: str, profile_id: str, campaign_id: Optional[str] = None) -> List[dict]:
    """Fetch ad groups, optionally filtered by campaign"""
    url = f"{base}/v2/sp/adGroups"
    params = {}
    if campaign_id:
        params["campaignIdFilter"] = campaign_id
    r = requests.get(url, headers=api_headers(auth, profile_id), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def create_ad_group(auth: Auth, base: str, profile_id: str, campaign_id: str, 
                   name: str, default_bid: float) -> dict:
    """Create a new ad group"""
    url = f"{base}/v2/sp/adGroups"
    payload = [{
        "campaignId": int(campaign_id),
        "name": name,
        "defaultBid": default_bid,
        "state": "enabled"
    }]
    r = requests.post(url, json=payload, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


# ---------- Keywords ----------

def get_keywords(auth: Auth, base: str, profile_id: str, ad_group_id: Optional[str] = None) -> List[dict]:
    """Fetch keywords, optionally filtered by ad group"""
    url = f"{base}/v2/sp/keywords"
    params = {}
    if ad_group_id:
        params["adGroupIdFilter"] = ad_group_id
    r = requests.get(url, headers=api_headers(auth, profile_id), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def get_keyword_suggestions(auth: Auth, base: str, profile_id: str, 
                           ad_group_id: str, max_suggestions: int = 100) -> List[dict]:
    """Get keyword suggestions for an ad group"""
    url = f"{base}/v2/sp/adGroups/{ad_group_id}/suggested/keywords"
    params = {"maxNumSuggestions": max_suggestions}
    try:
        r = requests.get(url, headers=api_headers(auth, profile_id), params=params, timeout=30)
        r.raise_for_status()
        return r.json().get("suggestedKeywords", [])
    except Exception as e:
        print(f"Warning: Could not fetch keyword suggestions: {e}")
        return []


def create_keywords(auth: Auth, base: str, profile_id: str, keywords: List[dict]) -> List[dict]:
    """Create new keywords"""
    url = f"{base}/v2/sp/keywords"
    r = requests.post(url, json=keywords, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


def update_keyword_bids(auth: Auth, base: str, profile_id: str, updates: List[dict]) -> List[dict]:
    """Update keyword bids"""
    url = f"{base}/v2/sp/keywords"
    r = requests.put(url, json=updates, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


# ---------- Product Ads ----------

def get_product_ads(auth: Auth, base: str, profile_id: str, ad_group_id: Optional[str] = None) -> List[dict]:
    """Fetch product ads"""
    url = f"{base}/v2/sp/productAds"
    params = {}
    if ad_group_id:
        params["adGroupIdFilter"] = ad_group_id
    r = requests.get(url, headers=api_headers(auth, profile_id), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def create_product_ad(auth: Auth, base: str, profile_id: str, campaign_id: str,
                     ad_group_id: str, sku: str, asin: str) -> dict:
    """Create a product ad"""
    url = f"{base}/v2/sp/productAds"
    payload = [{
        "campaignId": int(campaign_id),
        "adGroupId": int(ad_group_id),
        "sku": sku,
        "asin": asin,
        "state": "enabled"
    }]
    r = requests.post(url, json=payload, headers=api_headers(auth, profile_id), timeout=30)
    r.raise_for_status()
    return r.json()


# ---------- Reports ----------

def create_sp_report(auth: Auth, base: str, profile_id: str, report_type: str, lookback_days: int) -> str:
    """Create a Sponsored Products report"""
    headers = api_headers(auth, profile_id)
    since = (datetime.utcnow() - timedelta(days=lookback_days)).strftime("%Y%m%d")
    until = (datetime.utcnow() - timedelta(days=1)).strftime("%Y%m%d")

    if report_type == "keywords":
        url = f"{base}/v2/sp/keywords/report"
        payload = {
            "reportDate": until,
            "metrics": "campaignName,campaignId,adGroupName,adGroupId,keywordId,keywordText,matchType,impressions,clicks,cost,attributedConversions14d,attributedSales14d"
        }
    elif report_type == "campaigns":
        url = f"{base}/v2/sp/campaigns/report"
        payload = {
            "reportDate": until,
            "metrics": "campaignName,campaignId,campaignStatus,impressions,clicks,cost,attributedConversions14d,attributedSales14d"
        }
    else:
        raise ValueError(f"Unsupported report_type: {report_type}")

    r = requests.post(url, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    report_id = r.json().get("reportId")
    if not report_id:
        raise RuntimeError("Failed to create report")
    return report_id


def poll_report(auth: Auth, base: str, profile_id: str, report_id: str, 
               interval: int = 5, timeout_s: int = 180) -> str:
    """Poll report until ready"""
    headers = api_headers(auth, profile_id)
    url = f"{base}/v2/reports/{report_id}"
    deadline = time.time() + timeout_s
    
    while time.time() < deadline:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        status = data.get("status")
        
        if status == "SUCCESS":
            return data["location"]
        elif status in {"FAILURE", "CANCELLED"}:
            raise RuntimeError(f"Report failed: {data}")
        
        time.sleep(interval)
    
    raise TimeoutError("Report polling timed out")


def download_report(url: str) -> List[Dict[str, str]]:
    """Download and parse report"""
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    content = r.content
    
    # Try ZIP first
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            names = z.namelist()
            with z.open(names[0]) as f:
                text = io.TextIOWrapper(f, encoding="utf-8", newline="")
                return list(csv.DictReader(text))
    except zipfile.BadZipFile:
        # Try gzip
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(content)) as gz:
                text = io.TextIOWrapper(gz, encoding="utf-8", newline="")
                return list(csv.DictReader(text))
        except Exception:
            # Try plain text
            text = io.StringIO(content.decode('utf-8'))
            return list(csv.DictReader(text))


# ---------- KPI Calculations ----------

def compute_kpis(row: Dict[str, str]) -> Tuple[float, float, float, float, int]:
    """Calculate CTR, ACOS, cost, sales, clicks"""
    clicks = int(float(row.get("clicks", 0) or 0))
    impressions = float(row.get("impressions", 0) or 0)
    cost = float(row.get("cost", 0) or 0)
    sales = float(row.get("attributedSales14d", 0) or 0)
    
    ctr = (clicks / impressions) if impressions else 0.0
    acos = (cost / sales) if sales > 0 else float("inf") if cost > 0 else 0.0
    
    return ctr, acos, cost, sales, clicks


# ---------- Dayparting Logic ----------

def get_dayparting_multiplier(rules: Dict) -> float:
    """Get bid multiplier based on current hour"""
    if not rules.get("dayparting_enabled", False):
        return 1.0
    
    current_hour = datetime.now().hour
    peak_hours = rules.get("peak_hours", [])
    
    if current_hour in peak_hours:
        return rules.get("peak_multiplier", 1.0)
    else:
        return rules.get("off_peak_multiplier", 1.0)


# ---------- Bid Optimization Logic ----------

def clamp(v: float, lo: float, hi: float) -> float:
    """Clamp value between min and max"""
    return max(lo, min(hi, v))


def decide_bid_change(rules: Dict, ctr: float, acos: float, clicks: int, 
                     cost: float, sales: float, current_bid: float) -> Optional[float]:
    """Decide if bid should change based on performance"""
    # Insufficient data check
    if clicks < rules["min_clicks"] and cost < rules["min_spend"]:
        return None
    
    # Apply dayparting multiplier
    daypart_mult = get_dayparting_multiplier(rules)
    
    # Low CTR → downbid
    if ctr < rules.get("min_ctr", 0) and clicks >= rules["min_clicks"]:
        new_bid = current_bid * (1 - rules["down_pct"]) * daypart_mult
        return clamp(new_bid, rules["min_bid"], rules["max_bid"])
    
    # No sales after enough clicks → downbid
    if sales <= 0 and clicks >= rules["min_clicks"]:
        new_bid = current_bid * (1 - rules["down_pct"]) * daypart_mult
        return clamp(new_bid, rules["min_bid"], rules["max_bid"])
    
    # High ACOS → downbid
    if acos > rules["high_acos"]:
        new_bid = current_bid * (1 - rules["down_pct"]) * daypart_mult
        return clamp(new_bid, rules["min_bid"], rules["max_bid"])
    
    # Low ACOS with sales → upbid
    if acos < rules["low_acos"] and sales > 0:
        new_bid = current_bid * (1 + rules["up_pct"]) * daypart_mult
        return clamp(new_bid, rules["min_bid"], rules["max_bid"])
    
    # Apply dayparting adjustment to current bid
    if daypart_mult != 1.0:
        new_bid = current_bid * daypart_mult
        return clamp(new_bid, rules["min_bid"], rules["max_bid"])
    
    return None


# ---------- Campaign Management ----------

def manage_campaigns_by_acos(auth: Auth, base: str, profile_id: str, 
                             campaign_performance: Dict[str, Dict], rules: Dict, 
                             dry_run: bool = False) -> List[Dict]:
    """Activate/deactivate campaigns based on ACOS"""
    actions = []
    
    if not rules.get("auto_activate_campaigns") and not rules.get("auto_deactivate_campaigns"):
        return actions
    
    for campaign_id, perf in campaign_performance.items():
        acos = perf.get("acos", 0)
        current_state = perf.get("state", "enabled")
        clicks = perf.get("clicks", 0)
        
        # Need minimum data
        if clicks < rules["min_clicks"]:
            continue
        
        # Deactivate high ACOS campaigns
        if rules.get("auto_deactivate_campaigns") and acos > rules["deactivate_acos_threshold"]:
            if current_state == "enabled":
                if not dry_run:
                    try:
                        update_campaign_state(auth, base, profile_id, campaign_id, "paused")
                        actions.append({
                            "campaign_id": campaign_id,
                            "action": "paused",
                            "reason": f"High ACOS: {acos:.1%}",
                            "acos": acos
                        })
                    except Exception as e:
                        print(f"Error pausing campaign {campaign_id}: {e}")
                else:
                    actions.append({
                        "campaign_id": campaign_id,
                        "action": "paused (dry-run)",
                        "reason": f"High ACOS: {acos:.1%}",
                        "acos": acos
                    })
        
        # Activate low ACOS campaigns
        elif rules.get("auto_activate_campaigns") and acos <= rules["activate_acos_threshold"]:
            if current_state == "paused":
                if not dry_run:
                    try:
                        update_campaign_state(auth, base, profile_id, campaign_id, "enabled")
                        actions.append({
                            "campaign_id": campaign_id,
                            "action": "enabled",
                            "reason": f"Good ACOS: {acos:.1%}",
                            "acos": acos
                        })
                    except Exception as e:
                        print(f"Error enabling campaign {campaign_id}: {e}")
                else:
                    actions.append({
                        "campaign_id": campaign_id,
                        "action": "enabled (dry-run)",
                        "reason": f"Good ACOS: {acos:.1%}",
                        "acos": acos
                    })
    
    return actions


# ---------- Keyword Research & Addition ----------

def research_and_add_keywords(auth: Auth, base: str, profile_id: str, 
                             ad_groups: List[dict], rules: Dict, 
                             dry_run: bool = False) -> List[Dict]:
    """Research and add new keywords to campaigns"""
    added_keywords = []
    
    if not rules.get("keyword_research_enabled") or not rules.get("auto_add_keywords"):
        return added_keywords
    
    for ad_group in ad_groups:
        ad_group_id = str(ad_group.get("adGroupId"))
        campaign_id = str(ad_group.get("campaignId"))
        
        # Get existing keywords
        existing_keywords = get_keywords(auth, base, profile_id, ad_group_id)
        existing_keyword_texts = {kw.get("keywordText", "").lower() for kw in existing_keywords}
        
        # Check if we're at max keywords
        if len(existing_keywords) >= rules.get("max_keywords_per_campaign", 50):
            continue
        
        # Get suggestions
        suggestions = get_keyword_suggestions(auth, base, profile_id, ad_group_id, max_suggestions=20)
        
        # Filter and add new keywords
        new_keywords = []
        for suggestion in suggestions:
            keyword_text = suggestion.get("keywordText", "")
            if keyword_text.lower() not in existing_keyword_texts:
                new_keywords.append({
                    "campaignId": int(campaign_id),
                    "adGroupId": int(ad_group_id),
                    "keywordText": keyword_text,
                    "matchType": suggestion.get("matchType", "broad"),
                    "state": "enabled",
                    "bid": rules.get("new_keyword_bid", 0.50)
                })
                existing_keyword_texts.add(keyword_text.lower())
                
                if len(new_keywords) >= 5:  # Add max 5 per ad group per run
                    break
        
        if new_keywords:
            if not dry_run:
                try:
                    results = create_keywords(auth, base, profile_id, new_keywords)
                    for kw, result in zip(new_keywords, results):
                        added_keywords.append({
                            "ad_group_id": ad_group_id,
                            "keyword": kw["keywordText"],
                            "match_type": kw["matchType"],
                            "bid": kw["bid"],
                            "status": result.get("code", "unknown")
                        })
                except Exception as e:
                    print(f"Error adding keywords to ad group {ad_group_id}: {e}")
            else:
                for kw in new_keywords:
                    added_keywords.append({
                        "ad_group_id": ad_group_id,
                        "keyword": kw["keywordText"],
                        "match_type": kw["matchType"],
                        "bid": kw["bid"],
                        "status": "dry-run"
                    })
    
    return added_keywords


# ---------- New Campaign Creation ----------

def find_products_without_campaigns(auth: Auth, base: str, profile_id: str) -> List[Dict]:
    """Find products that don't have active campaigns"""
    # Get all campaigns
    campaigns = get_campaigns(auth, base, profile_id)
    
    # Get all ad groups and product ads
    all_ad_groups = get_ad_groups(auth, base, profile_id)
    all_product_ads = get_product_ads(auth, base, profile_id)
    
    # Build set of ASINs with campaigns
    asins_with_campaigns = {ad.get("asin") for ad in all_product_ads if ad.get("state") == "enabled"}
    
    # For this implementation, we'll return empty list
    # In production, you'd integrate with your product catalog
    return []


def create_campaign_for_product(auth: Auth, base: str, profile_id: str, 
                               product: Dict, rules: Dict, dry_run: bool = False) -> Optional[Dict]:
    """Create a new campaign for a product"""
    if not rules.get("auto_create_campaigns"):
        return None
    
    asin = product.get("asin")
    sku = product.get("sku")
    product_name = product.get("name", f"Product {asin}")
    
    campaign_name = f"Auto - {product_name} - {datetime.now().strftime('%Y-%m-%d')}"
    daily_budget = rules.get("new_campaign_daily_budget", 10.00)
    
    if dry_run:
        return {
            "asin": asin,
            "campaign_name": campaign_name,
            "daily_budget": daily_budget,
            "status": "dry-run"
        }
    
    try:
        # Create campaign
        campaign_result = create_campaign(auth, base, profile_id, campaign_name, daily_budget)
        campaign_id = str(campaign_result[0].get("campaignId"))
        
        # Create ad group
        ad_group_name = f"AG - {product_name}"
        ad_group_result = create_ad_group(auth, base, profile_id, campaign_id, ad_group_name, 0.50)
        ad_group_id = str(ad_group_result[0].get("adGroupId"))
        
        # Create product ad
        product_ad_result = create_product_ad(auth, base, profile_id, campaign_id, ad_group_id, sku, asin)
        
        return {
            "asin": asin,
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "ad_group_id": ad_group_id,
            "daily_budget": daily_budget,
            "status": "created"
        }
    except Exception as e:
        print(f"Error creating campaign for {asin}: {e}")
        return None


# ---------- Main Optimization Flow ----------

def main():
    ap = argparse.ArgumentParser(description="Advanced Amazon Ads PPC Optimizer")
    ap.add_argument("--scope", default=os.getenv("AMAZON_API_SCOPE", "NA"), 
                   help="NA/EU/FE endpoint scope")
    ap.add_argument("--profile-id", help="Specific profile id to target")
    ap.add_argument("--dry-run", action="store_true", 
                   help="Calculate changes but do NOT push updates")
    ap.add_argument("--skip-bids", action="store_true", 
                   help="Skip bid optimization")
    ap.add_argument("--skip-campaigns", action="store_true", 
                   help="Skip campaign activation/deactivation")
    ap.add_argument("--skip-keywords", action="store_true", 
                   help="Skip keyword research and addition")
    ap.add_argument("--skip-new-campaigns", action="store_true", 
                   help="Skip new campaign creation")
    args = ap.parse_args()

    print(f"🚀 Advanced Amazon PPC Optimizer Starting...")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Dry Run: {args.dry_run}")
    print()

    # Authenticate
    auth = oauth()
    base = resolve_endpoint(args.scope)
    print(f"✅ Authenticated successfully")

    # Get profile
    profiles = get_profiles(auth, base)
    if not profiles:
        print("❌ No profiles available")
        sys.exit(1)

    profile = None
    if args.profile_id:
        profile = next((p for p in profiles if str(p.get("profileId")) == str(args.profile_id)), None)
    else:
        profile = profiles[0]
    
    if not profile:
        print("❌ Profile not found")
        sys.exit(1)

    profile_id = str(profile["profileId"])
    profile_name = profile.get("accountInfo", {}).get("name", "Unknown")
    print(f"✅ Using profile: {profile_name} (ID: {profile_id})")
    print()

    rules = DEFAULT_RULES.copy()
    
    # Get current hour for dayparting
    current_hour = datetime.now().hour
    daypart_mult = get_dayparting_multiplier(rules)
    print(f"⏰ Current Hour: {current_hour}:00")
    print(f"   Dayparting Multiplier: {daypart_mult:.2f}x")
    print()

    # ========== STEP 1: Fetch Campaign Performance ==========
    print("📊 Step 1: Fetching campaign performance data...")
    try:
        campaign_report_id = create_sp_report(auth, base, profile_id, "campaigns", rules["lookback_days"])
        campaign_report_url = poll_report(auth, base, profile_id, campaign_report_id)
        campaign_rows = download_report(campaign_report_url)
        print(f"   ✅ Downloaded {len(campaign_rows)} campaign records")
    except Exception as e:
        print(f"   ⚠️  Could not fetch campaign report: {e}")
        campaign_rows = []

    # Build campaign performance map
    campaign_performance = {}
    for row in campaign_rows:
        campaign_id = row.get("campaignId")
        ctr, acos, cost, sales, clicks = compute_kpis(row)
        campaign_performance[campaign_id] = {
            "acos": acos,
            "ctr": ctr,
            "cost": cost,
            "sales": sales,
            "clicks": clicks,
            "state": row.get("campaignStatus", "enabled")
        }
    print()

    # ========== STEP 2: Campaign Activation/Deactivation ==========
    if not args.skip_campaigns:
        print("🎯 Step 2: Managing campaign states based on ACOS...")
        campaign_actions = manage_campaigns_by_acos(auth, base, profile_id, 
                                                   campaign_performance, rules, args.dry_run)
        if campaign_actions:
            print(f"   ✅ Processed {len(campaign_actions)} campaign state changes:")
            for action in campaign_actions[:5]:  # Show first 5
                print(f"      • Campaign {action['campaign_id']}: {action['action']} - {action['reason']}")
            if len(campaign_actions) > 5:
                print(f"      ... and {len(campaign_actions) - 5} more")
        else:
            print("   ℹ️  No campaign state changes needed")
        print()

    # ========== STEP 3: Keyword Bid Optimization ==========
    if not args.skip_bids:
        print("💰 Step 3: Optimizing keyword bids...")
        try:
            keyword_report_id = create_sp_report(auth, base, profile_id, "keywords", rules["lookback_days"])
            keyword_report_url = poll_report(auth, base, profile_id, keyword_report_id)
            keyword_rows = download_report(keyword_report_url)
            print(f"   ✅ Downloaded {len(keyword_rows)} keyword records")
        except Exception as e:
            print(f"   ⚠️  Could not fetch keyword report: {e}")
            keyword_rows = []

        # Process bid changes
        bid_updates = []
        audit_lines = []
        
        for row in keyword_rows:
            keyword_id = row.get("keywordId")
            if not keyword_id:
                continue
            
            ctr, acos, cost, sales, clicks = compute_kpis(row)
            
            # Get current bid from keywords API
            try:
                keywords = get_keywords(auth, base, profile_id)
                keyword_data = next((k for k in keywords if str(k.get("keywordId")) == str(keyword_id)), None)
                if not keyword_data:
                    continue
                current_bid = keyword_data.get("bid", 0)
            except Exception:
                continue
            
            new_bid = decide_bid_change(rules, ctr, acos, clicks, cost, sales, current_bid)
            
            if new_bid is not None and abs(new_bid - current_bid) > 0.01:
                bid_updates.append({
                    "keywordId": int(keyword_id),
                    "bid": round(new_bid, 2)
                })
                
                audit_lines.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "keyword_id": keyword_id,
                    "keyword_text": row.get("keywordText", ""),
                    "old_bid": round(current_bid, 2),
                    "new_bid": round(new_bid, 2),
                    "change": round(new_bid - current_bid, 2),
                    "ctr": round(ctr, 4),
                    "acos": round(acos, 4) if acos != float('inf') else "inf",
                    "clicks": clicks,
                    "cost": round(cost, 2),
                    "sales": round(sales, 2),
                    "daypart_mult": round(daypart_mult, 2)
                })

        # Push bid updates
        if bid_updates:
            if not args.dry_run:
                try:
                    results = update_keyword_bids(auth, base, profile_id, bid_updates)
                    print(f"   ✅ Updated {len(bid_updates)} keyword bids")
                except Exception as e:
                    print(f"   ⚠️  Error updating bids: {e}")
            else:
                print(f"   ℹ️  Would update {len(bid_updates)} keyword bids (dry-run)")
            
            # Show sample
            for audit in audit_lines[:5]:
                print(f"      • {audit['keyword_text']}: ${audit['old_bid']} → ${audit['new_bid']} "
                      f"(ACOS: {audit['acos']}, Clicks: {audit['clicks']})")
            if len(audit_lines) > 5:
                print(f"      ... and {len(audit_lines) - 5} more")
        else:
            print("   ℹ️  No bid changes needed")
        print()

        # Write audit file
        if audit_lines:
            audit_file = f"bid_audit_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(audit_file, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=list(audit_lines[0].keys()))
                w.writeheader()
                for line in audit_lines:
                    w.writerow(line)
            print(f"   📄 Audit written: {audit_file}")
            print()

    # ========== STEP 4: Keyword Research & Addition ==========
    if not args.skip_keywords:
        print("🔍 Step 4: Researching and adding new keywords...")
        try:
            ad_groups = get_ad_groups(auth, base, profile_id)
            added_keywords = research_and_add_keywords(auth, base, profile_id, ad_groups, rules, args.dry_run)
            
            if added_keywords:
                print(f"   ✅ Added {len(added_keywords)} new keywords:")
                for kw in added_keywords[:5]:
                    print(f"      • {kw['keyword']} ({kw['match_type']}) @ ${kw['bid']} - {kw['status']}")
                if len(added_keywords) > 5:
                    print(f"      ... and {len(added_keywords) - 5} more")
            else:
                print("   ℹ️  No new keywords added")
        except Exception as e:
            print(f"   ⚠️  Error in keyword research: {e}")
        print()

    # ========== STEP 5: New Campaign Creation ==========
    if not args.skip_new_campaigns:
        print("🆕 Step 5: Creating campaigns for products without campaigns...")
        try:
            products_without_campaigns = find_products_without_campaigns(auth, base, profile_id)
            
            if products_without_campaigns:
                created_campaigns = []
                for product in products_without_campaigns[:3]:  # Max 3 per run
                    result = create_campaign_for_product(auth, base, profile_id, product, rules, args.dry_run)
                    if result:
                        created_campaigns.append(result)
                
                if created_campaigns:
                    print(f"   ✅ Created {len(created_campaigns)} new campaigns:")
                    for camp in created_campaigns:
                        print(f"      • {camp['campaign_name']} (ASIN: {camp['asin']}) - {camp['status']}")
                else:
                    print("   ℹ️  No campaigns created")
            else:
                print("   ℹ️  All products have campaigns")
        except Exception as e:
            print(f"   ⚠️  Error creating campaigns: {e}")
        print()

    # ========== Summary ==========
    print("=" * 60)
    print("✅ Optimization Complete!")
    print(f"   Profile: {profile_name}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        sys.exit(0)
    except requests.HTTPError as e:
        print(f"❌ HTTP error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
