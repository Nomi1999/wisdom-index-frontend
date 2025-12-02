'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
}

const presetRanges = [
 { label: 'Last 6 Months', months: 6 },
  { label: 'Last Year', months: 12 },
  { label: 'Last 2 Years', months: 24 },
  { label: 'All Time', months: null }
];

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  minDate,
  maxDate
}) => {
 const [isOpen, setIsOpen] = useState(false);
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  const [alignRight, setAlignRight] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const minAvailableYear = minDate ? minDate.getFullYear() : null;
  const maxAvailableYear = maxDate ? maxDate.getFullYear() : null;
  const clampYearPanelStart = useCallback(
    (candidate: number) => {
      if (minAvailableYear !== null && maxAvailableYear !== null) {
        const span = maxAvailableYear - minAvailableYear + 1;
        if (span <= 12) {
          return minAvailableYear;
        }
        const minStart = minAvailableYear;
        const maxStart = maxAvailableYear - 11;
        return Math.min(Math.max(candidate, minStart), maxStart);
      }
      if (minAvailableYear !== null) {
        return Math.max(candidate, minAvailableYear);
      }
      if (maxAvailableYear !== null) {
        return Math.min(candidate, maxAvailableYear - 11);
      }
      return candidate;
    },
    [minAvailableYear, maxAvailableYear]
  );
  const [yearPanelStart, setYearPanelStart] = useState(() =>
    clampYearPanelStart(new Date().getFullYear() - 5)
  );

  const displayedYears = useMemo(() => {
    const rawYears = Array.from({ length: 12 }, (_, index) => yearPanelStart + index);
    return rawYears.filter((year) => {
      if (minAvailableYear !== null && year < minAvailableYear) return false;
      if (maxAvailableYear !== null && year > maxAvailableYear) return false;
      return true;
    });
  }, [yearPanelStart, minAvailableYear, maxAvailableYear]);

  const yearPanelEnd = yearPanelStart + 11;
  const canShiftYearBackward =
    minAvailableYear !== null ? yearPanelStart > minAvailableYear : true;
  const canShiftYearForward =
    maxAvailableYear !== null ? yearPanelEnd < maxAvailableYear : true;

 useEffect(() => {
    setYearPanelStart((prev) => clampYearPanelStart(prev));
  }, [clampYearPanelStart]);

  useEffect(() => {
    if (!isOpen) return;

    const updateDropdownMetrics = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth || rect.width;
      const viewportHeight = window.innerHeight || rect.height;
      const VIEWPORT_PADDING = 48;
      const VERTICAL_MARGIN = 12;

      const availableWidth = Math.max(viewportWidth - VIEWPORT_PADDING, 0);
      const widthCandidate = availableWidth > 0 ? Math.min(rect.width, availableWidth) : rect.width;
      setDropdownWidth(widthCandidate);

      const spaceOnRight = viewportWidth - rect.right - 16;
      const spaceOnLeft = rect.left - 16;

      if (spaceOnRight < widthCandidate && spaceOnLeft > spaceOnRight) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }

      const dialogElement = triggerRef.current.closest('[role="dialog"]') as HTMLElement | null;
      const dialogRect = dialogElement?.getBoundingClientRect();
      const boundaryTop = dialogRect ? dialogRect.top : VIEWPORT_PADDING;
      const boundaryBottom = dialogRect ? dialogRect.bottom : viewportHeight - VIEWPORT_PADDING;

      const rawSpaceBelow = Math.max(boundaryBottom - rect.bottom - VERTICAL_MARGIN, 0);
      const rawSpaceAbove = Math.max(rect.top - boundaryTop - VERTICAL_MARGIN, 0);

      let shouldOpenUp = rawSpaceBelow < 360 && rawSpaceAbove > rawSpaceBelow;
      let availableVertical = shouldOpenUp ? rawSpaceAbove : rawSpaceBelow;

      if (availableVertical < 280) {
        if (!shouldOpenUp && rawSpaceAbove > rawSpaceBelow) {
          shouldOpenUp = true;
          availableVertical = rawSpaceAbove;
        } else if (shouldOpenUp && rawSpaceBelow > rawSpaceAbove) {
          shouldOpenUp = false;
          availableVertical = rawSpaceBelow;
        } else {
          availableVertical = Math.max(rawSpaceBelow, rawSpaceAbove);
        }
      }

      setOpenUpwards(shouldOpenUp);
    };

    updateDropdownMetrics();
    window.addEventListener('resize', updateDropdownMetrics);
    window.addEventListener('orientationchange', updateDropdownMetrics);

    return () => {
      window.removeEventListener('resize', updateDropdownMetrics);
      window.removeEventListener('orientationchange', updateDropdownMetrics);
    };
  }, [isOpen]);

  const formatMonth = (date: Date | null) => {
    if (!date) return 'Select month';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const handlePresetClick = (months: number | null) => {
    if (months === null) {
      // All time - set dates to null
      onDateChange(null, null);
      setTempStartDate(null);
      setTempEndDate(null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      // Set to the end of the month for start and end dates
      start.setMonth(start.getMonth() + 1, 0); // Last day of previous month
      end.setDate(0); // Last day of current month
      onDateChange(start, end);
      setTempStartDate(start);
      setTempEndDate(end);
    }
    setIsOpen(false);
  };

  const handleMonthClick = (year: number, month: number) => {
    const selectedMonth = new Date(year, month, 1); // First day of the selected month
    const lastDayOfMonth = new Date(year, month + 1, 0); // Last day of the selected month

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection - set to the end of the selected month
      setTempStartDate(lastDayOfMonth);
      setTempEndDate(null);
    } else if (tempStartDate) {
      // Calculate the end date as the end of the selected month
      if (lastDayOfMonth < tempStartDate) {
        // Swap dates if end is before start
        onDateChange(lastDayOfMonth, tempStartDate);
        setTempEndDate(tempStartDate);
        setTempStartDate(lastDayOfMonth);
        setIsOpen(false);
      } else {
        // End selection - set to the end of the selected month
        onDateChange(tempStartDate, lastDayOfMonth);
        setTempEndDate(lastDayOfMonth);
        setIsOpen(false);
      }
    }
  };

  const navigateYear = (direction: number) => {
    setViewingYear(prev => prev + direction);
  };

  const shiftYearPanel = (direction: number) => {
    setYearPanelStart((prev) => {
      const next = clampYearPanelStart(prev + direction * 12);
      return next === prev ? prev : next;
    });
  };

  const isMonthSelected = (year: number, month: number) => {
    if (!tempStartDate && !tempEndDate) return false;
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    // Check if this month is the start or end month
    if (tempStartDate) {
      const tempStartMonth = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), 1);
      if (monthStart.getTime() === tempStartMonth.getTime()) return true;
    }
    if (tempEndDate) {
      const tempEndMonth = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), 1);
      if (monthStart.getTime() === tempEndMonth.getTime()) return true;
    }
    return false;
  };

  const isMonthInRange = (year: number, month: number) => {
    if (!tempStartDate || !tempEndDate) return false;
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return monthEnd >= tempStartDate && monthStart <= tempEndDate;
 };

  const handleClear = () => {
    onDateChange(null, null);
    setTempStartDate(null);
    setTempEndDate(null);
    setIsOpen(false);
  };

  // Get available months based on min/max dates
  const isMonthAvailable = (year: number, month: number) => {
    if (minDate) {
      const minYear = minDate.getFullYear();
      const minMonth = minDate.getMonth();
      if (year < minYear || (year === minYear && month < minMonth)) {
        return false;
      }
    }
    if (maxDate) {
      const maxYear = maxDate.getFullYear();
      const maxMonth = maxDate.getMonth();
      if (year > maxYear || (year === maxYear && month > maxMonth)) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="relative">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Month Range
        </label>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-start text-left font-normal"
          ref={triggerRef}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <span>
              {formatMonth(startDate)} - {formatMonth(endDate)}
            </span>
          ) : (
            <span className="text-gray-500">Select month range</span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${
              openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
            } bg-white/95 border rounded-xl shadow-2xl z-50 p-2.5 sm:p-2.5 backdrop-blur overflow-visible ${
              alignRight ? 'right-0 left-auto' : 'left-0 right-auto'
            }`}
            style={{
              width: dropdownWidth ? `${dropdownWidth}px` : undefined
            }}
          >
            <div
              className={`space-y-1.5 sm:space-y-2 scale-95 ${
                alignRight
                  ? openUpwards
                    ? 'origin-bottom-right'
                    : 'origin-top-right'
                  : openUpwards
                  ? 'origin-bottom-left'
                  : 'origin-top-left'
              }`}
            >
              {/* Preset Ranges */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Quick Select</div>
                <div className="grid grid-cols-2 gap-0.5">
                  {presetRanges.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetClick(preset.months)}
                      className="text-[10px] py-[3px] h-6"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Month Picker */}
              <div className="border-t pt-2">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateYear(-1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      setYearPanelStart(clampYearPanelStart(currentYear - 5));
                      setViewingYear(currentYear);
                    }}
                    className="font-medium text-sm px-2.5 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                    title="Select year"
                  >
                    {viewingYear}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateYear(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Year selection panel */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Select Year</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => shiftYearPanel(-1)}
                        disabled={!canShiftYearBackward}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => shiftYearPanel(1)}
                        disabled={!canShiftYearForward}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {displayedYears.map((year) => (
                      <Button
                        key={year}
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingYear(year)}
                        className={`py-1 text-sm ${
                          year === viewingYear
                            ? 'border-blue-600 text-blue-600'
                            : ''
                        }`}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_LABELS.map((label, monthIndex) => {
                    const isAvailable = isMonthAvailable(viewingYear, monthIndex);
                    return (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        onClick={() => isAvailable && handleMonthClick(viewingYear, monthIndex)}
                        disabled={!isAvailable}
                        className={`py-2 text-sm ${
                          isMonthSelected(viewingYear, monthIndex)
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : isMonthInRange(viewingYear, monthIndex)
                            ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                            : isAvailable
                            ? 'hover:bg-gray-100'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};