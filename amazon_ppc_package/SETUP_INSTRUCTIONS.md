# Amazon PPC Optimizer - Complete Setup Instructions

## 🎉 What's Included

This package contains everything you need for automated Amazon PPC optimization with email notifications and a live dashboard.

### Files Included:
- `amazon_ppc_optimizer_advanced.py` - Main optimization script
- `ppc_optimizer_config.yaml` - Configuration file with all settings
- `run_ppc_optimizer.sh` - Bash wrapper for easy execution
- `send_ppc_email_report.py` - Email notification script
- `ppc_dashboard.html` - Interactive performance dashboard
- `PPC_OPTIMIZER_README.md` - Comprehensive documentation
- `PPC_OPTIMIZER_SUMMARY.md` - Quick reference guide
- `PPC_OPTIMIZER_SUMMARY.pdf` - PDF version of summary
- `amazon_ppc_dayparting_research.md` - Dayparting strategy research
- `amazon_ppc_dayparting_research.pdf` - PDF version of research

## ✅ Current Status

**ACTIVE** - Your PPC optimizer is currently running every 2 hours with:
- ✅ Automated bid optimization
- ✅ Dayparting (peak/off-peak hours)
- ✅ Campaign management (pause/activate based on ACOS)
- ✅ Keyword research and addition
- ✅ New campaign creation
- ✅ **Email reports to natureswaysoil@gmail.com after each run**
- ✅ **Live dashboard with performance metrics**

## 📧 Email Notifications

After each optimization run (every 2 hours), you'll receive an email at **natureswaysoil@gmail.com** with:
- Summary of bid changes
- Keywords added
- Campaigns created/managed
- Performance metrics
- Next run time

## 📊 Dashboard

Open `ppc_dashboard.html` in your browser to view:
- Real-time performance metrics
- Bid changes over time
- ACOS performance by campaign
- Dayparting performance analysis
- Recent activity log
- Configuration settings

**To view the dashboard:**
```bash
# Open in browser
open ppc_dashboard.html
# or
firefox ppc_dashboard.html
# or
google-chrome ppc_dashboard.html
```

## 🚀 Manual Execution (Optional)

If you want to run the optimizer manually:

**Option 1: Using the bash wrapper**
```bash
chmod +x run_ppc_optimizer.sh
./run_ppc_optimizer.sh
```

**Option 2: Direct Python execution**
```bash
python3 amazon_ppc_optimizer_advanced.py --profile-id 1780498399290938
```

**Option 3: Dry-run mode (test without making changes)**
```bash
python3 amazon_ppc_optimizer_advanced.py --profile-id 1780498399290938 --dry-run
```

**Option 4: Send test email**
```bash
python3 send_ppc_email_report.py
```

## 📁 Log Files

All optimization runs are logged:

**Execution Logs:**
```bash
/home/ubuntu/ppc_logs/ppc_run_YYYYMMDD_HHMMSS.log
```

**Bid Audit Files:**
```bash
/home/ubuntu/bid_audit_YYYYMMDD_HHMMSS.csv
```

**View recent logs:**
```bash
tail -f /home/ubuntu/ppc_logs/ppc_run_*.log
```

**View recent audit files:**
```bash
ls -lt /home/ubuntu/bid_audit_*.csv | head -5
```

## ⚙️ Configuration

Edit `ppc_optimizer_config.yaml` to customize:
- Bid optimization thresholds
- Dayparting hours and multipliers
- ACOS targets (currently 45%)
- Budget limits
- Feature flags

**Current Settings:**
- **Run Frequency:** Every 2 hours
- **Peak Hours:** 9am - 8pm (1.20x multiplier)
- **Off-Peak:** 9pm - 8am (0.85x multiplier)
- **ACOS Pause Threshold:** > 45%
- **ACOS Reactivate:** ≤ 45%
- **Bid Range:** $0.25 - $5.00
- **Email:** natureswaysoil@gmail.com

## 🔧 Prerequisites

1. **Python 3.7 or higher**
2. **Amazon Advertising API credentials** (already configured)
3. **Gmail API access** (already configured)
4. **Required Python packages:**
```bash
pip install requests pyyaml
```

## 📈 Features

✅ **Automated Bid Optimization**
- Increase bids for high-performing keywords (ACOS < 30%)
- Decrease bids for underperforming keywords (ACOS > 45%)
- Apply dayparting multipliers

✅ **Campaign Management**
- Pause campaigns with ACOS > 45%
- Reactivate campaigns with ACOS ≤ 45%

✅ **Keyword Research**
- Automatically discover and add new relevant keywords
- Up to 5 new keywords per ad group per run

✅ **New Campaign Creation**
- Create campaigns for products without ads
- Up to 3 new campaigns per run

✅ **Email Notifications**
- Comprehensive HTML reports after each run
- Sent to natureswaysoil@gmail.com

✅ **Live Dashboard**
- Real-time performance metrics
- Interactive charts and graphs
- Recent activity log

## 🎯 Account Details

**Company:** Nature's Way Soil & Vermicompost LLC
**Profile ID:** 1780498399290938
**Email:** natureswaysoil@gmail.com

## 📞 Support

For detailed documentation, see:
- `PPC_OPTIMIZER_README.md` - Full documentation
- `PPC_OPTIMIZER_SUMMARY.md` - Quick reference
- `amazon_ppc_dayparting_research.md` - Dayparting strategies

---

**Note:** The optimizer is currently ACTIVE and running automatically every 2 hours. You don't need to do anything - just check your email for reports!
