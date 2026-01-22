# LRDA Infrastructure

Terraform configuration for provisioning the LRDA API server infrastructure on AWS EC2.

## Architecture

This Terraform configuration creates:

- **EC2 Instance**: Ubuntu 24.04 LTS running the Fastify API server
- **Security Group**: SSH (restricted to your IP), HTTP, and HTTPS access
- **Elastic IP**: Static public IP address for DNS
- **PostgreSQL 16**: Database installed on the EC2 instance
- **Nginx**: Reverse proxy with CORS configuration
- **PM2**: Process manager for Node.js

The frontend is hosted separately on Vercel and connects to this API server.

## Prerequisites

Before running Terraform, you need:

### 1. Install Terraform

```bash
# macOS
brew install terraform

# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Windows (using chocolatey)
choco install terraform
```

Verify installation:
```bash
terraform --version
```

### 2. AWS Account Setup

1. **Create an AWS account** at https://aws.amazon.com if you don't have one

2. **Create an IAM user** for Terraform:
   - Go to IAM Console: https://console.aws.amazon.com/iam/
   - Click "Users" > "Add users"
   - Username: `terraform-lrda`
   - Select "Access key - Programmatic access"
   - Attach policies: `AmazonEC2FullAccess`, `AmazonVPCFullAccess`
   - Download the CSV with access keys

3. **Configure AWS credentials** on your machine:
   ```bash
   # Option 1: AWS CLI (recommended)
   aws configure
   # Enter your Access Key ID, Secret Access Key, and region (us-east-1)

   # Option 2: Environment variables
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_DEFAULT_REGION="us-east-1"
   ```

### 3. Create EC2 Key Pair

1. **Go to EC2 Console**: https://console.aws.amazon.com/ec2/
2. **Navigate to**: Network & Security > Key Pairs
3. **Click**: "Create key pair"
   - Name: `lrda-staging-keypair` (or your preferred name)
   - Key pair type: RSA
   - Private key file format: `.pem`
4. **Download the key** and save it:
   ```bash
   mv ~/Downloads/lrda-staging-keypair.pem ~/.ssh/
   chmod 400 ~/.ssh/lrda-staging-keypair.pem
   ```

### 4. Find Your Public IP

You'll need your public IP address to allow SSH access:
```bash
curl ifconfig.me
```
Note this IP - you'll use it in the configuration.

## Configuration

1. **Copy the example variables file**:
   ```bash
   cd infrastructure
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your values:
   ```hcl
   aws_region      = "us-east-1"
   environment     = "staging"
   domain_name     = "wherereligion.org"
   instance_type   = "t3.small"
   ssh_allowed_ips = ["YOUR_IP/32"]  # Replace with your IP
   db_password     = "your_secure_password"  # Use a strong password
   key_pair_name   = "lrda-staging-keypair"  # Your key pair name
   ```

## Usage

### Initialize Terraform

First-time setup only:
```bash
cd infrastructure
terraform init
```

### Preview Changes

See what will be created:
```bash
terraform plan
```

### Apply Changes

Create the infrastructure:
```bash
terraform apply
```

Type `yes` when prompted to confirm.

### View Outputs

After applying, see important information:
```bash
terraform output
```

This shows:
- EC2 instance ID
- Public IP address
- SSH command
- Next steps

### Destroy Infrastructure

Remove all created resources (careful!):
```bash
terraform destroy
```

## Post-Deployment Steps

After `terraform apply` completes:

1. **Update DNS**: Add an A record pointing your API subdomain to the Elastic IP
   - Staging: `api-staging.wherereligion.org` -> `<elastic-ip>`
   - Production: `api.wherereligion.org` -> `<elastic-ip>`

2. **SSH into the server**:
   ```bash
   # Use the command from terraform output
   ssh -i ~/.ssh/lrda-staging-keypair.pem ubuntu@<elastic-ip>
   ```

3. **Set up SSL certificate**:
   ```bash
   sudo certbot --nginx -d api-staging.wherereligion.org
   ```

4. **Verify setup**:
   ```bash
   # Check PostgreSQL
   sudo -u postgres psql -c "\l"

   # Check Nginx
   sudo nginx -t

   # Check PM2
   pm2 status
   ```

5. **Deploy application** via GitHub Actions (see `.github/workflows/infrastructure.yml`)

## GitHub Actions CI/CD

The infrastructure workflow (`.github/workflows/infrastructure.yml`) automatically runs on changes to the `infrastructure/` directory.

### Required GitHub Secrets

Configure these secrets in your repository settings (Settings > Secrets and variables > Actions):

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalr...` |
| `DB_PASSWORD` | PostgreSQL database password | `strong_password_123` |
| `DOMAIN_NAME` | Your domain name | `wherereligion.org` |
| `SSH_ALLOWED_IPS` | JSON array of allowed IPs | `["1.2.3.4/32"]` |
| `KEY_PAIR_NAME` | EC2 key pair name | `lrda-staging-keypair` |
| `TF_ENVIRONMENT` | (Optional) Environment name | `staging` or `production` |

Note: If `TF_ENVIRONMENT` is not set, it defaults to `staging`.

## Environments

This configuration supports two environments:

| Environment | API Subdomain | Frontend Origin |
|-------------|--------------|-----------------|
| staging | api-staging.wherereligion.org | staging.wherereligion.org |
| production | api.wherereligion.org | wherereligion.org |

Switch environments by changing the `environment` variable in `terraform.tfvars`.

## Troubleshooting

### Cannot SSH to instance

1. Check your IP hasn't changed: `curl ifconfig.me`
2. Update `ssh_allowed_ips` in `terraform.tfvars`
3. Run `terraform apply`

### User-data script failed

SSH in and check the logs:
```bash
sudo cat /var/log/user-data.log
```

### PostgreSQL connection issues

Verify PostgreSQL is running and configured:
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\du"  # List users
sudo -u postgres psql -c "\l"   # List databases
```

## Cost Estimate

Monthly costs (us-east-1):

| Resource | Type | Estimated Cost |
|----------|------|----------------|
| EC2 | t3.small | ~$15/month |
| EBS | 30GB gp3 | ~$2.40/month |
| Elastic IP | (when attached) | Free |
| **Total** | | **~$17.40/month** |

Note: Costs may vary. Use the [AWS Pricing Calculator](https://calculator.aws/) for accurate estimates.

## Security Considerations

- SSH access is restricted to specified IP addresses
- Database password is stored in a non-committed file
- PostgreSQL only accepts local connections
- SSL/TLS is configured via Let's Encrypt
- Security group allows only necessary ports

## Files

```
infrastructure/
├── README.md               # This file
├── main.tf                 # Main infrastructure resources
├── variables.tf            # Input variable definitions
├── outputs.tf              # Output value definitions
├── versions.tf             # Provider and version constraints
├── terraform.tfvars.example # Example variable values
└── scripts/
    └── user-data.sh        # EC2 bootstrap script
```
