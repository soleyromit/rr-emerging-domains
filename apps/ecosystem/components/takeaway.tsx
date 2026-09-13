import { Banner } from "@astryxdesign/core/Banner";
import type { ReactNode } from "react";

export function Takeaway({
  status = "info",
  title,
  children,
}: {
  status?: "info" | "warning" | "success" | "error";
  title: string;
  /**
   * Optional: a takeaway whose title IS the whole statement — ComparisonMatrix's
   * FACT slot, where the claim is one sentence and the prose that used to follow
   * it now lives in the IMPACT slot below. Banner already handles a missing
   * description — it gates the description row on its own `isRenderable` check —
   * so this renders as a single-line banner rather than one with an empty body.
   * (Banner's separate title-only VERTICAL CENTERING is not what does that: it is
   * gated on `hasActions`, i.e. `endContent` or `isDismissable`, neither of which
   * Takeaway ever passes, so that branch never runs on this path.)
   */
  children?: ReactNode;
}) {
  return <Banner status={status} title={title} description={children} container="card" />;
}
