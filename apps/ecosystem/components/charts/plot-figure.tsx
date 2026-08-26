"use client";

import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

export function PlotFigure({
  options,
  className,
}: {
  options: (width: number) => Plot.PlotOptions;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let plot: (HTMLElement | SVGSVGElement) & { remove?: () => void };

    const render = () => {
      const width = container.clientWidth || 640;
      if (plot) plot.remove?.();
      plot = Plot.plot(options(width)) as any;
      container.replaceChildren(plot);
    };

    render();
    const ro = new ResizeObserver(() => render());
    ro.observe(container);
    return () => {
      ro.disconnect();
      plot?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
}
