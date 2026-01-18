# AI Mortgage Project 🏠

A super cool, AI-powered mortgage application platform that makes the whole mortgage process way easier. Built with React, TypeScript, and Supabase - this thing streamlines everything from checking eligibility to getting loan offers, all wrapped up in a nice role-based dashboard system. Pretty neat, right?

![Project Banner](public/banner.png)

## 🌟 What's This All About?

So basically, this is a full-stack mortgage platform that helps clients, brokers, and admins work together smoothly. It's got AI agents that actually understand Irish mortgage rules, automated document processing that saves everyone time, and a payment system that just works. The whole thing is designed to make mortgage applications less of a headache.

## 🚀 Key Features

### 🤖 AI-Powered Intelligence

- **Broker AI Agent**: Smart assistant that helps brokers find deals, answer questions, and manage client data using natural language. It knows all about Irish mortgage standards and can analyze applications like a pro.
- **Client AI Assistant**: Friendly chatbot that helps clients understand the mortgage process, explains documents in plain English, and guides them through what they need to do next.
- **Automated Document Analysis**: Upload your docs (ID, payslips, bank statements, etc.) and the AI scans them, extracts data, verifies everything, and flags any issues. It's like having a super thorough assistant that never gets tired.
- **Smart Valuation**: Automated property valuation checks using `check-valuation-ai` - no more guessing games.
- **Pre-Eligibility Engine**: Quick check to see if you might qualify before diving into the full application process.
- **Unified Chat Bot**: One chat interface that handles everything - questions, document help, application status, you name it.
- **Library AI Search**: Search through mortgage knowledge base using AI - find answers fast.

### 💳 Payments & Subscriptions

- **Stripe Integration**: Full payment suite with Stripe Connect for secure transactions.
- **Subscription Management**: Handles recurring billing, subscription checks, and customer portal access.
- **Secure Checkout**: Smooth checkout sessions for service payments - no friction, just works.
- **Customer Portal**: Let users manage their own subscriptions and billing.

### 👥 Role-Based Dashboards

