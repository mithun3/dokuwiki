# Infrastructure Scaffold

This directory holds Terraform for AWS:
- Remote state in S3 with DynamoDB lock (per env bucket/prefix).
- VPC (public for ALB/CloudFront, private for compute), NAT as needed.
- ACM certs and Route53 for custom domain.
- Compute (ECS Fargate or EC2 ASG) with ALB + WAF.
- EFS for DokuWiki persistent state; S3 + CloudFront for large downloads.
- IAM roles for tasks/instances and CI; CloudWatch logs/alarms.
- AWS Backup for EFS snapshots before deploys/updates.

Recommended layout:
- `modules/` for VPC, ALB/WAF, EFS, compute, Route53, backup.
- `envs/<env>/` for per-environment stacks referencing modules.
- `terraform.tfvars` per env for domain, cert ARNs, EFS IDs, etc.

Initialize backend first, then plan/apply per env.

What’s included now (starter wiring):
- Network: VPC, public/private subnets, IGW, optional NAT.- ECR: repository for Docker images with lifecycle policy (keeps last 10 untagged images).- EFS: filesystem + mount targets; ingress open to VPC CIDR by default (tighten to task SG later).
- ALB: HTTP/HTTPS listeners, target group, SG.
- ECS Fargate: cluster/service/task with EFS mounts at /var/www/dokuwiki/{data,conf,lib/plugins}; env vars and ADMIN_PASSWORD via SSM secret.
- ACM + Route53: DNS validation and alias A record to ALB.
- Media CDN: S3 bucket (private, versioned, SSE-S3, CORS) + CloudFront with OAC; optional media.* Route53 alias and us-east-1 ACM.

Quickstart
1) Update terraform.tfvars with VPC CIDRs/AZs, domain/zone, admin password SSM ARN.
2) (Optional) Configure backend S3/DynamoDB in `terraform { backend "s3" { ... } }`.
3) `terraform init`
4) `terraform plan -var-file=terraform.tfvars`
5) `terraform apply -var-file=terraform.tfvars`
6) After apply, get the ECR URL from output: `terraform output ecr_repository_url`

Building and pushing Docker images
After infrastructure is created, build and push your Docker image:
```bash
# Get ECR repository URL from Terraform output
ECR_URL=$(terraform output -raw ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin "$ECR_URL"

# Build and push (from repo root)
docker build -t "$ECR_URL:latest" -f app/Dockerfile .
docker push "$ECR_URL:latest"
```

Manual ECR creation (if not using Terraform)
If you need to create the ECR repository outside of Terraform:
```bash
aws ecr create-repository \
  --repository-name dokuwiki-app-repo \
  --region ap-southeast-2 \
  --image-scanning-configuration scanOnPush=true
```

State backend bootstrap (one-time)
- Use `scripts/tf-backend-bootstrap.sh` to create the remote backend (S3 + DynamoDB) with local state first: set env STATE_BUCKET, STATE_KEY, LOCK_TABLE, REGION, PROJECT.
- After creation, add the emitted backend block to `infra/main.tf` and re-run `terraform init -reconfigure` in infra/.

Backend stack (what it creates)
- S3 bucket for Terraform state: versioning on, SSE-S3, public access blocked.
- DynamoDB table for state locks (pay-per-request).
- Outputs include a ready-to-paste backend block.

Bootstrap commands
```
STATE_BUCKET=<your-bucket> STATE_KEY=dokuwiki/terraform.tfstate \
LOCK_TABLE=tf-locks REGION=us-east-1 PROJECT=dokuwiki \
./scripts/tf-backend-bootstrap.sh
```
Then paste the backend block into `infra/main.tf` and run `terraform init -reconfigure` in `infra/`.

Destroying the backend (only after migrating or discarding state)
```
cd infra/state-backend
terraform destroy -var-file=/tmp/tf-backend-vars-<run>.tfvars
```
Ensure no active stacks are using this backend before destroying it.

Notes
- EFS ingress is now limited to the ECS task SG via an explicit SG rule; no VPC-wide access.
- ADMIN_PASSWORD comes from SSM/Secrets Manager (ARN in `admin_password_ssm_arn`). Hashes land in users.auth.php on start; do not commit plaintext.
- Media: upload to the S3 bucket; reference URLs via the CloudFront domain (e.g., https://media.example.com/path/file.mp4). Range requests and CORS are enabled for streaming.

Hardening to consider (enterprise baseline)
- Enable remote state (S3 + DynamoDB) and restrict access via IAM.
- Turn on ALB access logs (S3) and WAF managed rules; consider rate limiting.
- Separate task execution role from task role with least-privilege policies (ECR pull, CloudWatch logs, SSM read for secrets).
- Constrain NAT or remove it if egress is not needed; alternatively, use VPC endpoints for S3/SSM.
- Add CloudWatch alarms (5xx, TG unhealthy hosts) and budgets/alerts for cost.
