# AWS Decommissioning Checklist

Post-migration cleanup for sysya-wiki. Old DokuWiki infrastructure on AWS can be safely removed once Vercel deployment is stable.

## ✅ Pre-Decommission Requirements

**All must be true before proceeding:**

- [x] Next.js site deployed and live on Vercel
- [x] Custom domain `sysya.com.au` resolving to Vercel
- [x] All content migrated and accessible
- [x] Media files serving via S3/CloudFront CDN
- [x] Tests passing (38/38 ✓)
- [x] Build succeeds (22 pages ✓)
- [ ] Site has been live for 1+ week with no issues
- [ ] Final EFS backup taken
- [ ] All stakeholders notified

## 📋 Decommissioning Automation

All decommissioning steps have been **automated into executable scripts** in `/scripts/decommissioning/`.

### 🚀 Quick Start

```bash
# Navigate to decommissioning directory
cd /Users/mithunselvan/dokuwiki/scripts/decommissioning

# Run all phases at once (with safety confirmations)
bash decommission-master.sh

# OR run individual phases
bash 01-backup-efs.sh        # Backup EFS data
bash 02-stop-ecs.sh          # Stop ECS services  
bash 03-terraform-destroy.sh # Destroy infrastructure (POINT OF NO RETURN)
bash 04-verify-resources.sh  # Verify cleanup
bash 05-cost-verification.sh # Confirm savings
```

### 📁 Scripts Available

| Script | Purpose | Status |
|--------|---------|--------|
| **decommission-master.sh** | Orchestrates all 5 phases with safety gates | Ready ✓ |
| **01-backup-efs.sh** | Creates EFS backup snapshots | Ready ✓ |
| **02-stop-ecs.sh** | Gracefully stops ECS services | Ready ✓ |
| **03-terraform-destroy.sh** | Destroys infrastructure via Terraform | Ready ✓ |
| **04-verify-resources.sh** | Verifies all resources deleted | Ready ✓ |
| **05-cost-verification.sh** | Confirms cost reduction | Ready ✓ |
| **utils/preflight-check.sh** | Pre-flight validation | Ready ✓ |
| **utils/resource-audit.sh** | Comprehensive resource inventory | Ready ✓ |
| **utils/state-cleanup.sh** | Archives Terraform state | Ready ✓ |
| **utils/emergency-rollback.sh** | Emergency restoration | Ready ✓ |

See [scripts/decommissioning/README.md](scripts/decommissioning/README.md) for full documentation.

### Phase 1: Data Backup (CRITICAL - Do First)

**Automated by:** `bash 01-backup-efs.sh`

Actions:
- Creates EFS backup snapshots
- Documents backup location
- Provides S3 upload commands (if needed)
- Estimated time: 5-10 minutes

### Phase 2: Verify Vercel Setup (1-2 weeks after deployment)

- [ ] Test all content pages load correctly
- [ ] Verify media playback works
- [ ] Check error tracking (Sentry/Vercel Analytics)
- [ ] Confirm DNS records point to Vercel
- [ ] Review Vercel deployment logs for errors

### Phase 3: Infrastructure Cleanup (After 1+ week stable)

**Automated by:** `bash 03-terraform-destroy.sh`

This script will:
- Plan all infrastructure changes
- Ask for your confirmation
- Execute `terraform destroy` with safety flags
- Archive Terraform state
- Estimated time: 10-15 minutes

**Keep (Still In Use):**
- [ ] S3 media bucket (media CDN dependency)
- [ ] CloudFront distribution (serving media)
- [ ] Route53 records (if using for Vercel)

**Delete via Scripts (Recommended):**

All infrastructure deletion is handled by `03-terraform-destroy.sh` which:
- Safely plans deletion
- Requires explicit confirmation
- Handles dependencies in correct order
- Archives state files for recovery
- Takes 10-15 minutes

**Manual Fallback Commands (if scripts fail):**

See [scripts/decommissioning/03-terraform-destroy.sh](scripts/decommissioning/03-terraform-destroy.sh) for full implementation.

## 💰 Cost Savings

| Resource | Monthly Cost | Status |
|----------|--------------|--------|
| NAT Gateways (2x) | ~$65 | 🗑️ Delete |
| ALB | ~$22 | 🗑️ Delete |
| ECS Fargate | ~$18 | 🗑️ Delete |
| RDS Database | ~$30 | 🗑️ Delete |
| EFS Storage | ~$3 | 🗑️ Delete |
| **Total Monthly** | **~$138** | **✅ To $0** |

## 📁 Archived Files

Old infrastructure files moved to `.archive/`:
- `.terraform/` - Terraform state
- `.terraform.lock.hcl` - Dependency lock
- `terraform.tfvars` - Old config
- `errored.tfstate` - Failed deployment

Keep for reference, can delete after 1 month.

## 🔗 References

- [AWS-DECOMMISSION.md](../nextjs-wiki/AWS-DECOMMISSION.md) - Detailed teardown guide
- [vercel.tfvars](../infra/vercel.tfvars) - New Vercel infrastructure config
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Vercel deployment docs

## ⚠️ Important Notes

- **BACKUP FIRST**: EFS data cannot be recovered after deletion
- **Test thoroughly**: Keep old infrastructure running 1+ week after Vercel deployment
- **DNS cutover**: Ensure all DNS traffic is pointing to Vercel before deleting infrastructure
- **Email records**: If using AWS SES, migrate to alternative before deleting
- **SSL certificates**: AWS ACM certs auto-delete after resource removal

---

**Last Updated:** January 27, 2026  
**Migration Status:** ✅ Complete - Awaiting 1-week stability period
