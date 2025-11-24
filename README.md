# Frontend - Wisdom Index Financial Advisory AI Web App

## Overview

This is the modern Next.js frontend for the Wisdom Index Financial Advisory AI Web App. The application provides clients with a secure, intuitive dashboard to view their complete financial picture through 37+ sophisticated financial metrics across 5 categories, interactive data visualizations, AI-powered insights, metric target management, and comprehensive export functionality.

**Current Status**: Production-ready Next.js 16.0.1 application with TypeScript 5.9.3. Successfully migrated from vanilla HTML/CSS/JavaScript to modern React architecture with enhanced type safety, improved developer experience, and comprehensive component organization. All original functionality has been preserved and enhanced with modern React patterns.

## Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5.9.3
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.0
- **Components**: Radix UI components for accessible UI primitives
  - @radix-ui/react-avatar 1.1.11
  - @radix-ui/react-checkbox 1.3.3
  - @radix-ui/react-dialog 1.1.15
  - @radix-ui/react-dropdown-menu 2.1.16
  - @radix-ui/react-label 2.1.8
  - @radix-ui/react-slot 1.2.4
- **Data Visualization**: 
  - Chart.js 4.5.1 for interactive charts
  - Recharts 2.15.4 for additional charting capabilities
- **Form Handling**: React Hook Form 7.66.0 with Zod 4.1.12 for validation
- **Authentication**: jwt-decode 4.0.0 for client-side JWT handling
- **Icons**: Lucide React 0.553.0
- **Animations**: Framer Motion 12.23.24
- **Export Functionality**: XLSX 0.18.5 for Excel export
- **Utility Libraries**:
  - class-variance-authority 0.7.1 for component variants
  - clsx 2.1.1 for conditional class names
  - tailwind-merge 3.3.1 for Tailwind class merging
  - tw-animate-css 1.4.0 for additional animations

## Project Structure

