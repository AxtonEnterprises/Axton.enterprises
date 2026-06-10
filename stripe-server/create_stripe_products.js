import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2026-02-25.preview';
const TAX_CODE_DIGITAL_SERVICE = 'txcd_10103100';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('Missing STRIPE_SECRET_KEY. Add it to .env first.');
  process.exit(1);
}

const root = process.cwd();
const planConfig = JSON.parse(await fs.readFile(path.join(root, 'stripe-plans.json'), 'utf8'));

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
    if (value === undefined || value === null) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      appendParams(body, value, fullKey);
    } else {
      body.append(fullKey, String(value));
    }
  }
}

async function createPlanResources(planKey, plan) {
  const monthlyProduct = await stripePost('/products', {
    name: plan.name,
    description: plan.description,
    tax_code: TAX_CODE_DIGITAL_SERVICE,
    default_price_data: {
      unit_amount: plan.monthlyAmount,
      currency: 'usd',
      recurring: { interval: 'month' }
    },
    metadata: {
      plan_key: planKey,
      price_type: 'monthly_service'
    }
  });

  const setupProduct = await stripePost('/products', {
    name: `${plan.name} Setup Fee`,
    description: `One-time setup fee for ${plan.name}. Includes initial consultation, project setup, launch assistance, and up to two revisions.`,
    tax_code: TAX_CODE_DIGITAL_SERVICE,
    default_price_data: {
      unit_amount: plan.setupAmount,
      currency: 'usd'
    },
    metadata: {
      plan_key: planKey,
      price_type: 'setup_fee'
    }
  });

  return {
    planKey,
    name: plan.name,
    monthlyProductId: monthlyProduct.id,
    monthlyPriceId: monthlyProduct.default_price,
    setupProductId: setupProduct.id,
    setupPriceId: setupProduct.default_price
  };
}

const created = {};
for (const [planKey, plan] of Object.entries(planConfig)) {
  console.log(`Creating Stripe resources for ${plan.name}...`);
  created[planKey] = await createPlanResources(planKey, plan);
}

await fs.writeFile(path.join(root, 'stripe-resource-ids.json'), JSON.stringify(created, null, 2));
console.log('Saved Stripe resource IDs to stripe-resource-ids.json');