#### Client Dashboard
- Track your application progress in real-time with a nice visual timeline
- Upload documents with AI verification (it tells you if something's missing or wrong)
- View your Agreement in Principle (AIP) status and download letters
- See all your loan offers and compare them side-by-side
- Chat with the AI assistant anytime
- Submit property valuations
- E-signatures for documents
- Fill out comprehensive application forms (personal details, income, financial info, property details, declarations)

#### Broker Dashboard
- Manage multiple client applications from one place
- AI insights panel that flags issues and inconsistencies automatically
- Document review with extracted data display
- AIP management - upload, track, and manage AIP documents
- Client messaging system
- Property valuation review
- Loan offer upload and management
- Library tab for resources
- Rates tracking
- Application tracker
- NDI calculator
- Cover letter generation
- Signature review tools

#### Admin Dashboard
- Global oversight of platform metrics
- User management and system configuration
- Stripe data overview
- System-wide analytics

### 🛠 Core Capabilities

- **Secure Authentication**: Role-based auth using Supabase Auth - clients, brokers, and admins all have their own spaces
- **Modern UI/UX**: Beautiful, responsive interface built with Shadcn UI, Tailwind CSS, and Framer Motion animations
- **Data Visualization**: Interactive charts and financial insights using Recharts
- **Real-time Notifications**: Get updates and alerts as things happen
- **Document Auto-Population**: AI extracts data from documents and fills forms automatically
- **Smart Timeline**: Visual progress tracker that shows where you are in the process
- **Batch Document Upload**: Upload multiple documents at once
- **Form Field Flags**: AI highlights issues in forms before submission

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/) - fast dev experience
- **Language**: [TypeScript](https://www.typescriptlang.org/) - type safety, fewer bugs
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - utility-first, super flexible
- **Components**: [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/) - accessible, beautiful components
- **State/Query**: [TanStack Query](https://tanstack.com/query/latest) - smart data fetching and caching
- **Forms**: React Hook Form + Zod - validation made easy
- **Routing**: React Router DOM - handle all those routes
- **Animations**: Framer Motion - smooth, polished interactions
- **Charts**: Recharts - visualize that data
- **Icons**: Lucide React - nice, consistent icon set

### Backend & Cloud
- **Platform**: [Supabase](https://supabase.com/) - PostgreSQL database, auth, storage, the works
- **Edge Functions**: Deno-based serverless functions (17 of them!) for all the heavy lifting:
  - `broker-agent`: AI logic for broker interactions and application analysis
  - `broker-agent-chat`: Chat interface for brokers
  - `ai-assistant`: Client-facing AI assistant
  - `unified-chat-bot`: One chat to rule them all
  - `analyze-document`: Computer vision for document verification and data extraction
  - `check-valuation-ai`: Property valuation checks
  - `evaluate-application-state`: Smart application state evaluation
  - `create-checkout`: Stripe checkout session creation
  - `customer-portal`: Stripe customer portal access
  - `check-subscription`: Subscription status checks
  - `suggest-broker`: Broker recommendation system
  - `library-ai-search`: AI-powered knowledge base search
  - `send-notification`: Notification system
  - `document-upload-greeting`: Welcome messages for document uploads
  - `admin-stripe-data`: Admin dashboard Stripe data
  - `delete-user`: User deletion (with cleanup)
- **AI Integration**: OpenAI (via Edge Functions) - powers all the smart stuff
- **Database**: PostgreSQL with Supabase - migrations in `supabase/migrations/`

### Payments
- **Provider**: [Stripe](https://stripe.com/) - industry standard, secure, reliable

### Additional Backend
- **Express Backend**: Separate Node.js backend in `backend/` folder for mortgage eligibility calculations and other services
  - Express server with CORS
  - MVC-like structure (routes, controllers, services)
  - Ready for additional business logic

## 🚀 Getting Started

Alright, let's get this thing running on your machine!

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or bun (your choice)
- Supabase CLI (optional, for local backend development)
- A Supabase project (you'll need the URL and anon key)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ai-Mortage-Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   You'll also need to set up environment variables in your Supabase project for the Edge Functions (OpenAI API key, Stripe keys, etc.)

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080` (configured in `vite.config.ts`)

5. **Optional: Run the backend server**
   If you want to run the Express backend separately:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   It'll run on port 5000 by default.

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder. You can preview it with:
```bash
npm run preview
```

## 📁 Project Structure

Here's how everything is organized:

```
Ai-Mortage-Project/
├── src/
│   ├── components/           # All the reusable UI components
│   │   ├── admin/            # Admin-specific components
│   │   ├── broker/           # Broker dashboard components
│   │   │   ├── AdminTab.tsx
│   │   │   ├── AgentInsightsPanel.tsx
│   │   │   ├── AIPManagementTab.tsx
│   │   │   ├── ApplicationTab.tsx
│   │   │   ├── ClientMessaging.tsx
│   │   │   ├── DocumentReview.tsx
│   │   │   ├── LibraryTab.tsx
│   │   │   ├── LoanOfferUpload.tsx
│   │   │   ├── PropertyValuationReview.tsx
│   │   │   ├── RatesTab.tsx
│   │   │   ├── TrackerTab.tsx
│   │   │   └── ... (more broker components)
│   │   ├── client/           # Client dashboard components
│   │   │   ├── forms/        # Application form components
│   │   │   │   ├── PersonalDetailsForm.tsx
│   │   │   │   ├── IncomeEmploymentForm.tsx
│   │   │   │   ├── FinancialCreditForm.tsx
│   │   │   │   ├── MortgageDetailsForm.tsx
│   │   │   │   ├── PropertyDetailsForm.tsx
│   │   │   │   └── DeclarationsForm.tsx
│   │   ├── payments/         # Payment-related components
│   │   ├── ui/               # Shadcn UI components (buttons, cards, etc.)
│   │   ├── AIFlagsPanel.tsx
│   │   ├── AIInsightsSidebar.tsx
│   │   ├── BatchDocumentUpload.tsx
│   │   ├── DocumentList.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleBasedRoute.tsx
│   │   ├── SmartTimeline.tsx
│   │   └── ... (more shared components)
│   ├── pages/                # Main page components (routes)
│   │   ├── Index.tsx         # Landing page
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ClientSignup.tsx
│   │   ├── BrokerSignup.tsx
│   │   ├── PreEligibility.tsx
│   │   ├── ClientDashboard.tsx
│   │   ├── BrokerDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── PaymentSuccess.tsx
│   │   ├── PaymentCanceled.tsx
│   │   └── ... (more pages)
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useUserRole.tsx
│   ├── lib/                  # Utility functions and helpers
│   │   ├── autoPopulateFormData.ts
│   │   ├── documentFormMapping.ts
│   │   ├── stripe-config.ts
│   │   └── utils.ts
│   ├── integrations/         # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── App.tsx               # Main app component with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── supabase/
│   ├── functions/            # Deno Edge Functions (backend logic)
│   │   ├── admin-stripe-data/
│   │   ├── ai-assistant/
│   │   ├── analyze-document/
│   │   ├── broker-agent/
│   │   ├── broker-agent-chat/
│   │   ├── check-subscription/
│   │   ├── check-valuation-ai/
│   │   ├── create-checkout/
│   │   ├── customer-portal/
│   │   ├── delete-user/
│   │   ├── document-upload-greeting/
│   │   ├── evaluate-application-state/
│   │   ├── library-ai-search/
│   │   ├── send-notification/
│   │   ├── suggest-broker/
│   │   └── unified-chat-bot/
│   ├── migrations/           # Database migrations (30+ SQL files)
│   └── config.toml           # Supabase configuration
├── backend/                  # Express backend (optional)
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── mortgage.routes.js
│   │   ├── controllers/
│   │   │   └── mortgage.controller.js
│   │   └── services/
│   │       └── eligibility.service.js
│   └── package.json
├── public/                   # Static assets
│   ├── banner.png
│   ├── bg-img.png
│   ├── mock-aip/            # Sample AIP documents
│   ├── mock-offers/         # Sample loan offers
│   ├── robots.txt
│   └── _redirects           # Vercel redirects
├── package.json             # Frontend dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment config
└── README.md                # This file!
```

## 🎯 How It Works

### The Flow

1. **Client signs up** → Gets access to client dashboard
2. **Pre-eligibility check** → Quick assessment before full application
3. **Fill out application forms** → Personal details, income, financial info, property details, declarations
4. **Upload documents** → AI analyzes and extracts data automatically
5. **AI flags issues** → System highlights any problems or inconsistencies
6. **Broker reviews** → Broker sees everything with AI insights
7. **AIP process** → Agreement in Principle management
8. **Property valuation** → Submit and review valuations
9. **Loan offers** → Compare multiple offers
10. **Payment processing** → Stripe handles subscriptions and payments
11. **E-signatures** → Sign documents digitally
12. **Done!** → Application complete

### AI Features in Detail

- **Document Analysis**: Uploads go through `analyze-document` function which uses OpenAI Vision to read and extract data from PDFs/images. It checks for completeness, validity, and flags inconsistencies.
- **Application Analysis**: `broker-agent` analyzes all form data against Irish mortgage standards, cross-references with documents, and provides broker-facing insights.
- **Chat Assistants**: Multiple AI assistants (`ai-assistant`, `unified-chat-bot`, `broker-agent-chat`) help users with questions, document explanations, and process guidance.
- **Auto-Population**: Extracted document data automatically fills form fields where possible.

## 🔐 Security & Authentication

- Role-based access control (client, broker, admin)
- Protected routes that check authentication and roles
- Supabase Auth handles all the security stuff
- Stripe handles payment security
- Environment variables for sensitive keys

## 📦 Deployment

The project is set up for deployment on Vercel (see `vercel.json`). The Supabase Edge Functions are deployed separately via Supabase CLI.

To deploy:
1. Push to your Git repository
2. Connect to Vercel (or your preferred platform)
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
