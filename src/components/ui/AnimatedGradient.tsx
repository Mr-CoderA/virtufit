'use client';

import { motion } from 'motion/react';

interface AnimatedGradientProps {
  className?: string;
  colors?: string[];
}

/**
 * Lightweight animated gradient background inspired by React Bits Aurora.
 * Uses CSS + Motion for a flowing gradient effect without WebGL.
 */
export default function AnimatedGradient({
  className = '',
  colors = ['#5227FF', '#7cff67', '#5227FF'],
}: AnimatedGradientProps) {
  const [c1, c2, c3] = colors;

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute -inset-[50%] opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${c1}, transparent),
            radial-gradient(ellipse 60% 40% at 80% 50%, ${c2}, transparent),
            radial-gradient(ellipse 60% 40% at 20% 80%, ${c3}, transparent)`,
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -inset-[30%] opacity-30"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 30% 20%, ${c2}, transparent),
            radial-gradient(ellipse 50% 50% at 70% 70%, ${c1}, transparent)`,
        }}
        animate={{
          x: ['0%', '5%', '0%'],
          y: ['0%', '-3%', '0%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
