"use client";

import * as React from "react";
import Image from "next/image";
import { ApplynLogo, type ApplynLogoProps } from "./ApplynLogo";

/**
 * Path in the app for the custom logo (file must be in frontend/public/).
 * Place your logo file at: frontend/public/logo.png (or logo.svg, logo.webp)
 * and name it to match CUSTOM_LOGO_FILENAME (default: logo.png).
 */
const CUSTOM_LOGO_FILENAME =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOGO_FILENAME) || "logo.png";
const CUSTOM_LOGO_PATH = `/${CUSTOM_LOGO_FILENAME}`;

export interface ApplynLogoOrCustomProps extends ApplynLogoProps {
  /** Alt text when using custom image */
  alt?: string;
}

/**
 * Shows custom logo from public folder if present (/logo.png), otherwise the Applyn CRM SVG logo.
 * To use your own logo: put your image in frontend/public/logo.png (or set NEXT_PUBLIC_LOGO_FILENAME).
 */
export function ApplynLogoOrCustom({ alt = "Applyn CRM", ...props }: ApplynLogoOrCustomProps) {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return <ApplynLogo {...props} showText={false} />;
  }

  const size = props.size ?? 40;
  return (
    <div
      className="flex items-center justify-center shrink-0 flex-none"
      style={{ width: size, height: size }}
    >
      <Image
        src={CUSTOM_LOGO_PATH}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setUseFallback(true)}
        unoptimized
      />
    </div>
  );
}
