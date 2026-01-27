# AWS Decommissioning Scripts

Complete automation toolkit for safely decommissioning old DokuWiki infrastructure on AWS after Vercel migration.

## 🚨 CRITICAL SAFETY INFORMATION

> **DO NOT RUN THESE SCRIPTS UNLESS:**
> - ✅ Vercel deployment has been stable for **1+ week** with **zero critical issues**
> - ✅ Final EFS backup has been downloaded and **verified**
> - ✅ All team members have signed off on decommissioning
> - ✅ All required data has been migrated to Next.js
> - ✅ RDS final snapshot will be created (retained in AWS for 7 days)

**These scripts will permanently delete:**
- ECS Fargate cluster and all tasks
- RDS PostgreSQL database
- EFS file system with all backup data
- Application Load Balancer
- NAT Gateways and Elastic IPs
- Custom VPC and security groups
- ECR container registry

**Monthly savings: ~$138/month**

---

## 📋 Directory Structure

```
/scripts/decommissioning/
├── README.md                          # This file
├── decommission-master.sh             # Master orchestrator (run this first)
├── 01-backup-efs.sh                   # Phase 1: Backup data
├── 02-stop-ecs.sh                     # Phase 2: Stop services
├── 03-terraform-destroy.sh            # Phase 3: Destroy infrastructure
├── 04-verify-resources.sh             # Phase 4: Verify deletion
├── 05-cost-verification.sh            # Phase 5: Confirm cost savings
├── utils/
│   ├── preflight-check.sh             # Pre-execution validation
│   ├── resource-audit.sh              # Resource inventory audit
│   ├── state-cleanup.sh               # Terraform state cleanup
│   └── emergency-rollback.sh           # Emergency restoration
└── logs/                              # Execution logs (auto-generated)
```

---

## 🚀 Quick Start

### 1. Run Pre-Flight Checks

```bash
cd /Users/mithunselvan/dokuwiki/scripts/decommissioning
bash utils/preflight-check.sh
```

Expected output:
- ✅ AWS CLI installed and configured
- ✅ Vercel site responding
- ✅ Terraform state valid
- ✅ EFS snapshots available
- ✅ RDS backups enabled

### 2. Execute Master Decommissioning Script

The master script orchestrates all phases with safety gates:

```bash
bash decommission-master.sh
```

**You will be prompted before each phase:**
```
✅ Pre-flight checks passed
Press ENTER to continue to Phase 1: Backup EFS...
```

### 3. Manual Phase Execution (if needed)

Run individual phases with their own safety checks:

```bash
# Phase 1: Backup EFS
bash 01-backup-efs.sh

# Phase 2: Stop ECS services
bash 02-stop-ecs.sh

# Phase 3: Destroy with Terraform (RECOMMENDED)
bash 03-terraform-destroy.sh

# Phase 4: Verify cleanup
bash 04-verify-resources.sh

# Phase 5: Confirm cost savings
bash 05-cost-verification.sh
```

---

## 📊 Phase Breakdown

| Phase | Duration | Script | Action |
|-------|----------|--------|--------|
| **1** | 5-10 min | `01-backup-efs.sh` | Create EFS snapshots, backup to local/S3 |
| **2** | 2-5 min | `02-stop-ecs.sh` | Scale down ECS service to 0 tasks |
| **3** | 10-15 min | `03-terraform-destroy.sh` | Run `terraform destroy` (automated Terraform) |
| **4** | 5 min | `04-verify-resources.sh` | Confirm all resources deleted |
| **5** | 2 min | `05-cost-verification.sh` | Verify AWS billing reduction |
| **TOTAL** | ~30-40 min | `decommission-master.sh` | Complete teardown |

---

## 🔧 Configuration Variables

Before running, set these environment variables:

```bash
# AWS Configuration
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="YOUR_ACCOUNT_ID"

# Resource IDs (find in AWS Console or terraform.tfstate)
export CLUSTER_NAME="dokuwiki-prod-cluster"
export RDS_DB_IDENTIFIER="dokuwiki-prod-db"
export EFS_ID="fs-xxxxxxxxxx"
export VPC_ID="vpc-xxxxxxxxxx"
export ECR_REPO="dokuwiki-prod"

# Backup Configuration
export BACKUP_S3_BUCKET="your-backup-bucket"
export BACKUP_LOCAL_PATH="./backups"

# Safety
export ENABLE_BATCH_MODE="false"  # Set to "true" to skip confirmations
export DRY_RUN="true"              # Set to "false" to execute (default is dry-run)
```

Or create a `.env.decommission` file:

```bash
# .env.decommission (in this directory)
AWS_REGION=us-east-1
CLUSTER_NAME=dokuwiki-prod-cluster
RDS_DB_IDENTIFIER=dokuwiki-prod-db
EFS_ID=fs-xxxxxxxxxx
VPC_ID=vpc-xxxxxxxxxx
```

Then load it:
```bash
source .env.decommission
bash decommission-master.sh
```

---

## 📝 Execution Checklist

Run this before and during decommissioning:

