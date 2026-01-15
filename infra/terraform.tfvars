aws_region   = "ap-southeast-2"
project_name = "dokuwiki"
environment  = "prod"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.0.0/24", "10.0.1.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
availability_zones   = ["ap-southeast-2a", "ap-southeast-2b"]

domain_name        = "sysya.com.au"
create_hosted_zone = true
hosted_zone_id     = ""
container_image    = "462634386575.dkr.ecr.ap-southeast-2.amazonaws.com/dokuwiki:latest"
admin_password_ssm_arn = "arn:aws:ssm:ap-southeast-2:462634386575:parameter/dokuwiki/admin_password"

# Media CDN
media_domain_name    = "media.sysya.com.au"
media_hosted_zone_id = "" # leave blank to manage DNS externally
media_bucket_name    = "dokuwiki-media-example"
media_certificate_arn = "" # optional: ACM cert ARN in us-east-1 for media domain
