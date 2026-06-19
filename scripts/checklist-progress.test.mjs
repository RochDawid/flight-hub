import assert from "node:assert/strict";
import test from "node:test";
import {
  createSession,
  getAllItemIds,
  getProfileProgress,
  getSessionReadyForChecklistOpen,
  legacyStorageKeyFor,
  loadSession,
  loadSessions,
  prepareSessionForChecklistOpen,
  resetSession,
  setSessionActivePhase,
  storageKeyFor,
  toggleSessionItem,
  updateSession,
} from "../src/session.ts";

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

const secondProfile = {
  ...profile,
  id: "second-aircraft",
  phases: [
    {
      id: "setup",
      title: "Setup",
      summary: "Set up the aircraft.",
      items: [{ id: "setup-done", action: "Setup - DONE" }],
    },
  ],
};

class MemoryStorage {
  #values = new Map();

  constructor(initialValues = {}) {
    Object.entries(initialValues).forEach(([key, value]) => {
      this.#values.set(key, value);
    });
  }

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  removeItem(key) {
    this.#values.delete(key);
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }
}

function readStoredSession(storage, profileId = profile.id) {
  return JSON.parse(storage.getItem(storageKeyFor(profileId)));
}

test("creates a fresh session at the first phase", () => {
  assert.deepEqual(createSession(profile), {
    activePhaseId: "preflight",
    completed: {},
  });
});

test("loads all profile sessions through an injectable storage seam", () => {
  const storage = new MemoryStorage({
    [storageKeyFor(secondProfile.id)]: JSON.stringify({
      activePhaseId: "setup",
      completed: { "setup-done": true },
      updatedAt: "2026-06-19T21:52:48.000Z",
    }),
  });

  const sessions = loadSessions([profile, secondProfile], storage);

  assert.deepEqual(sessions[profile.id], createSession(profile));
  assert.deepEqual(sessions[secondProfile.id], {
    activePhaseId: "setup",
    completed: { "setup-done": true },
    updatedAt: "2026-06-19T21:52:48.000Z",
  });
});

test("loads current localStorage sessions and repairs missing active phases", () => {
  const storage = new MemoryStorage({
    [storageKeyFor(profile.id)]: JSON.stringify({
      activePhaseId: "removed-phase",
      completed: { "battery-on": true },
      updatedAt: "2026-06-19T21:52:48.000Z",
    }),
  });

  assert.deepEqual(loadSession(profile, storage), {
    activePhaseId: "preflight",
    completed: { "battery-on": true },
    updatedAt: "2026-06-19T21:52:48.000Z",
  });
});

test("migrates legacy session keys when no current key exists", () => {
  const legacySession = {
    activePhaseId: "taxi",
    completed: { "battery-on": true },
    updatedAt: "2026-06-19T21:52:48.000Z",
  };
  const storage = new MemoryStorage({
    [legacyStorageKeyFor(profile.id)]: JSON.stringify(legacySession),
  });

  assert.deepEqual(loadSession(profile, storage), legacySession);
  assert.deepEqual(readStoredSession(storage), legacySession);
  assert.equal(storage.getItem(legacyStorageKeyFor(profile.id)), null);
});

test("keeps current session keys ahead of legacy keys", () => {
  const currentSession = {
    activePhaseId: "taxi",
    completed: { "taxi-light": true },
    updatedAt: "2026-06-20T08:00:00.000Z",
  };
  const legacyRaw = JSON.stringify({
    activePhaseId: "preflight",
    completed: { "battery-on": true },
  });
  const storage = new MemoryStorage({
    [storageKeyFor(profile.id)]: JSON.stringify(currentSession),
    [legacyStorageKeyFor(profile.id)]: legacyRaw,
  });

  assert.deepEqual(loadSession(profile, storage), currentSession);
  assert.equal(storage.getItem(legacyStorageKeyFor(profile.id)), legacyRaw);
});

test("falls back to a fresh session when stored JSON is invalid", () => {
  const storage = new MemoryStorage({
    [storageKeyFor(profile.id)]: "{not json",
  });

  assert.deepEqual(loadSession(profile, storage), createSession(profile));
});

test("updates sessions from an existing value and persists the result", () => {
  const storage = new MemoryStorage();
  const currentSession = {
    activePhaseId: "preflight",
    completed: {},
  };

  const nextSession = updateSession(
    profile,
    currentSession,
    storage,
    (current) =>
      toggleSessionItem(current, "battery-on", "2026-06-20T08:00:00.000Z"),
  );

  assert.deepEqual(nextSession, {
    activePhaseId: "preflight",
    completed: { "battery-on": true },
    updatedAt: "2026-06-20T08:00:00.000Z",
  });
  assert.deepEqual(readStoredSession(storage), nextSession);
});

test("updates sessions from a fresh profile session when none is loaded", () => {
  const storage = new MemoryStorage();

  const nextSession = updateSession(
    profile,
    undefined,
    storage,
    (current) =>
      setSessionActivePhase(current, "taxi", "2026-06-20T08:00:00.000Z"),
  );

  assert.deepEqual(nextSession, {
    activePhaseId: "taxi",
    completed: {},
    updatedAt: "2026-06-20T08:00:00.000Z",
  });
  assert.deepEqual(readStoredSession(storage), nextSession);
});

test("resets current and legacy storage to a fresh session", () => {
  const storage = new MemoryStorage({
    [storageKeyFor(profile.id)]: JSON.stringify({
      activePhaseId: "taxi",
      completed: { "battery-on": true },
    }),
    [legacyStorageKeyFor(profile.id)]: JSON.stringify({
      activePhaseId: "takeoff",
      completed: { "landing-light": true },
    }),
  });

  assert.deepEqual(resetSession(profile, storage), createSession(profile));
  assert.equal(storage.getItem(storageKeyFor(profile.id)), null);
  assert.equal(storage.getItem(legacyStorageKeyFor(profile.id)), null);
});

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

test("checklist open preparation persists next-incomplete phase corrections", () => {
  const storage = new MemoryStorage();
  const staleSession = {
    activePhaseId: "takeoff",
    completed: {
      "battery-on": true,
      "avionics-on": true,
    },
    updatedAt: "2026-06-19T21:52:48.000Z",
  };

  const openSession = prepareSessionForChecklistOpen(
    profile,
    staleSession,
    storage,
  );

  assert.equal(openSession.activePhaseId, "taxi");
  assert.deepEqual(readStoredSession(storage), openSession);
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

test("progress includes completion totals and all checklist item ids", () => {
  const session = {
    activePhaseId: "taxi",
    completed: {
      "battery-on": true,
      "avionics-on": true,
      "taxi-light": true,
    },
  };

  assert.deepEqual(getAllItemIds(profile), [
    "battery-on",
    "avionics-on",
    "taxi-light",
    "landing-light",
  ]);
  assert.deepEqual(getProfileProgress(profile, session), {
    completedCount: 3,
    nextPhaseTitle: "Takeoff",
    overallPercent: 75,
    totalCount: 4,
  });
});
