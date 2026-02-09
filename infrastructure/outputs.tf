output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_eip.web.public_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.web.public_ip}"
}

output "api_subdomain" {
  description = "API subdomain for this environment"
  value       = var.environment == "production" ? "api.${var.domain_name}" : "api-staging.${var.domain_name}"
}

# Uncomment when using your own S3 bucket instead of RERUM S3 proxy
# output "s3_bucket_name" {
#   description = "S3 bucket for media"
#   value       = aws_s3_bucket.media.bucket
# }
#
# output "s3_bucket_url" {
#   description = "S3 bucket URL for media"
#   value       = "https://${aws_s3_bucket.media.bucket}.s3.${var.aws_region}.amazonaws.com"
# }

# Uncomment when using SES for transactional email
# output "ses_domain_identity_arn" {
#   description = "SES domain identity ARN"
#   value       = aws_ses_domain_identity.main.arn
# }
#
# output "ses_dkim_tokens" {
#   description = "DKIM CNAME tokens (add to DNS if not using Route 53)"
#   value       = aws_ses_domain_dkim.main.dkim_tokens
# }
#
# output "ses_smtp_endpoint" {
#   description = "SES SMTP endpoint for this region"
#   value       = "email-smtp.${var.aws_region}.amazonaws.com"
# }
#
# output "ses_sender_access_key" {
#   description = "Access key ID for SES sender IAM user"
#   value       = aws_iam_access_key.ses_sender.id
# }
#
# output "ses_sender_secret_key" {
#   description = "Secret access key for SES sender IAM user (use to generate SMTP password)"
#   value       = aws_iam_access_key.ses_sender.secret
#   sensitive   = true
# }

output "next_steps" {
  description = "Post-deployment steps"
  value       = <<-EOT
    1. Point DNS A record for ${var.environment == "production" ? "api" : "api-staging"}.${var.domain_name} to ${aws_eip.web.public_ip}
    2. SSH into server: ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.web.public_ip}
    3. Run SSL setup: sudo certbot --nginx -d ${var.environment == "production" ? "api" : "api-staging"}.${var.domain_name}
    4. Deploy application via GitHub Actions

    Note: Media uploads will continue using s3-proxy.rerum.io
  EOT
}
