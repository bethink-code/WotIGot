locals {
  image                   = "362603347848.dkr.ecr.af-south-1.amazonaws.com/scansure:api_8ac8a8f132d29bba6cf1927602491c8dc155233e"
  resource_base_name      = "scansure-api"
  app_listen_port         = 3000
  cluster                 = "ScanSure"
  aws_region              = "af-south-1"
  vpc_id                  = "vpc-0e33336182e1d17f3"
  subnets                 = ["subnet-0f91902cd6854b785", "subnet-0b16836db0c49c7ea", "subnet-0f6612002c117f4a7"]
  executionRoleArn        = "arn:aws:iam::362603347848:role/ecsTaskExecutionRole"
  loadBalancerListenerArn = "arn:aws:elasticloadbalancing:af-south-1:362603347848:listener/app/bethink-load-balancer/d6307d63ff72e38f/bd6c7d9e2b3284e1"
  balancerPrefix          = "scansure/api"
}

resource "aws_ecs_task_definition" "app_task" {
  family                   = "task-${local.resource_base_name}"
  container_definitions    = <<DEFINITION
  [
    {
      "name": "task-${local.resource_base_name}",
      "image": "${local.image}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": ${local.app_listen_port},
          "hostPort": ${local.app_listen_port}
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
            "awslogs-create-group": "true",
            "awslogs-group": "/ecs/scansure-api",
            "awslogs-region": "af-south-1",
            "awslogs-stream-prefix": "ecs"
        }
      },
       "environment": [
        {
          "name": "DB_HOST",
          "value": "molo.cdildyorfazh.af-south-1.rds.amazonaws.com"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_USERNAME",
          "value": "postgres"
        },
        {
          "name": "DB_PASSWORD",
          "value": "ySwyxkBkTVVfyjKgBOq8"
        },
        {
          "name": "DB_DATABASE",
          "value": "scan_sure"
        },
        {
          "name": "JWT_SECRET",
          "value": "ASDFF#$%423erdeasffge345$%&ghjn12"
        },
        {
          "name": "AWS_S3_BUCKET",
          "value": "scan-sure"
        },
        {
          "name": "BASE_PATH",
          "value": "${local.balancerPrefix}"
        },
        {
          "name": "AWS_REGION",
          "value": "${local.aws_region}"
        },
        {
          "name": "PORT",
          "value": "${local.app_listen_port}"
        },
        {
          "name": "APP_URL",
          "value": "https://lb.bethink.co.za/${local.balancerPrefix}"
        }
      ],
      "memory": 512,
      "cpu": 256
    }
  ]
  DEFINITION
  requires_compatibilities = ["FARGATE"] # use Fargate as the launch type
  network_mode             = "awsvpc"    # add the AWS VPN network mode as this is required for Fargate
  memory                   = 512         # Specify the memory the container requires
  cpu                      = 256         # Specify the CPU the container requires
  execution_role_arn       = local.executionRoleArn
}

resource "aws_ecs_service" "app_service" {
  name            = local.resource_base_name
  cluster         = local.cluster
  task_definition = aws_ecs_task_definition.app_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1 # Set up the number of containers to 1

  load_balancer {
    target_group_arn = aws_lb_target_group.app_target_group.arn
    container_name   = aws_ecs_task_definition.app_task.family
    container_port   = local.app_listen_port
  }

  network_configuration {
    subnets          = local.subnets
    assign_public_ip = true # Provide the containers with public IPs
    security_groups  = ["${aws_security_group.app_service_security_group.id}"]
  }
}

resource "aws_security_group" "app_service_security_group" {
  ingress {
    from_port   = local.app_listen_port
    to_port     = local.app_listen_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb_target_group" "app_target_group" {
  name        = "tg-${local.resource_base_name}"
  port        = local.app_listen_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = local.vpc_id

  health_check {
    path     = "/${local.balancerPrefix}/"
    port     = local.app_listen_port
    protocol = "HTTP"
  }
}

resource "aws_alb_listener_rule" "api_rule" {
  listener_arn = local.loadBalancerListenerArn
  priority     = 98

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_target_group.arn
  }

  condition {
    path_pattern {
      values = ["/${local.balancerPrefix}/*"]
    }
  }
}

