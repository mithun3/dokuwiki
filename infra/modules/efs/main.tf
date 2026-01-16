resource "aws_security_group" "efs" {
  name        = "${var.name}-efs-sg"
  description = "EFS access"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = length(var.ingress_security_groups) > 0 || length(var.ingress_cidr_blocks) > 0 ? [1] : []
    content {
      from_port        = 2049
      to_port          = 2049
      protocol         = "tcp"
      security_groups  = var.ingress_security_groups
      cidr_blocks      = var.ingress_cidr_blocks
      ipv6_cidr_blocks = []
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name}-efs-sg" }
}

resource "aws_efs_file_system" "this" {
  performance_mode = var.performance_mode
  throughput_mode  = var.throughput_mode

  tags = { Name = "${var.name}-efs" }
}

resource "aws_efs_mount_target" "this" {
  for_each = { for idx, subnet_id in var.subnet_ids : idx => subnet_id }

  file_system_id  = aws_efs_file_system.this.id
  subnet_id       = each.value
  security_groups = concat([aws_security_group.efs.id], var.security_group_ids)
}

resource "aws_efs_backup_policy" "this" {
  count = var.backup_policy ? 1 : 0

  file_system_id = aws_efs_file_system.this.id

  backup_policy {
    status = "ENABLED"
  }
}

# Access points for DokuWiki directories
resource "aws_efs_access_point" "data" {
  file_system_id = aws_efs_file_system.this.id

  posix_user {
    uid = 82 # www-data in Alpine
    gid = 82
  }

  root_directory {
    path = "/data"
    creation_info {
      owner_uid   = 82
      owner_gid   = 82
      permissions = "0755"
    }
  }

  tags = { Name = "${var.name}-efs-data" }
}

resource "aws_efs_access_point" "conf" {
  file_system_id = aws_efs_file_system.this.id

  posix_user {
    uid = 82
    gid = 82
  }

  root_directory {
    path = "/conf"
    creation_info {
      owner_uid   = 82
      owner_gid   = 82
      permissions = "0755"
    }
  }

  tags = { Name = "${var.name}-efs-conf" }
}

resource "aws_efs_access_point" "plugins" {
  file_system_id = aws_efs_file_system.this.id

  posix_user {
    uid = 82
    gid = 82
  }

  root_directory {
    path = "/plugins"
    creation_info {
      owner_uid   = 82
      owner_gid   = 82
      permissions = "0755"
    }
  }

  tags = { Name = "${var.name}-efs-plugins" }
}
