terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket  = "terraform-s3tate"
    key     = "scansure.tfstate"
    region  = "af-south-1"
    profile = "bethink"
  }
}

locals {
  aws_region = "af-south-1"
}
provider "aws" {
  region  = local.aws_region
  profile = "bethink"
}

module "api" {
  source = "./api"
}
