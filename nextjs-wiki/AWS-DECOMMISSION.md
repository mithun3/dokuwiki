# AWS Infrastructure Decommission Guide

This guide walks you through safely decommissioning the DokuWiki AWS infrastructure after migrating to Next.js on Vercel.

##  Pre-Decommission Checklist

**DO NOT proceed until ALL items are checked:**

- [ ] Next.js site is fully deployed and tested on Vercel
- [ ] Custom domain `sysya.com.au` is pointing to Vercel
- [ ] All content has been migrated and verified
- [ ] Media files are accessible (S3/CloudFront for large files)
- [ ] DNS has propagated (test from multiple locations)
- [ ] Site has been live for at least 1 week without issues
- [ ] Backup of all EFS data has been taken
- [ ] Final backup has been uploaded to S3

##  Current AWS Resources

Your infrastructure includes:

| Resource | Purpose | Monthly Cost | Can Delete? |
|----------|---------|--------------|-------------|
| **VPC + Subnets** | Network | ~$0 |  Yes |
| **NAT Gateway (2x)** | Private subnet egress | ~$65 |  Yes |
| **Application Load Balancer** | HTTP/HTTPS routing | ~$22 |  Yes |
| **ECS Fargate Cluster** | PHP runtime | ~$18 |  Yes |
| **EFS File System** | DokuWiki data | ~$3 |  After backup |
| **S3 Media Bucket** | Large media files | ~$1 |  Keep (in use) |
| **CloudFront Distribution** | Media CDN | ~$1 |  Keep (in use) |
| **Route53 Hosted Zone** | DNS | ~$0.50 |  Optional |
| **ECR Repository** | Docker images | ~$0.50 |  Yes |
| **CloudWatch Logs** | ECS logs | ~$0.50 |  Yes (auto-deleted) |
| **ACM Certificates** | SSL certs | $0 |  Yes (auto-deleted) |

##  Step 1: Final Backup (CRITICAL)

### Backup EFS Data

```bash
# Set your AWS profile
export AWS_PROFILE=your-profile

# Get ECS cluster and task details
CLUSTER_NAME="dokuwiki-prod-cluster"
TASK_ID=$(aws ecs list-tasks --cluster $CLUSTER_NAME --query 'taskArns[0]' --output text | cut -d'/' -f3)

# Create final backup via ECS Exec
aws ecs execute-command \
  --cluster $CLUSTER_NAME \
  --task $TASK_ID \
  --container dokuwiki \
  --interactive \
  --command "/bin/bash -c '/app/backup.sh'"
```

### Verify Backup in S3

```bash
# List recent backups
aws s3 ls s3://your-backup-bucket/dokuwiki-backups/ --recursive --human-readable

# Download backup locally for safekeeping
aws s3 cp s3://your-backup-bucket/dokuwiki-backups/dokuwiki-backup-YYYYMMDD.tar.gz ./final-backup.tar.gz
```

### What to Backup

The backup should include:
- `/var/www/dokuwiki/data/` - All wiki content
- `/var/www/dokuwiki/conf/` - Configuration files
- `/var/www/dokuwiki/lib/plugins/` - Custom plugins (if any)

**Store this backup safely** - it's your rollback option if needed.

##  Step 2: Stop ECS Service

Before destroying infrastructure, gracefully stop the service:

```bash
cd infra/

# Update desired count to 0
aws ecs update-service \
  --cluster dokuwiki-prod-cluster \
  --service dokuwiki-prod-svc \
  --desired-count 0

# Wait for tasks to drain
aws ecs wait services-stable \
  --cluster dokuwiki-prod-cluster \
  --services dokuwiki-prod-svc
```

This prevents new connections and allows existing requests to complete.

##  Step 3: Terraform Destroy

### Option A: Full Destroy (Recommended after 2 weeks)

```bash
cd infra/

# Review what will be destroyed
terraform plan -destroy

# Destroy everything except S3/CloudFront (see Step 4)
terraform destroy -auto-approve
```

This will remove:
-  ECS Cluster, Service, Tasks
-  EFS File System and Mount Targets
-  Application Load Balancer
-  NAT Gateways
-  VPC, Subnets, Internet Gateway
-  Security Groups
-  IAM Roles
-  CloudWatch Log Groups
-  ACM Certificates
-  ECR Repository
-  S3/CloudFront (handled separately)

**Expected Duration:** 5-10 minutes

