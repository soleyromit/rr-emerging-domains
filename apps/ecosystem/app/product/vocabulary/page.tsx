import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { PageHeader } from "@/components/page-header";
import { Takeaway } from "@/components/takeaway";
import { PlacementPipeline } from "@/components/placement-pipeline";
import { TermFlashcards } from "@/components/term-flashcards";
import { DisciplineProfileCards } from "@/components/discipline-profile-cards";
import { WishlistModes } from "@/components/wishlist-modes";
import { CourseModelSplit } from "@/components/course-model-split";

// The "Vocabulary" tab of /product. Its sibling tab, Capability map, is
// ../page.tsx; the tab list lives in ../layout.tsx.
export default function ProductVocabularyPage() {
  return (
    <Stack gap={0}>
      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={5}>
          {/* No eyebrow — the breadcrumb in app/product/layout.tsx states the trail
              above the tabs for every tab, this one included. */}
          <PageHeader
            title="Placement, Slot, Wishlist — one system, twelve shapes"
            description={
              <>
                &ldquo;Placement,&rdquo; &ldquo;Slot,&rdquo; and &ldquo;Wishlist&rdquo; aren&rsquo;t accreditation
                jargon — they&rsquo;re Prism&rsquo;s own product vocabulary for how a student gets matched to a
                clinical site. DO, Pharmacy, Dentistry, and Medicine — the four target domains — each get their own
                card below; the rest are Exxat&rsquo;s existing served disciplines, for comparison. For accreditor
                terms — COM, EPA, USMLE, and the rest — see{" "}
                <Link href="/standards/glossary" hasUnderline>
                  the Glossary tab
                </Link>{" "}
                under Standards &amp; glossary.
              </>
            }
          />
          <Takeaway title="Dentistry doesn't just use these terms differently — it doesn't run on this model at all.">
            Start with the pipeline, then the five plain-English terms, then open DO, Pharmacy, Dentistry, and
            Medicine below — the four domains this whole app is about — before comparing them to how PT/OT or PA
            already use the same system.
          </Takeaway>
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>How a Placement gets made</Heading>
            <Text type="supporting">One lifecycle, six checkpoints — read left to right.</Text>
          </Stack>
          <PlacementPipeline />
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>Five terms, plainly defined</Heading>
            <Text type="supporting">What each word actually points to inside Prism, before any discipline nuance.</Text>
          </Stack>
          <TermFlashcards />
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>Same term, different machine</Heading>
            <Text type="supporting">
              One card per discipline — DO, Pharmacy, Dentistry, and Medicine first, then Baseline (the shared shape
              every other non-called-out discipline uses), then Exxat&rsquo;s existing served disciplines for
              comparison. Pill color is the fast read: green = ahead, amber = distinct, red = gap or inverted, gray =
              same as baseline. Click any row for the source detail.
            </Text>
          </Stack>
          <DisciplineProfileCards />
        </Stack>
      </Section>

      <Section padding={6} dividers={["bottom"]}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>The three baseline Wishlist modes, plus one exclusive</Heading>
            <Text type="supporting">What "3 modes" and "4 modes — exclusive" in the cards above actually mean.</Text>
          </Stack>
          <WishlistModes />
        </Stack>
      </Section>

      <Section padding={6}>
        <Stack gap={3}>
          <Stack gap={1}>
            <Heading level={2}>The split hiding under &ldquo;Course&rdquo;</Heading>
            <Text type="supporting">Not a labeling difference — it changes what a Slot is even attached to.</Text>
          </Stack>
          <CourseModelSplit />
        </Stack>
      </Section>

      <Section padding={6}>
        <Text type="supporting" size="xsm" color="secondary">
          Sourced from Prism&rsquo;s own capability map and the placement-allocation stage of the rotation-lifecycle
          research. Cells marked
          &ldquo;Not confirmed&rdquo; are honest gaps, not a claim to make on a call.
        </Text>
      </Section>
    </Stack>
  );
}
