"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typeahead, createStaticSource, type SearchableItem } from "@astryxdesign/core/Typeahead";

interface DomainItem extends SearchableItem {
  slug: string;
}

export function DomainJumpSearch({ domains }: { domains: { name: string; slug: string }[] }) {
  const router = useRouter();
  // A one-shot "search and navigate" control, not a persistent selection — no state
  // needed for the selected item, since it always navigates away immediately.
  const items: DomainItem[] = useMemo(() => domains.map((d) => ({ id: d.slug, label: d.name, slug: d.slug })), [domains]);
  const searchSource = useMemo(() => createStaticSource(items), [items]);

  return (
    <Typeahead<DomainItem>
      label="Jump to a domain"
      placeholder="Type a domain name…"
      searchSource={searchSource}
      value={null}
      onChange={(item) => {
        if (item) router.push(`/domains/${item.slug}`);
      }}
      hasEntriesOnFocus
      width={320}
    />
  );
}