### Option B: Staged Destroy (Lower Risk)

Destroy resources in phases:

```bash
# Phase 1: Compute (no data loss risk)
terraform destroy -target=module.ecs -auto-approve
terraform destroy -target=module.alb -auto-approve

# Phase 2: Network (saves $65/month from NAT)
terraform destroy -target=module.network -auto-approve

# Phase 3: Storage (after confirming backups)
terraform destroy -target=module.efs -auto-approve

# Phase 4: Everything else
terraform destroy -auto-approve
```

### Handle Protected Resources

If Terraform fails due to deletion protection:

```bash
# Disable termination protection on ECS service
aws ecs update-service \
  --cluster dokuwiki-prod-cluster \
  --service dokuwiki-prod-svc \
  --enable-execute-command false

# Disable EFS backup protection (if enabled)
aws backup delete-backup-vault --backup-vault-name dokuwiki-backup-vault || true
```

##  Step 4: Handle S3 and CloudFront

### Keep Media CDN (Recommended)

If your Next.js site references media files from `media.sysya.com.au`, **KEEP** these resources:

-  S3 bucket for media files (~$1-2/month)
-  CloudFront distribution (~$1/month)

### Clean Up Unused Files

```bash
# List all objects
aws s3 ls s3://dokuwiki-media-example/ --recursive --human-readable

# Remove old backups (if stored here)
aws s3 rm s3://dokuwiki-media-example/backups/ --recursive

# Enable lifecycle policy for cost optimization
aws s3api put-bucket-lifecycle-configuration \
  --bucket dokuwiki-media-example \
  --lifecycle-configuration file://lifecycle-policy.json
```

**lifecycle-policy.json:**
```json
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Prefix": "backups/",
      "Expiration": {
        "Days": 90
      }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
```

### Destroy CDN (If Not Needed)

If you're NOT using the media CDN:

```bash
# Disable CloudFront distribution (required before deletion)
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='dokuwiki-media'].Id" --output text)

# Get current config
aws cloudfront get-distribution-config --id $DIST_ID > dist-config.json

# Edit dist-config.json: set "Enabled": false

# Update distribution
aws cloudfront update-distribution --id $DIST_ID --if-match ETAG --distribution-config file://dist-config.json

# Wait for deployment (can take 15-30 minutes)
aws cloudfront wait distribution-deployed --id $DIST_ID

# Now delete
aws cloudfront delete-distribution --id $DIST_ID --if-match NEW_ETAG

# Empty and delete S3 bucket
aws s3 rm s3://dokuwiki-media-example/ --recursive
aws s3 rb s3://dokuwiki-media-example/ --force
```

##  Step 5: DNS Migration

### Option A: Move to Vercel DNS (Recommended)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add `sysya.com.au`
   - Choose "Use Vercel nameservers"

2. **Update Domain Registrar:**
   - Point nameservers to Vercel's NS records
   - Remove old Route53 nameservers

3. **Delete Route53 Hosted Zone:**
   ```bash
   # Get hosted zone ID
   ZONE_ID=$(aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='sysya.com.au.'].Id" --output text | cut -d'/' -f3)
   
   # Delete all records except NS and SOA
   # (Manual via AWS Console or use aws-cli with caution)
   
   # Delete hosted zone
   aws route53 delete-hosted-zone --id $ZONE_ID
   ```

   **Savings:** $0.50/month

### Option B: Keep Route53

If you prefer Route53 DNS:

1. Update A record to point to Vercel:
   ```bash
   # Get Vercel IP from dashboard or use CNAME
   # Update Route53 record to point to cname.vercel-dns.com
   ```

2. Keep hosted zone (minimal cost)

##  Step 6: Clean Up Terraform State

```bash
cd infra/

# Remove state backend (optional - keeps audit trail)
# terraform state rm aws_s3_bucket.terraform_state
# terraform state rm aws_dynamodb_table.terraform_locks

# Or destroy state backend entirely
cd state-backend/
terraform destroy -auto-approve
cd ..

# Remove local state files
rm -rf .terraform/
rm terraform.tfstate*
```

##  Cost Verification

### Before Decommission
```bash
# Get cost breakdown (requires AWS Cost Explorer API access)
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json
```

### After Decommission

Wait 24 hours, then check:

```bash
# List all remaining resources with costs
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=dokuwiki \
  --region ap-southeast-2
```

