# AWS Deployment Guide — MindGuard

This guide walks through deploying MindGuard to AWS step by step.
Estimated time: 2-3 hours on first deploy.

---

## Architecture

```
Internet
    │
    ▼
Route 53 (DNS)
    │
    ├── api.yourdomain.com → Application Load Balancer → ECS Fargate (Backend)
    │                                                          │
    │                                                    RDS PostgreSQL
    │                                                    ElastiCache Redis
    │
    └── app.yourdomain.com → ECS Fargate (Frontend)
```

---

## Prerequisites

**1. Install AWS CLI**
```bash
brew install awscli
```

**2. Create AWS Account**
Go to https://aws.amazon.com and create a free account.

**3. Create IAM User**
- AWS Console → IAM → Users → Create User
- Name: `mindguard-deploy`
- Attach policy: `AdministratorAccess` (for setup — restrict later)
- Create access key → save the Access Key ID and Secret

**4. Configure CLI**
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)
```

**5. Verify it works**
```bash
aws sts get-caller-identity
# Should return your account ID
```

---

## Step 1 — Run the Setup Script

```bash
chmod +x aws-setup.sh
./aws-setup.sh
```

This creates:
- ECR repositories (Docker image registry)
- VPC, subnets, security groups
- RDS PostgreSQL database
- ElastiCache Redis
- ECS cluster
- IAM roles

Save all the output values — you need them for GitHub Secrets.

---

## Step 2 — Store Secrets in AWS Secrets Manager

Never put secrets in environment variables directly in ECS. Use Secrets Manager:

```bash
# Store each secret
aws secretsmanager create-secret \
  --name mindguard/SECRET_KEY \
  --secret-string "your-secret-key-here"

aws secretsmanager create-secret \
  --name mindguard/ENCRYPTION_KEY \
  --secret-string "your-encryption-key-here"

aws secretsmanager create-secret \
  --name mindguard/ANTHROPIC_API_KEY \
  --secret-string "sk-ant-your-key-here"

# Get your RDS endpoint first
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier mindguard-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

aws secretsmanager create-secret \
  --name mindguard/DATABASE_URL \
  --secret-string "postgresql+asyncpg://mindguard:MindGuard2024!@${RDS_ENDPOINT}:5432/mindguard"

# Get your Redis endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id mindguard-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

aws secretsmanager create-secret \
  --name mindguard/REDIS_URL \
  --secret-string "redis://${REDIS_ENDPOINT}:6379/0"
```

---

## Step 3 — Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

Add each of these:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | From IAM user |
| `AWS_SECRET_ACCESS_KEY` | From IAM user |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | Your 12-digit account ID |
| `ECR_BACKEND_REPO` | `mindguard-backend` |
| `ECR_FRONTEND_REPO` | `mindguard-frontend` |
| `ECS_CLUSTER` | `mindguard-cluster` |
| `ECS_BACKEND_SERVICE` | `mindguard-backend-service` |
| `ECS_FRONTEND_SERVICE` | `mindguard-frontend-service` |
| `ENCRYPTION_KEY` | Your Fernet key |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |

---

## Step 4 — Register ECS Task Definitions

Replace `ACCOUNT_ID` and `REGION` placeholders in the task definition files:

```bash
# Replace placeholders
sed -i "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws/ecs-backend-task.json
sed -i "s/REGION/us-east-1/g" aws/ecs-backend-task.json

# Register task definitions
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-backend-task.json

aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-frontend-task.json
```

---

## Step 5 — Create ECS Services

```bash
# Backend service
aws ecs create-service \
  --cluster mindguard-cluster \
  --service-name mindguard-backend-service \
  --task-definition mindguard-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[SUBNET_1,SUBNET_2],securityGroups=[BACKEND_SG],assignPublicIp=ENABLED}"

# Frontend service
aws ecs create-service \
  --cluster mindguard-cluster \
  --service-name mindguard-frontend-service \
  --task-definition mindguard-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[SUBNET_1,SUBNET_2],securityGroups=[FRONTEND_SG],assignPublicIp=ENABLED}"
```

---

## Step 6 — First Deploy

Push to main to trigger the GitHub Actions pipeline:

```bash
git push origin main
```

Go to GitHub → Actions tab. You'll see the pipeline running:
```
✅ Run Tests
✅ Build & Push Docker Images  
✅ Deploy to AWS ECS
```

---

## Step 7 — Get Your Public URLs

```bash
# Get backend public IP
aws ecs list-tasks --cluster mindguard-cluster --service-name mindguard-backend-service

# Then describe the task to get the public IP
aws ec2 describe-network-interfaces \
  --filters "Name=description,Values=*mindguard*" \
  --query 'NetworkInterfaces[0].Association.PublicIp'
```

---

## Monitoring

```bash
# View backend logs live
aws logs tail /ecs/mindguard-backend --follow

# Check service health
aws ecs describe-services \
  --cluster mindguard-cluster \
  --services mindguard-backend-service
```

---

## Cost Management

To avoid unexpected bills:
1. Set a billing alert at $20/month: AWS Console → Billing → Budgets
2. Stop services when not using them:
```bash
aws ecs update-service --cluster mindguard-cluster \
  --service mindguard-backend-service --desired-count 0
```
