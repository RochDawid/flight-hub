import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";
import { validateProfiles } from "./validate-profiles.mjs";

const execFileAsync = promisify(execFile);

function createValidProfile(overrides = {}) {
  return {
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
          {
            id: "battery-on",
            action: "Battery - ON",
            confirmation: "Power available",
          },
        ],
      },
    ],
    ...overrides,
  };
}

test("accepts a valid aircraft profile", () => {
  const errors = validateProfiles([
    {
      source: "valid.json",
      data: createValidProfile(),
    },
  ]);

  assert.deepEqual(errors, []);
});

test("can be imported when process.argv[1] is undefined", async () => {
  const { stderr, stdout } = await execFileAsync(process.execPath, [
    "-e",
    "await import('./scripts/validate-profiles.mjs'); console.log('imported');",
  ]);

  assert.equal(stderr, "");
  assert.equal(stdout.trim(), "imported");
});

test("rejects duplicate aircraft profile ids", () => {
  const errors = validateProfiles([
    {
      source: "first.json",
      data: createValidProfile({ id: "duplicate-aircraft" }),
    },
    {
      source: "second.json",
      data: createValidProfile({ id: "duplicate-aircraft" }),
    },
  ]);

  assert.match(
    errors.join("\n"),
    /duplicate aircraft profile id "duplicate-aircraft"/,
  );
});

test("rejects duplicate phase ids within a profile", () => {
  const errors = validateProfiles([
    {
      source: "duplicate-phases.json",
      data: createValidProfile({
        phases: [
          {
            id: "preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            items: [{ id: "battery-on", action: "Battery - ON" }],
          },
          {
            id: "preflight",
            title: "Second Preflight",
            summary: "Duplicate phase id.",
            items: [{ id: "beacon-on", action: "Beacon - ON" }],
          },
        ],
      }),
    },
  ]);

  assert.match(errors.join("\n"), /duplicate phase id "preflight"/);
});

test("rejects duplicate item ids within a profile", () => {
  const errors = validateProfiles([
    {
      source: "duplicate-items.json",
      data: createValidProfile({
        phases: [
          {
            id: "preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            items: [{ id: "flaps-up", action: "Flaps - UP" }],
          },
          {
            id: "after-landing",
            title: "After Landing",
            summary: "Clean up the aircraft.",
            items: [{ id: "flaps-up", action: "Flaps - UP" }],
          },
        ],
      }),
    },
  ]);

  assert.match(errors.join("\n"), /duplicate checklist item id "flaps-up"/);
});

test("rejects missing required fields and empty phases or items", () => {
  const errors = validateProfiles([
    {
      source: "invalid.json",
      data: {
        id: "invalid-aircraft",
        name: "Invalid Aircraft",
        variant: "Invalid Variant",
        simulator: "Microsoft Flight Simulator 2024",
        phases: [
          {
            id: "empty-phase",
            title: "Empty Phase",
            summary: "No items here.",
            items: [],
          },
        ],
      },
    },
    {
      source: "empty.json",
      data: createValidProfile({ id: "empty-aircraft", phases: [] }),
    },
  ]);

  const message = errors.join("\n");

  assert.match(message, /invalid\.json\.description is required/);
  assert.match(message, /invalid\.json\.phases\[0\]\.items must not be empty/);
  assert.match(message, /empty\.json\.phases must not be empty/);
});
