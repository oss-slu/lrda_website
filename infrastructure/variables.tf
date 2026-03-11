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

variable "instance_type" {
  description = "EC2 instance type (t3.small is sufficient for API-only)"
  type        = string
  default     = "t3.small"
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
  description = "Name of existing EC2 key pair for SSH access"
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

variable "cloudflare_account_id" {
  description = "Cloudflare account ID (Dashboard -> Overview -> right sidebar)"
  type        = string
}

variable "create_api_dns" {
  description = "Create API DNS record pointing to AWS (set true after EC2 is deployed)"
  type        = bool
  default     = false
}
