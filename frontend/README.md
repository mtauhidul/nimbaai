# NimbaAI - AI Chat Reselling Platform

## Project Overview

An AI chat reselling platform that allows users to access ChatGPT and Claude through a unified interface with flexible credit-based and subscription-based payment options. The platform includes personalized chat experiences using embeddings, comprehensive admin controls, and flexible billing systems.

## Core Features

### 1. Flexible Payment System

#### Credit-Based Packages

- **Pay-as-you-go model** where users purchase credits without time restrictions
- Credits never expire and can be used at user's pace
- Different credit packages: 100, 500, 1000, 5000, 10000 credits
- Bulk discounts for larger packages
- Each AI model consumes different credit amounts (GPT-3.5: 1 credit, GPT-4: 5 credits, Claude: 3 credits)

#### Time-Based Subscriptions

- Monthly, quarterly, and annual subscription options
- Unlimited usage within subscription period
- Access to all AI models and features
- Custom timeline subscriptions available (7 days, 15 days, 2 months, etc.)
- Auto-renewal option with notifications

#### Hybrid Options

- Subscription + additional credits for heavy users
- Team packages with shared credit pools
- Enterprise custom packages

### 2. Personalized Chat System

#### Embedding-Based Personalization

- User conversation history analysis
- Interest and preference tracking
- Contextual understanding using OpenAI embeddings
- Personalized response generation based on user profile
- Learning from user feedback and chat patterns

#### Personalization Features

- Remember user preferences and context across conversations
- Adjust response tone and style based on user history
- Suggest relevant topics based on past interactions
- Quick access to frequently discussed topics
- Personalized greeting messages

### 3. Admin Dashboard

#### User Management

- View and manage all users
- Modify user credits and subscriptions
- Suspend or ban accounts
- View user conversation history
- Export user data
- Send notifications to users

#### Analytics & Monitoring

- Real-time usage statistics
- Revenue tracking and reports
- Model usage distribution
- User engagement metrics
- System performance monitoring
- Error tracking and logs

#### Platform Control

- Enable/disable AI models
- Adjust credit costs per model
- Set rate limits for different user tiers
- Maintenance mode toggle
- Global announcements
- Backup and restore functionality

### 4. User Features

#### Chat Interface

- Clean, modern chat interface
- Model selection (GPT-3.5, GPT-4, Claude)
- Conversation history with search
- Export conversations
- Share conversations (with privacy controls)
- File uploads for context
- Code syntax highlighting
- Markdown support

#### Account Management

- Profile customization
- Usage tracking and history
- Credit balance display
- Billing history
- API key management (for advanced users)
- Referral system
- Email notifications settings

## Technical Architecture

### Technology Stack

- **Frontend**: Next.js (React), Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Node.js, Express.js, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Payments**: Stripe (for global users), SSLCommerz (for local payment gateways)
- **AI Services**: OpenAI API, Anthropic API
- **Hosting**: Vercel (Frontend), Heroku (Backend)
- **UI Components**: shadcn/ui with prebuilt blocks
- **Chat UI**: Next.js Chat UI template (customized)
- **State Management**: Zustand

### Security Features

- All API keys stored securely in backend
- Firebase token-based authentication
- Rate limiting based on user tier
- Input validation and sanitization
- Encrypted sensitive data
- Regular security audits

### Scalability

- Horizontal scaling capability
- Caching for frequent requests
- Database indexing for performance
- CDN for static assets
- Load balancing ready architecture

## Business Model

### Revenue Streams

1. **Credit Sales**: Direct credit package purchases
2. **Subscriptions**: Recurring monthly/annual revenue
3. **Enterprise Packages**: Custom solutions for businesses
4. **API Access**: Premium API access for developers
5. **White Label**: Branded solutions for other businesses

### Pricing Strategy

- Competitive pricing compared to direct API access
- Value-added features justify premium
- Free tier with limited credits to attract users
- Referral rewards to encourage growth
- Seasonal promotions and discounts

