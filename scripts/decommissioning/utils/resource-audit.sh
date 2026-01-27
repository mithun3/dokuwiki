#!/bin/bash

# UTILITY: Resource Audit
# Comprehensive inventory of AWS resources before decommissioning

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
OUTPUT_FILE="${OUTPUT_FILE:-./logs/resource-audit-$(date +%Y%m%d-%H%M%S).json}"

echo "📋 AWS RESOURCE AUDIT"
echo "======================================"
echo "Region: $AWS_REGION"
echo "Output: $OUTPUT_FILE"
echo ""

mkdir -p "$(dirname "$OUTPUT_FILE")"

# JSON output structure
cat > "$OUTPUT_FILE" << 'EOF'
{
  "timestamp": null,
  "region": null,
  "resources": {
    "ecs": {},
    "rds": {},
    "efs": {},
    "elb": {},
    "nat": {},
    "ecr": {},
    "vpc": {},
    "security_groups": {}
  }
}
EOF

echo "Auditing resources..."

# 1. ECS
echo "1. ECS Clusters..."
aws ecs list-clusters --region "$AWS_REGION" --query 'clusterArns' --output json | jq '.' > /tmp/ecs.json
echo "   Found: $(jq 'length' /tmp/ecs.json) clusters"

# 2. RDS
echo "2. RDS Instances..."
aws rds describe-db-instances --region "$AWS_REGION" --query 'DBInstances[*].{DBInstanceIdentifier,Engine,DBInstanceClass,MultiAZ}' --output json | jq '.' > /tmp/rds.json
echo "   Found: $(jq 'length' /tmp/rds.json) instances"

# 3. EFS
echo "3. EFS File Systems..."
aws efs describe-file-systems --region "$AWS_REGION" --query 'FileSystems[*].{FileSystemId,SizeInBytes}' --output json | jq '.' > /tmp/efs.json
echo "   Found: $(jq 'length' /tmp/efs.json) file systems"

# 4. Load Balancers
echo "4. Load Balancers..."
aws elbv2 describe-load-balancers --region "$AWS_REGION" --query 'LoadBalancers[*].{LoadBalancerName,Type,Scheme}' --output json | jq '.' > /tmp/elb.json
echo "   Found: $(jq 'length' /tmp/elb.json) load balancers"

# 5. NAT Gateways
echo "5. NAT Gateways..."
aws ec2 describe-nat-gateways --region "$AWS_REGION" --query 'NatGateways[*].{NatGatewayId,State}' --output json | jq '.' > /tmp/nat.json
echo "   Found: $(jq 'length' /tmp/nat.json) NAT gateways"

# 6. ECR
echo "6. ECR Repositories..."
aws ecr describe-repositories --region "$AWS_REGION" --query 'repositories[*].{repositoryName,repositoryArn}' --output json | jq '.' > /tmp/ecr.json
echo "   Found: $(jq 'length' /tmp/ecr.json) repositories"

# 7. VPCs
echo "7. Custom VPCs..."
aws ec2 describe-vpcs --region "$AWS_REGION" --query 'Vpcs[?IsDefault==`false`].[VpcId,CidrBlock]' --output json | jq '.' > /tmp/vpc.json
echo "   Found: $(jq 'length' /tmp/vpc.json) custom VPCs"

# 8. Security Groups
echo "8. Security Groups..."
aws ec2 describe-security-groups --region "$AWS_REGION" --query 'SecurityGroups[?GroupName!=`default`].[GroupId,GroupName,VpcId]' --output json | jq '.' > /tmp/sg.json
echo "   Found: $(jq 'length' /tmp/sg.json) non-default security groups"

# Compile results
echo ""
echo "Compiling audit report..."

jq \
  --arg ts "$(date -Iseconds)" \
  --arg region "$AWS_REGION" \
  --slurpfile ecs /tmp/ecs.json \
  --slurpfile rds /tmp/rds.json \
  --slurpfile efs /tmp/efs.json \
  --slurpfile elb /tmp/elb.json \
  --slurpfile nat /tmp/nat.json \
  --slurpfile ecr /tmp/ecr.json \
  --slurpfile vpc /tmp/vpc.json \
  --slurpfile sg /tmp/sg.json \
  '.timestamp = $ts | .region = $region | .resources.ecs = $ecs[0] | .resources.rds = $rds[0] | .resources.efs = $efs[0] | .resources.elb = $elb[0] | .resources.nat = $nat[0] | .resources.ecr = $ecr[0] | .resources.vpc = $vpc[0] | .resources.security_groups = $sg[0]' \
  "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

echo ""
echo "✅ Audit complete: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "  ECS Clusters:      $(jq '.resources.ecs | length' "$OUTPUT_FILE")"
echo "  RDS Instances:     $(jq '.resources.rds | length' "$OUTPUT_FILE")"
echo "  EFS File Systems:  $(jq '.resources.efs | length' "$OUTPUT_FILE")"
echo "  Load Balancers:    $(jq '.resources.elb | length' "$OUTPUT_FILE")"
echo "  NAT Gateways:      $(jq '.resources.nat | length' "$OUTPUT_FILE")"
echo "  ECR Repositories:  $(jq '.resources.ecr | length' "$OUTPUT_FILE")"
echo "  Custom VPCs:       $(jq '.resources.vpc | length' "$OUTPUT_FILE")"
echo "  Security Groups:   $(jq '.resources.security_groups | length' "$OUTPUT_FILE")"
