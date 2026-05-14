export type UserRole = 'user' | 'admin'
export type KycStatus = 'not_started' | 'submitted' | 'approved' | 'rejected'

export type OfferSourceType = 'manual_subsidized' | 'manual_affiliate' | 'api_postback'
export type OfferCompletionMethod =
  | 'screenshot_review'
  | 'postback'
  | 'manual_admin_approval'
  | 'click_then_self_report'
export type OfferStatus = 'draft' | 'active' | 'paused' | 'expired'

export type CompletionStatus =
  | 'clicked'
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'confirmed'
  | 'rejected'
  | 'reversed'

export type WalletTxType =
  | 'completion_credit'
  | 'completion_hold_release'
  | 'completion_reversal'
  | 'redemption_reservation'
  | 'redemption_debit'
  | 'redemption_refund'
  | 'referral_bonus'
  | 'adjustment'

export type WalletTxStatus = 'pending' | 'available' | 'reserved' | 'settled'

export type RedemptionMethod = 'mercadopago'
export type RedemptionStatus =
  | 'pending_kyc'
  | 'kyc_approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retry'
  | 'cancelled'

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ReferralStatus = 'pending' | 'activated'

export interface Profile {
  id: string
  phone: string
  email: string | null
  whatsapp_verified: boolean
  role: UserRole
  kyc_status: KycStatus
  kyc_documents: Record<string, unknown> | null
  kyc_reviewed_by: string | null
  kyc_reviewed_at: string | null
  kyc_rejection_reason: string | null
  mp_alias: string | null
  waitlist_cohort: number | null
  signup_answers: Record<string, unknown> | null
  referral_code: string
  referred_by_code: string | null
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  title: string
  description: string
  instructions: string | null
  reward_amount_ars: number
  cost_ars: number
  source_type: OfferSourceType
  source_provider: string | null
  external_offer_id: string | null
  completion_method: OfferCompletionMethod
  target_url: string | null
  postback_secret: string | null
  icon_url: string | null
  category: string
  status: OfferStatus
  max_completions_per_user: number
  hold_period_days: number
  starts_at: string | null
  ends_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OfferCompletion {
  id: string
  user_id: string
  offer_id: string
  status: CompletionStatus
  reward_amount_ars: number
  external_transaction_id: string | null
  submission_data: Record<string, unknown> | null
  click_ip: string | null
  click_user_agent: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  approved_at: string | null
  hold_until: string | null
  confirmed_at: string | null
  reversed_at: string | null
  reverse_reason: string | null
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  amount_ars: number
  type: WalletTxType
  status: WalletTxStatus
  reference_type: string
  reference_id: string | null
  description: string
  metadata: Record<string, unknown> | null
  created_by: string | null
  created_at: string
}

export interface Redemption {
  id: string
  user_id: string
  amount_ars: number
  method: RedemptionMethod
  destination: string
  status: RedemptionStatus
  idempotency_key: string
  external_transaction_id: string | null
  failure_reason: string | null
  retry_count: number
  next_retry_at: string | null
  processed_by: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  status: ReferralStatus
  activated_at: string | null
  reward_amount_ars: number
  reward_credited: boolean
  created_at: string
}

export interface AntiFraudEvent {
  id: string
  user_id: string | null
  event_type: string
  severity: FraudSeverity
  metadata: Record<string, unknown> | null
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
}

export interface DeviceFingerprint {
  id: string
  user_id: string
  fingerprint_hash: string
  ip_address: string | null
  user_agent: string | null
  first_seen: string
  last_seen: string
}

export interface AdminAction {
  id: string
  admin_id: string
  action_type: string
  target_table: string
  target_id: string
  notes: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
