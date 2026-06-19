import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const profileStringFields = [
  "id",
  "name",
  "variant",
  "simulator",
  "description",
];
const phaseStringFields = ["id", "title", "summary"];
const itemStringFields = ["id", "action"];
const optionalItemStringFields = ["confirmation", "note"];
const profileFields = new Set([...profileStringFields, "phases"]);
const phaseFields = new Set([...phaseStringFields, "items"]);
const itemFields = new Set([...itemStringFields, ...optionalItemStringFields]);
const stableIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const defaultProfileDirectory = path.join(repoRoot, "src/data");

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDuplicateLocation(existingPath, duplicatePath) {
  return `${duplicatePath} duplicates ${existingPath}`;
}

function normalizeContentKey(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function validateAllowedFields(value, allowedFields, location, errors) {
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${location}.${field} is not a supported field`);
    }
  }
}

function validateStableId(value, location, errors) {
  if (!stableIdPattern.test(value)) {
    errors.push(
      `${location} must use stable kebab-case lowercase letters and numbers`,
    );
  }
}

function readRequiredString(value, field, location, errors) {
  if (!Object.hasOwn(value, field)) {
    errors.push(`${location}.${field} is required`);
    return undefined;
  }

  if (typeof value[field] !== "string" || value[field].trim() === "") {
    errors.push(`${location}.${field} must be a non-empty string`);
    return undefined;
  }

  return value[field];
}

function validateOptionalString(value, field, location, errors) {
  if (!Object.hasOwn(value, field)) {
    return;
  }

  if (typeof value[field] !== "string") {
    errors.push(`${location}.${field} must be a string when present`);
    return;
  }

  if (value[field].trim() === "") {
    errors.push(`${location}.${field} must not be empty when present`);
  }
}

export function validateProfileRecords(profileRecords) {
  const errors = [];
  const warnings = [];
  const profileIds = new Map();

  profileRecords.forEach((record, profileIndex) => {
    const profile = record.data;
    const profileLocation = record.source ?? `profiles[${profileIndex}]`;

    if (!isRecord(profile)) {
      errors.push(`${profileLocation} must be an object`);
      return;
    }

    validateAllowedFields(profile, profileFields, profileLocation, errors);

    const profileId = readRequiredString(
      profile,
      "id",
      profileLocation,
      errors,
    );

    for (const field of profileStringFields.filter((field) => field !== "id")) {
      readRequiredString(profile, field, profileLocation, errors);
    }

    if (profileId) {
      validateStableId(profileId, `${profileLocation}.id`, errors);

      const existingPath = profileIds.get(profileId);

      if (existingPath) {
        errors.push(
          `duplicate aircraft profile id "${profileId}": ${formatDuplicateLocation(
            existingPath,
            `${profileLocation}.id`,
          )}`,
        );
      } else {
        profileIds.set(profileId, `${profileLocation}.id`);
      }
    }

    if (!Array.isArray(profile.phases)) {
      errors.push(`${profileLocation}.phases must be a non-empty array`);
      return;
    }

    if (profile.phases.length === 0) {
      errors.push(`${profileLocation}.phases must not be empty`);
      return;
    }

    const phaseIds = new Map();
    const phaseTitles = new Map();
    const itemIds = new Map();
    const itemActions = new Map();

    profile.phases.forEach((phase, phaseIndex) => {
      const phaseLocation = `${profileLocation}.phases[${phaseIndex}]`;

      if (!isRecord(phase)) {
        errors.push(`${phaseLocation} must be an object`);
        return;
      }

      validateAllowedFields(phase, phaseFields, phaseLocation, errors);

      const phaseId = readRequiredString(phase, "id", phaseLocation, errors);
      const phaseTitle = readRequiredString(
        phase,
        "title",
        phaseLocation,
        errors,
      );

      for (const field of phaseStringFields.filter(
        (field) => field !== "id" && field !== "title",
      )) {
        readRequiredString(phase, field, phaseLocation, errors);
      }

      if (phaseId) {
        validateStableId(phaseId, `${phaseLocation}.id`, errors);

        const existingPath = phaseIds.get(phaseId);

        if (existingPath) {
          errors.push(
            `duplicate phase id "${phaseId}" in profile "${
              profileId ?? profileLocation
            }": ${formatDuplicateLocation(existingPath, `${phaseLocation}.id`)}`,
          );
        } else {
          phaseIds.set(phaseId, `${phaseLocation}.id`);
        }
      }

      if (phaseTitle) {
        const normalizedTitle = normalizeContentKey(phaseTitle);
        const existingPath = phaseTitles.get(normalizedTitle);

        if (existingPath) {
          errors.push(
            `duplicate phase title "${phaseTitle}" in profile "${
              profileId ?? profileLocation
            }": ${formatDuplicateLocation(
              existingPath,
              `${phaseLocation}.title`,
            )}`,
          );
        } else {
          phaseTitles.set(normalizedTitle, `${phaseLocation}.title`);
        }
      }

      if (!Array.isArray(phase.items)) {
        errors.push(`${phaseLocation}.items must be a non-empty array`);
        return;
      }

      if (phase.items.length === 0) {
        errors.push(`${phaseLocation}.items must not be empty`);
        return;
      }

      phase.items.forEach((item, itemIndex) => {
        const itemLocation = `${phaseLocation}.items[${itemIndex}]`;

        if (!isRecord(item)) {
          errors.push(`${itemLocation} must be an object`);
          return;
        }

        validateAllowedFields(item, itemFields, itemLocation, errors);

        const itemId = readRequiredString(item, "id", itemLocation, errors);
        const action = readRequiredString(item, "action", itemLocation, errors);

        for (const field of optionalItemStringFields) {
          validateOptionalString(item, field, itemLocation, errors);
        }

        if (!Object.hasOwn(item, "confirmation")) {
          warnings.push(
            `${itemLocation}.confirmation is recommended so checklist completion has a visible expected result`,
          );
        }

        if (action) {
          const normalizedAction = normalizeContentKey(action);
          const existingPath = itemActions.get(normalizedAction);

          if (existingPath) {
            warnings.push(
              `repeated checklist action "${action}" in profile "${
                profileId ?? profileLocation
              }": ${formatDuplicateLocation(
                existingPath,
                `${itemLocation}.action`,
              )}`,
            );
          } else {
            itemActions.set(normalizedAction, `${itemLocation}.action`);
          }
        }

        if (itemId) {
          validateStableId(itemId, `${itemLocation}.id`, errors);

          const existingPath = itemIds.get(itemId);

          if (existingPath) {
            errors.push(
              `duplicate checklist item id "${itemId}" in profile "${
                profileId ?? profileLocation
              }": ${formatDuplicateLocation(
                existingPath,
                `${itemLocation}.id`,
              )}`,
            );
          } else {
            itemIds.set(itemId, `${itemLocation}.id`);
          }
        }
      });
    });
  });

  return { errors, warnings };
}

