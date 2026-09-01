import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Token, type TokenColor } from "@astryxdesign/core/Token";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { DisciplineChip } from "@/components/discipline-chip";
import { SlotIcon, WishlistIcon, AssistIcon, PlacementIcon } from "@/components/concept-icons";

type PillVariant = "neutral" | "success" | "warning" | "error";

const TOKEN_COLOR: Record<PillVariant, TokenColor> = {
  neutral: "gray",
  success: "green",
  warning: "orange",
  error: "red",
};

interface TermCell {
  label: string;
  variant: PillVariant;
  detail: string;
}

interface Discipline {
  key: string;
  chip: string | null;
  name: string;
  sub?: string;
  slot: TermCell;
  wishlist: TermCell;
  assist: TermCell;
  placement: TermCell;
}

const DISCIPLINES: Discipline[] = [
  {
    key: "do",
    chip: "DO",
    name: "DO — Osteopathic Medicine",
    sub: "22-ish four-week blocks, 22-month OMS-3/4 sequence, distributive independent-site network",
    slot: { label: "Rolling-avg unconfirmed", variant: "warning", detail: "COCA Standard 6, Element 6.9 wants a rolling-average of students-per-rotation-type against each site's stated capacity. The closest shipped report is a weekly offered-vs-filled Slot count — not a rolling adequacy calculation." },
    wishlist: { label: "3 modes — MD competition", variant: "neutral", detail: "Same baseline ranking modes, but since the 2020 AOA–ACGME merger, DO students compete directly with MD students for the same community away-rotation slots — a scarcity dynamic outside Prism's own model." },
    assist: { label: "Ticket required", variant: "warning", detail: "Same as every non-PT/OT discipline — full self-service is PT/OT-only; DO is one of the four target domains this scoping gap applies to." },
    placement: { label: "Not confirmed", variant: "neutral", detail: "Not independently documented against the Course = timeframe vs. Course = setting question — don't assume either shape without checking." },
  },
  {
    key: "pharmacy",
    chip: "RPh",
    name: "Pharmacy",
    sub: "Two structurally different allocations in one program: IPPE and APPE",
    slot: { label: "Ratio-check gap", variant: "error", detail: "ACPE Standard 3.3.e requires a real-time check that BLOCKS an assignment breaching 2 students per precepting pharmacist. Max Placement Limit checks a different entity (Location + Setting + Cohort headcount), only warns, and is PA-exclusive on lockstep clients — Pharmacy has no access to it at all." },
    wishlist: { label: "3 modes — two allocation shapes", variant: "neutral", detail: "IPPE placements are short, recurring, and run *concurrently* with didactic coursework across the first two professional years. APPE is a block allocation of six to seven 4–6 week full-time rotations filling an entire coursework-free capstone year, constrained by four mandatory setting categories plus the 2:1 ratio cap." },
    assist: { label: "Ticket required", variant: "warning", detail: "Same as every non-PT/OT discipline — full self-service is PT/OT-only." },
    placement: { label: "Not confirmed", variant: "neutral", detail: "Not independently documented against the Course = timeframe vs. Course = setting question — don't assume either shape without checking." },
  },
  {
    key: "dentistry",
    chip: "DDS",
    name: "Dentistry",
    sub: "The outlier — no cohort-wide block allocation exists to solve",
    slot: { label: "No cohort Slot model", variant: "error", detail: "There's no cohort-wide block allocation to solve — students hold a longitudinal patient panel in the school's own clinic. What needs scheduling is chair/operatory time and patient appointments, not a Slot batch." },
    wishlist: { label: "N/A — chair model", variant: "error", detail: "No ranked Wishlist applies — the panel/chair model has no admin-built Slot list to rank against." },
    assist: { label: "Doesn't map", variant: "error", detail: "axiUm owns the chair-scheduling model Dentistry actually runs on. Prism's placement engine doesn't map onto it — occasional specialty and extramural rotations layer on top, but the core unit is chair time, not a Placement Assist run." },
    placement: { label: "Chair, not Slot", variant: "error", detail: "The assignment of record here is a chair/operatory booking plus a patient appointment, not a student–site–preceptor Placement — the vocabulary on this whole page assumes a rotation model Dentistry doesn't run on." },
  },
  {
    key: "medicine",
    chip: "MD",
    name: "Medicine (MD)",
    sub: "Core clerkships own the Slot path; away rotations don't",
    slot: { label: "Standard", variant: "neutral", detail: "Same base Slot record as baseline — core clerkships (~4–12 weeks, ~48 weeks total in year 3) at affiliated teaching hospitals run through the normal Slot/Assist path." },
    wishlist: { label: "3 modes", variant: "neutral", detail: "Same baseline ranking modes as every non-PT/OT discipline." },
    assist: { label: "Ticket required", variant: "warning", detail: "Same as every non-PT/OT discipline — full self-service is PT/OT-only." },
    placement: { label: "Doesn't own away rotations", variant: "warning", detail: "Year 4 sub-internships plus VSLO-coordinated away/audition rotations are scheduled OUTSIDE the home institution entirely — 54.9% of students report declining at least one for cost — an allocation Prism wouldn't own but must still record." },
  },
  {
    key: "baseline",
    chip: null,
    name: "Baseline",
    sub: "SLP, and any discipline with no documented override below",
    slot: { label: "Standard", variant: "neutral", detail: 'One field: "Number of Offers" — a manually entered static integer per batch. No rolling 3-year average exists anywhere in the system.' },
    wishlist: { label: "3 modes", variant: "neutral", detail: "Settings-based (electives), Slot-based (core), or Location-based ranking — which one a program uses is process-dependent." },
    assist: { label: "Ticket required", variant: "warning", detail: 'The matching engine exists, but full self-service is off by default — Exxat\'s own docs flag it as having "limited functionality" until a support ticket enables it.' },
    placement: { label: "Not confirmed", variant: "neutral", detail: "Not independently documented against the Course = timeframe vs. Course = setting question — don't assume either shape without checking." },
  },
  {
    key: "pt_ot",
    chip: "PT",
    name: "PT/PTA & OT/OTA",
    slot: { label: "Standard", variant: "neutral", detail: "Same base Slot record as the baseline — PT/OT's real divergence is in Wishlist and Placement Assist, not the Slot record itself." },
    wishlist: { label: "4 modes — exclusive", variant: "success", detail: "The same 3 baseline modes, plus an exclusive 4th: Exxat One Availability-Based — students rank live external site availabilities before any placement request is even sent." },
    assist: { label: "Full self-service", variant: "success", detail: "The only disciplines with full self-service access to Placement Assist — every other discipline files a support ticket for the same engine." },
    placement: { label: "Course = timeframe", variant: "neutral", detail: "A Course represents a timeframe; each individual rotation is modeled as its own Course." },
  },
  {
    key: "pa",
    chip: "PA",
    name: "Physician Assistant",
    slot: { label: "+ Capacity cap", variant: "warning", detail: "Adds Max Placement Limit: a soft warning scoped to Location + Setting + Cohort, off unless enabled in Slot Request Configuration, and lockstep-only — it can cap a site but never one individual preceptor." },
    wishlist: { label: "3 modes", variant: "neutral", detail: "Same baseline ranking modes. PA's real Wishlist-adjacent divergence is downstream: site slot-request responses auto-populate SCPE Details reporting rather than an admin re-keying estimates." },
    assist: { label: "Ticket required", variant: "warning", detail: "Same as baseline — full self-service is PT/OT-only." },
    placement: { label: "Course = setting", variant: "error", detail: "The opposite model from PT/OT/Nursing: a Course represents the clinical setting itself, and a Rotation is the wrapping period — when a rotation spans multiple courses, an admin must specify which Course a student is completing when placing them in a Slot." },
  },
  {
    key: "nursing",
    chip: "RN",
    name: "Nursing",
    slot: { label: "+ Sufficiency report", variant: "warning", detail: "Adds a Slot Sufficiency Report: Total Slots Offered / Total Placements / Completed Placements by site. Offered-vs-placed exposes over-solicitation; placed-vs-completed exposes attrition." },
    wishlist: { label: "3 modes", variant: "neutral", detail: "Same baseline ranking modes as every non-PT/OT discipline." },
    assist: { label: "Ticket required", variant: "warning", detail: "Same as baseline — full self-service is PT/OT-only." },
    placement: { label: "Course = timeframe", variant: "neutral", detail: "Same model as PT/OT: a Course is a timeframe, each rotation its own Course." },
  },
  {
    key: "crna",
    chip: "CRNA",
    name: "Nurse Anesthesia",
    slot: { label: "Ratio mismatch", variant: "error", detail: "The Slot record carries a batch-level Supervision Type select. COA Standard F.7 asks a shift-level question — never more than 2 students per CRNA at any moment — that a batch-level field cannot answer." },
    wishlist: { label: "3 modes", variant: "neutral", detail: "Same baseline ranking modes as every non-PT/OT discipline." },
    assist: { label: "Ticket required", variant: "warning", detail: "Same as baseline — full self-service is PT/OT-only." },
    placement: { label: "Not confirmed", variant: "neutral", detail: "Not independently documented against this specific data-model question." },
  },
  {
    key: "ot_capstone",
    chip: "OT",
    name: "OT Capstone",
    sub: "the capstone phase specifically, not OT/OTA generally",
    slot: { label: "Standard", variant: "neutral", detail: "Same base Slot record as OT/OTA — the capstone's divergence is in how the agreement gets executed, not in Slot capacity." },
    wishlist: { label: "MyRequest → custom form", variant: "warning", detail: "Runs the usual student-proposes pattern through a MyRequest wishlist, then executes the ACOTE D.1.5 agreement as a separate multi-party custom form (Student > Site Mentor > Faculty > Admin) — a second agreement mechanism living entirely outside the normal Contract object." },
    assist: { label: "Bypassed", variant: "error", detail: "The capstone's custom multi-party form replaces ranked Assist matching entirely — there's no batch solver run for this agreement type." },
    placement: { label: "Course = timeframe", variant: "neutral", detail: "Inherits OT/OTA's standard model — the capstone's divergence is in the agreement mechanism, not the Course/Rotation shape." },
  },
  {
    key: "social_work",
    chip: "SW",
    name: "Social Work",
    slot: { label: "No Slot exists", variant: "error", detail: "Sourcing is inverted before a Slot concept even applies — an agency is proposed by a student, not offered as capacity by an admin." },
    wishlist: { label: "Inverted — no ranking", variant: "error", detail: "Agencies are proposed BY students (up to 10 per student, each its own interview) — there's no admin-built list to rank at all." },
    assist: { label: "Bypassed", variant: "error", detail: "With no Slot and no ranked Wishlist, there's nothing for a batch solver to match — the agency relationship is negotiated directly." },
    placement: { label: "Not confirmed", variant: "neutral", detail: "Not independently documented against this specific data-model question." },
  },
  {
    key: "teacher_ed",
    chip: "TE",
    name: "Teacher Education",
    slot: { label: "Not confirmed", variant: "neutral", detail: "Terminology and placement workflow are explicitly flagged as not yet confirmed for this system." },
    wishlist: { label: "Not confirmed", variant: "neutral", detail: "Terminology and placement workflow are explicitly flagged as not yet confirmed for this system." },
    assist: { label: "Not confirmed", variant: "neutral", detail: "Terminology and placement workflow are explicitly flagged as not yet confirmed for this system." },
    placement: { label: "Not confirmed", variant: "neutral", detail: "Terminology and placement workflow are explicitly flagged as not yet confirmed for this system." },
  },
];

