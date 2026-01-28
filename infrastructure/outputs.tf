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
