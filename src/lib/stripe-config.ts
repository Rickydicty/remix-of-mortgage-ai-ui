// Stripe price and product IDs
export const STRIPE_PRICES = {
  // Client one-time payment (€50)
  application_fee: "price_1SgTIF2FpGd4w0komgFG8bO2",
  // Broker subscriptions
  broker_basic: "price_1Sdwbz2FpGd4w0koOHpmZMiV",
  broker_pro: "price_1SdwcI2FpGd4w0koBCLxBPqG",
  broker_enterprise: "price_1SdwcY2FpGd4w0koPfrWUYtb",
} as const;

export const STRIPE_PRODUCTS = {
  basic: "prod_Tb8tE3X7wAEk5g",
  pro: "prod_Tb8u6JfeS1c9Nd",
  enterprise: "prod_Tb8uOsZ0FuZ1Cz",
} as const;

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    price: 49,
    priceId: STRIPE_PRICES.broker_basic,
    productId: STRIPE_PRODUCTS.basic,
    features: [
      "Up to 10 active applications",
      "Document management",
      "Client messaging",
      "Basic reporting",
    ],
  },
  pro: {
    name: "Pro",
    price: 99,
    priceId: STRIPE_PRICES.broker_pro,
    productId: STRIPE_PRODUCTS.pro,
    features: [
      "Unlimited applications",
      "AI-powered document analysis",
      "Lender comparison tools",
      "Advanced reporting",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    priceId: STRIPE_PRICES.broker_enterprise,
    productId: STRIPE_PRODUCTS.enterprise,
    features: [
      "Everything in Pro",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "API access",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
