import { Text, type TextSize } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";

// `source` fields in this content are sometimes a real URL, sometimes a prose
// note ("unable to verify — searched g2.com..."). Detect which and render the
// right thing instead of forcing every source into a link.
export function SourceLine({ source, size = "xsm" }: { source?: string; size?: TextSize }) {
  if (!source) return null;
  const isUrl = source.trim().startsWith("http");
  return isUrl ? (
    <Link href={source} isExternalLink size={size}>
      View source
    </Link>
  ) : (
    <Text type="supporting" size={size}>
      {source}
    </Text>
  );
}
