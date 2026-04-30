#!/bin/bash
# aws-setup.sh
#
# Run this ONCE to create all the AWS infrastructure for MindGuard.
# After this runs, GitHub Actions handles all future deploys automatically.
#
# PREREQUISITES:
# 1. AWS CLI installed: brew install awscli
# 2. AWS account created (free tier works): https://aws.amazon.com
# 3. IAM user created with programmatic access
# 4. Run: aws configure (paste your access key + secret key)
#
# COST ESTIMATE (AWS Free Tier):
# - ECS Fargate:  ~$0-15/month (free tier covers 750hrs/month)
# - RDS (t3.micro): ~$0/month first year free tier
# - ElastiCache:  ~$13/month (smallest node)
# - Total:        ~$15-30/month after free tier
#
# HOW TO RUN:
# chmod +x aws-setup.sh
# ./aws-setup.sh

set -e  # exit on any error

# ── CONFIGURATION — edit these ────────────────────────────────────────────────
APP_NAME="mindguard"
AWS_REGION="us-east-1"          # change to your preferred region
DB_PASSWORD="MindGuard2024!"    # CHANGE THIS to a strong password
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "============================================================"
echo "MindGuard AWS Infrastructure Setup"
echo "Account: $AWS_ACCOUNT_ID"
echo "Region:  $AWS_REGION"
echo "============================================================"

# ── Step 1: Create ECR Repositories ──────────────────────────────────────────
echo ""
echo "📦 Step 1: Creating ECR repositories..."

aws ecr create-repository \
  --repository-name ${APP_NAME}-backend \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "  Backend repo already exists"

aws ecr create-repository \
  --repository-name ${APP_NAME}-frontend \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "  Frontend repo already exists"

echo "  ✅ ECR repositories ready"

# ── Step 2: Create VPC and Networking ────────────────────────────────────────
echo ""
echo "🌐 Step 2: Setting up networking..."

# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query 'Vpc.VpcId' \
  --output text \
  --region $AWS_REGION)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=${APP_NAME}-vpc
echo "  VPC: $VPC_ID"

# Create public subnets in two AZs (required for load balancer)
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $SUBNET_1 --tags Key=Name,Value=${APP_NAME}-subnet-1

SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}b \
  --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $SUBNET_2 --tags Key=Name,Value=${APP_NAME}-subnet-2

# Internet gateway so containers can reach the internet
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Route table
RTB_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RTB_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RTB_ID --subnet-id $SUBNET_1
aws ec2 associate-route-table --route-table-id $RTB_ID --subnet-id $SUBNET_2

echo "  ✅ VPC and subnets ready"

# ── Step 3: Security Groups ───────────────────────────────────────────────────
echo ""
echo "🔒 Step 3: Creating security groups..."

# Backend security group
BACKEND_SG=$(aws ec2 create-security-group \
  --group-name ${APP_NAME}-backend-sg \
  --description "MindGuard backend" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $BACKEND_SG --protocol tcp --port 8000 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $BACKEND_SG --protocol tcp --port 443 --cidr 0.0.0.0/0

# Frontend security group
FRONTEND_SG=$(aws ec2 create-security-group \
  --group-name ${APP_NAME}-frontend-sg \
  --description "MindGuard frontend" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $FRONTEND_SG --protocol tcp --port 3000 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $FRONTEND_SG --protocol tcp --port 80 --cidr 0.0.0.0/0

# DB security group (only accessible from backend)
DB_SG=$(aws ec2 create-security-group \
  --group-name ${APP_NAME}-db-sg \
  --description "MindGuard database" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $DB_SG --protocol tcp --port 5432 --source-group $BACKEND_SG

echo "  ✅ Security groups ready"

# ── Step 4: RDS PostgreSQL ────────────────────────────────────────────────────
echo ""
echo "🗄️  Step 4: Creating RDS PostgreSQL (this takes ~5 minutes)..."

# DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name ${APP_NAME}-db-subnet \
  --db-subnet-group-description "MindGuard DB subnet" \
  --subnet-ids $SUBNET_1 $SUBNET_2

# Create RDS instance (db.t3.micro is free tier eligible)
aws rds create-db-instance \
  --db-instance-identifier ${APP_NAME}-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version "16.3" \
  --master-username mindguard \
  --master-user-password "$DB_PASSWORD" \
  --db-name mindguard \
  --allocated-storage 20 \
  --vpc-security-group-ids $DB_SG \
  --db-subnet-group-name ${APP_NAME}-db-subnet \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --region $AWS_REGION

echo "  RDS creating... (takes 5-10 mins, continuing setup)"

# ── Step 5: ElastiCache Redis ─────────────────────────────────────────────────
echo ""
echo "⚡ Step 5: Creating ElastiCache Redis..."

aws elasticache create-cache-cluster \
  --cache-cluster-id ${APP_NAME}-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids $BACKEND_SG \
  --region $AWS_REGION

echo "  Redis creating... (takes 3-5 mins, continuing)"

# ── Step 6: ECS Cluster ───────────────────────────────────────────────────────
echo ""
echo "🚀 Step 6: Creating ECS cluster..."

aws ecs create-cluster \
  --cluster-name ${APP_NAME}-cluster \
  --capacity-providers FARGATE \
  --region $AWS_REGION

echo "  ✅ ECS cluster ready"

# ── Step 7: IAM Role for ECS ──────────────────────────────────────────────────
echo ""
echo "👤 Step 7: Creating IAM execution role..."

aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "  Role already exists"

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
  2>/dev/null || true

echo "  ✅ IAM role ready"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "✅ AWS Infrastructure Setup Complete!"
echo "============================================================"
echo ""
echo "Save these values — you need them for GitHub Secrets:"
echo ""
echo "  AWS_ACCOUNT_ID:       $AWS_ACCOUNT_ID"
echo "  AWS_REGION:           $AWS_REGION"
echo "  ECR_BACKEND_REPO:     ${APP_NAME}-backend"
echo "  ECR_FRONTEND_REPO:    ${APP_NAME}-frontend"
echo "  ECS_CLUSTER:          ${APP_NAME}-cluster"
echo "  ECS_BACKEND_SERVICE:  ${APP_NAME}-backend-service"
echo "  ECS_FRONTEND_SERVICE: ${APP_NAME}-frontend-service"
echo ""
echo "Next steps:"
echo "  1. Wait for RDS to finish creating (~5 more minutes)"
echo "  2. Run: aws rds describe-db-instances --query 'DBInstances[0].Endpoint.Address'"
echo "  3. Update DATABASE_URL in GitHub Secrets with the RDS endpoint"
echo "  4. Add all secrets to GitHub → Settings → Secrets → Actions"
echo "  5. Push to main to trigger your first deploy"
