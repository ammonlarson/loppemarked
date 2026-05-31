# ---------- Shared-DB VPC Peering (requester side) ----------
#
# Requester-side peering into the shared-db VPC (Phase B of the shared-db
# migration). The accepter side lives in infra-shared-db and its
# data.aws_vpc_peering_connection lookup cannot resolve until this requester
# apply exists, so this must be applied first. auto_accept works because both
# VPCs are in the same account and region. DB traffic does not move onto this
# peering until DB_SECRET_ID is wired in Phase D; the connection is preparatory.

resource "aws_vpc_peering_connection" "shared_db" {
  count = var.shared_db_vpc_id != null ? 1 : 0

  vpc_id      = aws_vpc.main.id
  peer_vpc_id = var.shared_db_vpc_id
  auto_accept = true

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  tags = {
    Name = "loppemarked--2026-shared-db-peering"
  }

  lifecycle {
    precondition {
      condition     = var.shared_db_cidr != null
      error_message = "shared_db_cidr must be set when shared_db_vpc_id is set so the peering route can be created."
    }
  }
}

# Route private-subnet traffic destined for the shared-db CIDR over the peering
# connection. The private route table otherwise has no route off-VPC.
resource "aws_route" "private_to_shared_db" {
  count = var.shared_db_vpc_id != null ? 1 : 0

  route_table_id            = aws_route_table.private.id
  destination_cidr_block    = var.shared_db_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.shared_db[0].id
}
