import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Info,
  ListChecks,
  Plane,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  aircraftProfiles,
  defaultAircraftProfile,
  findAircraftProfile,
} from "./data/profiles";
import type { AircraftProfile, FlightPhase } from "./types";

type Route =
  | {
      kind: "dashboard";
    }
  | {
      kind: "checklist";
      profileId: string;
    };

type ChecklistSession = {
  completed: Record<string, boolean>;
  activePhaseId: string;
  updatedAt?: string;
};

type PlanningLink = {
  label: string;
  description: string;
  href: string;
};

type AircraftVisual = {
  code: string;
  role: string;
};

const appName = "MSFS Checklist Companion";
const storageKeyPrefix = "msfs-checklist-companion";
const legacyStorageKeyPrefix = "flight-hub";

const planningLinks: PlanningLink[] = [
  {
    label: "MSFS Flight Planner",
    description: "Open the official Microsoft Flight Simulator web planner.",
    href: "https://planner.flightsimulator.com/",
  },
  {
    label: "SimBrief Dispatch",
    description: "Build an OFP, fuel plan, route, and performance notes.",
    href: "https://dispatch.simbrief.com/",
  },
  {
    label: "FlightAware",
    description: "Look up real-world route examples before flying.",
    href: "https://www.flightaware.com/",
  },
];

const routeAliases: Record<string, string> = {
  "737max": "boeing-737-max-8",
  "a320neo": "inibuilds-a320neo",
  "c172": "c172-skyhawk-g1000",
  "tbm930": "daher-tbm930",
};

const aircraftVisuals: Record<string, AircraftVisual> = {
  "boeing-737-max-8": {
    code: "B38M",
    role: "Airliner flow",
  },
  "c172-skyhawk-g1000": {
    code: "C172",
    role: "GA training",
  },
  "daher-tbm930": {
    code: "TBM",
    role: "Turboprop IFR",
  },
  "inibuilds-a320neo": {
    code: "A20N",
    role: "Airbus flow",
  },
};

function storageKeyFor(profileId: string): string {
  return `${storageKeyPrefix}:${profileId}:session:v1`;
}

function legacyStorageKeyFor(profileId: string): string {
  return `${legacyStorageKeyPrefix}:${profileId}:session:v1`;
}

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  const profileId = routeAliases[hash] ?? hash;
  const profile = profileId ? findAircraftProfile(profileId) : undefined;

  if (!profile) {
    return { kind: "dashboard" };
  }

  return {
    kind: "checklist",
    profileId: profile.id,
  };
}

function createSession(profile: AircraftProfile): ChecklistSession {
  return {
    completed: {},
    activePhaseId: profile.phases[0]?.id ?? "",
  };
}

