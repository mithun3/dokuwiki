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

# Show nameserver configuration reminder if hosted zone was created
if terraform output -json dns_configuration_required 2>/dev/null | grep -q "nameservers"; then
  echo ""
  echo "============================================================================"
  echo "📋 TERRAFORM APPLY COMPLETE - NEXT STEPS"
  echo "============================================================================"
  echo ""
  echo "If this is your first deploy or you recreated the hosted zone:"
  echo ""
  echo "1. Get the nameservers:"
  terraform output hosted_zone_nameservers
  echo ""
  echo "2. Update these nameservers at your domain registrar"
  echo "3. Wait 5-15 minutes for DNS propagation"
  echo "4. Verify with: dig NS $(terraform output -raw hosted_zone_id 2>/dev/null || echo 'your-domain.com') +short"
  echo ""
  echo "See README.md for detailed instructions."
  echo "============================================================================"
fi
