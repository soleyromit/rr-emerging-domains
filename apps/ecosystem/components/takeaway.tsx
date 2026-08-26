import { Banner } from "@astryxdesign/core/Banner";
import type { ReactNode } from "react";

export function Takeaway({
  status = "info",
  title,
  children,
}: {
  status?: "info" | "warning" | "success" | "error";
  title: string;
  children: ReactNode;
}) {
  return <Banner status={status} title={title} description={children} container="card" />;
}
