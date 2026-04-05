import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Kysely, Transaction } from "kysely";
import { EMAIL_FROM as DEFAULT_EMAIL_FROM, EMAIL_FROM_NAMES, EMAIL_REPLY_TO as DEFAULT_EMAIL_REPLY_TO } from "@greenspace/shared";
import type { Database } from "../db/types.js";
import { logAuditEvent } from "./audit.js";
import { logger } from "./logger.js";

const emailFrom = process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
const emailReplyTo = process.env.EMAIL_REPLY_TO ?? DEFAULT_EMAIL_REPLY_TO;

let sesClient: SESClient | null = null;

function getSesClient(): SESClient {
  if (!sesClient) {
    sesClient = new SESClient({
      region: process.env.AWS_REGION ?? "eu-north-1",
    });
  }
  return sesClient;
}

/** Visible for testing. */
export function setSesClient(client: SESClient | null): void {
  sesClient = client;
}

interface QueueEmailInput {
  recipientEmail: string;
  language: "da" | "en";
  subject: string;
  bodyHtml: string;
}

/**
 * Queue a confirmation email in the database and attempt to send it via SES.
 * Email failures are caught and logged — they never fail the caller.
 */
export async function queueAndSendEmail(
  db: Kysely<Database> | Transaction<Database>,
  input: QueueEmailInput,
): Promise<string | null> {
  let emailId: string;

  try {
    const [row] = await db
      .insertInto("emails")
      .values({
        recipient_email: input.recipientEmail,
        language: input.language,
        subject: input.subject,
        body_html: input.bodyHtml,
        status: "pending",
      })
      .returning(["id"])
      .execute();

    emailId = row.id;
  } catch (err) {
    logger.error("Failed to queue email", err);
    return null;
  }

  try {
    await sendViaSes(input);

    await db
      .updateTable("emails")
      .set({ status: "sent", sent_at: new Date().toISOString() })
      .where("id", "=", emailId)
      .execute();

    await logAuditEvent(db, {
      actor_type: "system",
      actor_id: null,
      action: "email_sent",
      entity_type: "email",
      entity_id: emailId,
      after: {
        recipient: input.recipientEmail,
        subject: input.subject,
        language: input.language,
      },
    });
  } catch (err) {
    logger.error("Failed to send email via SES", err);

    try {
      await db
        .updateTable("emails")
        .set({ status: "failed" })
        .where("id", "=", emailId)
        .execute();
    } catch (updateErr) {
      logger.error("Failed to update email status", updateErr);
    }
  }

  return emailId;
}

async function sendViaSes(input: QueueEmailInput): Promise<void> {
  const client = getSesClient();
  const fromName = EMAIL_FROM_NAMES[input.language];
  const source = `${fromName} <${emailFrom}>`;

  const command = new SendEmailCommand({
    Source: source,
    ReplyToAddresses: [emailReplyTo],
    Destination: {
      ToAddresses: [input.recipientEmail],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: input.subject,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: input.bodyHtml,
        },
      },
    },
  });

  await client.send(command);
}
