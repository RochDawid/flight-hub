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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { a320neoProfile } from "./data/a320neo";
import type { AircraftProfile, FlightPhase } from "./types";

type Route = "dashboard" | "checklist";

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

const profile = a320neoProfile;
const storageKey = `flight-checklists:${profile.id}:session:v1`;

function readRoute(): Route {
  return window.location.hash === "#a320neo" ? "checklist" : "dashboard";
}

function createSession(): ChecklistSession {
  return {
    completed: {},
    activePhaseId: profile.phases[0].id,
  };
}

function loadSession(): ChecklistSession {
  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return createSession();
    }

    const parsed = JSON.parse(raw) as Partial<ChecklistSession>;
    const activePhaseExists = profile.phases.some(
      (phase) => phase.id === parsed.activePhaseId,
    );

    return {
      completed: parsed.completed ?? {},
      activePhaseId: activePhaseExists
        ? parsed.activePhaseId!
        : profile.phases[0].id,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return createSession();
  }
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

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [session, setSession] = useState<ChecklistSession>(loadSession);
  const [recentlyCheckedItemId, setRecentlyCheckedItemId] = useState<
    string | null
  >(null);

  const allItemIds = useMemo(() => getAllItemIds(profile), []);
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const activePhase =
    profile.phases.find((phase) => phase.id === session.activePhaseId) ??
    profile.phases[0];

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [route]);

  useEffect(() => {
    if (!recentlyCheckedItemId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyCheckedItemId(null);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyCheckedItemId]);

  function openChecklist() {
    window.location.hash = "a320neo";
    setRoute("checklist");
  }

  function openDashboard() {
    window.history.pushState("", document.title, window.location.pathname);
    setRoute("dashboard");
  }

  function setActivePhase(activePhaseId: string) {
    setSession((current) => ({
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

    setSession((current) => ({
      ...current,
      completed: {
        ...current.completed,
        [itemId]: !current.completed[itemId],
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function resetSession() {
    const confirmed = window.confirm(
      "Reset the A320neo checklist session for a new flight?",
    );

    if (!confirmed) {
      return;
    }

    const nextSession = createSession();
    window.localStorage.removeItem(storageKey);
    setSession(nextSession);
  }

  if (route === "checklist") {
    return (
      <ChecklistPage
        activePhase={activePhase}
        completedCount={completedCount}
        onBack={openDashboard}
        onPhaseSelect={setActivePhase}
        onReset={resetSession}
        onToggleItem={toggleItem}
        overallPercent={overallPercent}
        profile={profile}
        recentlyCheckedItemId={recentlyCheckedItemId}
        session={session}
        totalCount={totalCount}
      />
    );
  }

  return (
    <DashboardPage
      completedCount={completedCount}
      onOpenChecklist={openChecklist}
      overallPercent={overallPercent}
      profile={profile}
      session={session}
      totalCount={totalCount}
    />
  );
}

type DashboardProps = {
  completedCount: number;
  onOpenChecklist: () => void;
  overallPercent: number;
  profile: AircraftProfile;
  session: ChecklistSession;
  totalCount: number;
};

function DashboardPage({
  completedCount,
  onOpenChecklist,
  overallPercent,
  profile,
  session,
  totalCount,
}: DashboardProps) {
  const nextPhase =
    profile.phases.find(
      (phase) => getPhaseCompletion(phase, session.completed).done < phase.items.length,
    ) ?? profile.phases[profile.phases.length - 1];

  return (
    <main className="app-shell dashboard-shell">
      <TopBar />

      <section className="dashboard-grid">
        <div className="intro-panel">
          <p className="eyebrow">MSFS 2024 checklist companion</p>
          <h1>Flight Checklists</h1>
          <p className="intro-copy">
            A minimalist aircraft checklist hub for running a clean simulator
            flight from stand to destination gate. Start with the iniBuilds
            A320neo, keep the useful planning tools nearby, and tick through
            each phase beside the sim.
          </p>

          <div className="notice">
            <Info size={18} aria-hidden="true" />
            <span>
              Simulator-only guidance. This is not real-world aviation
              instruction.
            </span>
          </div>
        </div>

        <AircraftCard
          completedCount={completedCount}
          nextPhaseTitle={nextPhase.title}
          onOpenChecklist={onOpenChecklist}
          overallPercent={overallPercent}
          profile={profile}
          session={session}
          totalCount={totalCount}
        />
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
  return (
    <article className="aircraft-card">
      <div className="aircraft-card-header">
        <div>
          <p className="eyebrow">First aircraft profile</p>
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

      <button className="primary-action" onClick={onOpenChecklist} type="button">
        Open A320neo checklist
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
  onPhaseSelect: (phaseId: string) => void;
  onReset: () => void;
  onToggleItem: (itemId: string) => void;
  overallPercent: number;
  profile: AircraftProfile;
  recentlyCheckedItemId: string | null;
  session: ChecklistSession;
  totalCount: number;
};

function ChecklistPage({
  activePhase,
  completedCount,
  onBack,
  onPhaseSelect,
  onReset,
  onToggleItem,
  overallPercent,
  profile,
  recentlyCheckedItemId,
  session,
  totalCount,
}: ChecklistProps) {
  const activeCompletion = getPhaseCompletion(activePhase, session.completed);

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

      <section className="checklist-layout">
        <nav className="phase-rail" aria-label="Flight phases">
          {profile.phases.map((phase, index) => {
            const completion = getPhaseCompletion(phase, session.completed);
            const isActive = phase.id === activePhase.id;
            const isComplete = completion.done === completion.total;

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
        </article>
      </section>
    </main>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <Plane size={20} aria-hidden="true" />
        <span>Flight Checklists</span>
      </a>
      <span className="sim-badge">MSFS 2024</span>
    </header>
  );
}

export default App;
