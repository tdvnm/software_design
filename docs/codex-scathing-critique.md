# A scathing critique of Tracey

Written by Codex on 9 October 2026 after inspecting the local repository, including the proposals, implementation, current sequence documentation and tests.

Tracey has a compelling problem statement, a respectable working prototype, and an uncomfortable gulf between them. The proposal promises to tell a student the last trimester in which a major or minor remains possible. The implementation lets that student arrange course cards and read advisory warnings. That is useful work, but the project's defining intellectual contribution is still on the drawing board. The most impressive feature currently exists as prose.

The README and course map openly acknowledge this reduced scope, which deserves credit. It also means the omission cannot be dismissed as a reviewer misunderstanding the product. Deadline calculation, complete degree validation, live ingestion and identity are explicitly future work. If this submission is assessed as a small prototype, that is defensible. If it is assessed as delivery of the proposed solution, it falls conspicuously short.

## The proposed algorithm needs more scrutiny than its confident presentation suggests

The HW2 design treats earliest completion as a prerequisite traversal followed by a search for an eligible offering. Yet the claim that the slide loop takes at most three iterations ignores year eligibility. A course available only in year four may require skipping years; a course with no remaining eligible slot can make the unbounded loop run forever. The pseudocode needs an explicit horizon and an infeasible result.

It also numbers slots from zero while comparing completion against a horizon stated as nine or twelve trimesters. A nine-trimester degree has final index eight. Without a precise convention, the proposed deadline calculation risks accepting a course after graduation.

More fundamentally, independently finding early dates for required courses does not establish that they fit together under trimester credit limits. Choosing the third earliest course from a five-course pool does not resolve shared requirements, competing loads or all prerequisite alternatives. The design describes a useful starting computation with the confidence of a complete feasibility engine. That confidence needs to be earned through counterexamples and validation.

## Even the modest placement helper breaks its own promise

In `src/plan.js`, `suggestTerm` says it finds room under the 20-credit limit. Its actual condition checks whether the existing load is below 20 and never adds the incoming course's credits. I reproduced a 19-credit trimester receiving a four-credit course: the helper suggested it despite the resulting 23-credit load.

The helper also ignores prerequisite completion and falls back to an earlier slot when no eligible offering fits. Advisory warnings make these choices visible afterward, but an automatic suggestion should not manufacture an avoidable problem. The foundation starter is another heuristic: it balances course counts rather than credits and contains a title-based special case for the environment course. These are understandable shortcuts, but they are not a general scheduling solution.

## The architecture is split between the system described and the system delivered

The design proposes PostgreSQL, a compiled TypeScript frontend, university sign-in, server sessions and shared plans. The implementation uses SQLite, plain JavaScript, a standard-library Python HTTP server and browser storage. Those choices are perfectly reasonable for a course prototype. The issue is that the submission requires the reader to keep translating between an ambitious future architecture and a much smaller present one.

The server's plan API is implemented and tested, but the interface never calls it. Meanwhile, course metadata and programme requirements live in JavaScript snapshots alongside the database catalogue. That creates separate update paths for facts which ought to remain consistent. There is no implemented ingestion and review pipeline here that proves the next timetable can be incorporated reliably.

The proposed authentication explanation also contains a serious conceptual slip: a university-domain login does not handle authorisation “for free.” It establishes an identity or affiliation; ownership checks still determine who can access a plan. The later ownership rule partly corrects this, but the earlier claim should not survive a careful design review. The current plan routes themselves have no identity or ownership checks. Localhost binding limits their intended exposure; they are not ready to become a shared student service.

## Passing tests do not answer the project's hardest question

I ran `npm test`: all 13 frontend tests and 10 Python tests passed. They provide real evidence for parsing, storage, plan operations and API/database behaviour. They do not validate declaration deadlines, and they missed the placement-cap bug above. The frontend suite exercises functions rather than a real browser, so it does not establish that drag interactions, focus restoration and responsive layouts work correctly in use.

The proposal's mentor checks, cohort replay and registration outcomes remain proposed validation, not demonstrated results in the materials reviewed. No amount of green unit-test output can substitute for checking whether academic advice is right.

Tracey's strengths are real: clear module boundaries, parameterised SQL, transactional import, defensive plan restoration and honest documentation. They make the missing centre more frustrating, not less. This is a competent foundation for a planner. To fulfil its own ambition, it needs to implement and validate the deadline computation, define infeasibility precisely, maintain the academic data coherently, and make automatic placement respect the constraints it claims to consider. Until then, the project offers a polished way to organise uncertainty rather than the promised answer to it.
