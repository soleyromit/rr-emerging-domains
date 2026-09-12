import { Text, type TextSize } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { stripFileCitations } from "@/lib/strip-file-citations";

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
    // The prose branch is also where a file citation lands ("../accreditation/coca.yaml
    // (Elements 6.4, 6.9)"), so it gets the same humanizing every other prose surface
    // does. The URL branch above is untouched: a real link must stay verbatim.
    <Text type="supporting" size={size}>
      {stripFileCitations(source)}
    </Text>
  );
}
