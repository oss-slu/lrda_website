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

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = data.cloudflare_zone.main.id
}

output "cloudflare_name_servers" {
  description = "Cloudflare nameservers (should already be set at registrar)"
  value       = data.cloudflare_zone.main.name_servers
}

# Origin CA outputs -- install these on the EC2 nginx instance
output "origin_ca_certificate" {
  description = "Origin CA cert PEM (install at /etc/ssl/cloudflare/origin.pem on EC2)"
  value       = cloudflare_origin_ca_certificate.api.certificate
  sensitive   = true
}

output "origin_ca_private_key" {
  description = "Origin CA private key PEM (install at /etc/ssl/cloudflare/origin-key.pem on EC2)"
  value       = tls_private_key.origin.private_key_pem
  sensitive   = true
}

output "next_steps" {
  description = "Post-deployment steps"
  value       = <<-EOT
    Architecture:
      Frontend: Cloudflare Workers (Next.js via @opennextjs/cloudflare)
      API:      AWS EC2 -> proxied through Cloudflare
      SSL:      Cloudflare edge (browser) + Origin CA (edge-to-EC2)

    Steps:
      1. Set up @opennextjs/cloudflare in packages/web
      2. Configure wrangler.jsonc with custom_domain: ${var.domain_name}
      3. Deploy frontend: wrangler deploy (from CI/CD)
      4. Deploy EC2: set create_api_dns=true, terraform apply
      5. Install Origin CA cert on nginx:
         terraform output -raw origin_ca_certificate > /etc/ssl/cloudflare/origin.pem
         terraform output -raw origin_ca_private_key > /etc/ssl/cloudflare/origin-key.pem
      6. Configure nginx to use the cert for HTTPS
  EOT
}
