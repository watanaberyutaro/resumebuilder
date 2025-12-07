import { createClient } from '@/lib/supabase/server';

// =====================================================
// Billing Service
// Handles billing events and payment processing
// Currently a placeholder - integrate with Stripe in production
// =====================================================

export const SCOUT_SUCCESS_FEE_JPY = 10000; // 1万円/人

export interface BillingEventInput {
  companyId: string;
  offerId: string;
  amount: number;
}

export interface BillingResult {
  success: boolean;
  billingEventId?: string;
  error?: string;
}

// Record a successful hire billing event
export async function recordSuccessfulHire(input: BillingEventInput): Promise<BillingResult> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('billing_events')
      .insert({
        company_id: input.companyId,
        event_type: 'scout_success',
        offer_id: input.offerId,
        amount_jpy: input.amount,
        is_paid: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record billing event: ${error.message}`);
    }

    // In production, this would trigger a Stripe invoice
    // await createStripeInvoice(input.companyId, input.amount);

    return {
      success: true,
      billingEventId: data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get pending billing events for a company
export async function getPendingBillingEvents(companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('billing_events')
    .select(`
      *,
      offers (
        id,
        subject,
        recipient_user_id,
        profiles:recipient_user_id (
          display_name
        )
      )
    `)
    .eq('company_id', companyId)
    .eq('is_paid', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get pending billing events:', error);
    return [];
  }

  return data || [];
}

// Mark billing event as paid
export async function markBillingEventAsPaid(
  billingEventId: string,
  externalPaymentId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('billing_events')
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      external_payment_id: externalPaymentId,
    })
    .eq('id', billingEventId);

  return !error;
}

// Calculate total outstanding amount for a company
export async function getOutstandingAmount(companyId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('billing_events')
    .select('amount_jpy')
    .eq('company_id', companyId)
    .eq('is_paid', false);

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum, event) => sum + event.amount_jpy, 0);
}

// Stripe integration placeholders
// In production, replace these with actual Stripe API calls

interface StripeCustomer {
  id: string;
  email: string;
}

export async function createOrGetStripeCustomer(_companyId: string): Promise<StripeCustomer | null> {
  // Placeholder - In production:
  // 1. Check if company has a Stripe customer ID stored
  // 2. If not, create a new Stripe customer
  // 3. Store the customer ID in the database
  console.log('Stripe integration placeholder: createOrGetStripeCustomer');
  return null;
}

export async function createStripeInvoice(
  _companyId: string,
  _amount: number
): Promise<string | null> {
  // Placeholder - In production:
  // 1. Create a Stripe invoice with line items
  // 2. Send the invoice to the customer
  // 3. Return the invoice ID
  console.log('Stripe integration placeholder: createStripeInvoice');
  return null;
}

export async function handleStripeWebhook(
  _eventType: string,
  _eventData: Record<string, unknown>
): Promise<void> {
  // Placeholder - In production:
  // Handle Stripe webhook events like:
  // - invoice.paid
  // - invoice.payment_failed
  // - customer.subscription.updated
  console.log('Stripe integration placeholder: handleStripeWebhook');
}
