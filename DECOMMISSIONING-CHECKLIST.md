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

## 📋 Decommissioning Steps

### Phase 1: Data Backup (CRITICAL - Do First)

```bash
# 1. Backup EFS data from ECS cluster
# This contains all original DokuWiki files and media
aws ecs execute-command \
  --cluster dokuwiki-prod-cluster \
  --task $(aws ecs list-tasks --cluster dokuwiki-prod-cluster --query 'taskArns[0]' --output text) \
  --container dokuwiki-app \
  --interactive \
  --command "/bin/bash"

# Inside ECS container:
tar -czf dokuwiki-backup-$(date +%Y%m%d).tar.gz /data
exit

# 2. Download to local storage
aws s3 cp s3://YOUR_BACKUP_BUCKET/dokuwiki-backup-*.tar.gz ./backups/
```

### Phase 2: Verify Vercel Setup (1-2 weeks after deployment)

- [ ] Test all content pages load correctly
- [ ] Verify media playback works
- [ ] Check error tracking (Sentry/Vercel Analytics)
- [ ] Confirm DNS records point to Vercel
- [ ] Review Vercel deployment logs for errors

### Phase 3: Infrastructure Cleanup (After 1+ week stable)

**Keep (Still In Use):**
- [ ] S3 media bucket (media CDN dependency)
- [ ] CloudFront distribution (serving media)
- [ ] Route53 records (if using for Vercel)

**Delete (No Longer Needed):**

```bash
# 1. Delete ECS Cluster
aws ecs delete-cluster --cluster dokuwiki-prod-cluster

# 2. Delete RDS Database (WARNING: No recovery after this!)
aws rds delete-db-instance \
  --db-instance-identifier dokuwiki-db \
  --skip-final-snapshot

# 3. Delete EFS File System
aws efs delete-file-system --file-system-id fs-xxxxx

# 4. Delete ALB and Security Groups
aws elbv2 delete-load-balancer --load-balancer-arn arn:aws:elasticloadbalancing:...

# 5. Delete NAT Gateways (frees ~$65/month)
aws ec2 release-address --allocation-id eipalloc-xxxxx

# 6. Delete VPC and subnets
aws ec2 delete-vpc --vpc-id vpc-xxxxx

# 7. Empty and delete ECR Repository
aws ecr delete-repository --repository-name dokuwiki-app --force

# 8. Delete Terraform state backend
aws s3 rm s3://dokuwiki-tf-state/ --recursive
```

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
