import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";
import {
  validateProfileRecords,
  validateProfiles,
} from "./validate-profiles.mjs";

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
  const result = validateProfileRecords([
    {
      source: "valid.json",
      data: createValidProfile(),
    },
  ]);

  assert.deepEqual(result, { errors: [], warnings: [] });
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

test("rejects unsupported profile, phase, and item fields", () => {
  const errors = validateProfiles([
    {
      source: "unknown-fields.json",
      data: createValidProfile({
        checklistVersion: 1,
        phases: [
          {
            id: "preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            caution: "Unexpected phase field.",
            items: [
              {
                id: "battery-on",
                action: "Battery - ON",
                confirmation: "Power available",
                source: "Unexpected item field.",
              },
            ],
          },
        ],
      }),
    },
  ]);

  const message = errors.join("\n");

  assert.match(
    message,
    /unknown-fields\.json\.checklistVersion is not a supported field/,
  );
  assert.match(
    message,
    /unknown-fields\.json\.phases\[0\]\.caution is not a supported field/,
  );
  assert.match(
    message,
    /unknown-fields\.json\.phases\[0\]\.items\[0\]\.source is not a supported field/,
  );
});

test("rejects unstable id formats", () => {
  const errors = validateProfiles([
    {
      source: "unstable-ids.json",
      data: createValidProfile({
        id: "Test Aircraft",
        phases: [
          {
            id: "Preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            items: [
              {
                id: "battery_on",
                action: "Battery - ON",
                confirmation: "Power available",
              },
            ],
          },
        ],
      }),
    },
  ]);

  const message = errors.join("\n");

  assert.match(
    message,
    /unstable-ids\.json\.id must use stable kebab-case/,
  );
  assert.match(
    message,
    /unstable-ids\.json\.phases\[0\]\.id must use stable kebab-case/,
  );
  assert.match(
    message,
    /unstable-ids\.json\.phases\[0\]\.items\[0\]\.id must use stable kebab-case/,
  );
});

test("rejects duplicate phase titles within a profile", () => {
  const errors = validateProfiles([
    {
      source: "duplicate-phase-titles.json",
      data: createValidProfile({
        phases: [
          {
            id: "preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            items: [{ id: "battery-on", action: "Battery - ON" }],
          },
          {
            id: "second-preflight",
            title: " preflight ",
            summary: "Repeated phase title.",
            items: [{ id: "beacon-on", action: "Beacon - ON" }],
          },
        ],
      }),
    },
  ]);

  assert.match(errors.join("\n"), /duplicate phase title " preflight "/);
});

test("warns for repeated actions and missing confirmations", () => {
  const result = validateProfileRecords([
    {
      source: "warnings.json",
      data: createValidProfile({
        phases: [
          {
            id: "preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            items: [
              { id: "battery-on", action: "Battery - ON" },
              {
                id: "battery-check",
                action: " battery - on ",
                confirmation: "Power available",
              },
            ],
          },
        ],
      }),
    },
  ]);

  assert.deepEqual(result.errors, []);
  assert.match(
    result.warnings.join("\n"),
    /warnings\.json\.phases\[0\]\.items\[0\]\.confirmation is recommended/,
  );
  assert.match(
    result.warnings.join("\n"),
    /repeated checklist action " battery - on " in profile "test-aircraft"/,
  );
});

test("rejects empty optional item text when present", () => {
  const errors = validateProfiles([
    {
      source: "empty-optional-text.json",
      data: createValidProfile({
        phases: [
          {
            id: "preflight",
            title: "Preflight",
            summary: "Prepare the aircraft.",
            items: [
              {
                id: "battery-on",
                action: "Battery - ON",
                confirmation: " ",
                note: "",
              },
            ],
          },
        ],
      }),
    },
  ]);

  const message = errors.join("\n");

  assert.match(
    message,
    /empty-optional-text\.json\.phases\[0\]\.items\[0\]\.confirmation must not be empty when present/,
  );
  assert.match(
    message,
    /empty-optional-text\.json\.phases\[0\]\.items\[0\]\.note must not be empty when present/,
  );
});
