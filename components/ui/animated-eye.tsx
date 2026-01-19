'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedEyeProps {
  isOpen: boolean;
  isBlinking: boolean;
  className?: string;
}

/**
 * Animated eye icon that blinks when toggling visibility.
 * Uses Framer Motion for smooth lid animation.
 */
export function AnimatedEye({ isOpen, isBlinking, className = '' }: AnimatedEyeProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Eye outline - always visible */}
      <motion.path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        initial={false}
        animate={{
          d: isBlinking 
            ? "M1 12s4-1 11-1 11 1 11 1-4 1-11 1-11-1-11-1z"  // Closed
            : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", // Open
        }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
      />
      
      {/* Pupil - hide when blinking */}
      <AnimatePresence>
        {!isBlinking && (
          <motion.circle
            cx="12"
            cy="12"
            r="3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
      
      {/* Slash line when password is hidden */}
      <AnimatePresence>
        {!isOpen && !isBlinking && (
          <motion.line
            x1="1"
            y1="1"
            x2="23"
            y2="23"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </svg>
  );
}
