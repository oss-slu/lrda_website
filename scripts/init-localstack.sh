#!/bin/bash
# Initialize LocalStack S3 bucket for local development
# Run this after starting docker compose

BUCKET_NAME="livedreligion-local"
LOCALSTACK_URL="http://localhost:4566"

echo "Waiting for LocalStack to be ready..."
until curl -s "$LOCALSTACK_URL/_localstack/health" | grep -q '"s3": "running"'; do
  sleep 1
done

echo "Creating S3 bucket: $BUCKET_NAME"
aws --endpoint-url="$LOCALSTACK_URL" s3 mb "s3://$BUCKET_NAME" 2>/dev/null || echo "Bucket already exists"

echo "Setting bucket policy for public read access..."
aws --endpoint-url="$LOCALSTACK_URL" s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*"
    }
  ]
}'

echo "LocalStack S3 bucket '$BUCKET_NAME' is ready!"
echo "Endpoint: $LOCALSTACK_URL"
echo "Bucket URL: $LOCALSTACK_URL/$BUCKET_NAME"
