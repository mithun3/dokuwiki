#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   TFVARS=terraform.tfvars ./scripts/tf-apply.sh
# Optional backend (remote state) at runtime without editing main.tf backend block:
#   BACKEND_BUCKET=... BACKEND_KEY=... BACKEND_REGION=... BACKEND_DDB_TABLE=... ./scripts/tf-apply.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/infra"

TFVARS="${TFVARS:-terraform.tfvars}"

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

if [ ${#backend_args[@]} -gt 0 ]; then
  terraform init "${backend_args[@]}"
else
  terraform init
fi

terraform plan -var-file="$TFVARS" -out=tfplan.out
terraform apply tfplan.out
