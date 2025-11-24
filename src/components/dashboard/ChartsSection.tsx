'use client';

import React from 'react';
import { IncomeBarChart } from './IncomeBarChart';
import { ExpensePieChart } from './ExpensePieChart';

interface ChartsSectionProps {
  authToken: string | null;
  onChartDataUpdate: (chartType: 'income' | 'expense', data: any[]) => void;
  isInitialLoad: boolean;
  initialIncomeData?: any[] | null;
  initialExpenseData?: any[] | null;
  prefetchComplete: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  authToken,
  onChartDataUpdate,
  isInitialLoad,
  initialIncomeData,
  initialExpenseData,
  prefetchComplete
}) => {
  return (
    <section className={`h-full flex flex-col gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-1.5 overflow-hidden ${isInitialLoad ? '' : ''}`} aria-labelledby="charts-title">
      <div className={`flex flex-col gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-1.5 flex-1 min-h-0 overflow-hidden ${isInitialLoad ? '' : ''}`}>
        {/* Income Bar Chart Component */}
        <IncomeBarChart
          authToken={authToken}
          onChartDataUpdate={(data) => onChartDataUpdate('income', data)}
          isInitialLoad={isInitialLoad}
          initialData={initialIncomeData || undefined}
          prefetchComplete={prefetchComplete}
        />

        {/* Expense Pie Chart Component */}
        <ExpensePieChart
          authToken={authToken}
          onChartDataUpdate={(data) => onChartDataUpdate('expense', data)}
          isInitialLoad={isInitialLoad}
          initialData={initialExpenseData || undefined}
          prefetchComplete={prefetchComplete}
        />
      </div>
    </section>
  );
};
