import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  BatteryFull,
  CalendarCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Signal,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Wifi,
  Workflow,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const tools = [
  { name: "CRM", short: "CRM", icon: Database, action: "Update lead records", status: "Ready", tint: "sky" },
  { name: "Mail", short: "Mail", icon: Mail, action: "Draft approved replies", status: "Guarded", tint: "rose" },
  { name: "Calendar", short: "Cal", icon: CalendarCheck, action: "Book open slots", status: "Ready", tint: "green" },
  { name: "Payments", short: "Pay", icon: CircleDollarSign, action: "Verify status", status: "Approval", tint: "amber" },
  { name: "Support", short: "Support", icon: MessageSquare, action: "Prepare answers", status: "Ready", tint: "violet" }
];

const seedRuns = [
  {
    id: 1,
    input: "Can you check if Maria is qualified and book a call?",
    route: "CRM + Calendar",
    result: "Lead score 86. Tuesday 10:30 slot held.",
    state: "Ready for approval",
    confidence: 92,
    steps: ["Lead matched", "Score calculated", "Slot reserved", "Awaiting approval"]
  },
  {
    id: 2,
    input: "Send follow-up to the Shopify lead from yesterday.",
    route: "CRM + Mail",
    result: "Draft created with lead context and next-step CTA.",
    state: "Needs review",
    confidence: 81,
    steps: ["Lead found", "Thread summarized", "Draft prepared", "Send blocked"]
  },
  {
    id: 3,
    input: "Find the customer order status and summarize it.",
    route: "Database + Support",
    result: "Order found. Customer response is ready.",
    state: "Ready to send",
    confidence: 88,
    steps: ["Order located", "Status verified", "Tone checked", "Reply ready"]
  }
];

const tabViews = {
  run: { label: "Selected Request", empty: "Choose a request or run a new command.", cta: "Run route" },
  approvals: { label: "Approval Gate", empty: "Review the prepared action before release.", cta: "Approve" },
  schedule: { label: "Schedule", empty: "Check held slots and follow-up timing.", cta: "Book slot" },
  people: { label: "Contact Context", empty: "View lead and customer context.", cta: "Open profile" }
};

const routePresets = {
  CRM: "CRM + Calendar",
  Mail: "CRM + Mail",
  Calendar: "CRM + Calendar",
  Payments: "Payments + CRM",
  Support: "Database + Support",
  All: "CRM + Mail + Support"
};

