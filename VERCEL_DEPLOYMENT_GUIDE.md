# D&D Character Creator - Vercel + Supabase Deployment Guide

This guide will help you deploy the D&D Character Creator application to Vercel with Supabase as the database.

## Prerequisites

1. **GitHub Account** - For connecting to Vercel
2. **Vercel Account** - Free tier available
3. **Supabase Account** - Free tier available
4. **Stripe Account** - For payment processing
5. **Z-AI API Key** - For AI generation features

## Step 1: Set Up Supabase

### 1.1 Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Enter project details:
   - **Project Name**: `dnd-character-creator`
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
4. Click "Create new project"

### 1.2 Get Database Connection String

1. Once the project is created, go to **Project Settings** → **Database**
2. Find the **Connection string** section
3. Copy the **URI** connection string
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 1.3 Set Up Environment Variables in Supabase

1. Go to **Project Settings** → **API**
2. Copy the **Project URL** and **service_role** key
3. You'll need these for the Prisma setup

## Step 2: Configure Prisma for PostgreSQL

### 2.1 Update Prisma Schema

The Prisma schema is already configured for PostgreSQL. Just ensure your `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.2 Generate Prisma Client

Run these commands to generate the Prisma client:

```bash
npm install
npm run db:generate
```

### 2.3 Push Schema to Supabase

```bash
npm run db:push
```

This will create all the necessary tables in your Supabase database.

## Step 3: Set Up Stripe

### 3.1 Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. Go to **Webhooks** → **Add endpoint**
5. Set endpoint URL: `https://your-domain.vercel.app/api/payments/webhook`
6. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
7. Copy the **Webhook signing secret**

## Step 4: Set Up Z-AI SDK

### 4.1 Get Z-AI API Key

1. Contact Z-AI team to get your API key
2. This will be used for AI generation features

## Step 5: Deploy to Vercel

### 5.1 Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"

### 5.2 Configure Environment Variables

In Vercel project settings, add these environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Z-AI SDK
ZAI_API_KEY="your-z-ai-api-key"
```

### 5.3 Configure Build Settings

Vercel should automatically detect the Next.js configuration. Ensure:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 5.4 Deploy

Click "Deploy" to deploy your application.

## Step 6: Post-Deployment Setup

### 6.1 Update Stripe Webhook URL

1. Go back to Stripe Dashboard → **Webhooks**
2. Update the endpoint URL to your actual Vercel domain
3. Test the webhook endpoint

### 6.2 Test the Application

1. Visit your deployed application
2. Test user registration and login
3. Test character creation
4. Test payment flow (in test mode)
5. Verify AI generation features work

### 6.3 Monitor Application

1. Check Vercel logs for any errors
2. Monitor Supabase database performance
3. Set up error tracking if needed

## Step 7: Go Live

### 7.1 Switch to Production Stripe Keys

1. Go to Stripe Dashboard → **API keys**
2. Switch from test keys to live keys
3. Update Vercel environment variables with live keys

### 7.2 Update Webhook for Production

1. Create a new webhook endpoint for production
2. Update the endpoint URL in Stripe
3. Update the `STRIPE_WEBHOOK_SECRET` in Vercel

### 7.3 Final Testing

1. Test the entire flow with real payments (small amounts)
2. Verify all features work correctly
3. Check email notifications if implemented

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure `DATABASE_URL` is correct
   - Verify SSL mode is set to `require`
   - Check Supabase project is active

2. **Build Failures**
   - Check Vercel build logs
   - Ensure all dependencies are installed
   - Verify Next.js configuration

3. **Payment Issues**
   - Verify Stripe keys are correct
   - Check webhook configuration
   - Ensure webhook endpoint is accessible

4. **AI Generation Failures**
   - Verify Z-AI API key is valid
   - Check API rate limits
   - Monitor AI service status

### Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Secure random string
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `ZAI_API_KEY` - Z-AI API key

## Cost Optimization

### Free Tier Limits

- **Vercel**: 100GB bandwidth, 6 serverless functions
- **Supabase**: 500MB database, 2GB bandwidth, 1 million API requests
- **Stripe**: No monthly fees, pay per transaction
- **Z-AI**: Depends on your plan

### Scaling Considerations

1. **Database**: Monitor Supabase usage, upgrade when needed
2. **Bandwidth**: Vercel's free tier is generous for most startups
3. **AI Costs**: Monitor Z-AI usage and optimize prompts
4. **Stripe Fees**: 2.9% + 30¢ per transaction

## Support

If you encounter any issues during deployment:

1. Check Vercel and Supabase documentation
2. Review Stripe webhook documentation
3. Contact Z-AI support for API issues
4. Check the project's GitHub issues for known problems

---

**Happy deploying! 🚀**