# HW1 — Tracey: the proposal

Shubhro, Radha, Gangasagar and Arav. Software Design Practical, Assignment 1.

This is the proposal the project started from: a five-sentence abstract, a
one-page summary and a first Business Model Canvas. The typeset version is
[hw1-proposal.pdf](hw1-proposal.pdf). The prototype in this repository builds
the first small slice of it — the catalogue and the trimester grid — and leaves
the deadline computation for later; [course-map.md](course-map.md) says which
parts are in and which are out.

## Five-sentence abstract

**1. Introduction.** At Krea's School of Interwoven Arts and Sciences a
student takes a major from one of thirteen subjects and may add a second major,
a minor or a concentration on top of it, and most students make that second
decision somewhere in year one or year two, after they have seen what the
subjects are actually like.

**2. Related work.** To make it they have the timetable spreadsheet the
academic office circulates before each trimester, a credit table on each
subject's page, one mentor meeting, and whatever seniors remember, while
universities that run a student information system answer the same question with
degree-audit software such as Workday Student, Ellucian Degree Works or Stellic.

**3. Problem statement.** Every major and minor has a last trimester by
which it has to be started, because its required courses sit in a prerequisite
chain and most of them run in only one trimester a year: across the seven
timetables Krea has published, a mathematics major has to begin with MATH191 in
the third trimester of year one or the chain MATH230, MATH231, MATH332, MATH333,
MATH434 no longer fits before graduation, a biology minor has to begin in the
first trimester of year one, sociology can be picked up as late as the eighth,
and not one of those dates appears in any document the university publishes.

**4. Solution.** tracey will compute that date, out of a catalogue rebuilt
from the seven published timetables into 474 courses with their offering
trimesters, year eligibility and a prerequisite graph, joined to the requirement
sets on the thirteen programme pages, and a walk over that graph against the
offering slots that gives the earliest trimester each required course can be
taken, which turns into a plain answer: the last trimester you can still declare
this combination, and the course that breaks first if you miss it.

**5. Validation.** The dates are checkable against the record: replay two
past cohorts' registrations and see whether the students who declared after the
computed deadline are the ones who dropped the second major, overloaded a
trimester or graduated a term late, and separately show each department's
computed deadline to the mentors who already advise on it and ask where it is
wrong.

## One-page summary

**Introduction.** SIAS does not hand a student a syllabus. You take a major
from one of thirteen subjects, and you may put a second major, a minor or a
concentration on top of it. Almost nobody decides the second one on day one.
They decide it in year one or year two, after a few courses have shown them what
the subject is actually like, and after a mentor has told them the combination
is allowed. The degree runs three or four years, three trimesters to a year, so
there are nine or twelve slots to fit everything into. Alongside the subject sit
the twelve courses of the KCCS foundation core and enough electives to reach 128
credits on a three-year degree, or 176 on a four-year one. The question a
student is really asking at that moment is simple: can this still be added, from
where they are now?

**Related work.** Nothing they have answers it. Before each trimester the
academic office circulates a spreadsheet of that term's sections: code, title,
faculty, credits, which years may register, and the prerequisite written as a
sentence inside the cell. It covers one trimester. The website carries a page
per subject with the programme structure and a credit table, and the table gives
totals, never dates. Around those, students keep their own spreadsheets,
screenshot the term sheet, and ask seniors who have already done the major. The
ERP course-drop form applies the rules, but only on submission, and only for the
trimester in front of it. Universities with a student information system answer
the same question with degree-audit software, Workday Student, Ellucian Degree
Works, PeopleSoft, or a planner like Stellic, all of which read a catalogue the
registrar keeps as structured data across years.

**Problem statement.** Every major and minor has a last trimester by which
it has to be started, and nobody at Krea writes that date down. Two things
create it. Required courses sit in prerequisite chains, and most courses run in
one fixed trimester a year: of the 474 courses on the seven timetables released
so far, 181 have appeared exactly once, and of the 293 that appeared more than
once, 173 moved to a different trimester the next year. Follow one chain.
Mathematics requires MATH191, which has only ever run in T3. MATH230 needs to
come after it and runs in T1, then MATH231, then MATH332 in T1 of year three or
later, then MATH333 in T3, then MATH434 in T1 and open only to fourth years.
That is six trimesters in a fixed order with fixed slots, so a mathematics major
that does not start with MATH191 in the third trimester of year one cannot
finish. Biology is worse. BIOS201 runs in T1 only, BIOS218 needs it, BIOS221 and
BIOS226 need those and run in T3, so even the five-course biology minor has to
start in the very first trimester of a three-year degree. Sociology, by
contrast, can be picked up in the eighth. A student comparing biology and
sociology in year two is comparing one option that closed a year ago with one
that is still open, and no document tells them which is which. They find out
when a mentor says it is too late, or when final year needs an extra trimester.

