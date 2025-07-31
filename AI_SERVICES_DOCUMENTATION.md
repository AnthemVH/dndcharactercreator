# D&D Character Creator - AI Services & API Documentation

## 🤖 AI Services Used

### Primary AI Service: Z-AI Web Dev SDK
The application uses the **z-ai-web-dev-sdk** package as the primary AI service provider.

**Package Version:** `^0.0.10`
**Installation:** `npm install z-ai-web-dev-sdk`

### AI Capabilities Utilized:

#### 1. **AI Portrait Generator** ($4.99)
- **Service:** `zai.images.generations.create()`
- **Function:** Generates character portraits based on race, class, and description
- **Output:** Base64 encoded image data
- **Size:** 1024x1024 pixels
- **Prompt Example:** 
  ```javascript
  const prompt = `Create a professional D&D character portrait of a ${character.race} ${character.class}. The character should look heroic and fantasy-themed. Style: digital painting, detailed, high quality.`
  ```

#### 2. **AI Backstory Generator** ($2.99)
- **Service:** `zai.chat.completions.create()`
- **Function:** Generates compelling character backstories (300 words)
- **Model:** Chat completion with system role
- **Prompt Example:**
  ```javascript
  const prompt = `Write a compelling 300-word backstory for a D&D character who is a ${character.race} ${character.class} named ${character.name}. Include their origins, motivations, and a hint of mystery or adventure.`
  ```

#### 3. **AI Stat Optimizer** ($3.99)
- **Service:** `zai.chat.completions.create()`
- **Function:** Provides optimized stat suggestions in JSON format
- **Output:** Structured JSON with ability scores, skills, feats, and tips
- **Prompt Example:**
  ```javascript
  const prompt = `Provide optimized stat suggestions for a D&D ${character.class} character who is a ${character.race}. Include recommended ability score distribution, skill priorities, and feat suggestions. Format as JSON...`
  ```

## 🔑 Required API Keys & Environment Variables

### 1. **Z-AI Web Dev SDK Configuration**
The Z-AI Web Dev SDK requires authentication through environment variables:

```bash
# Required for Z-AI SDK authentication
Z_AI_API_KEY=your_z_ai_api_key_here
Z_AI_BASE_URL=https://api.z-ai.com/v1  # (or provided URL)
```

### 2. **Stripe Payment Integration**
For payment processing, the following Stripe environment variables are required:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. **JWT Authentication**
For secure user authentication:

```bash
# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
```

### 4. **Database Configuration**
For Prisma/SQLite database:

```bash
# Database Configuration
DATABASE_URL="file:./dev.db"
```

## 📋 Complete .env File Template

```bash
# =============================================================================
# D&D Character Creator - Environment Variables
# =============================================================================

# =============================================================================
# AI SERVICES
# =============================================================================
# Z-AI Web Dev SDK Configuration
Z_AI_API_KEY=your_z_ai_api_key_here
Z_AI_BASE_URL=https://api.z-ai.com/v1

# =============================================================================
# PAYMENT PROCESSING
# =============================================================================
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =============================================================================
# AUTHENTICATION
# =============================================================================
# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_at_least_32_characters_long

# =============================================================================
# DATABASE
# =============================================================================
# Prisma/SQLite Configuration
DATABASE_URL="file:./dev.db"

# =============================================================================
# APPLICATION
# =============================================================================
# Next.js Configuration
NODE_ENV=development
```

## 🔧 API Key Setup Instructions

### 1. **Z-AI Web Dev SDK**
1. Contact Z-AI support or visit their developer portal
2. Register for an API key
3. Add the key to your `.env` file as `Z_AI_API_KEY`
4. The SDK automatically handles authentication using this key

### 2. **Stripe Setup**
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Navigate to Developers → API Keys
3. Copy your test keys (publishable and secret)
4. Set up webhook endpoints for payment events
5. Add keys to your `.env` file

### 3. **JWT Secret**
1. Generate a secure random string (at least 32 characters)
2. Use an online generator or run: `openssl rand -base64 32`
3. Add to your `.env` file as `JWT_SECRET`

## 🚀 Deployment Checklist

### Required for Production:
- [ ] All API keys added to environment variables
- [ ] Stripe webhook endpoints configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Domain name configured
- [ ] Payment testing completed

### Security Considerations:
- [ ] All secrets stored in environment variables (not in code)
- [ ] HTTPS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] Database backups configured

## 📊 AI Usage Monitoring

The application tracks AI generation through:
- Payment records in the database
- Character updates with AI-generated content
- Webhook logging for successful generations
- Error logging for failed generations

### Cost Estimation:
- **Portrait Generation:** ~$0.02-$0.05 per image (depending on AI service pricing)
- **Text Generation:** ~$0.001-$0.003 per 1K tokens
- **Estimated Cost per User:** $0.03-$0.08 for complete AI feature set

## 🔍 Troubleshooting

### Common Issues:
1. **AI Generation Fails:** Check `Z_AI_API_KEY` is valid and has credits
2. **Payment Processing:** Verify Stripe keys and webhook configuration
3. **Authentication:** Ensure `JWT_SECRET` is consistent across services
4. **Database:** Check `DATABASE_URL` and file permissions

### Debug Commands:
```bash
# Test database connection
npx prisma db push

# Test Stripe integration
stripe listen --forward-to localhost:3000/api/payments/webhook

# Check environment variables
node -e "console.log(process.env)"
```

## 📞 Support

For API key and service issues:
- **Z-AI SDK:** Contact through their developer support
- **Stripe:** [Stripe Support](https://support.stripe.com/)
- **Prisma:** [Prisma Documentation](https://www.prisma.io/docs/)
- **Next.js:** [Next.js Documentation](https://nextjs.org/docs)

---

**Note:** This application is designed with strict paywalls to ensure zero AI costs for free users. All AI generation requires valid payment verification through Stripe.