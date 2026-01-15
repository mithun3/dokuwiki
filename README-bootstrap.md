# Local + AWS Bootstrap

Use this guide to prep AWS prerequisites, push the app image, and run Terraform from your Mac.

## Prerequisites
- AWS CLI configured for the target account (keys or SSO).
- Terraform 1.6+.
- Docker Desktop running.
- A domain in Route53 (for `domain_name` and `hosted_zone_id`).
- Create a robot user from iam generate access keys or better use SSO.


## Access Keys Authenticate AWS CLI (not recommended)

Choose one method; ensure `aws sts get-caller-identity --region ap-southeast-2` works before continuing.

- Access keys (no SSO):
```sh
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE AWS_REGION
```
- Configure Access keys:
```sh
aws configure --profile my-creds
# enter:
# AWS Access Key ID: <your key>
# AWS Secret Access Key: <your secret>
# Default region: ap-southeast-2
# Output format: json
```
- Verify access:
```sh
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE AWS_REGION
AWS_PROFILE=my-creds aws sts get-caller-identity --region ap-southeast-2
```
- SSO (if your org provides a start URL/role):
```sh
  aws configure sso --profile my-sso
  # supply SSO start URL and SSO region, pick account/role, set region ap-southeast-2
  aws sso login --profile my-sso
  AWS_PROFILE=my-sso aws sts get-caller-identity --region ap-southeast-2
```

## 1) Create ECR repository
```sh
REGION=ap-southeast-2
ECR_REPO=dokuwiki
AWS_PROFILE=my-creds aws ecr create-repository --repository-name "$ECR_REPO" --region "$REGION" || true
```

## 2) Store the admin password in SSM
```sh
REGION=ap-southeast-2
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE AWS_REGION
AWS_PROFILE=my-creds AWS_REGION=ap-southeast-2 \
aws ssm put-parameter \
  --name "/dokuwiki/admin_password" \
  --value "changeme" \
  --type SecureString \
  --overwrite \
  --region ap-southeast-2
```
Use the ARN of this parameter for `admin_password_ssm_arn`.

## Required IAM policy for the robot user
Attach a policy scoped to your state bucket and lock table (adjust ARNs as needed):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:PutBucketVersioning",
        "s3:GetBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketTagging",
        "s3:GetAccelerateConfiguration",
        "s3:GetBucketPolicy",
        "s3:GetBucketRequestPayment",
        "s3:GetBucketAcl",
        "s3:GetBucketLogging",
        "s3:GetBucketTagging",
        "s3:GetBucketLocation",
        "s3:GetEncryptionConfiguration",
        "s3:GetBucketCORS",
        "s3:GetBucketWebsite",
        "s3:GetLifecycleConfiguration",
        "s3:GetReplicationConfiguration",
        "s3:GetBucketObjectLockConfiguration",
        "s3:GetBucketPublicAccessBlock",
        "s3:DeleteBucket",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::sysya-bucket-001"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::sysya-bucket-001/dokuwiki/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:PutBucketCors",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketTagging"
      ],
      "Resource": "arn:aws:s3:::dokuwiki-media-example"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::dokuwiki-media-example/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/Z123456789"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:DeleteTable",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:TagResource",
        "dynamodb:DescribeContinuousBackups",
        "dynamodb:DescribeTimeToLive",
        "dynamodb:ListTagsOfResource"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-2:462634386575:table/tf-locks"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:ModifySubnetAttribute",
        "ec2:CreateInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:AllocateAddress",
        "ec2:ReleaseAddress",
        "ec2:CreateNatGateway",
        "ec2:DeleteNatGateway",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:CreateRoute",
        "ec2:ReplaceRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateTags",
        "ec2:DeleteTags"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:PassRole",
        "iam:CreateServiceLinkedRole"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:CreateCluster",
        "ecs:DeleteCluster",
        "ecs:DescribeClusters",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:CreateService",
        "ecs:UpdateService",
        "ecs:DeleteService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:PutRetentionPolicy",
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:CreateFileSystem",
        "elasticfilesystem:DeleteFileSystem",
        "elasticfilesystem:DescribeFileSystems",
        "elasticfilesystem:CreateMountTarget",
        "elasticfilesystem:DeleteMountTarget",
        "elasticfilesystem:DescribeMountTargets",
        "elasticfilesystem:PutBackupPolicy",
        "elasticfilesystem:DeleteBackupPolicy",
        "elasticfilesystem:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:AddTagsToCertificate",
        "acm:ListCertificates"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:ListDistributions",
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:GetOriginAccessControl",
        "cloudfront:UpdateOriginAccessControl",
        "cloudfront:DeleteOriginAccessControl",
        "cloudfront:TagResource",
        "cloudfront:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParameterHistory",
        "ssm:DeleteParameter"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:ListTagsForResource",
        "ecr:TagResource",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
        "ecr:DeleteRepository"
      ],
      "Resource": "*"
    }
  ]
}
```

Replace the bucket/table ARNs with your own if they differ. Ensure no permission boundary or SCP blocks these actions.

## Backend bootstrap run (example output)
Command:
```sh
AWS_PROFILE=my-creds AWS_REGION=ap-southeast-2 \
STATE_BUCKET=sysya-bucket-001 \
STATE_KEY=dokuwiki/terraform.tfstate \
LOCK_TABLE=tf-locks \
REGION=ap-southeast-2 \
PROJECT=dokuwiki \
./scripts/tf-backend-bootstrap.sh
```
Result:
- Terraform initialized, refreshed existing bucket/table.
- Recreated public access block (tainted resource) and completed apply.
- Outputs:
  - state_bucket: sysya-bucket-001
  - lock_table: tf-locks
  - backend_snippet:
    ```
    backend "s3" {
      bucket         = "sysya-bucket-001"
      key            = "dokuwiki/terraform.tfstate"
      region         = "ap-southeast-2"
      dynamodb_table = "tf-locks"
      encrypt        = true
    }
    ```

Paste the backend block into infra/main.tf and run `AWS_PROFILE=my-creds terraform init -reconfigure` in infra/.

## Destroying the backend stack
Only do this after migrating or discarding all state. If the temp tfvars file is gone (e.g., reboot or cleanup), recreate it as shown below.
```sh
# recreate the temp tfvars if missing
cat > /tmp/tf-backend-vars.tfvars <<'EOF'
aws_region        = "ap-southeast-2"
project_name      = "dokuwiki"
state_bucket_name = "sysya-bucket-001"
lock_table_name   = "tf-locks"
state_key         = "dokuwiki/terraform.tfstate"
EOF

