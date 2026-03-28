# YourKey Mortgages: AI-Powered Platform 🏠🇮🇪

**The Future of Irish Mortgage Applications**

YourKey Mortgages is a state-of-the-art, full-stack platform designed to revolutionize the Irish mortgage market. By combining cutting-edge AI agents with a comprehensive role-based dashboard system, we make high-complexity financial processing as simple as a few clicks.

![Project Banner](public/banner.png)

---

## 🌟 Executive Summary

YourKey Mortgages streamlines the entire application lifecycle—from initial pre-eligibility checks through document verification and final loan offers. It provides a seamless, secure, and intelligent environment for **Clients**, **Brokers**, and **Admins** to collaborate in real-time.

---

## 🚀 Key Intelligent Features

### 🤖 The AI Ecosystem
Our platform is powered by a network of specialized AI agents:

*   **Broker AI Agent (`broker-agent`)**: A sophisticated analyzer that cross-references client forms with uploaded documents to identify inconsistencies, credit risks, and application strengths.
*   **Client AI Assistant (`ai-assistant`)**: A friendly, 24/7 companion that guides clients through the complex Irish mortgage terminology (AIP, LTV, NDI) and helps manage document requirements.
*   **Document Vision AI (`analyze-document`)**: Leverages OpenAI Vision to "read" and extract structured data from P60s, Payslips, and Identity documents, auto-populating application forms with high accuracy.
*   **Unified Chat Hub**: A centralized communication layer combining human and AI interaction to ensure no question goes unanswered.

### 🇮🇪 Irish Mortgage Standards Engine
The engine is specifically tuned for the Central Bank of Ireland's regulations:
*   **Income Multipliers**: Automatically applies the 4.0x multiplier for First-Time Buyers (FTB) and 3.5x for Second-Time Buyers.
*   **LTV Calculations**: Calculates Loan-to-Value ratios based on current market property valuations.
*   **Eligibility Scoring**: A proprietary scoring algorithm (0-100%) that filters applicants based on credit history, residency status, and financial commitments.

---

## 🛠️ Technical Architecture

### 🛡️ Frontend Stack
*   **Framework**: React (Vite) with TypeScript.
*   **UI System**: Shadcn UI & Radix UI for accessible, premium components.
*   **Animations**: Framer Motion for high-end micro-interactions.
*   **State Management**: TanStack Query (React Query) for robust server-state synchronization.
*   **Data Visualization**: Recharts for interactive financial capacity graphs.

### ☁️ Backend & Infrastructure (Supabase)
*   **Database**: PostgreSQL with complex RLS (Row Level Security) policies.
*   **Edge Functions**: 19 high-performance Deno functions:
    *   `mortgage-eligibility`: Core backend calculation engine.
    *   `send-otp`: Secure Twilio-based mobile verification.
    *   `analyze-document`: AI Document OCR and extraction.
    *   `check-valuation-ai`: Intelligent property valuation checks.
    *   `broker-agent`: Detailed AI application audit for brokers.
    *   `send-notification`: Centralized email (SendGrid) and app notification system.
    *   `create-checkout` / `customer-portal`: Full Stripe integration for broker/client payments.
    *   `check-sla-breach`: Automated monitoring of response times.

---

## 🏗️ Folder Structure

```
Ai-Mortage-Project/
├── src/
│   ├── components/           # Modularized UI (Admin, Broker, Client, Forms)
│   ├── pages/                # High-level route views (Dashboards, Signups)
│   ├── integrations/         # Supabase client and types
│   ├── lib/                  # Auto-population logic, form mappings, utils
│   └── contexts/             # Auth and global state
├── supabase/
│   ├── functions/            # 19 TypeScript Edge Functions
│   └── migrations/           # Database schema and RLS policies
└── backend/                  # Optional Node.js/Express supplemental services
```

---

## ⚙️ Professional Setup Guide

### 1. Prerequisites
*   Node.js v18.x+
*   Supabase CLI
*   Twilio Account (for mobile verification)
*   Stripe Account (for payments)
*   OpenAI API Key (for AI features)

### 2. Environment Configuration
Create a `.env` file in the root:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Set Supabase Secrets (for Edge Functions):
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set TWILIO_ACCOUNT_SID=AC...
supabase secrets set TWILIO_AUTH_TOKEN=...
supabase secrets set TWILIO_FROM_NUMBER=+353...
```

### 3. Verification Setup (Twilio)
*Specific instructions for Irish (+353) number verification are available in the [Twilio Setup Guide](file:///C:/Users/FARHAN/.gemini/antigravity/brain/f919c898-3469-41c6-8a77-f2343f20bd25/artifacts/twilio_guide.md).*

---

## 🔒 Security & Roles

*   **Client**: Access to application tracking, document uploads, and AI chat.
*   **Broker**: Application management, AI insights, loan offer uploads.
*   **Admin**: Global metrics, system-wide configuration, stripe analytics.

---

## 🤝 Contributing
Please follow the standard Git Flow. Ensure all code passes ESLint checks and has appropriate TypeScript interfaces.

---

*Built with precision for the modern mortgage landscape.* ✨
orm)
3. Set environment variables in your deployment platform
4. Deploy Supabase functions: `supabase functions deploy`

## 🤝 Contributing

Contributions are totally welcome! Here's how:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Notes

- The project uses Irish mortgage standards and terminology (AIP, LTV, etc.)
- All AI prompts are tailored for the Irish mortgage market
- The backend folder contains a sample Express setup for additional services
- Check `backend.md` for more info on the Express backend structure

## 🎨 UI/UX Highlights

- Fully responsive design (mobile, tablet, desktop)
- Dark mode support (via next-themes)
- Smooth animations with Framer Motion
- Accessible components from Radix UI
- Toast notifications for user feedback
- Loading states and error handling
- Beautiful data visualizations

---

Built with ❤️ using React, TypeScript, Supabase, and a whole lot of AI magic ✨