## User Journey

### New User Flow

1. Sign up with email/Google
2. Receive welcome credits (e.g., 50 free credits)
3. Explore chat interface with tutorial
4. First conversation with AI
5. Prompt to purchase credits or subscribe
6. Seamless payment through Stripe/SSLCommerz
7. Continued usage with personalization

### Returning User Flow

1. Quick login
2. Resume previous conversations
3. Personalized dashboard
4. Low credit warnings
5. Easy recharge/renewal
6. Access to new features

## Competitive Advantages

1. **Flexibility**: Both credit and subscription options
2. **Personalization**: Embedding-based context awareness
3. **Multi-Model**: Access to multiple AI providers
4. **User-Friendly**: Simple interface for non-technical users
5. **Cost-Effective**: Bulk pricing better than direct API access
6. **Support**: Local language support and customer service
7. **Privacy**: User data protection and control

## Future Roadmap

### Phase 1 (Launch)

- Basic chat functionality
- Credit system
- User authentication
- Simple admin panel

### Phase 2 (Growth)

- Subscription system
- Personalization features
- Advanced admin analytics
- Mobile responsive design

### Phase 3 (Scale)

- Mobile apps
- Team collaborations
- API access for developers
- White label solutions
- Voice chat integration
- Custom AI model fine-tuning

## Success Metrics

- **User Acquisition**: Monthly new user signups
- **Retention Rate**: Monthly active users
- **Revenue Growth**: MRR and credit sales
- **Usage Metrics**: Messages per user
- **Customer Satisfaction**: NPS score
- **Technical Performance**: Uptime and response time

## Compliance & Legal

- Terms of Service and Privacy Policy
- GDPR compliance for EU users
- Data retention policies
- Transparent AI usage disclosure
- Secure payment processing (PCI compliance via Stripe)
- Regular security audits

## UI/UX Design Guidelines

### Brand Identity & Color Scheme

#### Primary Colors (from logo)

- **Primary Dark**: #2C3E50 (Deep blue-gray from logo icon)
- **Primary Medium**: #5A6C7D (Medium gray from text)
- **Primary Light**: #F8F9FA (Off-white for backgrounds)

#### Secondary Colors

- **Accent Blue**: #3B82F6 (For CTAs and highlights)
- **Success Green**: #10B981 (For positive states)
- **Warning Amber**: #F59E0B (For alerts)
- **Error Red**: #EF4444 (For errors)
- **Neutral Grays**: #F3F4F6, #E5E7EB, #D1D5DB, #9CA3AF

### Design Principles

#### 1. Minimalist Interface

- Clean white/light gray backgrounds like ChatGPT
- Ample white space for breathing room
- No unnecessary decorative elements
- Focus on content and functionality

#### 2. Typography

- **Primary Font**: Inter or SF Pro Display (modern, clean)
- **Headings**: Semi-bold to bold weights
- **Body Text**: Regular weight, 16px base size
- **Code/Monospace**: Fira Code or Monaco

#### 3. Component Design

**Chat Interface**

- Left sidebar (280px) with conversation history
- Main chat area with centered message container (max-width: 768px)
- Floating input bar at bottom with send button
- Smooth animations for message appearance
- Typing indicators with subtle pulse animation

**Message Bubbles**

