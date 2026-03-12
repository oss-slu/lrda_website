output "instance_name" {
  description = "Lightsail instance name"
  value       = aws_lightsail_instance.web.name
}

output "public_ip" {
  description = "Static public IP address"
  value       = aws_lightsail_static_ip.web.ip_address
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_lightsail_static_ip.web.ip_address}"
}

output "api_subdomain" {
  description = "API subdomain for this environment"
  value       = var.environment == "production" ? "api.${var.domain_name}" : "api-staging.${var.domain_name}"
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = data.cloudflare_zone.main.id
}

output "origin_ca_certificate" {
  description = "Origin CA cert PEM (install at /etc/ssl/cloudflare/origin.pem)"
  value       = cloudflare_origin_ca_certificate.api.certificate
  sensitive   = true
}

output "origin_ca_private_key" {
  description = "Origin CA private key PEM (install at /etc/ssl/cloudflare/origin-key.pem)"
  value       = tls_private_key.origin.private_key_pem
  sensitive   = true
}