AWS_PROFILE=my-creds AWS_REGION=ap-southeast-2 \
  terraform -chdir=infra/state-backend destroy -var-file=/tmp/tf-backend-vars.tfvars
```

## 3) (Optional) Bootstrap Terraform remote state
This creates S3 + DynamoDB for the backend.
```sh
# run from repo root (so scripts/ is in path)
# first time only: chmod +x scripts/tf-backend-bootstrap.sh
STATE_BUCKET=sysya-bucket-001
STATE_KEY=dokuwiki/terraform.tfstate
LOCK_TABLE=tf-locks
REGION=ap-southeast-2
PROJECT=dokuwiki
STATE_BUCKET="$STATE_BUCKET" STATE_KEY="$STATE_KEY" LOCK_TABLE="$LOCK_TABLE" REGION="$REGION" PROJECT="$PROJECT" \
  ./scripts/tf-backend-bootstrap.sh
```
Then paste the emitted backend block into `infra/main.tf` and run:
```sh
cd infra
AWS_PROFILE=my-creds terraform init -reconfigure
```

## 4) Prepare terraform.tfvars
Set values in `infra/terraform.tfvars` (or another tfvars file):
- `aws_region`
- `environment`
- `container_image` (ECR URI you build below)
- `domain_name` (e.g., example.com)
- `hosted_zone_id` (for that domain)
- `media_bucket_name` (unique S3 bucket)
- `media_domain_name` (e.g., media.example.com)
- `media_hosted_zone_id` (or leave empty to reuse the main zone)
- `admin_password_ssm_arn` (ARN from step 2)

## 5) Build and push the app image
```sh
ACCOUNT_ID=$(AWS_PROFILE=my-creds aws sts get-caller-identity --query Account --output text) && REGION=ap-southeast-2 && ECR_REPO=dokuwiki && IMAGE_TAG=latest && IMAGE_URI=${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} && AWS_PROFILE=my-creds aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com && docker build -t "$IMAGE_URI" -f app/Dockerfile app && docker push "$IMAGE_URI"
```
Update `container_image` (or export `TF_VAR_container_image=$IMAGE_URI`) for Terraform.

## 6) Apply infrastructure from local
With backend values passed at runtime (no backend block required):
```sh
cd infra
AWS_PROFILE=my-creds BACKEND_BUCKET=sysya-bucket-001 BACKEND_KEY=dokuwiki/terraform.tfstate BACKEND_REGION=ap-southeast-2 BACKEND_DDB_TABLE=tf-locks TFVARS=terraform.tfvars ../scripts/tf-apply.sh
```
If you set the backend in `infra/main.tf`, omit the BACKEND_* vars and just run:
```sh
TFVARS=terraform.tfvars ../scripts/tf-apply.sh
```

## 7) Verify
- Hit the ALB DNS or Route53 alias for the wiki.
- Check media URLs via CloudFront (if media CDN is configured).

## 8) Local-only sanity check (Docker Compose)
```sh
ADMIN_PASSWORD=changeme DEMO_USERS=1 docker compose up
```
Browse http://localhost:8080. Stop with `docker compose down`.

## 9) Destroy (if needed)
```sh
cd infra
TFVARS=terraform.tfvars ../scripts/tf-destroy.sh
```
Only destroy the backend after migrating or discarding all state.
