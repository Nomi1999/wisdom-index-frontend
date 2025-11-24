'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
}

const presetRanges = [
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last Year', days: 365 },
  { label: 'Last 2 Years', days: 730 },
  { label: 'All Time', days: null }
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

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  const [alignRight, setAlignRight] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [selectionStage, setSelectionStage] = useState<'year' | 'month' | null>(null);
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
  const [pendingYear, setPendingYear] = useState<number | null>(null);
  const displayedYears = useMemo(() => {
    const rawYears = Array.from({ length: 12 }, (_, index) => yearPanelStart + index);
    return rawYears.filter((year) => {
      if (minAvailableYear !== null && year < minAvailableYear) return false;
      if (maxAvailableYear !== null && year > maxAvailableYear) return false;
      return true;
    });
  }, [yearPanelStart, minAvailableYear, maxAvailableYear]);
  const activeYearHighlight = pendingYear ?? viewingMonth.getFullYear();
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

      const dialogElement = triggerRef.current.closest('[role=\"dialog\"]') as HTMLElement | null;
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

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePresetClick = (days: number | null) => {
    if (days === null) {
      // All time - set dates to null
      onDateChange(null, null);
      setTempStartDate(null);
      setTempEndDate(null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      onDateChange(start, end);
      setTempStartDate(start);
      setTempEndDate(end);
    }
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(date);
      setTempEndDate(null);
    } else if (tempStartDate) {
      if (date < tempStartDate) {
        // Swap dates if end is before start
        onDateChange(date, tempStartDate);
        setTempEndDate(tempStartDate);
        setTempStartDate(date);
        setIsOpen(false);
      } else {
        // End selection
        onDateChange(tempStartDate, date);
        setTempEndDate(date);
        setIsOpen(false);
      }
    }
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(viewingMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setViewingMonth(newMonth);
  };

  const openYearSelection = () => {
    if (selectionStage) {
      setSelectionStage(null);
      setPendingYear(null);
      return;
    }
    const currentYear = viewingMonth.getFullYear();
    setYearPanelStart(clampYearPanelStart(currentYear - 5));
    setPendingYear(null);
    setSelectionStage('year');
  };

  const shiftYearPanel = (direction: number) => {
    setYearPanelStart((prev) => {
      const next = clampYearPanelStart(prev + direction * 12);
      return next === prev ? prev : next;
    });
  };

  const handleYearSelect = (year: number) => {
    setPendingYear(year);
    setSelectionStage('month');
  };

  const handleMonthSelect = (monthIndex: number) => {
    if (pendingYear === null) return;
    const updatedMonth = new Date(pendingYear, monthIndex, 1);
    setViewingMonth(updatedMonth);
    setSelectionStage(null);
    setPendingYear(null);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateSelected = (date: Date) => {
    if (!tempStartDate && !tempEndDate) return false;
    if (tempStartDate && date.toDateString() === tempStartDate.toDateString()) return true;
    if (tempEndDate && date.toDateString() === tempEndDate.toDateString()) return true;
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return date >= tempStartDate && date <= tempEndDate;
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleClear = () => {
    onDateChange(null, null);
    setTempStartDate(null);
    setTempEndDate(null);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectionStage(null);
      setPendingYear(null);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Date Range
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
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          ) : (
            <span className="text-gray-500">Select date range</span>
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
                      onClick={() => handlePresetClick(preset.days)}
                      className="text-[10px] py-[3px] h-6"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="border-t pt-2">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={openYearSelection}
                    className="font-medium text-sm px-2.5 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                    title="Select month and year"
                  >
                    {viewingMonth.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Month/Year selection panels */}
                {selectionStage === 'year' && (
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
                          onClick={() => handleYearSelect(year)}
                          className={`py-1 text-sm ${
                            year === activeYearHighlight
                              ? 'border-blue-600 text-blue-600'
                              : ''
                          }`}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectionStage === 'month' && (
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Select Month {pendingYear !== null ? `(${pendingYear})` : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setSelectionStage('year')}
                      >
                        Change year
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {MONTH_LABELS.map((label, monthIndex) => (
                        <Button
                          key={label}
                          variant="outline"
                          size="sm"
                          disabled={pendingYear === null}
                          onClick={() => handleMonthSelect(monthIndex)}
                          className={`py-1 text-sm ${
                            pendingYear !== null &&
                            monthIndex === viewingMonth.getMonth() &&
                            pendingYear === viewingMonth.getFullYear()
                              ? 'border-blue-600 text-blue-600'
                              : ''
                          }`}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar Grid */}
                {!selectionStage && (
                  <div className="grid grid-cols-7 gap-[2px] text-[10px]">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-medium text-gray-500 py-1.5">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {getDaysInMonth(viewingMonth).map((date, index) => (
                      <div key={index} className="h-6 sm:h-7">
                        {date && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDateClick(date)}
                            className={`w-full h-full text-[11px] py-0 ${
                              isDateSelected(date)
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : isDateInRange(date)
                                ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                                : isDateToday(date)
                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {date.getDate()}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
