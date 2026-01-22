terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: Store state in S3 for team collaboration
  # Uncomment and configure when ready for shared state management
  # backend "s3" {
  #   bucket         = "lrda-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "lrda"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
