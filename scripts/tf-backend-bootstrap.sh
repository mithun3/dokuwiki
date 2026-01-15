#!/usr/bin/env bash
set -euo pipefail

# Bootstraps the Terraform remote state backend (S3 bucket + DynamoDB lock table).
# Usage:
#   STATE_BUCKET=my-tfstate-bucket STATE_KEY=dokuwiki/terraform.tfstate LOCK_TABLE=tf-locks REGION=us-east-1 PROJECT=dokuwiki ./scripts/tf-backend-bootstrap.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/infra/state-backend"

STATE_BUCKET=${STATE_BUCKET:?"STATE_BUCKET required"}
STATE_KEY=${STATE_KEY:-dokuwiki/terraform.tfstate}
LOCK_TABLE=${LOCK_TABLE:-tf-locks}
REGION=${REGION:-us-east-1}
PROJECT=${PROJECT:-dokuwiki}

TFVARS="/tmp/tf-backend-vars-$$.tfvars"
trap 'rm -f "$TFVARS"' EXIT

cat > "$TFVARS" <<EOF
aws_region       = "${REGION}"
project_name     = "${PROJECT}"
state_bucket_name = "${STATE_BUCKET}"
lock_table_name  = "${LOCK_TABLE}"
state_key        = "${STATE_KEY}"
EOF

terraform init
terraform apply -auto-approve -var-file="$TFVARS"

echo "Backend created. Use this backend block in your main Terraform config:" >&2
tail -n +1 <<'EOF'
# In infra/main.tf terraform { backend "s3" { ... } }
# Replace bucket/key/region/dynamodb_table with the values above.
EOF

echo "" >&2
echo "To destroy the backend stack (only after migrating or discarding any state):" >&2
echo "  cd infra/state-backend && terraform destroy -var-file=$TFVARS" >&2
