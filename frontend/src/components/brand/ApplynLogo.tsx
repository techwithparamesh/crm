"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ApplynLogoProps {
  /** Width of the logo mark (square + arrow) in pixels */
  size?: number;
  /** Show "Applyn CRM" text next to the mark */
  showText?: boolean;
  /** Text size: sm = compact (sidebar), md = default, lg = login/hero */
  textSize?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Applyn CRM logo: gradient square with upward arrow + optional "Applyn CRM" text.
 * "Applyn" in dark, "CRM" in purple gradient.
 */
export function ApplynLogo({ size = 32, showText = true, textSize = "md", className }: ApplynLogoProps) {
  const textClass =
    textSize === "sm"
      ? "text-sm font-semibold"
      : textSize === "lg"
        ? "text-xl font-bold"
        : "text-base font-semibold";

  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="applyn-square" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="applyn-arrow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        {/* Rounded square base */}
        <rect width="22" height="22" x="5" y="5" rx="5" fill="url(#applyn-square)" />
        {/* Upward arrow from square */}
        <path
          d="M16 8l-5 6h3v6h4v-6h3L16 8z"
          fill="url(#applyn-arrow)"
        />
      </svg>
      {showText && (
        <span className={cn(textClass, "flex items-baseline gap-0.5")}>
          <span className="text-foreground">Applyn</span>
          <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent font-semibold">
            CRM
          </span>
        </span>
      )}
    </div>
  );
}