### Pre-Execution
- [ ] Vercel site stable for 1+ week
- [ ] All team members notified
- [ ] Final data backup verified
- [ ] `preflight-check.sh` passes all checks
- [ ] AWS credentials configured
- [ ] VPN connected (if required)
- [ ] Terminal session will not be interrupted

### During Execution
- [ ] Watch script output for errors
- [ ] Do NOT interrupt scripts
- [ ] Monitor AWS Console in parallel
- [ ] Keep backup credentials safe
- [ ] Document any errors

### Post-Execution
- [ ] `04-verify-resources.sh` shows all resources deleted
- [ ] `05-cost-verification.sh` confirms cost reduction
- [ ] Vercel site still operational
- [ ] DNS still resolving to Vercel
- [ ] CloudFront/S3 media still serving
- [ ] Logs archived in `logs/` directory

---

## 🔄 Monitoring & Logs

Each phase creates detailed logs:

```bash
# View all logs
ls -la logs/

# Follow latest log in real-time
tail -f logs/decommissioning-$(date +%Y%m%d).log

# Search for errors
grep ERROR logs/decommissioning-*.log
grep WARN logs/decommissioning-*.log
```

Log format:
```
[2026-01-27 14:32:15] [INFO] Starting Phase 1: Backup EFS
[2026-01-27 14:32:16] [EXEC] Creating EFS snapshot...
[2026-01-27 14:35:22] [SUCCESS] Snapshot created: snap-0a1b2c3d
[2026-01-27 14:35:23] [INFO] Uploading to S3...
```

---

## ⚠️ Troubleshooting

### Script Fails with "AWS CLI not found"
```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure
```

### "Cannot assume role" error
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Verify IAM permissions for decommissioning
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query 'Arn' | grep -o '/[^/]*$' | tr -d '/')
```

### "EFS mount targets still exist" error
This is normal - the script waits up to 60 seconds. If it persists:
```bash
# Check mount targets
aws efs describe-mount-targets --file-system-id $EFS_ID

# Force delete (if safe)
bash utils/resource-audit.sh
```

### Terraform destroy failed
```bash
# Check what would be destroyed (dry-run)
cd /Users/mithunselvan/dokuwiki/infra
terraform plan -destroy

# View error details
terraform destroy -auto-approve -parallelism=1
```

---

## 🆘 Emergency Procedures

### Stop Everything Immediately

```bash
# Kill running scripts
pkill -f decommission

# Restore from backup (RDS)
bash utils/emergency-rollback.sh
```

### Restore from RDS Snapshot

```bash
SNAPSHOT_ID="dokuwiki-prod-final-snapshot-20260127"

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier dokuwiki-prod-db-restored \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --region us-east-1
```

### Restore from EFS Backup

```bash
# Find backup location
ls -la backups/

# Restore to new EFS
aws efs create-file-system --performance-mode generalPurpose
# Then mount and restore from backup tar.gz
```

---

## 📈 Cost Impact

### Before Decommissioning
```
ECS Fargate:      ~$50/month
RDS PostgreSQL:   ~$60/month
NAT Gateway:      ~$20/month
EFS Storage:      ~$8/month
ALB:              ~$20/month (amortized)
────────────────────────────
TOTAL:            ~$158/month
```

### After Decommissioning
```
S3 Bucket:        ~$2/month  (media only, lifecycle policies)
CloudFront:       ~$5/month  (media CDN, amortized)
Route53:          ~$1/month  (DNS)
────────────────────────────
TOTAL:            ~$8/month

NET SAVINGS:      ~$150/month = $1,800/year
```

---

## 📚 Related Documentation

- [DECOMMISSIONING-CHECKLIST.md](../../DECOMMISSIONING-CHECKLIST.md) - Executive overview
- [AWS-DECOMMISSION.md](../../nextjs-wiki/AWS-DECOMMISSION.md) - Detailed breakdown
- [IMPLEMENTATION-SUMMARY.md](../../IMPLEMENTATION-SUMMARY.md) - Migration summary
- [Terraform Modules](../../infra/modules/) - Infrastructure code

---

## ✅ Success Criteria

Decommissioning is complete when:

- ✅ All 5 phases completed successfully
- ✅ `04-verify-resources.sh` shows zero AWS resources
- ✅ Vercel site still responding
- ✅ AWS billing confirms ~$150/month reduction
- ✅ All logs archived in `logs/` directory
- ✅ Team notified of completion
- ✅ Final Terraform state archived

---

## 🔐 Security Considerations

- **Credentials**: Scripts use AWS CLI with configured credentials (never hardcoded)
- **Backups**: Final RDS snapshot retained in AWS for 7 days
- **EFS Backup**: Downloaded to local storage before deletion
- **Audit Trail**: All operations logged with timestamps
- **Dry-Run**: Default to dry-run mode for safety; explicitly enable with `--execute`

---

## 📞 Support

If issues arise:

1. Check [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
2. Review logs in `logs/` directory
3. Run `utils/preflight-check.sh` to diagnose
4. Consult AWS documentation
5. Contact DevOps team with log output

---

**Created**: January 27, 2026  
**Last Updated**: January 27, 2026  
**Status**: Ready for Execution (Awaiting 1-week stability period)  
**Author**: Migration Team  
**Approval**: Pending post-1-week verification
