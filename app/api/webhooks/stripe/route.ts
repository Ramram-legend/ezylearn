import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/webhooks/stripe
 * Endpoint de webhook Stripe (App Router — le corps brut est fourni par req.text()).
 *
 * Securite :
 *  - La signature Stripe est verifiee via `stripe.webhooks.constructEvent`
 *    avant toute action (secret STRIPE_WEBHOOK_SECRET).
 *  - Les mutations passent par le client ADMIN (service role) : un webhook
 *    n'a pas de session utilisateur, les policies RLS `auth.uid()` le
 *    bloqueraient sinon.
 *
 * Variables requises : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET non configures.' },
      { status: 500 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature Stripe manquante.' }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature invalide:', err);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (userId) {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'plus', updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('[stripe-webhook] Echec de la mise a jour du plan:', error);
        return NextResponse.json({ error: 'Erreur base de donnees.' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
