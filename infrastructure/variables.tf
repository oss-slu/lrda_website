variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "bundle_id" {
  description = "Lightsail bundle (nano_3_0=$5/mo 1GB, small_3_0=$10/mo 2GB, medium_3_0=$20/mo 4GB)"
  type        = string
  default     = "small_3_0"
}

variable "ssh_allowed_ips" {
  description = "List of IPs allowed to SSH (CIDR notation, e.g., ['1.2.3.4/32'])"
  type        = list(string)
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "key_pair_name" {
  description = "Name of existing Lightsail key pair for SSH access"
  type        = string
}

# -----------------------------------------------------------------------------
# Cloudflare Variables
# -----------------------------------------------------------------------------

variable "cloudflare_api_token" {
  description = "Cloudflare API token (or set CLOUDFLARE_API_TOKEN env var)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "create_api_dns" {
  description = "Create API DNS record pointing to AWS (set true after instance is deployed)"
  type        = bool
  default     = false
}
