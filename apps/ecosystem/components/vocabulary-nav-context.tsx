"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface JumpTarget {
  domainSlug: string;
  termName: string;
  // Bumped on every request so re-clicking the same cell still re-triggers
  // the jump (a plain object-equality check wouldn't fire the effect twice).
  nonce: number;
}

interface VocabularyNavValue {
  jumpTarget: JumpTarget | null;
  requestJump: (domainSlug: string, termName: string) => void;
  consumeJump: () => void;
}

const VocabularyNavContext = createContext<VocabularyNavValue | null>(null);

// Bridges RosettaCards (a Rosetta cell click) to GlossaryTabs (switch tab +
// open + scroll to that term) even though they're rendered as siblings from
// a server component (app/synthesis/vocabulary/page.tsx) with no shared
// client-side parent state otherwise.
export function VocabularyNavProvider({ children }: { children: ReactNode }) {
  const [jumpTarget, setJumpTarget] = useState<JumpTarget | null>(null);
  const requestJump = useCallback((domainSlug: string, termName: string) => {
    setJumpTarget((prev) => ({ domainSlug, termName, nonce: (prev?.nonce ?? 0) + 1 }));
  }, []);
  const consumeJump = useCallback(() => setJumpTarget(null), []);

  return (
    <VocabularyNavContext.Provider value={{ jumpTarget, requestJump, consumeJump }}>
      {children}
    </VocabularyNavContext.Provider>
  );
}

export function useVocabularyNav(): VocabularyNavValue {
  const ctx = useContext(VocabularyNavContext);
  if (!ctx) {
    throw new Error("useVocabularyNav must be used within a VocabularyNavProvider");
  }
  return ctx;
}
