# -----------------------------------------------------------------------------
# Cloudflare - Zone Settings, DNS, Security, and Origin CA
# -----------------------------------------------------------------------------

# Reference the existing zone (domain already migrated to Cloudflare)
data "cloudflare_zone" "main" {
  filter = {
    name = var.domain_name
  }
}

# Cloudflare IP ranges (used to lock down Lightsail firewall)
data "cloudflare_ip_ranges" "cloudflare" {}

# -----------------------------------------------------------------------------
# Zone Settings (v5: individual cloudflare_zone_setting resources)
# -----------------------------------------------------------------------------
locals {
  zone_id = data.cloudflare_zone.main.id

  zone_settings = {
    ssl                      = "strict"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    http3                    = "on"
    "0rtt"                   = "on"
    brotli                   = "on"
    early_hints              = "on"
    security_level           = "medium"
    browser_check            = "on"
    automatic_https_rewrites = "on"
    opportunistic_encryption = "on"
  }
}

resource "cloudflare_zone_setting" "settings" {
  for_each   = local.zone_settings
  zone_id    = local.zone_id
  setting_id = each.key
  value      = each.value
}

# -----------------------------------------------------------------------------
# DNS Records - API (AWS Lightsail, created when deployed)
#
# Frontend DNS is NOT here -- Workers custom domains (configured in
# wrangler.jsonc) create DNS records automatically when deployed.
# -----------------------------------------------------------------------------
resource "cloudflare_dns_record" "api" {
  count   = var.create_api_dns ? 1 : 0
  zone_id = local.zone_id
  name    = var.environment == "production" ? "api" : "api-staging"
  content = aws_lightsail_static_ip.web.ip_address
  type    = "A"
  proxied = true
  ttl     = 1 # auto (required when proxied)
  comment = "API on AWS Lightsail"
}

# -----------------------------------------------------------------------------
# Origin CA Certificate (for AWS Lightsail API origin)
#
# Trusted only by Cloudflare's edge -- all traffic is proxied so this is fine.
# 15-year validity, no renewal needed. Install cert + key on nginx.
# -----------------------------------------------------------------------------
resource "tls_private_key" "origin" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "origin" {
  private_key_pem = tls_private_key.origin.private_key_pem

  subject {
    common_name  = "api.${var.domain_name}"
    organization = "LRDA"
  }

  dns_names = [
    "api.${var.domain_name}",
    "api-staging.${var.domain_name}",
  ]
}

resource "cloudflare_origin_ca_certificate" "api" {
  csr                = tls_cert_request.origin.cert_request_pem
  hostnames          = ["api.${var.domain_name}", "api-staging.${var.domain_name}"]
  request_type       = "origin-rsa"
  requested_validity = 5475 # 15 years
}

# -----------------------------------------------------------------------------
# Cache Rules - bypass cache for API
# -----------------------------------------------------------------------------
resource "cloudflare_ruleset" "cache" {
  zone_id = local.zone_id
  name    = "Cache settings"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [{
    action      = "set_cache_settings"
    enabled     = true
    expression  = "(starts_with(http.host, \"api\"))"
    description = "Bypass cache for API"

    action_parameters = {
      cache = false
    }
  }]
}
