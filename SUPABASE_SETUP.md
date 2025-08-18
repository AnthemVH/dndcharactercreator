# Supabase Setup Guide

## Issue
The "Make Permanent" functionality in the Library is failing because Supabase environment variables are not configured.

## Solution
You need to create a `.env.local` file in your project root with your Supabase configuration.

## Steps

### 1. Get Your Supabase Credentials
1. Go to [Supabase](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Service Role Key** (starts with `eyJ...`)

### 2. Create Environment File
Create a file named `.env.local` in your project root with:

```bash
SUPABASE_URL=your_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Restart Your Development Server
After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

### 4. Verify Setup
- Check your terminal for any Supabase connection errors
- Try using the "Make Permanent" button in the Library
- The error "Failed to convert content to permanent" should be resolved

## Important Notes
- **Never commit `.env.local` to version control** (it's already in `.gitignore`)
- The Service Role Key has full access to your database - keep it secure
- If you don't have a Service Role Key, you can use `SUPABASE_SECRET_KEY` instead

## Alternative: Use Prisma (Local Development)
If you prefer to use the local SQLite database instead of Supabase:

1. Run the Prisma commands:
   ```bash
   npm run db:generate
   npm run db:push
   ```

2. The application will use the local SQLite database instead of Supabase

## Troubleshooting
- **"SUPABASE_URL is not set"**: Check that your `.env.local` file exists and has the correct variable names
- **"SUPABASE_SERVICE_ROLE_KEY is not set"**: Verify your service role key is copied correctly
- **Connection errors**: Ensure your Supabase project is active and the credentials are correct
