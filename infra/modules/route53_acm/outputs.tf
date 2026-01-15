output "certificate_arn" { value = aws_acm_certificate.this.arn }
output "record_fqdn" { value = aws_route53_record.app.fqdn }
