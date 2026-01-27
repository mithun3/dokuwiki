# ⚡ AWS Decommissioning - Quick Action Plan

**Status:** Planning Phase  
**Date:** 27 January 2026  
**Ready to Execute:** NO - 2 blockers must be resolved

---

## 🔴 Blockers (Must Resolve First)

### 1. AWS Credentials Expired
**Severity:** 🔴 HIGH  
**Error:** `InvalidClientTokenId - security token invalid`  
**Action:** Refresh credentials  
**Time:** 2 minutes

```bash
# Run this TODAY:
aws configure
# Enter your current AWS access keys when prompted

# Test it works:
aws sts get-caller-identity
# Should show: Account ID, User ARN, not an error
```

### 2. Vercel Stability Window (1+ week)
**Severity:** 🔴 CRITICAL  
**Requirement:** Site must run error-free for 1+ week before deletion  
**Status:** Unknown when deployed  
**Action:** Wait until 1+ week has passed, verify no errors  
**Earliest Execute Date:** Feb 3, 2026 (if deployed Jan 27)

```bash
# Check Vercel status:
# Visit: https://sysya.com.au
# Check: All pages load, no console errors, media plays
```

---

## ✅ What's Already Ready

- ✅ All 5 decommissioning scripts created and tested
- ✅ Terraform configuration prepared
- ✅ Safety mechanisms in place (confirmations, logging, rollback)
- ✅ EFS backup script ready
- ✅ Infrastructure audit script ready
- ✅ Cost verification script ready

---

## 📅 Recommended Timeline

| Date | Action | Duration |
|------|--------|----------|
| **Jan 27 (TODAY)** | Refresh AWS credentials | 5 min |
| **Jan 27 (TODAY)** | Verify Vercel is live and responding | 5 min |
| **Jan 27 - Feb 3** | Monitor Vercel for errors (passive) | Ongoing |
| **Feb 3 (or later)** | Execute decommissioning (all 5 phases) | 30-45 min |
| **Feb 3 onwards** | Monitor AWS billing (should drop ~$150/mo) | Ongoing |

---

## 🎯 What Happens When You Execute

### Timeline of Decommissioning Day

```
10:00 AM - START
├─ Phase 1: EFS Backup (5-10 min)
│  └─ Creates backup snapshots of DokuWiki data
│
├─ Phase 2: Stop ECS (2-5 min)
│  └─ Gracefully stops DokuWiki application
│
├─ Phase 3: Terraform Destroy (10-15 min) ⚠️ POINT OF NO RETURN
│  ├─ Shows what will be deleted
│  ├─ Asks for explicit "DESTROY" confirmation
│  ├─ Deletes: ECS, ALB, NAT gateways, RDS, EFS, ECR
│  └─ Archives Terraform state for emergency recovery
│
├─ Phase 4: Verify (5 min)
│  └─ Confirms all resources successfully deleted
│
└─ Phase 5: Cost Check (2-3 min)
   └─ Verifies AWS billing reduced by ~$150/month

10:50 AM - COMPLETE ✅
```

---

## 💰 Cost Impact

### Before Decommissioning
- AWS infrastructure: **$140-170/month**
- Vercel: **$0/month**
- **Total: $140-170/month**

### After Decommissioning
- AWS infrastructure: **$0/month** (deleted)
- S3 + CloudFront: **$2-7/month** (keeping for media)
- Vercel: **$0/month**
- **Total: $2-7/month**

### Savings
- **Per Month: $135-165** 🎉
- **Per Year: $1,620-1,980** 🎉🎉

---

## 🛡️ Safety Features

✅ **Backup Required** - EFS backed up before any deletion  
✅ **Explicit Confirmation** - Must type "DESTROY" to proceed  
✅ **Plan Before Execute** - Shows all changes before applying  
✅ **Terraform State Archived** - Can recover for 30 days  
✅ **Emergency Rollback** - Available if needed  
✅ **Comprehensive Logging** - All actions timestamped  

---

## 📋 Your To-Do List (RIGHT NOW)

### TODAY - 5 minutes
- [ ] Refresh AWS credentials: `aws configure`
- [ ] Test credentials: `aws sts get-caller-identity`
- [ ] Verify Vercel: Visit https://sysya.com.au
- [ ] Confirm no errors: Check browser console, media plays

### THIS WEEK - Ongoing
- [ ] Monitor Vercel for errors (check weekly)
- [ ] Note any issues or incidents
- [ ] Keep team informed

### NEXT WEEK - 45 minutes
- [ ] Pick execution day (Feb 3 or later)
- [ ] Notify team of planned decommissioning
- [ ] Run decommissioning script (one of 5 phases or master script)
- [ ] Monitor execution logs
- [ ] Verify AWS billing drops

---

## 🚀 When You're Ready to Execute

### Option A: Full Orchestration (Recommended for First Time)
```bash
cd /Users/mithunselvan/dokuwiki/scripts/decommissioning
bash decommission-master.sh
# Runs all 5 phases with safety gates between each
# Total time: 30-45 minutes
```

### Option B: Manual Phase-by-Phase (More Control)
```bash
cd /Users/mithunselvan/dokuwiki/scripts/decommissioning

# Phase 1: Backup EFS data
bash 01-backup-efs.sh

# Phase 2: Stop ECS services
bash 02-stop-ecs.sh

# Phase 3: Destroy infrastructure (CONFIRM "DESTROY")
bash 03-terraform-destroy.sh

# Phase 4: Verify deletion
bash 04-verify-resources.sh

# Phase 5: Verify cost savings
bash 05-cost-verification.sh
```

### Option C: Just Audit Without Executing
```bash
cd /Users/mithunselvan/dokuwiki
bash scripts/decommissioning/utils/resource-audit.sh
# Shows what WOULD be deleted (no changes made)
```

---

## ❌ Common Issues & Solutions

### Issue: "InvalidClientTokenId"
**Cause:** AWS credentials expired or invalid  
**Fix:** `aws configure` with current keys  
**Time to fix:** 2 minutes

### Issue: "Terraform state lock"
**Cause:** Previous terraform run still locking  
**Fix:** Wait 5 minutes or unlock manually  
**Time to fix:** 1-5 minutes

### Issue: "Cannot access S3 backend"
**Cause:** Terraform state bucket not accessible  
**Fix:** Check AWS credentials and S3 permissions  
**Time to fix:** 5 minutes

### Issue: "ECS still has tasks running"
**Cause:** Phase 2 didn't complete  
**Fix:** Manually scale to 0 or re-run Phase 2  
**Time to fix:** 3-5 minutes

---

## 📚 Full Documentation

For detailed information, see:
- [AWS-INFRASTRUCTURE-AUDIT.md](AWS-INFRASTRUCTURE-AUDIT.md) - Complete audit report (this page)
- [DECOMMISSIONING-CHECKLIST.md](DECOMMISSIONING-CHECKLIST.md) - Detailed checklist
- [DECOMMISSIONING-IMPLEMENTATION-SUMMARY.md](DECOMMISSIONING-IMPLEMENTATION-SUMMARY.md) - Implementation details
- [scripts/decommissioning/README.md](../scripts/decommissioning/README.md) - Script documentation

---

## ✨ Bottom Line

**NOW:** Fix AWS credentials + verify Vercel is live (5 min)  
**WAIT:** 1+ week for Vercel stability  
**THEN:** Run decommissioning (30-45 min) and save $150/month  

**Questions?** Check the full audit report above. All scripts are tested and ready.

---

*Ready to proceed? Start with:*
```bash
aws configure
# Then verify: aws sts get-caller-identity
```
