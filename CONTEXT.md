# Flight Checklists

A personal Microsoft Flight Simulator procedure companion organized around aircraft-specific checklist flows. It exists to make each simulator flight easier to prepare, fly, and finish without turning the experience into a full route-planning system.

## Language

**Aircraft Checklist Hub**:
The primary product shape: checklists are organized by aircraft and flight phase. Route planning and performance resources support the checklist flow but do not define it.
_Avoid_: Flight-planning companion, route planner

**Aircraft Profile**:
An aircraft-specific checklist flow for one simulator aircraft or add-on. The first aircraft profile targets the iniBuilds A320neo rather than a generic A320neo.
_Avoid_: Generic aircraft template, aircraft family checklist

**Flight Phase**:
A distinct stage of a simulator flight, such as taxi, takeoff, cruise, approach, or landing. Each checklist belongs to one flight phase.
_Avoid_: Stage, step group

**Checklist Flow**:
The ordered sequence of flight phases for one aircraft. It gives the pilot a phase-by-phase path from aircraft preparation through arrival and shutdown.
_Avoid_: Procedure tree, route flow

**Planning Link**:
An outbound external resource that helps prepare or validate a simulator flight, such as route planning, performance calculation, or real-flight lookup. Planning links are secondary to the aircraft checklist flow and do not imply importing, syncing, or managing route data.
_Avoid_: Route workflow, planning module

**Checklist Dashboard**:
The compact landing page for the app. It introduces the simulator checklist companion, surfaces available aircraft profiles, shows checklist session progress when available, and links to supporting planning resources.
_Avoid_: Marketing homepage, brochure page

**Minimal Cockpit Utility**:
The visual mood for the app: calm, high-contrast, compact, and easy to scan beside the simulator. It may borrow subtle aviation cues but should not mimic aircraft avionics unless that improves usability.
_Avoid_: Marketing gloss, fake avionics panel, heavy dashboard

**Sim-Practical Checklist**:
An aircraft checklist written for a smooth Microsoft Flight Simulator flight rather than strict airline SOP fidelity. It keeps real-world aviation flavor where useful while omitting procedures that are too dense, airline-specific, abnormal, or not meaningfully represented in the simulator.
_Avoid_: Real-procedure checklist, full SOP checklist

**Simulator-Only Guidance**:
Checklist content written in original words for Microsoft Flight Simulator use only. It may be informed by general aircraft knowledge and simulator verification, but it is not real-world aviation instruction and should not copy airline or manufacturer procedures verbatim.
_Avoid_: Real-world procedure source, official checklist

**Interactive Flight Companion**:
A checklist experience meant to be used beside the simulator during a flight. It lets the pilot mark checklist items complete, track progress through flight phases, and reset the flow for a new simulator flight.
_Avoid_: Static reference, checklist document

**Checklist Session**:
One local, temporary run through an aircraft checklist flow. Completion state belongs to the browser and persists until the pilot resets the flight.
_Avoid_: Saved flight, route instance, flight record

**Checklist Item**:
A single cockpit or flight action in a checklist. It should be quick to scan, may include a confirmation of the expected result, and may include a short simulator-specific note when the action needs extra context.
_Avoid_: Task, instruction block
