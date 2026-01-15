#!/usr/bin/env bash
set -euo pipefail

: "${AWS_PROFILE:=my-creds}"
: "${AWS_REGION:=ap-southeast-2}"

ensure_slr() {
  local role_name="$1"
  local service_name="$2"

  if aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
    echo "✅ $role_name exists"
  else
    echo "➕ creating $role_name"
    aws iam create-service-linked-role --aws-service-name "$service_name" >/dev/null
  fi
}

ensure_slr "AWSServiceRoleForElasticLoadBalancing" "elasticloadbalancing.amazonaws.com"
ensure_slr "AWSServiceRoleForECS" "ecs.amazonaws.com"
ensure_slr "AWSServiceRoleForElasticFileSystem" "elasticfilesystem.amazonaws.com"