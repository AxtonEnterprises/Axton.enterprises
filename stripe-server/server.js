import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2026-02-25.preview';
const AGREEMENT_VERSION = 'axton-service-agreement-2026-06-10';

const app = express();
const port = process.env.PORT || 4242;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!secretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY. Add it to .env.');
}

const resourcePath = path.join(__dirname, 'stripe-resource-ids.json');
if (!fs.existsSync(resourcePath)) {
  throw new Error('Missing stripe-resource-ids.json. Run: npm run create:stripe-products');
}
const stripeResources = JSON.parse(fs.readFileSync(resourcePath, 'utf8'));

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = verifyStripeWebhook(req.body, req.headers['stripe-signature']);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const record = {
        eventId: event.id,
        checkoutSessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        planKey: session.metadata?.plan_key,
        customerEmail: session.customer_details?.email,
        legalAccepted: session.metadata?.legal_accepted,
        agreementVersion: session.metadata?.agreement_version,
        createdAt: new Date().toISOString()
      };

      // Replace this JSONL append with your datastore.
      fs.appendFileSync(path.join(__dirname, 'stripe-checkout-events.jsonl'), JSON.stringify(record) + '\n');
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { planKey, customerName, customerEmail, businessName, projectDescription, legalAccepted } = req.body;

    if (!legalAccepted) {
      return res.status(400).json({ error: 'The service agreement must be accepted before checkout.' });
    }

    const selectedPlan = stripeResources[planKey];
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const session = await stripePost('/checkout/sessions', {
      mode: 'subscription',
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout.html?plan=${encodeURIComponent(planKey)}`,
      customer_email: customerEmail || undefined,
      client_reference_id: crypto.randomUUID(),
      managed_payments: { enabled: true },
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      line_items: {
        0: { price: selectedPlan.setupPriceId, quantity: 1 },
        1: { price: selectedPlan.monthlyPriceId, quantity: 1 }
      },
      subscription_data: {
        metadata: {
          plan_key: planKey,
          business_name: businessName || '',
          agreement_version: AGREEMENT_VERSION,
          legal_accepted: 'true'
        }
      },
      metadata: {
        plan_key: planKey,
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        business_name: businessName || '',
        project_description: projectDescription || '',
        agreement_version: AGREEMENT_VERSION,
        legal_accepted: 'true'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create checkout session.' });
  }
});

async function stripePost(endpoint, params) {
  const body = new URLSearchParams();
  appendParams(body, params);

  const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_VERSION
    },
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${endpoint} failed: ${JSON.stringify(data, null, 2)}`);
  }
  return data;
}

function appendParams(body, params, prefix = '') {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      appendParams(body, value, fullKey);
    } else {
      body.append(fullKey, String(value));
    }
  }
}

function verifyStripeWebhook(rawBody, signatureHeader) {
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET.');
  }
  if (!signatureHeader) {
    throw new Error('Missing Stripe-Signature header.');
  }

  const parts = Object.fromEntries(signatureHeader.split(',').map(part => part.split('=')));
  const timestamp = parts.t;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');

  const providedSignatures = signatureHeader
    .split(',')
    .filter(part => part.startsWith('v1='))
    .map(part => part.slice(3));

  const verified = providedSignatures.some(sig =>
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
  );

  if (!verified) {
    throw new Error('Invalid webhook signature.');
  }
  return JSON.parse(rawBody.toString('utf8'));
}

app.listen(port, () => {
  console.log(`Axton Stripe server running at ${baseUrl}`);
});
