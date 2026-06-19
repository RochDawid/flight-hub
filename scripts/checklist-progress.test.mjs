import assert from "node:assert/strict";
import test from "node:test";
import {
  getProfileProgress,
  getSessionReadyForChecklistOpen,
} from "../src/checklistProgress.ts";

const profile = {
  id: "test-aircraft",
  name: "Test Aircraft",
  variant: "Test Variant",
  simulator: "Microsoft Flight Simulator 2024",
  description: "A test profile.",
  phases: [
    {
      id: "preflight",
      title: "Preflight",
      summary: "Prepare the aircraft.",
      items: [
        { id: "battery-on", action: "Battery - ON" },
        { id: "avionics-on", action: "Avionics - ON" },
      ],
    },
    {
      id: "taxi",
      title: "Taxi",
      summary: "Prepare to taxi.",
      items: [{ id: "taxi-light", action: "Taxi light - ON" }],
    },
    {
      id: "takeoff",
      title: "Takeoff",
      summary: "Depart.",
      items: [{ id: "landing-light", action: "Landing light - ON" }],
    },
  ],
};

test("resume target and dashboard progress use the next incomplete phase", () => {
  const staleSession = {
    activePhaseId: "takeoff",
    completed: {
      "battery-on": true,
      "avionics-on": true,
    },
    updatedAt: "2026-06-19T21:52:48.000Z",
  };

  const progress = getProfileProgress(profile, staleSession);
  const openSession = getSessionReadyForChecklistOpen(profile, staleSession);

  assert.equal(progress.nextPhaseTitle, "Taxi");
  assert.equal(openSession.activePhaseId, "taxi");
  assert.deepEqual(openSession.completed, staleSession.completed);
  assert.equal(openSession.updatedAt, staleSession.updatedAt);
});

test("resume keeps the active phase when it already points at the next incomplete phase", () => {
  const currentSession = {
    activePhaseId: "taxi",
    completed: {
      "battery-on": true,
      "avionics-on": true,
    },
  };

  assert.equal(
    getSessionReadyForChecklistOpen(profile, currentSession),
    currentSession,
  );
});
