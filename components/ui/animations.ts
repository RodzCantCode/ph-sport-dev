'use client';

import type { Transition } from 'framer-motion';

// ============================================
// Transitions (duraciones + easings combinados)
// ============================================

export const TRANSITIONS = {
  /** Para contenido que carga/descarga rápidamente (0.15s) */
  fade: { duration: 0.15, ease: [0.4, 0, 0.6, 1] } as Transition,
  
  /** Para diálogos, modales y overlays (0.25s) */
  modal: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  /** Para cambios de layout y redimensionado (0.4s) */
  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  /** Para redimensionado de contenedores (spring suave) */
  layoutSpring: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
} as const;

// ============================================
// Animations (movimientos: initial → animate → exit)
// ============================================

export const animations = {
  /** Solo opacidad */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  /** Opacidad + movimiento vertical sutil (contenido que aparece) */
  fadeSlide: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  },
  
  /** Opacidad + escala (modales/dialogs) */
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  
  /** Movimiento horizontal (tabs/cambio de opciones) */
  slideHorizontal: {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  },
} as const;
