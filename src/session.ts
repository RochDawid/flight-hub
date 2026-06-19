import type { AircraftProfile, FlightPhase } from "./types";

const storageKeyPrefix = "msfs-checklist-companion";
const legacyStorageKeyPrefix = "flight-hub";

export type ChecklistSession = {
  completed: Record<string, boolean>;
  activePhaseId: string;
  updatedAt?: string;
};

export type ChecklistSessionStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

export function storageKeyFor(profileId: string): string {
  return `${storageKeyPrefix}:${profileId}:session:v1`;
}

export function legacyStorageKeyFor(profileId: string): string {
  return `${legacyStorageKeyPrefix}:${profileId}:session:v1`;
}

export function createSession(profile: AircraftProfile): ChecklistSession {
  return {
    completed: {},
    activePhaseId: profile.phases[0]?.id ?? "",
  };
}

export function normalizeSession(
  profile: AircraftProfile,
  persisted: Partial<ChecklistSession>,
): ChecklistSession {
  const activePhaseExists = profile.phases.some(
    (phase) => phase.id === persisted.activePhaseId,
  );

  return {
    completed: persisted.completed ?? {},
    activePhaseId: activePhaseExists
      ? persisted.activePhaseId!
      : profile.phases[0]?.id ?? "",
    updatedAt: persisted.updatedAt,
  };
}

export function loadSession(
  profile: AircraftProfile,
  storage: ChecklistSessionStorage,
): ChecklistSession {
  try {
    const storageKey = storageKeyFor(profile.id);
    const legacyStorageKey = legacyStorageKeyFor(profile.id);
    const raw = storage.getItem(storageKey);
    const legacyRaw = raw ? null : storage.getItem(legacyStorageKey);
    const persistedRaw = raw ?? legacyRaw;

    if (!persistedRaw) {
      return createSession(profile);
    }

    const parsed = JSON.parse(persistedRaw) as Partial<ChecklistSession>;

    if (legacyRaw) {
      storage.setItem(storageKey, legacyRaw);
      storage.removeItem(legacyStorageKey);
    }

    return normalizeSession(profile, parsed);
  } catch {
    return createSession(profile);
  }
}

export function loadSessions(
  profiles: AircraftProfile[],
  storage: ChecklistSessionStorage,
): Record<string, ChecklistSession> {
  return Object.fromEntries(
    profiles.map((profile) => [profile.id, loadSession(profile, storage)]),
  );
}

export function saveSession(
  profileId: string,
  session: ChecklistSession,
  storage: ChecklistSessionStorage,
): void {
  storage.setItem(storageKeyFor(profileId), JSON.stringify(session));
}

export function updateSession(
  profile: AircraftProfile,
  currentSession: ChecklistSession | undefined,
  storage: ChecklistSessionStorage,
  updater: (current: ChecklistSession) => ChecklistSession,
): ChecklistSession {
  const nextSession = updater(currentSession ?? createSession(profile));

  saveSession(profile.id, nextSession, storage);

  return nextSession;
}

export function resetSession(
  profile: AircraftProfile,
  storage: ChecklistSessionStorage,
): ChecklistSession {
  storage.removeItem(storageKeyFor(profile.id));
  storage.removeItem(legacyStorageKeyFor(profile.id));

  return createSession(profile);
}

export function setSessionActivePhase(
  session: ChecklistSession,
  activePhaseId: string,
  updatedAt = new Date().toISOString(),
): ChecklistSession {
  return {
    ...session,
    activePhaseId,
    updatedAt,
  };
}

export function toggleSessionItem(
  session: ChecklistSession,
  itemId: string,
  updatedAt = new Date().toISOString(),
): ChecklistSession {
  return {
    ...session,
    completed: {
      ...session.completed,
      [itemId]: !session.completed[itemId],
    },
    updatedAt,
  };
}

export function getAllItemIds(aircraft: AircraftProfile): string[] {
  return aircraft.phases.flatMap((phase) => phase.items.map((item) => item.id));
}

export function getPhaseCompletion(
  phase: FlightPhase,
  completed: Record<string, boolean>,
) {
  const done = phase.items.filter((item) => completed[item.id]).length;

  return {
    done,
    total: phase.items.length,
    ratio: phase.items.length === 0 ? 0 : done / phase.items.length,
  };
}

export function getNextIncompletePhase(
  profile: AircraftProfile,
  session: ChecklistSession,
): FlightPhase | undefined {
  return (
    profile.phases.find(
      (phase) =>
        getPhaseCompletion(phase, session.completed).done < phase.items.length,
    ) ?? profile.phases[profile.phases.length - 1]
  );
}

export function getSessionReadyForChecklistOpen(
  profile: AircraftProfile,
  session: ChecklistSession,
): ChecklistSession {
  const nextPhase = getNextIncompletePhase(profile, session);

  if (!nextPhase || session.activePhaseId === nextPhase.id) {
    return session;
  }

  return {
    ...session,
    activePhaseId: nextPhase.id,
  };
}

export function prepareSessionForChecklistOpen(
  profile: AircraftProfile,
  session: ChecklistSession,
  storage: ChecklistSessionStorage,
): ChecklistSession {
  const nextSession = getSessionReadyForChecklistOpen(profile, session);

  if (nextSession !== session) {
    saveSession(profile.id, nextSession, storage);
  }

  return nextSession;
}

export function getProfileProgress(
  profile: AircraftProfile,
  session: ChecklistSession,
) {
  const allItemIds = getAllItemIds(profile);
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextPhase = getNextIncompletePhase(profile, session);

  return {
    completedCount,
    nextPhaseTitle: nextPhase?.title ?? "Complete",
    overallPercent,
    totalCount,
  };
}
