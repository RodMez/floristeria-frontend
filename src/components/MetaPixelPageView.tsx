"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackMetaEvent } from "@/lib/meta-pixel";

/**
 * Dispara `PageView` en navegaciones cliente (SPA) del App Router.
 * El snippet base del layout ya cubre la carga inicial, por eso se omite
 * el primer render y solo se trackean los cambios de ruta posteriores.
 */
export default function MetaPixelPageView() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      trackMetaEvent("PageView");
    }
  }, [pathname]);

  return null;
}
