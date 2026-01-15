output "cluster_id" { value = aws_ecs_cluster.this.id }
output "service_id" { value = aws_ecs_service.this.id }
output "task_role_arn" { value = aws_iam_role.task_execution.arn }
output "task_security_group_id" { value = aws_security_group.task.id }
