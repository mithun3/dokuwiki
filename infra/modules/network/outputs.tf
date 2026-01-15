output "vpc_id" { value = aws_vpc.this.id }
output "public_subnet_ids" { value = [for s in aws_subnet.public : s.id] }
output "private_subnet_ids" { value = [for s in aws_subnet.private : s.id] }
output "public_route_table_id" { value = aws_route_table.public.id }
output "private_route_table_id" { value = var.enable_nat ? aws_route_table.private[0].id : null }
