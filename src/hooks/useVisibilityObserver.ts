'use client';

import { RefObject, useEffect, useState } from 'react';

type VisibilityObserverOptions = {
  threshold?: number | number[];
  rootMargin?: string;
  freezeOnceVisible?: boolean;
};

/**
 * Observes when a DOM node enters the viewport so work like chart animations
 * can be deferred until the user can actually see them.
 */
export function useVisibilityObserver(
  targetRef: RefObject<Element | null>,
  {
    threshold = 0.2,
    rootMargin = '0px',
    freezeOnceVisible = true,
  }: VisibilityObserverOptions = {},
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || (freezeOnceVisible && isVisible)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (freezeOnceVisible) {
            obs.disconnect();
          }
        } else if (!freezeOnceVisible) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        root: null,
        rootMargin,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, threshold, rootMargin, freezeOnceVisible, isVisible]);

  return isVisible;
}
