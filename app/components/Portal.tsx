"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

/**
 * Portal Component
 * 
 * Renders children at the document root level to escape stacking context issues
 * Ensures notifications and modals are always on top regardless of parent elements
 * 
 * @param children - Content to render in the portal
 * @param containerId - Optional ID for the portal container (default: "portal-root")
 */
export const Portal: React.FC<PortalProps> = ({ children, containerId = "portal-root" }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Get or create the portal container
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }

  return createPortal(children, container);
};