export function validateProfiles(profileRecords) {
  const { errors } = validateProfileRecords(profileRecords);

  return errors;
}

export async function loadProfileRecords(
  profileDirectory = defaultProfileDirectory,
) {
  const entries = await readdir(profileDirectory, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    jsonFiles.map(async (fileName) => {
      const filePath = path.join(profileDirectory, fileName);
      const source = path.relative(repoRoot, filePath);
      const raw = await readFile(filePath, "utf8");

      try {
        return {
          data: JSON.parse(raw),
          source,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        return {
          data: undefined,
          source,
          parseError: `${source} contains invalid JSON: ${message}`,
        };
      }
    }),
  );
}

async function main() {
  const records = await loadProfileRecords();
  const parseErrors = records
    .map((record) => record.parseError)
    .filter(Boolean);
  const result = validateProfileRecords(
    records.filter((record) => !record.parseError),
  );
  const errors = [...parseErrors, ...result.errors];

  if (errors.length > 0) {
    console.error("Aircraft profile validation failed:");

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  if (result.warnings.length > 0) {
    console.warn("Aircraft profile validation warnings:");

    for (const warning of result.warnings) {
      console.warn(`- ${warning}`);
    }
  }

  console.log(`Validated ${records.length} aircraft profiles.`);
}

function isDirectRun() {
  const entrypoint = process.argv[1];

  return (
    Boolean(entrypoint) && import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
