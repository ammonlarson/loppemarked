# ---------- SES Domain Identity ----------

resource "aws_ses_domain_identity" "main" {
  domain = var.ses_sender_domain
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# ---------- SES Configuration Set ----------

resource "aws_ses_configuration_set" "main" {
  name = "${local.naming_prefix}-delivery"
}
