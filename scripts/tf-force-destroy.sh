#!/usr/bin/env bash
set -euo pipefail

# This script is a workaround for the "BucketNotEmpty" error when destroying a
# versioned S3 bucket. It first applies the configuration to ensure that the
# 'force_destroy = true' attribute is set in the Terraform state, and then
# immediately destroys the infrastructure.
#
# Usage:
#   AWS_PROFILE=my-creds TFVARS=terraform.tfvars ./scripts/tf-force-destroy.sh
#
# With backend config:
#   AWS_PROFILE=my-creds BACKEND_BUCKET=dokuwiki-tfstate-bucket \
#   BACKEND_KEY=dokuwiki/terraform.tfstate BACKEND_REGION=ap-southeast-2 \
#   BACKEND_DDB_TABLE=tf-locks TFVARS=terraform.tfvars ./scripts/tf-force-destroy.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/infra"

TFVARS="${TFVARS:-terraform.tfvars}"

# Build backend configuration arguments
backend_args=()
if [ -n "${BACKEND_BUCKET:-}" ]; then
  backend_args+=("-backend-config=bucket=${BACKEND_BUCKET}")
fi
if [ -n "${BACKEND_KEY:-}" ]; then
  backend_args+=("-backend-config=key=${BACKEND_KEY}")
fi
if [ -n "${BACKEND_REGION:-}" ]; then
  backend_args+=("-backend-config=region=${BACKEND_REGION}")
fi
if [ -n "${BACKEND_DDB_TABLE:-}" ]; then
  backend_args+=("-backend-config=dynamodb_table=${BACKEND_DDB_TABLE}")
fi

echo "Initializing Terraform..."
if [ ${#backend_args[@]} -gt 0 ]; then
  terraform init "${backend_args[@]}"
else
  terraform init
fi

echo "Applying changes to update the S3 bucket state..."
terraform apply -auto-approve -var-file="$TFVARS"

echo "Destroying infrastructure..."
terraform destroy -auto-approve -var-file="$TFVARS"

echo "Cleanup complete."
