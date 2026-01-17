'use client';

import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// ============================================
// Animation Variants - Reusable across the app
// ============================================

const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeSlideVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

// ============================================
// Transition Presets
// ============================================

const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' },
  normal: { duration: 0.25, ease: 'easeOut' },
  slow: { duration: 0.4, ease: 'easeInOut' },
} as const;

type TransitionSpeed = keyof typeof transitions;

// ============================================
// PageTransition Component
// ============================================

interface PageTransitionProps {
  children: ReactNode;
  loading: boolean;
  skeleton: ReactNode;
  /** Animation variant: 'fade' (opacity only) or 'fadeSlide' (opacity + vertical movement) */
  variant?: 'fade' | 'fadeSlide';
  /** Transition speed preset */
  speed?: TransitionSpeed;
  /** Custom transition (overrides speed preset) */
  transition?: Transition;
}

/**
 * Wrapper component that handles smooth transitions between loading skeleton and content.
 * Uses Framer Motion's AnimatePresence for crossfade effect.
 * 
 * @example
 * <PageTransition loading={loading} skeleton={<Skeleton />}>
 *   <Content />
 * </PageTransition>
 * 
 * @example With custom options
 * <PageTransition 
 *   loading={loading} 
 *   skeleton={<Skeleton />}
 *   variant="fadeSlide"
 *   speed="slow"
 * >
 *   <Content />
 * </PageTransition>
 */
export function PageTransition({
  children,
  loading,
  skeleton,
  variant = 'fade',
  speed = 'normal',
  transition,
}: PageTransitionProps) {
  const variants = variant === 'fadeSlide' ? fadeSlideVariants : fadeVariants;
  const resolvedTransition = transition ?? transitions[speed];

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="skeleton"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={resolvedTransition}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={resolvedTransition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export variants for reuse in other components
export { fadeVariants, fadeSlideVariants, transitions };
