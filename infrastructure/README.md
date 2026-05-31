# Infrastructure

Terraform configuration for the LRDA API server on AWS Lightsail and Cloudflare.

See the [Deployment docs](https://docs.wheresreligion.org/architecture/deployment) for the full deployment guide, service accounts, secrets, rollback procedures, and instance details.

## Quick Reference

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

## Files

```
infrastructure/
  main.tf                 # Lightsail instance, static IP, firewall
  cloudflare.tf           # DNS, zone settings, Origin CA, cache rules
  variables.tf            # Input variables
  outputs.tf              # Outputs (IP, SSH command, certs)
  versions.tf             # Provider versions (AWS, Cloudflare, TLS)
  terraform.tfvars.example # Example variable values
  scripts/
    deploy.sh             # Blue/green deploy script (copied to instance by CI)
    user-data.sh          # Instance bootstrap (Docker, PostgreSQL 17, Nginx)
```