Expected remaining costs:
- S3 media storage: ~$1-2/month
- CloudFront: ~$1/month
- Route53 (if kept): ~$0.50/month
- **Total: $2-4/month** (vs $117/month before)

##  Step 7: Verification Checklist

- [ ] Vercel site is fully operational
- [ ] DNS resolves to Vercel (`dig sysya.com.au`)
- [ ] SSL certificate is valid (https://sysya.com.au)
- [ ] All pages load correctly
- [ ] Media player works with CDN files
- [ ] No AWS charges for ECS/Fargate in next bill
- [ ] No ALB charges
- [ ] No NAT Gateway charges
- [ ] CloudWatch Logs stopped accumulating
- [ ] Backup downloaded and stored safely

##  Rollback Procedure (Emergency)

If you need to rollback:

1. **Restore from backup:**
   ```bash
   # Re-deploy ECS infrastructure
   cd infra/
   terraform apply -auto-approve
   
   # Wait for service to be healthy
   aws ecs wait services-stable --cluster dokuwiki-prod-cluster --services dokuwiki-prod-svc
   
   # Restore backup to EFS
   aws ecs execute-command --cluster dokuwiki-prod-cluster --task TASK_ID --container dokuwiki --interactive --command "/bin/bash"
   
   # In container:
   cd /var/www/dokuwiki
   aws s3 cp s3://backup-bucket/final-backup.tar.gz /tmp/
   tar -xzf /tmp/final-backup.tar.gz -C /var/www/dokuwiki/
   ```

2. **Update DNS back to ALB:**
   ```bash
   # Get ALB DNS name
   aws elbv2 describe-load-balancers --query 'LoadBalancers[?LoadBalancerName==`dokuwiki-prod-alb`].DNSName' --output text
   
   # Update Route53 A record to point to ALB
   ```

3. **Wait for DNS propagation** (5-60 minutes)

**Rollback window:** 30 days (keep backups for 30 days minimum)

##  Recommended Timeline

| Day | Action | Duration |
|-----|--------|----------|
| **Day 0** | Deploy Next.js to Vercel, run in parallel | 2 hours |
| **Day 1-7** | Monitor both systems, verify migration | Ongoing |
| **Day 7** | Final backup, stop ECS service | 1 hour |
| **Day 8** | Terraform destroy (except S3/CloudFront) | 30 min |
| **Day 9-14** | Monitor costs, verify no issues | Ongoing |
| **Day 14** | Clean up Route53, state backend (optional) | 30 min |
| **Day 30** | Archive final backup, delete old logs | 30 min |

##  Expected Cost Savings

| Resource | Before | After | Savings |
|----------|--------|-------|---------|
| **ECS Fargate** | $18/mo | $0 | $18/mo |
| **ALB** | $22/mo | $0 | $22/mo |
| **NAT Gateway** | $65/mo | $0 | $65/mo |
| **EFS** | $3/mo | $0 | $3/mo |
| **CloudWatch** | $1/mo | $0 | $1/mo |
| **ECR** | $0.50/mo | $0 | $0.50/mo |
| **S3/CloudFront** | $2/mo | $2/mo | $0 |
| **Route53** | $0.50/mo | $0* | $0.50/mo |
| **Vercel** | $0 | $0 | $0 |
| **TOTAL** | **$117/mo** | **$2/mo** | **$115/mo** |

*If moving DNS to Vercel

**Annual Savings: $1,380**

##  Success Criteria

Decommission is successful when:

1.  Next.js site is fully operational on Vercel
2.  Zero AWS compute charges (ECS, ALB, NAT)
3.  Only S3/CloudFront charges remain (~$2/month)
4.  All backups are safely stored
5.  Terraform state is clean
6.  No orphaned resources remain

##  Support

If you encounter issues:

1. Check AWS CloudFormation events for stack deletion failures
2. Review Terraform error messages
3. Verify resource dependencies (some resources must be deleted in order)
4. Contact AWS Support for stuck resources

##  Additional Resources

- [AWS Cost Optimization Best Practices](https://aws.amazon.com/pricing/cost-optimization/)
- [Terraform Destroy Documentation](https://www.terraform.io/docs/commands/destroy.html)
- [AWS Resource Cleanup Guide](https://docs.aws.amazon.com/awsconsolehelpdocs/latest/gsg/delete-resources.html)

---

**Remember:** Always keep backups for at least 30 days after decommission!
