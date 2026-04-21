terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "elearning-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "elearning-terraform-locks"
  }
}
 
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = { Project = "elearning-platform", ManagedBy = "terraform" }
  }
}
 
variable "aws_region"  { default = "eu-west-1" }
variable "environment" { default = "prod" }
 
locals {
  services = [
    "auth-service","user-service","course-service","content-service",
    "quiz-service","forum-service","messaging-service",
    "notification-service","chatbot-service","executor-service","frontend"
  ]
}
 
# ── VPC ──────────────────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name = "elearning-vpc-${var.environment}"
  cidr = "10.0.0.0/16"
  azs             = ["${var.aws_region}a","${var.aws_region}b","${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24","10.0.102.0/24","10.0.103.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_dns_hostnames = true
}
 
# ── ECR : 1 repo par service ─────────────────────────────────────
resource "aws_ecr_repository" "services" {
  for_each             = toset(local.services)
  name                 = "elearning-${each.key}"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration    { encryption_type = "AES256" }
}
 
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name
  policy = jsonencode({ rules = [{
    rulePriority = 1
    description  = "Keep last 10 images"
    selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
    action       = { type = "expire" }
  }]})
}
 
# ── EKS ──────────────────────────────────────────────────────────
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 20.0"
  cluster_name    = "elearning-cluster-${var.environment}"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
  }
  eks_managed_node_groups = {
    general = {
      instance_types = ["t3.medium"]
      min_size = 2; max_size = 6; desired_size = 3
    }
    executor = {
      instance_types = ["t3.large"]
      min_size = 1; max_size = 4; desired_size = 2
      labels = { role = "executor" }
      taints = [{ key="executor", value="true", effect="NO_SCHEDULE" }]
    }
  }
}
 
output "ecr_repositories" {
  value = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}
output "eks_cluster_name"     { value = module.eks.cluster_name }
output "eks_cluster_endpoint" { value = module.eks.cluster_endpoint; sensitive = true }