function loadSession(profile: AircraftProfile): ChecklistSession {
  try {
    const storageKey = storageKeyFor(profile.id);
    const legacyStorageKey = legacyStorageKeyFor(profile.id);
    const raw = window.localStorage.getItem(storageKey);
    const legacyRaw = raw ? null : window.localStorage.getItem(legacyStorageKey);
    const persistedRaw = raw ?? legacyRaw;

    if (!persistedRaw) {
      return createSession(profile);
    }

    const parsed = JSON.parse(persistedRaw) as Partial<ChecklistSession>;
    const activePhaseExists = profile.phases.some(
      (phase) => phase.id === parsed.activePhaseId,
    );

    if (legacyRaw) {
      window.localStorage.setItem(storageKey, legacyRaw);
      window.localStorage.removeItem(legacyStorageKey);
    }

    return {
      completed: parsed.completed ?? {},
      activePhaseId: activePhaseExists
        ? parsed.activePhaseId!
        : profile.phases[0]?.id ?? "",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return createSession(profile);
  }
}

function loadSessions(): Record<string, ChecklistSession> {
  return Object.fromEntries(
    aircraftProfiles.map((profile) => [profile.id, loadSession(profile)]),
  );
}

function formatUpdatedAt(value?: string): string {
  if (!value) {
    return "Not started yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAllItemIds(aircraft: AircraftProfile): string[] {
  return aircraft.phases.flatMap((phase) => phase.items.map((item) => item.id));
}

function getPhaseCompletion(
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

function getProfileProgress(
  profile: AircraftProfile,
  session: ChecklistSession,
) {
  const allItemIds = getAllItemIds(profile);
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextPhase =
    profile.phases.find(
      (phase) =>
        getPhaseCompletion(phase, session.completed).done < phase.items.length,
    ) ?? profile.phases[profile.phases.length - 1];

  return {
    completedCount,
    nextPhaseTitle: nextPhase?.title ?? "Complete",
    overallPercent,
    totalCount,
  };
}

function getMostRecentProfile(
  profiles: AircraftProfile[],
  sessions: Record<string, ChecklistSession>,
) {
  return profiles.reduce<AircraftProfile | undefined>((latest, profile) => {
    const updatedAt = sessions[profile.id]?.updatedAt;

    if (!updatedAt) {
      return latest;
    }

    if (!latest) {
      return profile;
    }

    const latestUpdatedAt = sessions[latest.id]?.updatedAt;

    if (!latestUpdatedAt) {
      return profile;
    }

    return new Date(updatedAt).getTime() > new Date(latestUpdatedAt).getTime()
      ? profile
      : latest;
  }, undefined);
}

function getStatusLabel(completedCount: number, totalCount: number): string {
  if (totalCount > 0 && completedCount === totalCount) {
    return "Complete";
  }

  if (completedCount > 0) {
    return "In progress";
  }

  return "Ready";
}

function getStatusTone(
  completedCount: number,
  totalCount: number,
): "complete" | "active" | "ready" {
  if (totalCount > 0 && completedCount === totalCount) {
    return "complete";
  }

  if (completedCount > 0) {
    return "active";
  }

  return "ready";
}

function getChecklistActionLabel(
  completedCount: number,
  totalCount: number,
  nextPhaseTitle: string,
): string {
  if (totalCount > 0 && completedCount === totalCount) {
    return "Review checklist";
  }

  if (completedCount > 0) {
    return `Resume ${nextPhaseTitle}`;
  }

  return "Start checklist";
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [sessions, setSessions] =
    useState<Record<string, ChecklistSession>>(loadSessions);
  const [recentlyCheckedItemId, setRecentlyCheckedItemId] = useState<
    string | null
  >(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const activeProfile =
    route.kind === "checklist"
      ? findAircraftProfile(route.profileId) ?? defaultAircraftProfile
      : defaultAircraftProfile;
  const session =
    sessions[activeProfile.id] ?? createSession(activeProfile);
  const allItemIds = useMemo(
    () => getAllItemIds(activeProfile),
    [activeProfile],
  );
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const activePhase =
    activeProfile.phases.find((phase) => phase.id === session.activePhaseId) ??
    activeProfile.phases[0];
  const routeKey =
    route.kind === "checklist" ? `${route.kind}:${route.profileId}` : route.kind;

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [routeKey]);

  useEffect(() => {
    setRecentlyCheckedItemId(null);
    setIsResetDialogOpen(false);
  }, [activeProfile.id]);

  useEffect(() => {
    if (!recentlyCheckedItemId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyCheckedItemId(null);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyCheckedItemId]);

  useEffect(() => {
    if (!isResetDialogOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsResetDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isResetDialogOpen]);

  function updateSession(
    profileId: string,
    updater: (current: ChecklistSession) => ChecklistSession,
  ) {
    const profile = findAircraftProfile(profileId);

    if (!profile) {
      return;
    }

    setSessions((current) => {
      const currentSession = current[profileId] ?? createSession(profile);
      const nextSession = updater(currentSession);

      window.localStorage.setItem(
        storageKeyFor(profileId),
        JSON.stringify(nextSession),
      );

      return {
        ...current,
        [profileId]: nextSession,
      };
    });
  }

  function openChecklist(profileId: string) {
    const profile = findAircraftProfile(profileId);

    if (!profile) {
      return;
    }

    window.location.hash = profile.id;
    setRoute({ kind: "checklist", profileId: profile.id });
  }

  function openDashboard() {
    window.history.pushState("", document.title, window.location.pathname);
    setRoute({ kind: "dashboard" });
  }

  function setActivePhase(activePhaseId: string) {
    updateSession(activeProfile.id, (current) => ({
      ...current,
      activePhaseId,
      updatedAt: new Date().toISOString(),
    }));

    if (window.matchMedia("(max-width: 920px)").matches) {
      window.setTimeout(() => {
        document
          .querySelector(".phase-panel")
          ?.scrollIntoView({ block: "start", behavior: "auto" });
      }, 0);
    }
  }

  function toggleItem(itemId: string) {
    const willBeChecked = !session.completed[itemId];

    if (willBeChecked) {
      setRecentlyCheckedItemId(itemId);
    } else if (recentlyCheckedItemId === itemId) {
      setRecentlyCheckedItemId(null);
    }

    updateSession(activeProfile.id, (current) => ({
      ...current,
      completed: {
        ...current.completed,
        [itemId]: !current.completed[itemId],
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function requestResetSession() {
    setIsResetDialogOpen(true);
  }

  function confirmResetSession() {
    const nextSession = createSession(activeProfile);
    window.localStorage.removeItem(storageKeyFor(activeProfile.id));
    window.localStorage.removeItem(legacyStorageKeyFor(activeProfile.id));
    setRecentlyCheckedItemId(null);
    setIsResetDialogOpen(false);
    setSessions((current) => ({
      ...current,
      [activeProfile.id]: nextSession,
    }));
  }

  function cancelResetSession() {
    setIsResetDialogOpen(false);
  }

  if (route.kind === "checklist" && activePhase) {
    return (
      <ChecklistPage
        activePhase={activePhase}
        completedCount={completedCount}
        onBack={openDashboard}
        onCancelReset={cancelResetSession}
        onConfirmReset={confirmResetSession}
        onPhaseSelect={setActivePhase}
        onReset={requestResetSession}
        onToggleItem={toggleItem}
        overallPercent={overallPercent}
        profile={activeProfile}
        recentlyCheckedItemId={recentlyCheckedItemId}
        session={session}
        showResetDialog={isResetDialogOpen}
        totalCount={totalCount}
      />
    );
  }

  return (
    <DashboardPage
      onOpenChecklist={openChecklist}
      profiles={aircraftProfiles}
      sessions={sessions}
    />
  );
}

type DashboardProps = {
  onOpenChecklist: (profileId: string) => void;
  profiles: AircraftProfile[];
  sessions: Record<string, ChecklistSession>;
};

function DashboardPage({
  onOpenChecklist,
  profiles,
  sessions,
}: DashboardProps) {
  const resumeProfile =
    getMostRecentProfile(profiles, sessions) ?? defaultAircraftProfile;
  const resumeSession =
    sessions[resumeProfile.id] ?? createSession(resumeProfile);
  const resumeProgress = getProfileProgress(resumeProfile, resumeSession);
  const hasResume = Boolean(resumeSession.updatedAt);

  return (
    <main className="app-shell dashboard-shell">
      <TopBar />

      <section className="dashboard-grid">
        <div className="intro-panel">
          <p className="eyebrow">Microsoft Flight Simulator 2024 checklist companion</p>
          <h1>{appName}</h1>
          <p className="intro-copy">
            A minimalist Microsoft Flight Simulator checklist companion for
            running a clean flight from stand to destination gate. Pick an
            aircraft profile, keep the useful planning tools nearby, and tick
            through each phase beside the sim.
          </p>

          <div className="notice">
            <Info size={18} aria-hidden="true" />
            <span>
              Simulator-only guidance. This is not real-world aviation
              instruction.
            </span>
          </div>

          <div className="dashboard-actions">
            <button
              className="primary-action dashboard-primary"
              onClick={() => onOpenChecklist(resumeProfile.id)}
              type="button"
            >
              {hasResume
                ? `Continue ${resumeProgress.nextPhaseTitle}`
                : `Start with ${resumeProfile.name}`}
            </button>
            <span>
              {hasResume
                ? `${resumeProfile.name} was updated ${formatUpdatedAt(
                    resumeSession.updatedAt,
                  )}.`
                : "Pick up the default A320 flow or choose a different aircraft."}
            </span>
          </div>
        </div>

        <div className="aircraft-list" aria-label="Aircraft profiles">
          {profiles.map((profile) => {
            const session = sessions[profile.id] ?? createSession(profile);
            const progress = getProfileProgress(profile, session);

            return (
              <AircraftCard
                completedCount={progress.completedCount}
                key={profile.id}
                nextPhaseTitle={progress.nextPhaseTitle}
                onOpenChecklist={() => onOpenChecklist(profile.id)}
                overallPercent={progress.overallPercent}
                profile={profile}
                session={session}
                totalCount={progress.totalCount}
              />
            );
          })}
        </div>
      </section>

      <section className="planning-section" aria-labelledby="planning-title">
        <div className="section-heading">
          <p className="eyebrow">Planning links</p>
          <h2 id="planning-title">Open the tools, keep this page focused</h2>
        </div>

        <div className="planning-links">
          {planningLinks.map((link) => (
            <a
              className="planning-link"
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
              <ExternalLink size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

type AircraftCardProps = {
  completedCount: number;
  nextPhaseTitle: string;
  onOpenChecklist: () => void;
  overallPercent: number;
  profile: AircraftProfile;
  session: ChecklistSession;
  totalCount: number;
};

function AircraftCard({
  completedCount,
  nextPhaseTitle,
  onOpenChecklist,
  overallPercent,
  profile,
  session,
  totalCount,
}: AircraftCardProps) {
  const visual = aircraftVisuals[profile.id] ?? {
    code: "SIM",
    role: "Checklist",
  };
  const statusLabel = getStatusLabel(completedCount, totalCount);
  const statusTone = getStatusTone(completedCount, totalCount);
  const actionLabel = getChecklistActionLabel(
    completedCount,
    totalCount,
    nextPhaseTitle,
  );

  return (
    <article className={`aircraft-card ${statusTone}`}>
      <div className="aircraft-card-header">
        <div>
          <div className="aircraft-identity" aria-hidden="true">
            <span>{visual.code}</span>
            <small>{visual.role}</small>
          </div>
          <h2>{profile.name}</h2>
          <p>{profile.variant}</p>
        </div>
        <div
          aria-label={`${overallPercent}% complete`}
          className="progress-dial"
          style={{ "--progress": `${overallPercent}%` } as CSSProperties}
        >
          <span>{overallPercent}%</span>
        </div>
      </div>

      <span className={`status-pill ${statusTone}`}>{statusLabel}</span>

      <p className="profile-description">{profile.description}</p>

      <div className="stats-grid">
        <Stat
          icon={<ListChecks size={18} aria-hidden="true" />}
          label="Checklist"
          value={`${completedCount}/${totalCount}`}
        />
        <Stat
          icon={<Gauge size={18} aria-hidden="true" />}
          label="Next phase"
          value={nextPhaseTitle}
        />
        <Stat
          icon={<ClipboardCheck size={18} aria-hidden="true" />}
          label="Updated"
          value={formatUpdatedAt(session.updatedAt)}
        />
      </div>

      <button
        className="primary-action"
        onClick={onOpenChecklist}
        type="button"
      >
        {actionLabel}
      </button>
    </article>
  );
}

type StatProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="stat">
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

type ChecklistProps = {
  activePhase: FlightPhase;
  completedCount: number;
  onBack: () => void;
  onCancelReset: () => void;
  onConfirmReset: () => void;
  onPhaseSelect: (phaseId: string) => void;
  onReset: () => void;
  onToggleItem: (itemId: string) => void;
  overallPercent: number;
  profile: AircraftProfile;
  recentlyCheckedItemId: string | null;
  session: ChecklistSession;
  showResetDialog: boolean;
  totalCount: number;
};

function ChecklistPage({
  activePhase,
  completedCount,
  onBack,
  onCancelReset,
  onConfirmReset,
  onPhaseSelect,
  onReset,
  onToggleItem,
  overallPercent,
  profile,
  recentlyCheckedItemId,
  session,
  showResetDialog,
  totalCount,
}: ChecklistProps) {
  const activeCompletion = getPhaseCompletion(activePhase, session.completed);
  const activePhaseIndex = profile.phases.findIndex(
    (phase) => phase.id === activePhase.id,
  );
  const previousPhase = profile.phases[activePhaseIndex - 1];
  const nextPhase = profile.phases[activePhaseIndex + 1];
  const activePhaseComplete =
    activeCompletion.total > 0 &&
    activeCompletion.done === activeCompletion.total;
  const checklistComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <main className="app-shell checklist-shell">
      <TopBar />

      <section className="checklist-header">
        <button className="ghost-action" onClick={onBack} type="button">
          <ArrowLeft size={18} aria-hidden="true" />
          Dashboard
        </button>

        <div className="checklist-title">
          <p className="eyebrow">{profile.simulator}</p>
          <h1>{profile.name}</h1>
          <p>
            {completedCount} of {totalCount} checklist items complete.
          </p>
        </div>

        <button className="ghost-action danger" onClick={onReset} type="button">
          <RotateCcw size={18} aria-hidden="true" />
          Reset flight
        </button>
      </section>

      <div className="overall-progress" aria-label={`${overallPercent}% complete`}>
        <span style={{ width: `${overallPercent}%` }} />
      </div>

      <label className="phase-jump">
        <span>Jump to phase</span>
        <select
          onChange={(event) => onPhaseSelect(event.currentTarget.value)}
          value={activePhase.id}
        >
          {profile.phases.map((phase, index) => {
            const completion = getPhaseCompletion(phase, session.completed);

            return (
              <option key={phase.id} value={phase.id}>
                {`${index + 1}. ${phase.title} (${completion.done}/${
                  completion.total
                })`}
              </option>
            );
          })}
        </select>
      </label>

      <section className="checklist-layout">
        <nav className="phase-rail" aria-label="Flight phases">
          {profile.phases.map((phase, index) => {
            const completion = getPhaseCompletion(phase, session.completed);
            const isActive = phase.id === activePhase.id;
            const isComplete =
              completion.total > 0 && completion.done === completion.total;

            return (
              <button
                aria-current={isActive ? "step" : undefined}
                aria-label={`${index + 1}. ${phase.title}, ${completion.done} of ${completion.total} complete`}
                className={isActive ? "phase-button active" : "phase-button"}
                key={phase.id}
                onClick={() => onPhaseSelect(phase.id)}
                type="button"
              >
                <span className={isComplete ? "phase-number done" : "phase-number"}>
                  {isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}
                </span>
                <span>
                  <strong>{phase.title}</strong>
                  <small>
                    {completion.done}/{completion.total} complete
                  </small>
                </span>
              </button>
            );
          })}
        </nav>

        <article className="phase-panel">
          <div className="phase-panel-header">
            <div>
              <p className="eyebrow">Active phase</p>
              <h2>{activePhase.title}</h2>
              <p>{activePhase.summary}</p>
            </div>

            <div className="phase-count">
              <strong>
                {activeCompletion.done}/{activeCompletion.total}
              </strong>
              <span>complete</span>
            </div>
          </div>

          <div className="item-list">
            {activePhase.items.map((item) => {
              const checked = Boolean(session.completed[item.id]);
              const itemClassName = [
                "check-item",
                checked ? "done" : "",
                recentlyCheckedItemId === item.id ? "just-checked" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <label className={itemClassName} key={item.id}>
                  <input
                    checked={checked}
                    onChange={() => onToggleItem(item.id)}
                    type="checkbox"
                  />
                  <span className="check-mark" aria-hidden="true">
                    <Check size={16} />
                  </span>
                  <span className="item-copy">
                    <strong>{item.action}</strong>
                    {item.confirmation ? <small>{item.confirmation}</small> : null}
                    {item.note ? <em>{item.note}</em> : null}
                  </span>
                </label>
              );
            })}
          </div>

          {activePhaseComplete ? (
            <div className="phase-complete-card">
              <span className="phase-complete-icon" aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <span>
                <strong>
                  {checklistComplete
                    ? "Checklist complete"
                    : `${activePhase.title} complete`}
                </strong>
                <small>
                  {nextPhase
                    ? `Next up: ${nextPhase.title}.`
                    : "Nice flight. You can review or start fresh from here."}
                </small>
              </span>
              <button
                className="compact-action"
                onClick={() =>
                  nextPhase ? onPhaseSelect(nextPhase.id) : onBack()
                }
                type="button"
              >
                {nextPhase ? `Go to ${nextPhase.title}` : "Back to dashboard"}
              </button>
            </div>
          ) : null}

          <div className="phase-navigation">
            <button
              className="ghost-action"
              disabled={!previousPhase}
              onClick={() => previousPhase && onPhaseSelect(previousPhase.id)}
              type="button"
            >
              Previous phase
            </button>
            <button
              className="primary-action"
              disabled={!nextPhase}
              onClick={() => nextPhase && onPhaseSelect(nextPhase.id)}
              type="button"
            >
              Next phase
            </button>
          </div>
        </article>
      </section>

      {showResetDialog ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-describedby="reset-dialog-description"
            aria-labelledby="reset-dialog-title"
            aria-modal="true"
            className="reset-dialog"
            role="dialog"
          >
            <p className="eyebrow">Start a clean flight</p>
            <h2 id="reset-dialog-title">Reset {profile.name}?</h2>
            <p id="reset-dialog-description">
              This clears the saved checklist ticks for this aircraft only. Other
              aircraft progress stays as-is.
            </p>
            <div className="dialog-actions">
              <button
                autoFocus
                className="ghost-action"
                onClick={onCancelReset}
                type="button"
              >
                Keep progress
              </button>
              <button
                className="primary-action"
                onClick={onConfirmReset}
                type="button"
              >
                Start new flight
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <Plane size={20} aria-hidden="true" />
        <span>{appName}</span>
      </a>
      <span className="sim-badge">MSFS 2024</span>
    </header>
  );
}

export default App;