- User messages: Light background (#F3F4F6) with primary text
- AI responses: White background with subtle border
- Rounded corners (8-12px)
- Subtle shadows for depth
- Copy button on hover

**Navigation**

- Top navbar with logo left-aligned
- User menu and credits display right-aligned
- Mobile hamburger menu for responsive design
- Breadcrumb navigation for deep pages

#### 4. Responsive Breakpoints

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+
- Fluid typography and spacing

### Key UI Components

#### 1. Dashboard Cards

```
- White background with subtle shadow
- 16-24px padding
- Rounded corners (8px)
- Hover state with slight elevation
- Icon + metric + label layout
```

#### 2. Buttons

```
Primary: Background #3B82F6, white text
Secondary: Border #E5E7EB, primary text
Ghost: No border, primary text, hover background
Sizes: Small (32px), Medium (40px), Large (48px)
```

#### 3. Form Elements

```
- Rounded inputs with 12px padding
- Focus state with blue outline
- Label above input
- Helper text below in gray
- Error states in red
```

#### 4. Loading States

```
- Skeleton screens for content loading
- Subtle shimmer effect
- Smooth transitions
- Progress indicators for long operations
```

### Page-Specific Designs

#### Chat Page

- **Layout**: 3-column on desktop (sidebar, chat, details panel)
- **Mobile**: Full-screen chat with slide-out sidebar
- **Features**: Model selector dropdown, temperature slider, conversation settings

#### Admin Dashboard

- **Grid Layout**: Flexible card-based system
- **Data Visualization**: Clean charts using Chart.js
- **Tables**: Alternating row colors, sortable columns
- **Filters**: Inline filter bar with search

#### Billing Page

- **Credit Display**: Large, prominent credit balance
- **Package Cards**: Pricing tiers in card layout
- **Payment Form**: Stripe Elements integration
- **History Table**: Paginated transaction history

### Accessibility Features

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast mode option
- Focus indicators
- Alt text for images

### Animation & Interactions

- **Transitions**: 200-300ms ease-in-out
- **Hover Effects**: Subtle scale or shadow changes
- **Loading**: Smooth progress bars and spinners
- **Feedback**: Toast notifications for actions
- **Micro-animations**: Button clicks, input focus

### Dark Mode (Optional)

- Toggle in user settings
- Inverted color scheme
- Adjusted contrast ratios
- Persistent user preference

### Mobile-First Approach

- Touch-friendly targets (min 44px)
- Swipe gestures for navigation
- Optimized keyboard interactions
- Responsive images and icons
- Progressive enhancement

## Project Structure

### Frontend (Next.js)

```
frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth routes
│   ├── (dashboard)/              # Protected routes
│   ├── admin/                    # Admin section
│   └── api/                      # API routes
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── chat/                     # Chat components
│   └── shared/                   # Shared components
├── lib/
│   ├── firebase.js               # Firebase config
│   ├── api.js                    # API client
│   └── utils.js                  # Utility functions
├── stores/                       # Zustand stores
│   ├── authStore.js
│   ├── chatStore.js
│   └── uiStore.js
└── styles/                       # Global styles
```

### Backend (Node.js + Express)

```
backend/
├── server.js                     # Main server file
├── routes/
│   ├── auth.js                   # Auth endpoints
│   ├── chat.js                   # Chat endpoints
│   ├── billing.js                # Payment endpoints
│   └── admin.js                  # Admin endpoints
├── middleware/
│   ├── auth.js                   # Firebase auth
│   └── rateLimiter.js            # Rate limiting
├── services/
│   ├── firebase-admin.js         # Firebase setup
│   ├── openai.js                 # OpenAI integration
│   ├── anthropic.js              # Claude integration
│   ├── stripe.js                 # Stripe integration
│   └── sslcommerz.js             # SSLCommerz integration
└── config/
    └── keys.js                   # Environment config
```

## Development Guidelines

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_API_URL=

# Backend (.env)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
FIREBASE_SERVICE_ACCOUNT=
```

### Key Dependencies

- **Frontend**: next, react, tailwindcss, @shadcn/ui, zustand, firebase
- **Backend**: express, firebase-admin, openai, @anthropic-ai/sdk, stripe, sslcommerz

### Deployment

- Frontend: Vercel (automatic from GitHub)
- Backend: Heroku (manual deployment)
- Database: Firebase (automatic)

## Contact & Support

- Project Lead: [Your Name]
- Email: [Your Email]
- Documentation: [Link to detailed docs]

---

This platform bridges the gap between complex AI APIs and everyday users, providing a seamless, personalized, and flexible way to access advanced AI capabilities while maintaining a sustainable business model.
