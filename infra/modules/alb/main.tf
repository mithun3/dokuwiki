resource "aws_security_group" "alb" {
  name        = "${var.name}-alb-sg"
  description = "ALB ingress"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name}-alb-sg" }
}

resource "aws_lb" "this" {
  name               = "${var.name}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids
  idle_timeout       = 60

  tags = { Name = "${var.name}-alb" }
}

resource "aws_lb_target_group" "http" {
  # name = "dokuwiki-prod-tg"
  name_prefix = "a-"

  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  target_type = "ip"

  lifecycle {
    create_before_destroy = true
  }
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200"
    path                = "/"
  }
  tags = { Name = "${var.name}-tg" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.http.arn
  }
}

resource "aws_lb_listener" "https" {
  count             = var.enable_https ? 1 : 0
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.http.arn
  }
}

resource "aws_wafv2_web_acl_association" "this" {
  count        = var.enable_waf && var.waf_web_acl_arn != "" ? 1 : 0
  resource_arn = aws_lb.this.arn
  web_acl_arn  = var.waf_web_acl_arn
}
