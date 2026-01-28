# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# VPC & Networking (using default VPC for simplicity)
# -----------------------------------------------------------------------------
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# -----------------------------------------------------------------------------
# Security Groups
# -----------------------------------------------------------------------------
resource "aws_security_group" "lrda_web" {
  name        = "lrda-web-${var.environment}"
  description = "Security group for LRDA web server"
  vpc_id      = data.aws_vpc.default.id

  # SSH access from allowed IPs only
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_ips
  }

  # HTTP (for Let's Encrypt validation and redirect)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lrda-web-sg"
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket for Media Storage (OPTIONAL)
# -----------------------------------------------------------------------------
# Initially, keep using s3-proxy.rerum.io for media uploads.
# When ready to migrate media to your own S3, uncomment this section.
#
# resource "aws_s3_bucket" "media" {
#   bucket = "lrda-media-${var.environment}-${random_id.bucket_suffix.hex}"
#   tags = { Name = "lrda-media" }
# }
#
# resource "random_id" "bucket_suffix" {
#   byte_length = 4
# }
#
# resource "aws_s3_bucket_public_access_block" "media" {
#   bucket = aws_s3_bucket.media.id
#   block_public_acls       = false
#   block_public_policy     = false
#   ignore_public_acls      = false
#   restrict_public_buckets = false
# }
#
# resource "aws_s3_bucket_policy" "media_public_read" {
#   bucket = aws_s3_bucket.media.id
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Sid       = "PublicReadGetObject"
#       Effect    = "Allow"
#       Principal = "*"
#       Action    = "s3:GetObject"
#       Resource  = "${aws_s3_bucket.media.arn}/*"
#     }]
#   })
#   depends_on = [aws_s3_bucket_public_access_block.media]
# }
#
# resource "aws_s3_bucket_cors_configuration" "media" {
#   bucket = aws_s3_bucket.media.id
#   cors_rule {
#     allowed_headers = ["*"]
#     allowed_methods = ["GET", "PUT", "POST"]
#     allowed_origins = ["https://${var.domain_name}"]
#     expose_headers  = ["ETag"]
#     max_age_seconds = 3000
#   }
# }
#
# IAM role for EC2 to access S3 (only needed if using your own S3)
# resource "aws_iam_role" "ec2_role" { ... }
# resource "aws_iam_instance_profile" "ec2_profile" { ... }

# -----------------------------------------------------------------------------
# EC2 Instance
# -----------------------------------------------------------------------------
resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.lrda_web.id]
  # iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name  # Uncomment when using own S3
  subnet_id = data.aws_subnets.default.ids[0]

  root_block_device {
    volume_size           = 30 # Sufficient for API-only (no frontend build artifacts)
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    delete_on_termination = true
    encrypted             = true
  }

  user_data = templatefile("${path.module}/scripts/user-data.sh", {
    db_password = var.db_password
    domain_name = var.domain_name
    aws_region  = var.aws_region
    environment = var.environment
    # Environment-aware subdomains:
    # staging:    api-staging.wherereligion.org, staging.wherereligion.org
    # production: api.wherereligion.org, wherereligion.org
    api_subdomain   = var.environment == "production" ? "api" : "api-staging"
    frontend_origin = var.environment == "production" ? var.domain_name : "staging.${var.domain_name}"
  })

  tags = {
    Name = "lrda-web-${var.environment}"
  }

  lifecycle {
    ignore_changes = [ami] # Don't recreate on AMI updates
  }
}

# -----------------------------------------------------------------------------
# Elastic IP (static public IP)
# -----------------------------------------------------------------------------
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"

  tags = {
    Name = "lrda-eip-${var.environment}"
  }
}