**Solution.** tracey will compute the date. It starts from the catalogue
nobody maintains, which we have rebuilt by hand as the analysis behind this
proposal: seven timetables read into 474 courses with credits, offering
trimesters, eligible years and a prerequisite graph, joined to the thirteen
programme pages so every requirement resolves to a course code, in all four
programme shapes. The system has to automate that, since the value is in
surviving the next timetable rather than in one snapshot. Then it walks the
graph. For each required course, the earliest trimester it can sit in
is one past the latest of its prerequisites, pushed forward to the next
trimester the course actually runs in and the student is eligible for. The
largest of those over a requirement set is the earliest the programme can
finish, and sliding the start forward until it no longer fits gives the deadline
itself. The student will see it as a sentence: the last trimester to declare a
mathematics second major is T3, you are in T5, MATH434 is what breaks. Around
that goes the planner: a year-by-trimester grid where a course can be dragged
anywhere, every rule rechecked over the whole plan on each move, and each
problem named in words, red where the plan cannot happen and yellow
where it is merely unwise.

**Validation.** Two separate questions: are the dates right, and do they
change anything. Each date is a claim about published timetables, so a department
can be shown its own deadline and asked where it is wrong, and mathematics, which
already publishes a recommended pathway, is a direct check: that pathway should
not violate its own deadline. The retrospective test is to take two past cohorts,
find the students who declared a second major or minor late, and see whether they
are the ones who dropped it, overloaded a trimester or graduated a term behind.
If the deadline is real it should show up there without tracey existing. The
forward test is at registration: whether students who saw the date declared
earlier, and how many drop forms came back rejected. When we ask students about
any of this, the question is not whether they would use it, but when they decided
on their minor and what they were told.

### Business Model Canvas (first pass, before customer interviews)

**Key partners.** Krea academic office, which publishes the term timetable each trimester · The SIAS website: programme structures and credit tables · Faculty mentors and academic advisors · Departments that publish a recommended pathway, as mathematics does · Seniors, who can say whether a generated plan resembles a real one.

**Key activities.** Rerun the pipeline whenever a new term sheet is released · Repair the title-to-code matches and prerequisite prose the parser cannot resolve · Follow changes to credit, audit and foundation-core policy · Watch students plan during registration week.

**Key resources.** The generated catalogue: 474 courses and their prerequisite graph · Requirement sets for 13 subjects across four programme shapes · The rule set, each rule traced to a published source · A web app with a database behind it, so a plan outlives the browser it was made in · One person's time.

**Value propositions.** The last trimester you can still declare a major or minor, per subject · The whole degree on one screen, rather than one trimester at a time · A combination that has already closed is named as closed, not attempted · Nothing to type in: the catalogue comes from the university's own files · Every problem is named in words, with the rule it breaks · Double majors and minors, where the plans are tightest, work the same way · Mentor meetings can be about the subject instead of about credits.

**Customer relationships.** Self-serve: open a link and start planning, no account needed to try it · No support desk; problems come back through the batch group · Trust earned by showing where each rule came from · Data refreshed the day the new term sheet appears.

**Channels.** A public URL passed around batch groups · Mentors handing it to advisees before registration · Orientation for the incoming batch · A link from the academic office, if it earns one.

**Customer segments.** SIAS undergraduates in years 1 to 4 · First-years choosing between majors · Students on a double major, minor or concentration, who have the least slack in the plan · Final-year students checking they can still graduate on time · Faculty mentors advising several students each · The academic office, which handles the rejected forms.

**Cost structure.** Development time, most of it still ahead · Maintenance: roughly a day a trimester, when the new sheet lands · Modest hosting: one small server and one database, flat per term · The real cost is a stale rule giving confident wrong advice, so rechecking against policy is not optional.

**Revenue streams (measured as adoption).** Students holding a saved plan during registration week · Share of those plans that clear ERP validation first time · Rejected drop forms and forced rewrites avoided per trimester · Mentor minutes per advisee spent on rules rather than on advice · Longer term: the academic office adopting it as the plan of record.
