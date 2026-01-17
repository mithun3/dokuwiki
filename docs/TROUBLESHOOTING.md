# Troubleshooting Guide

## Website Not Reachable

If https://sysya.com.au is not loading, follow these diagnostic steps.

### 1. Check DNS Resolution

```bash
dig sysya.com.au +short
dig www.sysya.com.au +short
```

Expected: Should return IP addresses pointing to your ALB.

### 2. Get ALB DNS Name and Status

```bash
AWS_PROFILE=my-creds aws elbv2 describe-load-balancers \
  --region ap-southeast-2 \
  --query 'LoadBalancers[?contains(LoadBalancerName, `dokuwiki`)].{Name:LoadBalancerName,DNS:DNSName,State:State.Code}' \
  --output table
```

Expected: State should be `active`.

### 3. Check ECS Service Status

```bash
AWS_PROFILE=my-creds aws ecs describe-services \
  --cluster dokuwiki-prod-cluster \
  --services dokuwiki-prod-svc \
  --region ap-southeast-2 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Events:events[0:3]}' \
  --output json
```

Expected: `Running` should equal `Desired` (typically 1), and Status should be `ACTIVE`.

### 4. Check Target Group Health

```bash
# List target groups
AWS_PROFILE=my-creds aws elbv2 describe-target-groups \
  --region ap-southeast-2 \
  --query 'TargetGroups[*].{Name:TargetGroupName,ARN:TargetGroupArn}' \
  --output table

# Check health (replace ARN with actual value from above)
AWS_PROFILE=my-creds aws elbv2 describe-target-health \
  --target-group-arn "arn:aws:elasticloadbalancing:ap-southeast-2:462634386575:targetgroup/..." \
  --region ap-southeast-2
```

Expected: `TargetHealth.State` should be `healthy`.

### 5. Check ACM Certificate Status

```bash
AWS_PROFILE=my-creds aws acm list-certificates \
  --region ap-southeast-2 \
  --query 'CertificateSummaryList[*].{Domain:DomainName,Status:Status}' \
  --output table
```

Expected: Status should be `ISSUED`.

### 6. Test Direct Connection (Bypass DNS)

If DNS seems to be the issue, test connecting directly to the ALB IP:

```bash
# Get ALB IP
dig dokuwiki-prod-alb-*.ap-southeast-2.elb.amazonaws.com +short

# Test with direct IP (replace with actual IP)
curl -sI --connect-timeout 10 --resolve sysya.com.au:443:13.236.112.34 https://sysya.com.au
```

If this works but normal access doesn't, the issue is DNS-related.

### 7. Flush Local DNS Cache (macOS)

```bash
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

Then retry:
```bash
curl -sI --connect-timeout 10 https://sysya.com.au
```

---

## Common Issues and Solutions

### DNS Resolution Timeout
**Symptom:** `curl: (28) Resolving timed out`  
**Solution:** Flush local DNS cache (see step 7) or try a different DNS resolver (e.g., 8.8.8.8).

### Target Unhealthy
**Symptom:** Target group shows `unhealthy` state  
**Possible causes:**
- Container not running - check ECS service events
- Health check failing - check container logs
- Security group blocking health checks

Check container logs:
```bash
AWS_PROFILE=my-creds aws logs tail /ecs/dokuwiki-prod --region ap-southeast-2 --since 30m
```

### Certificate Not Issued
**Symptom:** ACM certificate in `PENDING_VALIDATION` state  
**Solution:** Ensure DNS validation records are created. Check:
```bash
cd infra && terraform output app_cert_validation_records
```

### ECS Task Failing to Start
**Symptom:** `Running: 0`, service events show task failures  
**Check task stopped reason:**
```bash
AWS_PROFILE=my-creds aws ecs list-tasks \
  --cluster dokuwiki-prod-cluster \
  --desired-status STOPPED \
  --region ap-southeast-2

# Get details for a stopped task
AWS_PROFILE=my-creds aws ecs describe-tasks \
  --cluster dokuwiki-prod-cluster \
  --tasks <task-arn> \
  --region ap-southeast-2 \
  --query 'tasks[0].{StoppedReason:stoppedReason,Containers:containers[*].{Name:name,Reason:reason}}'
```

---

## Useful Commands

### View Recent Container Logs
```bash
AWS_PROFILE=my-creds aws logs tail /ecs/dokuwiki-prod --region ap-southeast-2 --follow
```

### Force New Deployment
```bash
AWS_PROFILE=my-creds aws ecs update-service \
  --cluster dokuwiki-prod-cluster \
  --service dokuwiki-prod-svc \
  --force-new-deployment \
  --region ap-southeast-2
```

### Check Route53 Records
```bash
AWS_PROFILE=my-creds aws route53 list-resource-record-sets \
  --hosted-zone-id $(cd infra && terraform output -raw hosted_zone_id) \
  --query 'ResourceRecordSets[?Name==`sysya.com.au.`]'
```
