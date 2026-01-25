# Vercel DNS Configuration
# Points sysya.com.au to Vercel hosting platform for Next.js application

# Lookup existing Route53 hosted zone if not creating one
data "aws_route53_zone" "existing" {
  count = var.domain_name != "" && !var.create_hosted_zone && var.hosted_zone_id == "" ? 1 : 0
  name  = var.domain_name
}

locals {
  # Determine which zone ID to use (created, provided, or looked up)
  zone_id_for_vercel = var.domain_name != "" ? (
    var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : (
      var.hosted_zone_id != "" ? var.hosted_zone_id : (
        length(data.aws_route53_zone.existing) > 0 ? data.aws_route53_zone.existing[0].zone_id : ""
      )
    )
  ) : ""
}

# Main domain A records to Vercel (apex domain cannot use CNAME)
# Vercel's A record IPs for apex domains
resource "aws_route53_record" "vercel_main" {
  count           = var.enable_vercel_dns && var.domain_name != "" ? 1 : 0
  zone_id         = local.zone_id_for_vercel
  name            = var.domain_name
  type            = "A"
  ttl             = 300
  allow_overwrite = true
  records = [
    "76.76.21.21",
    "76.76.21.142"
  ]
}

# www subdomain CNAME to Vercel (e.g., www.sysya.com.au)
resource "aws_route53_record" "vercel_www" {
  count   = var.enable_vercel_dns && var.domain_name != "" ? 1 : 0
  zone_id = local.zone_id_for_vercel
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["cname.vercel-dns.com"]
}

# Output Vercel DNS configuration status
output "vercel_dns_records" {
  description = "Vercel DNS configuration status and next steps"
  value = var.enable_vercel_dns && var.domain_name != "" ? {
    status = "✅ Vercel DNS records configured"
    main_domain = {
      name   = var.domain_name
      type   = "A"
      target = "76.76.21.21, 76.76.21.142"
      ttl    = 300
    }
    www_subdomain = {
      name   = "www.${var.domain_name}"
      type   = "CNAME"
      target = "cname.vercel-dns.com"
      ttl    = 300
    }
    next_steps = [
      "1. Deploy to Vercel: ./scripts/deploy-vercel.sh production",
      "2. Add custom domain in Vercel dashboard:",
      "   - Go to https://vercel.com/dashboard",
      "   - Select your project → Settings → Domains",
      "   - Add ${var.domain_name} and www.${var.domain_name}",
      "3. Wait 5-60 minutes for DNS propagation",
      "4. Verify DNS: dig ${var.domain_name} +short",
      "5. Test HTTPS: curl -I https://${var.domain_name}"
    ]
    warning = "⚠️  Old ECS/ALB DNS records will conflict. Set enable_vercel_dns=false to use ECS routing."
  } : {
    status = "⏸️  Vercel DNS disabled"
    main_domain = {
      name   = ""
      type   = ""
      target = ""
      ttl    = 0
    }
    www_subdomain = {
      name   = ""
      type   = ""
      target = ""
      ttl    = 0
    }
    next_steps = [
      "Set enable_vercel_dns = true in terraform.tfvars or via -var flag",
      "Example: terraform apply -var='enable_vercel_dns=true'"
    ]
    warning = ""
  }
}

# Output for quick verification commands
output "vercel_dns_verification" {
  description = "Commands to verify Vercel DNS configuration"
  value = var.enable_vercel_dns && var.domain_name != "" ? {
    check_dns        = "dig ${var.domain_name} +short"
    check_www_dns    = "dig www.${var.domain_name} +short"
    check_https      = "curl -I https://${var.domain_name}"
    expected_cname   = "cname.vercel-dns.com"
    propagation_time = "5-60 minutes"
  } : null
}
