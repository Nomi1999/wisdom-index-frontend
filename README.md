# Wisdom Index Financial Advisory AI Web App - Frontend

## Overview

The frontend of the Wisdom Index Financial Advisory AI Web App is a comprehensive financial dashboard built with Next.js and TypeScript. It provides clients and financial advisors with detailed insights into their financial health through a modern, responsive interface. The application combines traditional financial metrics with AI-powered analysis to deliver personalized financial recommendations and guidance.

The frontend features a client dashboard with 37+ financial metrics organized across 6 key categories (Assets & Liabilities, Income Analysis, Expense Tracking, Insurance Coverage, Future Planning Ratios, and Wisdom Index Ratios), interactive visualizations, and one-click AI insights generation. Additionally, it includes a comprehensive admin dashboard for financial advisors to manage clients and view analytics.

## Features

- **Client Dashboard**: Complete financial overview with 37+ metrics organized in a responsive grid layout
- **Interactive Visualizations**: Income bar charts, expense pie charts, treemap visualizations, and financial ratio charts
- **AI-Powered Insights**: One-click generation of personalized financial insights with streaming responses
- **Target Management**: Set and track financial targets for each metric with visual indicators
- **Profile Management**: Complete client profile management with personal and financial information
- **Data Export**: Export all financial metrics and chart data to Excel format
- **Account History**: View historical financial data for accounts with interactive visualizations
- **Admin Dashboard**: Comprehensive administrative tools for client management, analytics, and database access
- **Responsive Design**: Fully responsive interface optimized for various screen sizes
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Metric Detail Modals**: Detailed information about each financial metric including formulas and data sources

## Tech Stack

### Frontend Technologies
- **Framework**: Next.js 16.0.1 with server-side rendering capabilities
- **Language**: TypeScript for type-safe development
- **Styling**: Tailwind CSS for responsive design
- **Animations**: Framer Motion 12.23.24 for advanced animations and micro-interactions
- **Charts**: Chart.js 4.5.1 and Recharts 2.15.4 for data visualization
- **Icons**: Lucide React 0.553.0 for UI components
- **State Management**: React hooks and context API
- **Form Validation**: React Hook Form 7.66.0 with Zod 4.1.12 validation
- **Excel Export**: SheetJS (xlsx) 0.18.5 for Excel export functionality
- **UI Components**: Radix UI components for accessibility
- **Date Handling**: chartjs-adapter-date-fns 3.0.0
- **JWT Handling**: jwt-decode 4.0.0

### UI Architecture
- **Component-Based Architecture**: Modular components for dashboard layout, metrics grid, charts, and AI insights
- **Dashboard Layout**: Responsive layout with sidebar navigation, header, metrics grid, chart section, and AI insights
- **Admin Interface**: Separate admin dashboard with client management, analytics, database viewer, and settings
- **Modal System**: Metric detail modals, account history views, and other interactive components
- **Responsive Design**: Mobile-first approach with responsive breakpoints for all screen sizes

## Setup and Development

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- Access to the backend API (see backend README for setup instructions)

### Installation
1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd frontend-nextjs
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the frontend-nextjs directory with the following variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001
   ```
   Replace `http://localhost:5001` with your backend API URL.

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Environment Variables
- `NEXT_PUBLIC_API_URL`: The URL of the backend API server (required)

### Development Scripts
- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint to check for code quality issues

## UI Components and Architecture

### Dashboard Components
- **DashboardLayout**: Main layout component that handles the overall structure with header, sidebar, and main content
- **MetricsGrid**: Grid layout displaying 37+ financial metrics organized by category
- **MetricCard**: Individual card component for each financial metric with value, target comparison, and status indicators
- **ChartsSection**: Container for income bar charts and expense pie charts
- **AIInsights**: Component for generating and displaying AI-powered financial insights
- **Header**: Dashboard header with client information and navigation controls
- **Sidebar**: Navigation sidebar with links to dashboard, profile, advisor contact, target management, and export functionality

### Admin Components
- **AdminAnalytics**: Analytics dashboard showing key metrics like AUM, client coverage, and revenue
- **ClientManagement**: Client list and detail views with financial metrics
- **DatabaseViewer**: Interface for viewing and filtering database tables
- **AIConfiguration**: Superuser-only interface for configuring AI settings
- **SecuritySettings**: Admin security code management interface

### Shared Components
- **MetricDetailModal**: Modal showing detailed information about specific metrics including formulas and data sources
- **ProfilePanel**: Client profile management interface
- **TargetsManager**: Interface for setting and managing financial targets
- **AccountHistoryView**: Component for viewing historical account data with charts and tables

### UI/UX Features
- **Responsive Design**: Adapts to different screen sizes with mobile-first approach
- **Animations**: Smooth transitions and micro-interactions powered by Framer Motion
- **Loading States**: Comprehensive loading states throughout the application
- **Error Handling**: Proper error handling and user feedback mechanisms
- **Accessibility**: Built with accessibility in mind using proper semantic HTML and ARIA attributes
- **Performance**: Optimized for performance with code splitting and lazy loading where appropriate

## Deployment

### Vercel Deployment
The frontend is configured for deployment to Vercel with the following configuration:

1. Connect your GitHub repository to Vercel
2. Set the `NEXT_PUBLIC_API_URL` environment variable to your backend URL
3. Vercel will automatically build and deploy the application on git pushes

### Environment Variables for Production
- `NEXT_PUBLIC_API_URL`: Your production backend API URL (e.g., https://your-app-name-production.up.railway.app)

### Build Configuration
The application is configured to:
- Use Next.js standalone output for optimized builds
- Handle trailing slashes properly
- Build with environment variables

### Deployment Files
- `vercel.json`: Vercel-specific configuration
- `next.config.ts`: Next.js configuration optimized for deployment
- `.env.example`: Example environment variables

## Troubleshooting

### Common Issues

#### API Connection Issues
- Verify that `NEXT_PUBLIC_API_URL` is correctly set in your environment variables
- Ensure the backend server is running and accessible from the frontend
- Check CORS configuration in the backend to ensure it allows requests from your frontend domain

#### Build Errors
- Make sure all dependencies are installed (`npm install` or `yarn install`)
- Verify Node.js version compatibility (18 or higher)
- Clear the build cache if needed (`rm -rf .next` in development)

#### Authentication Issues
- Ensure JWT tokens are properly stored in sessionStorage
- Verify that the API URL in your environment variables matches the backend server
- Check that authentication routes are correctly configured on the backend

#### Chart Rendering Problems
- Verify that chart data is being fetched correctly from the API
- Ensure required chart dependencies (Chart.js, Recharts) are properly imported
- Check for any JavaScript errors in the browser console that might prevent chart rendering

#### Performance Issues
- Use the browser's developer tools to identify any slow API calls or render bottlenecks
- Ensure proper component memoization and efficient state management
- Check network tab for any resources that take too long to load

#### Mobile Responsiveness Issues
- Test on multiple device sizes using browser developer tools
- Verify Tailwind CSS classes are correctly applied for different breakpoints
- Check that touch interactions work properly on mobile devices

#### Excel Export Problems
- Verify that SheetJS is correctly implemented and loaded
- Check that the export API endpoint returns properly formatted Excel file
- Test the generated Excel files for correct formatting and values

### Development Tips
- Use the browser's developer tools to inspect components and debug styling issues
- Check the network tab to monitor API calls and identify slow requests
- Use the console to check for JavaScript errors and warnings
- Enable React DevTools for better component debugging
- Use the Next.js development server for hot reloading during development