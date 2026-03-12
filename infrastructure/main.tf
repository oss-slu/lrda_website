# -----------------------------------------------------------------------------
# Lightsail Instance
# -----------------------------------------------------------------------------
resource "aws_lightsail_instance" "web" {
  name              = "lrda-${var.environment}"
  availability_zone = "${var.aws_region}a"
  blueprint_id      = "ubuntu_24_04"
  bundle_id         = var.bundle_id
  key_pair_name     = var.key_pair_name

  user_data = templatefile("${path.module}/scripts/user-data.sh", {
    db_password         = var.db_password
    db_password_encoded = urlencode(var.db_password)
    domain_name         = var.domain_name
    aws_region          = var.aws_region
    environment         = var.environment
    api_subdomain       = var.environment == "production" ? "api" : "api-staging"
    frontend_origin     = var.environment == "production" ? var.domain_name : "staging.${var.domain_name}"
    origin_ca_cert      = cloudflare_origin_ca_certificate.api.certificate
    origin_ca_key       = tls_private_key.origin.private_key_pem
  })

  tags = {
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Static IP (free with Lightsail when attached)
# -----------------------------------------------------------------------------
resource "aws_lightsail_static_ip" "web" {
  name = "lrda-ip-${var.environment}"
}

resource "aws_lightsail_static_ip_attachment" "web" {
  static_ip_name = aws_lightsail_static_ip.web.name
  instance_name  = aws_lightsail_instance.web.name
}

# -----------------------------------------------------------------------------
# Firewall (Lightsail instance-level)
# -----------------------------------------------------------------------------
resource "aws_lightsail_instance_public_ports" "web" {
  instance_name = aws_lightsail_instance.web.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
    cidrs     = var.ssh_allowed_ips
  }

  port_info {
    protocol  = "tcp"
    from_port = 80
    to_port   = 80
    cidrs     = data.cloudflare_ip_ranges.cloudflare.ipv4_cidrs
  }

  port_info {
    protocol  = "tcp"
    from_port = 443
    to_port   = 443
    cidrs     = data.cloudflare_ip_ranges.cloudflare.ipv4_cidrs
  }
}