function App() {
  const [selected, setSelected] = useState(seedRuns[0]);
  const [requestList, setRequestList] = useState(seedRuns);
  const [query, setQuery] = useState("");
  const [activeTool, setActiveTool] = useState("All");
  const [activeTab, setActiveTab] = useState("run");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [phoneMode, setPhoneMode] = useState("app");
  const [islandOpen, setIslandOpen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState("expanded");
  const [sheetDrag, setSheetDrag] = useState(null);
  const [routeProgress, setRouteProgress] = useState(seedRuns[0].confidence);
  const [animationKey, setAnimationKey] = useState(0);
  const [activity, setActivity] = useState(["Command Router is live", `${seedRuns[0].route} prepared for approval`]);
  const dragStart = useRef({ y: 0, offset: 0 });
  const snapOffsets = { expanded: 0, peek: 188, collapsed: 398 };

  useEffect(() => {
    if (!isRouting) return undefined;

    const timer = window.setInterval(() => {
      setRouteProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          setIsRouting(false);
          setSelected((currentRun) => {
            const updated = {
              ...currentRun,
              state: "Ready for approval",
              result: "Routing complete. Context, permissions, and next action are ready for review.",
              confidence: 91,
              steps: ["Request captured", "Tools selected", "Context checked", "Review required"]
            };
            setRequestList((currentList) => currentList.map((run) => (run.id === updated.id ? updated : run)));
            return updated;
          });
          setActivity((current) => ["Routing completed", ...current].slice(0, 6));
          return 100;
        }
        return Math.min(current + 13, 100);
      });
    }, 420);

    return () => window.clearInterval(timer);
  }, [isRouting]);

  useEffect(() => {
    if (sheetDrag === null) return undefined;

    const handleMouseMove = (event) => {
      const nextOffset = dragStart.current.offset + event.clientY - dragStart.current.y;
      setSheetDrag(Math.max(0, Math.min(430, nextOffset)));
    };
    const handleMouseUp = () => {
      setSheetDrag((current) => {
        if (current !== null) snapSheetTo(current);
        return null;
      });
    };
    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      const nextOffset = dragStart.current.offset + touch.clientY - dragStart.current.y;
      setSheetDrag(Math.max(0, Math.min(430, nextOffset)));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [sheetDrag]);

  const matchingRequests = useMemo(() => requestList.filter((run) => {
    const searchTarget = `${run.input} ${run.route} ${run.state} ${run.result}`.toLowerCase();
    const matchesSearch = searchTarget.includes(query.toLowerCase());
    const matchesTool = activeTool === "All" || run.route.toLowerCase().includes(activeTool.toLowerCase());
    return matchesSearch && matchesTool;
  }), [activeTool, query, requestList]);

  const pendingCount = requestList.filter((run) => !run.state.includes("Approved")).length;
  const currentTab = tabViews[activeTab];
  const visibleRoute = activeTool === "All" ? selected.route : routePresets[activeTool];
  const liveProgress = isRouting ? routeProgress : selected.confidence;
  const statusTime = "9:41";
  const sheetY = sheetDrag ?? snapOffsets[sheetSnap];

  const pushActivity = (line) => {
    setActivity((current) => [line, ...current].slice(0, 6));
    setAnimationKey((key) => key + 1);
  };

  const selectRun = (run) => {
    setSelected(run);
    setRouteProgress(run.confidence);
    pushActivity(`${run.route} opened`);
  };

  const setTool = (toolName) => {
    setActiveTool(toolName);
    setMenuOpen(false);
    pushActivity(toolName === "All" ? "All tools visible" : `${toolName} filter active`);
  };

  const runCommand = (overrideCommand) => {
    const cleanCommand = (overrideCommand || command).trim();
    if (!cleanCommand) {
      pushActivity("Type a command before routing");
      return;
    }

    const chosenRoute = routePresets[activeTool] || routePresets.All;
    const newRun = {
      id: Date.now(),
      input: cleanCommand,
      route: chosenRoute,
      result: "Routing in progress. Checking context, permissions, and next action.",
      state: "Routing",
      confidence: 64,
      steps: ["Request captured", "Selecting tools", "Checking context", "Waiting for route"]
    };

    setRequestList((current) => [newRun, ...current]);
    setSelected(newRun);
    setCommand("");
    setQuery("");
    setMenuOpen(false);
    setSheetSnap("expanded");
    setActiveTab("run");
    setRouteProgress(12);
    setIsRouting(true);
    pushActivity("New command is routing");
  };

  const completeAction = () => {
    if (isRouting) {
      pushActivity("Finish routing before acting");
      return;
    }

    const actionLabel = currentTab.cta;
    const updated = {
      ...selected,
      state: activeTab === "approvals" ? "Approved" : `${actionLabel} complete`,
      result: `${actionLabel} completed. The action is logged and ready for the next handoff.`,
      confidence: Math.min(selected.confidence + 4, 99),
      steps: [...selected.steps.slice(0, 3), `${actionLabel} logged`]
    };

    setSelected(updated);
    setRouteProgress(updated.confidence);
    setRequestList((current) => current.map((run) => (run.id === selected.id ? updated : run)));
    pushActivity(`${actionLabel} completed`);
  };

  const resetWorkspace = () => {
    setQuery("");
    setActiveTool("All");
    setActiveTab("run");
    setNoticeOpen(false);
    setMenuOpen(false);
    setIsRouting(false);
    setSheetSnap("expanded");
    setRouteProgress(selected.confidence);
    pushActivity("Workspace reset");
  };

  const openPhoneApp = () => {
    setPhoneMode("app");
    setIslandOpen(false);
    pushActivity("Command Router opened");
  };

  const goHome = () => {
    setPhoneMode("home");
    setNoticeOpen(false);
    setIslandOpen(false);
    setMenuOpen(false);
    pushActivity("Returned to Home");
  };

  const lockPhone = () => {
    setPhoneMode("lock");
    setNoticeOpen(false);
    setIslandOpen(false);
    setMenuOpen(false);
    pushActivity("Phone locked");
  };

  const cycleMatchingRequest = () => {
    if (matchingRequests.length === 0) {
      pushActivity("No matching requests to open");
      return;
    }
    const currentIndex = matchingRequests.findIndex((run) => run.id === selected.id);
    const nextRun = matchingRequests[(currentIndex + 1 + matchingRequests.length) % matchingRequests.length];
    selectRun(nextRun);
    setSheetSnap("expanded");
  };

  const startSampleRoute = () => {
    runCommand("Prepare a renewal note for the account owner");
    pushActivity("Sample route launched");
  };

  const snapSheetTo = (offset) => {
    const nextSnap = Object.entries(snapOffsets).reduce((closest, [name, value]) => (
      Math.abs(offset - value) < Math.abs(offset - snapOffsets[closest]) ? name : closest
    ), "expanded");
    setSheetSnap(nextSnap);
    setSheetDrag(null);
    pushActivity(`Sheet ${nextSnap === "peek" ? "partially opened" : nextSnap}`);
  };

  const beginSheetDrag = (event) => {
    dragStart.current = { y: event.clientY, offset: sheetY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setSheetDrag(sheetY);
  };

  const beginSheetMouseDrag = (event) => {
    dragStart.current = { y: event.clientY, offset: sheetY };
    setSheetDrag(sheetY);
  };

  const beginSheetTouchDrag = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    dragStart.current = { y: touch.clientY, offset: sheetY };
    setSheetDrag(sheetY);
  };

  const moveSheetDrag = (event) => {
    if (sheetDrag === null) return;
    const nextOffset = dragStart.current.offset + event.clientY - dragStart.current.y;
    setSheetDrag(Math.max(0, Math.min(430, nextOffset)));
  };

  const moveSheetTouchDrag = (event) => {
    if (sheetDrag === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const nextOffset = dragStart.current.offset + touch.clientY - dragStart.current.y;
    setSheetDrag(Math.max(0, Math.min(430, nextOffset)));
  };

  const endSheetDrag = () => {
    if (sheetDrag === null) return;
    snapSheetTo(sheetDrag);
  };

  const quickCreate = (toolName) => {
    const created = {
      id: Date.now(),
      input: `${toolName} check requested from operations panel`,
      route: routePresets[toolName] || routePresets.All,
      result: `${toolName} workflow queued and waiting for context confirmation.`,
      state: "Queued",
      confidence: 76,
      steps: ["Panel action received", "Workflow queued", "Context pending", "Ready to inspect"]
    };
    setRequestList((current) => [created, ...current]);
    setSelected(created);
    setActiveTool(toolName);
    setActiveTab("run");
    setRouteProgress(created.confidence);
    pushActivity(`${toolName} workflow queued`);
  };

  return (
    <main className="stage">
      <section className="product">
        <div className="copy">
          <div className="copy-heading">
            <p className="eyebrow">Operations Control</p>
            <h1>Command Router</h1>
            <p>Active routing for sales, support, scheduling, and approval-controlled actions.</p>
          </div>

          <div className="ops-summary" aria-label="Operational controls">
            <button onClick={() => setTool("All")}>
              <Radio size={18} />
              <span>Queue</span>
              <strong>{isRouting ? "Routing" : "Live"}</strong>
            </button>
            <button onClick={() => setActiveTab("run")}>
              <TrendingUp size={18} />
              <span>Confidence</span>
              <strong>{Math.round(liveProgress)}%</strong>
            </button>
            <button onClick={() => setActiveTab("approvals")}>
              <ShieldCheck size={18} />
              <span>Approval</span>
              <strong>{selected.state.includes("Approved") ? "Clear" : "Required"}</strong>
            </button>
          </div>

          <div className="activity-card" key={animationKey}>
            <div>
              <strong>Activity</strong>
              <button onClick={() => setActivity(["Activity cleared"])} aria-label="Clear activity">
                <X size={14} />
              </button>
            </div>
            {activity.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </div>
        </div>

        <div className={`device ${isRouting ? "routing" : ""}`} aria-label="Business Agent Command Router">
          <button className="side-button side-button-left" aria-label="Return to Home" onClick={goHome} />
          <button className="side-button side-button-right" aria-label="Lock phone" onClick={lockPhone} />
          <div className="screen">
            <div className="statusbar" aria-label="Phone status">
              <span>{statusTime}</span>
              <div>
                <Signal size={13} />
                <Wifi size={13} />
                <BatteryFull size={15} />
              </div>
            </div>
            <button className={`dynamic-island ${islandOpen ? "open" : ""}`} aria-label="Live activity" onClick={() => setIslandOpen((open) => !open)}>
              {islandOpen && (
                <>
                  <span>{isRouting ? "Routing active" : "Router live"}</span>
                  <strong>{Math.round(liveProgress)}%</strong>
                </>
              )}
            </button>

            {phoneMode === "lock" && (
              <section className="phone-lock" aria-label="Lock screen">
                <div>
                  <span>{statusTime}</span>
                  <strong>Command Router</strong>
                  <p>{pendingCount} updates waiting</p>
                </div>
                <button onClick={openPhoneApp}>Unlock</button>
              </section>
            )}

            {phoneMode === "home" && (
              <section className="phone-home" aria-label="Home screen">
                <div className="home-grid">
                  <button onClick={openPhoneApp}>
                    <span className="home-icon command"><Sparkles size={24} /></span>
                    <em>Router</em>
                  </button>
                  {tools.map(({ name, icon: Icon, tint }) => (
                    <button key={name} onClick={() => {
                      openPhoneApp();
                      setTool(name);
                    }}>
                      <span className={`home-icon ${tint}`}><Icon size={22} /></span>
                      <em>{name}</em>
                    </button>
                  ))}
                </div>
                <div className="home-dock">
                  <button onClick={openPhoneApp}><Zap size={20} /></button>
                  <button onClick={() => {
                    openPhoneApp();
                    setActiveTab("approvals");
                  }}><ShieldCheck size={20} /></button>
                  <button onClick={() => {
                    openPhoneApp();
                    setActiveTab("schedule");
                  }}><CalendarCheck size={20} /></button>
                </div>
              </section>
            )}

            {phoneMode === "app" && (
              <>
            <header className="topbar">
              <div>
                <span>{isRouting ? "Routing" : "Live"}</span>
                <strong>Command Router</strong>
              </div>
              <button aria-label="Notifications" onClick={() => setNoticeOpen((open) => !open)}>
                <Bell size={18} />
                {pendingCount > 0 && <i>{pendingCount}</i>}
              </button>
            </header>

            {noticeOpen && (
              <section className="notification-panel" aria-label="Notifications">
                <div>
                  <strong>{pendingCount} active updates</strong>
                  <button aria-label="Close notifications" onClick={() => setNoticeOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
                <button onClick={() => setActiveTab("approvals")}>Review approval queue</button>
                <button onClick={() => setTool("Support")}>Open support routes</button>
              </section>
            )}

            <label className="searchbar">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests, tools, customers"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => {
                  setQuery("");
                  pushActivity("Search cleared");
                }}>
                  <X size={14} />
                </button>
              )}
            </label>

            <form
              className="command-box"
              onSubmit={(event) => {
                event.preventDefault();
                runCommand();
              }}
            >
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Type a business request"
              />
              <button type="submit" aria-label="Run command">
                {isRouting ? <Pause size={17} /> : <Play size={17} />}
              </button>
            </form>

            <section className="hero-card">
              <div className="hero-card-top">
                <button className="app-icon" aria-label="Start sample route" onClick={startSampleRoute}>
                  <Sparkles size={24} />
                </button>
                <button aria-label="More actions" onClick={() => {
                  setMenuOpen((open) => !open);
                  setNoticeOpen(false);
                }}>
                  <MoreHorizontal size={20} />
                </button>
              </div>
              {menuOpen && (
                <div className="more-menu" aria-label="More actions">
                  <button onClick={resetWorkspace}>Reset workspace</button>
                  <button onClick={() => {
                    const nextSnap = sheetSnap === "expanded" ? "peek" : "expanded";
                    setSheetSnap(nextSnap);
                    pushActivity(nextSnap === "expanded" ? "Details expanded" : "Details partially collapsed");
                  }}>
                    {sheetSnap === "expanded" ? "Collapse details" : "Expand details"}
                  </button>
                  <button onClick={cycleMatchingRequest}>Next request</button>
                </div>
              )}
              <p>Routing Status</p>
              <button className="metric-row" onClick={cycleMatchingRequest} aria-label="Open next matching request">
                <strong>{isRouting ? `${Math.round(routeProgress)}%` : matchingRequests.length}</strong>
                <span>{isRouting ? "route progress" : "matching requests"}</span>
              </button>
              <button className="approval-meter" onClick={() => {
                setActiveTab("approvals");
                setSheetSnap("expanded");
                pushActivity("Approval details opened");
              }} aria-label="Open approval details">
                <span style={{ width: `${Math.min(liveProgress, 100)}%` }} />
              </button>
              <div className="route-pulse" />
            </section>

            <section className="quick-actions" aria-label="Tool shortcuts">
              <button className={`quick neutral ${activeTool === "All" ? "active" : ""}`} aria-label="All tools" onClick={() => setTool("All")}>
                <Workflow size={19} />
                <span>All</span>
              </button>
              {tools.map(({ name, short, icon: Icon, tint }) => (
                <button className={`quick ${tint} ${activeTool === name ? "active" : ""}`} key={name} aria-label={name} onClick={() => setTool(name)}>
                  <Icon size={19} />
                  <span>{short}</span>
                </button>
              ))}
            </section>

            <section className="request-stack">
              <div className="section-title">
                <h2>Requests</h2>
                <button onClick={resetWorkspace}>View all</button>
              </div>
              {matchingRequests.map((run) => (
                <button className={`request ${selected.id === run.id ? "selected" : ""}`} key={run.id} onClick={() => selectRun(run)}>
                  <span className="request-icon">
                    {selected.id === run.id ? <Check size={17} /> : <Workflow size={17} />}
                  </span>
                  <span>
                    <strong>{run.input}</strong>
                    <em>{run.route}</em>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
              {matchingRequests.length === 0 && (
                <div className="empty-state">
                  <strong>No matching requests</strong>
                  <span>Clear the search or switch tools.</span>
                  <button onClick={resetWorkspace}>Clear filters</button>
                </div>
              )}
            </section>

            <section
              className={`sheet ${isRouting ? "working" : ""} ${sheetSnap}`}
              style={{ "--sheet-y": `${sheetY}px` }}
            >
              <button
                className="grabber"
                aria-label="Drag details sheet"
                onClick={() => {
                  const nextSnap = sheetSnap === "expanded" ? "peek" : sheetSnap === "peek" ? "collapsed" : "expanded";
                  setSheetSnap(nextSnap);
                  pushActivity(`Sheet ${nextSnap === "peek" ? "partially opened" : nextSnap}`);
                }}
                onPointerDown={beginSheetDrag}
                onPointerMove={moveSheetDrag}
                onPointerUp={endSheetDrag}
                onPointerCancel={endSheetDrag}
                onMouseDown={beginSheetMouseDrag}
                onMouseMove={moveSheetDrag}
                onMouseUp={endSheetDrag}
                onMouseLeave={endSheetDrag}
                onTouchStart={beginSheetTouchDrag}
                onTouchMove={moveSheetTouchDrag}
                onTouchEnd={endSheetDrag}
              />
              <div className="sheet-heading">
                <div>
                  <span>{currentTab.label}</span>
                  <h2>{isRouting ? "Routing" : selected.state}</h2>
                </div>
                <div className="confidence">{Math.round(liveProgress)}%</div>
              </div>
              <p>{selected.result || currentTab.empty}</p>
              <div className="timeline">
                {selected.steps.map((step, index) => (
                  <div className="timeline-row" key={`${selected.id}-${step}`}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
              <button className="sheet-action" onClick={completeAction}>{isRouting ? "Routing..." : currentTab.cta}</button>
            </section>

            <nav className="tabs" aria-label="Primary">
              {Object.keys(tabViews).map((tab) => {
                const Icon = tab === "run" ? Zap : tab === "approvals" ? ShieldCheck : tab === "schedule" ? Clock3 : UserRoundCheck;
                return (
                  <button className={activeTab === tab ? "active" : ""} aria-label={tabViews[tab].label} key={tab} onClick={() => setActiveTab(tab)}>
                    <Icon size={20} />
                  </button>
                );
              })}
            </nav>
              </>
            )}

            <button className="home-indicator" aria-label={phoneMode === "app" ? "Go Home" : "Open Command Router"} onClick={phoneMode === "app" ? goHome : openPhoneApp} />
          </div>
        </div>

        <aside className="inspector">
          <div className="inspector-header">
            <span>Current Route</span>
            <strong>{visibleRoute}</strong>
            <button onClick={runCommand}>
              <Send size={15} />
              Route command
            </button>
          </div>
          <div className="tool-list">
            {tools.map(({ name, icon: Icon, action, status, tint }) => (
              <button className={`tool-row ${selected.route.includes(name) || activeTool === name ? "active" : ""}`} key={name} onClick={() => quickCreate(name)}>
                <span className={`tool-mark ${tint}`}>
                  <Icon size={18} />
                </span>
                <div>
                  <h3>{name}</h3>
                  <p>{action}</p>
                </div>
                <em>{status}</em>
              </button>
            ))}
          </div>
          <button className="sync-button" onClick={resetWorkspace}>
            <RefreshCw size={16} />
            Reset workspace
          </button>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