```
frontend-nextjs/
├── src/
│   ├── app/                      # Next.js App Router structure
│   │   ├── globals.css           # Global styling with responsive design
│   │   ├── layout.tsx            # Root layout component
│   │   ├── page.tsx              # Root page that redirects to login
│   │   ├── login/                # Login page
│   │   │   ├── page.tsx          # Login page component
│   │   │   └── login-wrapper.tsx # Login wrapper with form handling
│   │   ├── register/             # Registration page
│   │   │   └── page.tsx          # Registration page component
│   │   └── dashboard/            # Main dashboard
│   │       └── page.tsx          # Dashboard with 37+ metric cards
│   ├── components/               # Reusable React components
│   │   ├── ErrorBoundary.tsx     # Error boundary for error handling
│   │   ├── LoadingWrapper.tsx    # Loading state wrapper
│   │   ├── NavigationLoader.tsx  # Navigation loading component
│   │   ├── LoginPageContent.tsx  # Login page content component
│   │   └── ui/                   # UI components from Radix UI
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── table.tsx
│   │       └── textarea.tsx
│   └── utils/                    # Utility functions
│       └── auth.ts               # Authentication utilities
├── public/                       # Static assets
│   └── assets/images/            # Image assets
├── components.json               # Shadcn/ui configuration
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- Backend API running at http://localhost:5001
- Modern web browser

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd frontend-nextjs/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

   The application will automatically redirect to the login page.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks

## Features

### Authentication System

- **Secure Login**: JWT-based authentication with token validation
- **Self-Registration**: Client verification against existing records
- **Token Management**: Automatic token refresh and expiration handling
- **Security Features**: BFCache protection, visibility change detection, and secure logout

### Dashboard Features

- **37+ Financial Metrics**: Organized in a 7x5 grid layout across 5 categories
  - Assets & Liabilities (7 metrics)
  - Income Analysis (6 metrics)
  - Expense Tracking (7 metrics)
  - Insurance Coverage (8 metrics)
  - Future Planning Ratios (6 metrics)
- **Interactive Charts**: Income bar chart and expense pie chart using Chart.js
- **Real-Time Data**: Live data fetching from backend API
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Advanced Features

- **AI-Powered Insights**: Personalized financial recommendations with caching
- **Metric Target Management**: Set and track financial goals with visual indicators
- **Detailed Metric Views**: Comprehensive breakdowns in popup modals
- **Client Profile View**: Detailed client information display
- **Data Export**: Excel export functionality with chart data
- **Sidebar Navigation**: Easy access to all features and settings

### UI/UX Enhancements

- **Modern Design**: Professional interface with Tailwind CSS
- **Smooth Animations**: Framer Motion for transitions and micro-interactions
- **Loading States**: Comprehensive loading indicators for better UX
- **Error Handling**: Error boundaries and user-friendly error messages
- **Accessibility**: Semantic HTML and ARIA labels for screen readers

## Component Architecture

### Page Components

- **Root Page** (`src/app/page.tsx`): Redirects to login page
- **Login Page** (`src/app/login/page.tsx`): Authentication interface
- **Register Page** (`src/app/register/page.tsx`): User registration with verification
- **Dashboard Page** (`src/app/dashboard/page.tsx`): Main financial dashboard

### Reusable Components

- **ErrorBoundary**: Catches and handles JavaScript errors gracefully
- **LoadingWrapper**: Provides consistent loading states across the application
- **NavigationLoader**: Handles navigation-related loading states
- **LoginPageContent**: Isolated login form component for better organization
- **MetricDetailModal**: Interactive modal component for detailed metric views

### UI Components

Based on Radix UI primitives with custom styling:
- **Button**: Consistent button styling with variants
- **Card**: Container components for content organization
- **Dialog**: Modal dialogs for detailed views and forms
- **Input**: Form inputs with validation states
- **Label**: Accessible form labels
- **Avatar**: User profile images and placeholders

## Authentication Flow

### Login Process

1. User enters credentials on the login page
2. Frontend sends POST request to `/auth/login` endpoint
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. User is redirected to dashboard with authenticated state

### Registration Process

1. User fills registration form with personal information
2. Frontend sends POST request to `/auth/register` endpoint
3. Backend verifies user against existing client records
4. Account is created and user can log in

### Security Features

- **Token Validation**: Automatic token expiration checking
- **BFCache Protection**: Prevents cached pages from bypassing authentication
- **Visibility Change Detection**: Re-authenticates when user returns to the tab
- **Secure Logout**: Clears all session data and prevents back navigation

## API Integration

### Base Configuration

```typescript
const API_BASE_URL = 'http://localhost:5001';
```

### Authentication Headers

All authenticated requests include:

```typescript
headers: {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
}
```

### Key API Endpoints Used

- Authentication: `/auth/login`, `/auth/register`
- Metrics: `/api/metrics/*` (37+ endpoints)
- Charts: `/api/charts/income-bar-chart`, `/api/charts/expense-pie-chart`
- Profile: `/api/profile`
- Targets: `/api/targets` (GET, POST, DELETE)
- Insights: `/api/insights/generate`

## Data Management

### State Management

The application uses React hooks for state management:
- `useState` for component state
- `useEffect` for side effects and data fetching
- `useRef` for DOM references and chart instances
- `useRouter` for navigation

### Data Fetching Patterns

```typescript
// Example metric loading
const loadMetric = async (metricName: string, category: string) => {
  const response = await fetch(`${API_BASE_URL}/api/metrics/${metricName}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    setMetricsData(prev => ({ ...prev, [metricName]: data }));
  }
};
```

### Error Handling

Comprehensive error handling includes:
- Network error detection
- Authentication error handling
- Graceful degradation for missing data
- User-friendly error messages

## Chart Implementation

### Chart.js Integration

The application uses Chart.js for interactive data visualizations:

```typescript
import Chart from 'chart.js/auto';

// Chart initialization
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: 'Income Amount',
      data: values,
      backgroundColor: [...],
      borderColor: [...]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    // ... additional options
  }
});
```

### Chart Features

- **Responsive Design**: Charts adapt to container size
- **Interactive Tooltips**: Detailed information on hover
- **Loading States**: Loading indicators while data fetches
- **Error Handling**: Graceful error display for failed chart loads
- **Export Support**: Chart data included in Excel exports

## Export Functionality

### Excel Export Implementation

The application provides comprehensive Excel export using SheetJS:

```typescript
import * as XLSX from 'xlsx';

// Create workbook and add sheets
const wb = XLSX.utils.book_new();
createMetricsSheet(wb);
createChartSheet(wb, chartDataCache.income, "Income Chart");
createChartSheet(wb, chartDataCache.expense, "Expense Chart");

// Generate and download file
const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
const blob = new Blob([excelBuffer], { 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
});
```

### Export Features

- **Complete Data Export**: All 37+ metrics with current values
- **Chart Data**: Include chart data in separate sheets
- **Formatted Output**: Professional Excel formatting
- **Timestamped Files**: Automatic filename with current date
- **Client-Side Processing**: No server load for export generation

## Performance Optimizations

### Code Splitting

Next.js automatically splits code by pages and components:
- Automatic route-based code splitting
- Component-level lazy loading for large components
- Optimized bundle sizes for faster loading

### Data Loading Optimizations

- **Batch Loading**: Multiple metrics loaded concurrently
- **Caching Strategy**: Chart data cached for export functionality
- **Debounced Operations**: Resize handlers for responsive charts
- **Memory Management**: Proper cleanup of chart instances

### Rendering Optimizations

- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Memoized event handlers
- **useMemo**: Computed value caching
- **Virtualization**: Considered for large data sets

## Responsive Design

### Breakpoints

- **Mobile**: 320px - 767px (2-column grid)
- **Tablet**: 768px - 1199px (3-4 column grid)
- **Desktop**: 1200px+ (4-6 column grid)

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Custom configurations
    },
  },
  plugins: [],
}
```

### Mobile-First Approach

All styling follows mobile-first principles with progressive enhancement:
- Base styles for mobile devices
- Responsive utilities for larger screens
- Touch-friendly interaction targets
- Optimized typography for each breakpoint

## Development Experience

### TypeScript Integration

- **Type Safety**: Full TypeScript coverage for all components
- **Interface Definitions**: Comprehensive type definitions for API responses
- **Generic Components**: Reusable components with proper typing
- **IDE Support**: Enhanced autocompletion and error detection

### Development Tools

- **ESLint**: Code quality and consistency checks
- **Hot Reload**: Instant feedback during development
- **Error Overlay**: Detailed error information in development
- **Component DevTools**: React DevTools integration

### Code Organization

- **Component-Based Architecture**: Logical separation of concerns
- **Custom Hooks**: Reusable stateful logic
- **Utility Functions**: Shared helper functions
- **Consistent Naming**: Clear, descriptive component and function names

## Testing Considerations

### Testing Strategy

While the current implementation focuses on core functionality, the architecture supports:

- **Unit Testing**: Component testing with React Testing Library
- **Integration Testing**: API integration testing
- **E2E Testing**: Full user journey testing
- **Visual Regression**: UI consistency testing

### Testing Setup

The project is configured to support:
- Jest for unit testing
- React Testing Library for component testing
- Cypress for end-to-end testing
- Storybook for component documentation and testing

## Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Environment Variables

Create a `.env.local` file for production environment variables:

```
NEXT_PUBLIC_API_URL=http://your-backend-url.com
```

### Deployment Options

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Static site hosting with serverless functions
- **AWS**: Amplify or EC2 deployment
- **Docker**: Containerized deployment

## Browser Support

### Supported Browsers

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Modern JavaScript Features

The application uses modern JavaScript features supported by all target browsers:
- ES6+ syntax
- Async/await
- Destructuring
- Arrow functions
- Template literals

## Troubleshooting

### Common Issues

1. **Development server won't start**:
   - Check if port 3000 is available
   - Verify Node.js version is 18+
   - Clear node_modules and reinstall dependencies

2. **API connection errors**:
   - Ensure backend is running on port 5001
   - Check CORS configuration on backend
   - Verify API endpoints are accessible

3. **Authentication issues**:
   - Clear localStorage and try logging in again
   - Check JWT token expiration
   - Verify backend authentication endpoints

4. **Charts not displaying**:
   - Check browser console for JavaScript errors
   - Verify Chart.js is properly loaded
   - Ensure chart container has proper dimensions

5. **Export functionality not working**:
   - Check if XLSX library is properly loaded
   - Verify data is available for export
   - Check browser's download permissions

### Debug Information

Enable debug information by:
- Opening browser developer tools
- Checking the Network tab for API requests
- Reviewing Console for JavaScript errors
- Examining Components tab for React state

## Contributing

### Development Workflow

1. Create feature branch from main
2. Implement changes with TypeScript
3. Test on multiple screen sizes
4. Verify accessibility features
5. Submit pull request with description

### Code Standards

- Follow TypeScript best practices
- Use semantic HTML5 elements
- Implement responsive design principles
- Include proper error handling
- Write descriptive component names

## License

This project is part of the Wisdom Index Financial Advisory AI Web App development.

---

**Version**: 2.0.0 (Next.js Migration Complete)
**Last Updated**: November 2025
**Status**: Production Ready with Modern Next.js Architecture
**Backend Compatibility**: Fully compatible with backend-beta API (port 5001)
**Key Improvements**:
- Complete migration to Next.js 16.0.1 with TypeScript 5.9.3
- Modern React component architecture with proper separation of concerns
- Enhanced type safety with comprehensive TypeScript definitions
- Improved developer experience with ESLint and modern tooling
- Responsive design maintained and optimized across all devices
- All 37+ financial metrics successfully integrated with interactive modal views
- Interactive charts and AI insights fully functional
- Metric target management and export features operational
- Click-to-open metric detail modals with smooth animations and comprehensive breakdowns
