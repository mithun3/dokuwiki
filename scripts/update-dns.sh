#!/bin/bash

# DNS Update Script for Route53
# Points sysya.com.au to Vercel

set -e

DOMAIN="sysya.com.au"

echo "🌐 Updating DNS for $DOMAIN"
echo "============================"
echo ""

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
  --output text 2>/dev/null | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "⚠️  Could not find Route53 hosted zone for $DOMAIN"
    echo ""
    echo "Options:"
    echo "  1. Check AWS credentials are configured"
    echo "  2. Manually update DNS in AWS Console"
    echo "  3. Use Vercel DNS instead"
    echo ""
    exit 1
fi

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo ""

# Get Vercel deployment info
echo "📋 Vercel DNS Configuration:"
echo ""
echo "You need to point your domain to Vercel."
echo ""
echo "Recommended: CNAME record"
echo "  $DOMAIN -> cname.vercel-dns.com"
echo ""
echo "Alternative: A records"
echo "  76.76.21.21"
echo "  76.76.21.142"
echo ""

read -p "Update DNS now? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏭️  Skipping DNS update"
    echo ""
    echo "To update DNS manually:"
    echo "  1. AWS Console → Route53 → Hosted Zones"
    echo "  2. Add CNAME: $DOMAIN → cname.vercel-dns.com"
    echo "  3. Or run this script again"
    exit 0
fi

echo ""
echo "Updating Route53 records..."

# Create change batch JSON
cat > /tmp/dns-change.json << 'INNER_EOF'
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "DOMAIN_PLACEHOLDER",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "cname.vercel-dns.com"
          }
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.DOMAIN_PLACEHOLDER",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "cname.vercel-dns.com"
          }
        ]
      }
    }
  ]
}
INNER_EOF

# Replace placeholder with actual domain
sed -i.bak "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /tmp/dns-change.json

# Apply changes
aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch file:///tmp/dns-change.json

rm /tmp/dns-change.json /tmp/dns-change.json.bak

echo ""
echo "✅ DNS updated!"
echo ""
echo "⏰ DNS propagation typically takes 5-60 minutes"
echo ""
echo "Check status with:"
echo "  dig $DOMAIN"
echo "  dig www.$DOMAIN"
echo ""
echo "Or visit: https://dnschecker.org/#CNAME/$DOMAIN"