const ROWS: { key: "slot" | "wishlist" | "assist" | "placement"; label: string; icon: (s: { size?: number }) => React.ReactElement }[] = [
  { key: "slot", label: "Slot", icon: SlotIcon },
  { key: "wishlist", label: "Wishlist", icon: WishlistIcon },
  { key: "assist", label: "Placement Assist", icon: AssistIcon },
  { key: "placement", label: "Placement", icon: PlacementIcon },
];

// One illustrated card per discipline, built entirely on real DS primitives:
// CollapsibleGroup (type="single") gives the accordion its exclusive-open
// behavior, native chevron, and — because Collapsible's trigger renders at
// --text-large-size (17px) by default — genuinely readable trigger text for
// free. Token carries the icon + status color + label together instead of a
// hand-rolled pill; Badge was rejected because it has no size override (it's
// hard-capped at 12px), so Token's own `style` override is used to push its
// text to reading size instead.
function DisciplineCard({ discipline }: { discipline: Discipline }) {
  const cells: Record<string, TermCell> = {
    slot: discipline.slot,
    wishlist: discipline.wishlist,
    assist: discipline.assist,
    placement: discipline.placement,
  };

  return (
    <Card variant={discipline.key === "baseline" ? "transparent" : "default"} padding={4}>
      <Stack gap={3}>
        <Stack gap={1}>
          <Stack direction="horizontal" gap={2} vAlign="center">
            {discipline.chip ? <DisciplineChip subject={discipline.chip} /> : null}
            <Text type="body" weight="semibold" size="lg">
              {discipline.name}
            </Text>
          </Stack>
          {discipline.sub ? (
            <Text type="supporting" size="xsm" color="secondary">
              {discipline.sub}
            </Text>
          ) : null}
        </Stack>

        <CollapsibleGroup type="single" density="compact" hasDividers>
          {ROWS.map((row) => {
            const cell = cells[row.key];
            return (
              <Collapsible
                key={row.key}
                value={row.key}
                defaultIsOpen={false}
                trigger={
                  <Stack direction="horizontal" gap={2} vAlign="center" width="100%">
                    <row.icon size={18} />
                    <Text type="supporting" size="sm" style={{ minWidth: 84 }}>
                      {row.label}
                    </Text>
                    <Token
                      label={cell.label}
                      color={TOKEN_COLOR[cell.variant]}
                      size="lg"
                      style={{ fontSize: "15px", fontWeight: 600 }}
                    />
                  </Stack>
                }
              >
                <Text type="supporting" size="sm">
                  {cell.detail}
                </Text>
              </Collapsible>
            );
          })}
        </CollapsibleGroup>
      </Stack>
    </Card>
  );
}

export function DisciplineProfileCards() {
  return (
    <Grid columns={{ minWidth: 320 }} gap={3}>
      {DISCIPLINES.map((d) => (
        <DisciplineCard key={d.key} discipline={d} />
      ))}
    </Grid>
  );
}
