# Wisdom Index Frontend - Vercel Deployment

This frontend is configured for deployment to Vercel with Next.js.

## Deployment Files

- `vercel.json`: Vercel-specific configuration
- `next.config.ts`: Next.js configuration optimized for deployment
- `.env.example`: Example environment variables

## Environment Variables

Set these in your Vercel dashboard:

### Required
- `NEXT_PUBLIC_API_URL`: Your Railway backend URL (e.g., https://your-app-name-production.up.railway.app)

### Configuration Notes
- The `NEXT_PUBLIC_` prefix is required for variables to be exposed to the browser
- Do NOT include sensitive information in NEXT_PUBLIC_ variables

## Vercel Configuration

The application is configured to:
- Use Next.js standalone output for optimized builds
- Handle trailing slashes properly
- Build with environment variables

## API Integration

The frontend uses the API base URL from `NEXT_PUBLIC_API_URL` to:
- Make all API requests to the backend
- Handle authentication
- Fetch financial data
- Generate AI insights

## Deployment Process

1. Connect your GitHub repository to Vercel
2. Configure the `NEXT_PUBLIC_API_URL` environment variable
3. Vercel will automatically build and deploy on git push
4. The site will be available at your Vercel domain

## Troubleshooting

1. Check Vercel build logs for any errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Ensure backend CORS allows your Vercel domain
4. Check browser console for network errors

## Custom Domain (Optional)

To use a custom domain:
1. Add your domain in Vercel dashboard
2. Update CORS configuration in backend to allow your custom domain
3. Update `FRONTEND_URL` environment variable in Railway