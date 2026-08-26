"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Typeahead, createStaticSource, type SearchableItem } from "@astryxdesign/core/Typeahead";

interface DomainItem extends SearchableItem {
  slug: string;
}

export function DomainJumpSearch({ domains }: { domains: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [value, setValue] = useState<DomainItem | null>(null);
  const items: DomainItem[] = domains.map((d) => ({ id: d.slug, label: d.name, slug: d.slug }));
  const searchSource = createStaticSource(items);

  return (
    <Typeahead<DomainItem>
      label="Jump to a domain"
      placeholder="Type a domain name…"
      searchSource={searchSource}
      value={value}
      onChange={(item) => {
        if (item) router.push(`/domains/${item.slug}`);
        setValue(null);
      }}
      hasEntriesOnFocus
      width={320}
    />
  );
}
