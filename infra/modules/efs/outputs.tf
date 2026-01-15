output "file_system_id" { value = aws_efs_file_system.this.id }
output "security_group_id" { value = aws_security_group.efs.id }
output "access_point_data_id" { value = aws_efs_access_point.data.id }
output "access_point_conf_id" { value = aws_efs_access_point.conf.id }
output "access_point_plugins_id" { value = aws_efs_access_point.plugins.id }
