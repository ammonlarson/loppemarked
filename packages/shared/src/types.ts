import type { Greenhouse, GreenhousePreference } from "./constants.js";
import type {
  ActorType,
  AuditAction,
  BoxState,
  EmailStatus,
  Language,
  PublicBoxState,
  RegistrationStatus,
  WaitlistEntryStatus,
} from "./enums.js";

/** System settings record */
export interface SystemSettings {
  id: string;
  openingDatetime: string;
  updatedAt: string;
}

/** Greenhouse summary (public-safe — reserved boxes are counted as occupied) */
export interface GreenhouseSummary {
  name: Greenhouse;
  totalBoxes: number;
  availableBoxes: number;
  occupiedBoxes: number;
}

/** Planter box (public-safe view) */
export interface PlanterBoxPublic {
  id: number;
  name: string;
  greenhouse: Greenhouse;
  state: PublicBoxState;
}

/** Planter box (full admin view) */
export interface PlanterBox extends Omit<PlanterBoxPublic, "state"> {
  state: BoxState;
  reservedLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Normalized address fields */
export interface NormalizedAddress {
  street: string;
  houseNumber: number;
  floor: string | null;
  door: string | null;
}

/** Registration record (admin view) */
export interface Registration {
  id: string;
  boxId: number;
  name: string;
  email: string;
  address: NormalizedAddress;
  apartmentKey: string;
  language: Language;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

/** Registration record (public-safe, no PII) */
export interface RegistrationPublic {
  boxId: number;
  status: RegistrationStatus;
}

/** Waitlist entry (admin view) */
export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  address: NormalizedAddress;
  apartmentKey: string;
  language: Language;
  greenhousePreference: GreenhousePreference;
  status: WaitlistEntryStatus;
  createdAt: string;
  updatedAt: string;
}

/** Admin account record */
export interface Admin {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/** Audit event record */
export interface AuditEvent {
  id: string;
  timestamp: string;
  actorType: ActorType;
  actorId: string | null;
  actorName: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
}

/** Outbound email record */
export interface EmailRecord {
  id: string;
  recipientEmail: string;
  language: Language;
  subject: string;
  bodyHtml: string;
  status: EmailStatus;
  editedBeforeSend: boolean;
  sentAt: string | null;
  createdAt: string;
}

/** Public registration form input */
export interface RegistrationInput {
  name: string;
  email: string;
  street: string;
  houseNumber: number;
  floor: string | null;
  door: string | null;
  language: Language;
  boxId: number;
}

/** Waitlist join input */
export interface WaitlistInput {
  name: string;
  email: string;
  street: string;
  houseNumber: number;
  floor: string | null;
  door: string | null;
  language: Language;
  greenhousePreference: GreenhousePreference;
}

/** Public status response */
export interface PublicStatus {
  isOpen: boolean;
  openingDatetime: string;
  hasAvailableBoxes: boolean;
}
