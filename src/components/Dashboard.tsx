import { useState, useEffect } from "react";
import { InterviewSession, Feedback, ROLES, InterviewRole } from "../types";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { safeStorage } from "../lib/storage";
import { 
  BarChart, 
  Sparkles, 
  CheckCircle, 
  BookOpen, 
  History, 
  Plus, 
  TrendingUp, 
  LogOut, 
  Loader2,
  ShieldAlert, 
  Award, 
  Search,
  Filter,
  ArrowRight,
  ClipboardList,
  User,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  FileText
} from "lucide-react";

interface DashboardProps {
  user: any;
  userRole: "user" | "admin";
  onStartSession: () => void;
  onSelectSession: (sess: InterviewSession) => void;
  onLogout: () => void;
  onGoToAdmin: () => void;
  onShowTips: () => void;
}

export default function Dashboard({ user, userRole, onStartSession, onSelectSession, onLogout, onGoToAdmin, onShowTips }: DashboardProps) {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [adminStats, setAdminStats] = useState<{ totalUsers: number, totalSessions: number } | null>(null);

  useEffect(() => {
    fetchUserSessions();
  }, [user.uid]);

  useEffect(() => {
    if (userRole === "admin") {
      const fetchAdminStats = async () => {
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          const interviewsSnap = await getDocs(collection(db, "interviews"));
          setAdminStats({
            totalUsers: usersSnap.size,
            totalSessions: interviewsSnap.size
          });
        } catch (err) {
          console.warn("Error fetching admin stats:", err);
        }
      };
      fetchAdminStats();
    }
  }, [userRole]);

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      
      // Load local storage fallback sessions first
      let localSessions: InterviewSession[] = [];
      try {
        const localStr = safeStorage.getItem("user_interviews_" + user.uid);
        if (localStr) {
          localSessions = JSON.parse(localStr);
        }
      } catch (err) {
        console.warn("Error parsing local sessions backup:", err);
      }

      let loaded: InterviewSession[] = [];
      try {
        const q = query(
          collection(db, "interviews"),
          where("userId", "==", user.uid)
        );
        
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          loaded.push(doc.data() as InterviewSession);
        });
      } catch (err) {
        console.warn("Firestore sessions load warning, defaulting to secure local storage:", err);
        // Fallback entirely to local storage if Firestore fails
        loaded = localSessions;
      }

      // Merge local and firestore sessions to avoid duplicates, keeping most recently updated
      const mergedMap = new Map<string, InterviewSession>();
      localSessions.forEach(s => mergedMap.set(s.id, s));
      loaded.forEach(s => {
        const existing = mergedMap.get(s.id);
        if (!existing || new Date(s.completedAt || s.createdAt).getTime() > new Date(existing.completedAt || existing.createdAt).getTime()) {
          mergedMap.set(s.id, s);
        }
      });

      const finalSessions = Array.from(mergedMap.values());

      // Sort by date descending
      finalSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setSessions(finalSessions);
    } catch (err) {
      console.warn("Error loading user dashboard history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats helper
  const completedSessions = sessions.filter(s => s.status === "completed");
  const averageScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc, current) => acc + (current.feedback?.score || 0), 0) / completedSessions.length)
    : 0;

  // Group by role to compute counts
  const roleAttempts = sessions.reduce((acc: { [key: string]: number }, cur) => {
    acc[cur.role] = (acc[cur.role] || 0) + 1;
    return acc;
  }, {});

  const favoriteRole = Object.entries(roleAttempts).length > 0
    ? Object.entries(roleAttempts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
    : null;

  const favoriteRoleName = favoriteRole 
    ? ROLES.find(r => r.id === favoriteRole)?.name || "General focus"
    : "No sessions yet";

  // Filter sessions for listing
  const filteredSessions = sessions.filter(sess => {
    const roleObj = ROLES.find(r => r.id === sess.role);
    const roleName = roleObj?.name || "";
    
    const matchesSearch = roleName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sess.chatHistory.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRoleFilter === "all" || sess.role === selectedRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div id="user-dashboard" className="w-full max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full glass border border-white/10 flex items-center justify-center text-indigo-400">
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" alt="Profile" />
            ) : (
              <User className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome back, {user.displayName || "Candidate"}!
              </h1>
              {userRole === "admin" && (
                <span className="px-2.5 py-0.5 neon-pill-amber text-[10px] font-mono font-bold rounded-lg flex items-center gap-1">
                  Admin Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {userRole === "admin"
                ? "Manage platform operations, monitor user activity, and oversee interview performance analytics."
                : "Refine your conceptual and technical interview execution. Keep practicing."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {userRole === "admin" && (
            <button
              id="goto-admin-btn"
              onClick={onGoToAdmin}
              className="py-2.5 px-4 glass glass-hover text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Platform Administration</span>
              <BookOpen className="w-4 h-4" />
            </button>
          )}

          <button
            id="start-new-session-btn"
            onClick={onStartSession}
            className="py-2.5 px-5 bg-gradient-to-r from-[#38bdf8] to-[#818cf8] hover:opacity-90 active:scale-95 text-slate-900 text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Launch Practice Partner</span>
          </button>

          <button
            id="dash-logout-btn"
            onClick={onLogout}
            className="p-2.5 glass glass-hover text-slate-400 hover:text-white rounded-xl cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* METRICS PANEL */}
      {userRole === "admin" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Admin Account Card */}
          <div className="glass p-6 rounded-2xl border border-amber-500/10 flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Access Level</span>
                <h3 className="text-lg font-black text-white mt-0.5">Admin Account</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  You are signed in as a system administrator. You have full oversight of candidate practice sessions, evaluation logs, and user metadata.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
              <span>Security Clearance: LEVEL 1</span>
              <span className="text-amber-400 font-mono font-bold">ACTIVE</span>
            </div>
          </div>

          {/* Platform Administration Card */}
          <div className="glass p-6 rounded-2xl border border-indigo-500/10 flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono font-bold">Management Panel</span>
                <h3 className="text-lg font-black text-white mt-0.5">Platform Administration</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Audit live submissions, inspect performance analytics, and manage access roles for registered platform users.
                </p>
              </div>
            </div>
            <button
              onClick={onGoToAdmin}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Launch Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Administrative Statistics Card */}
          <div className="glass p-6 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <BarChart className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Platform Metrics</span>
                <h3 className="text-lg font-black text-white mt-0.5">Administrative Statistics</h3>
                
                {adminStats ? (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] uppercase font-bold text-slate-550 block font-mono font-semibold">Total Candidates</span>
                      <span className="text-xl font-black text-white">{adminStats.totalUsers}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] uppercase font-bold text-slate-550 block font-mono font-semibold">Interviews Run</span>
                      <span className="text-xl font-black text-white">{adminStats.totalSessions}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 font-mono">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Synchronizing aggregates...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
              <span>Database Sync</span>
              <span className="text-emerald-400 font-mono">Healthy</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          {/* Card 1: Practice Sessions */}
          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-indigo-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Practice Sessions</span>
              <span className="text-2xl font-black text-white block mt-0.5">{sessions.length}</span>
              <span className="text-[10px] text-slate-500 block">{completedSessions.length} completed assessments</span>
            </div>
          </div>

          {/* Card 2: Performance Metrics */}
          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Performance Metrics</span>
              <span className="text-2xl font-black text-white block mt-0.5">
                {averageScore > 0 ? `${averageScore}%` : "—"}
              </span>
              <span className="text-[10px] text-slate-500 block">Target benchmark is 85%</span>
            </div>
          </div>

          {/* Card 3: Interview Statistics */}
          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-sky-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Interview Statistics</span>
              <span className="text-[13px] font-black text-white block mt-1 leading-snug truncate max-w-[170px]">{favoriteRoleName}</span>
              <span className="text-[10px] text-slate-500 block">Based on session history logs</span>
            </div>
          </div>

          {/* Card 4: Progress Tracking */}
          <div className="glass p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Progress Tracking</span>
              <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                <CheckCircle className="w-3" /> Growth
              </span>
            </div>
            
            {completedSessions.length > 1 ? (
              <div className="h-12 w-full flex items-end justify-between pt-1">
                <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d={`M ${completedSessions.map((s, i) => `${(i / (completedSessions.length - 1)) * 100},${30 - ((s.feedback?.score || 0) / 100) * 25}`).join(" L ")}`}
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.6)"
                    strokeWidth="2"
                  />
                  {completedSessions.map((s, i) => (
                    <circle
                      key={i}
                      cx={(i / (completedSessions.length - 1)) * 100}
                      cy={30 - ((s.feedback?.score || 0) / 100) * 25}
                      r="2.5"
                      fill="#38bdf8"
                    />
                  ))}
                </svg>
              </div>
            ) : (
              <div className="text-slate-500 text-[10px] italic py-2 flex items-center justify-center font-mono">
                Requires 2+ completed screens
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK PRE-FLIGHT / OPERATIONAL BANNER */}
      {userRole === "admin" ? (
        <div className="glass p-5 rounded-3xl bg-amber-950/15 border-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              Platform Operations: Active Monitoring & Analytics
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Oversee live candidate practice sessions, inspect evaluation performance metrics, and manage user clearance roles across the platform.
            </p>
          </div>
          <button
            onClick={onGoToAdmin}
            className="py-2.5 px-4.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-[11px] font-black text-amber-400 hover:text-white rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Platform Administration</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="glass p-5 rounded-3xl bg-indigo-950/15 border-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-400 animate-pulse" />
              Ace Your Interview: Clarifying Questions & The STAR Framework
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Hiring loops focus heavily on structured responses. Before initiating a coding attempt, ask <b>clarifying questions</b> on scale limits. When answering situational prompts, structure ownership with the <b>S.T.A.R.</b> method.
            </p>
          </div>
          <button
            onClick={onShowTips}
            className="py-2.5 px-4.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-[11px] font-black text-[#818cf8] hover:text-white rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Open Strategy Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERING GRID */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <History className="w-4.5 h-4.5 text-indigo-400" /> {userRole === "admin" ? "Platform Session Logs" : "Historic Practice Logs"}
          </h2>
          
          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                id="search-history-input"
                type="text"
                placeholder={userRole === "admin" ? "Search candidate sessions..." : "Search history content..."}
                className="pl-8 pr-3 py-1.5 text-xs glass-input rounded-xl text-white outline-none w-full sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-550" />
              <select
                id="role-filter"
                className="glass-input text-slate-300 text-xs py-1.5 px-3 rounded-xl outline-none cursor-pointer"
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
              >
                <option value="all" className="bg-slate-900 text-white">All Roles</option>
                {ROLES.map(role => (
                  <option key={role.id} value={role.id} className="bg-slate-900 text-white">{role.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass p-12 text-center rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Synchronizing interview transcripts...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl flex flex-col items-center select-none">
            <ClipboardList className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-300">
              {userRole === "admin"
                ? "No interview sessions found across the platform."
                : "No interview sessions found. Start your first practice session."}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 mb-5">
              {userRole === "admin"
                ? "Candidate practice logs and AI evaluation transcripts will appear here automatically once users begin practicing."
                : "Launch our companion practice platform to start practicing technical questions and reviewing custom AI feedback logs."}
            </p>
            <button
              id="empty-launch-btn"
              onClick={onStartSession}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
            >
              <span>Start Practice Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((sess) => {
              const roleObj = ROLES.find(r => r.id === sess.role);
              const isOver = sess.status === "completed";
              return (
                <div
                  id={`history-item-${sess.id}`}
                  key={sess.id}
                  onClick={() => onSelectSession(sess)}
                  className="glass glass-hover p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(sess.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      
                      {isOver ? (
                        <div className="flex items-center gap-1 text-indigo-400">
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-mono font-bold text-xs text-[#38bdf8]">Score: {sess.feedback?.score}%</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 neon-pill-amber rounded-lg text-[9px] font-bold">
                          Ongoing Screen
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-all">
                        {roleObj?.name || "General Area Practice"}
                      </h4>
                      <p className="text-xs text-slate-450 line-clamp-2 mt-1 leading-normal">
                        {isOver 
                          ? sess.feedback?.summary 
                          : `Ongoing technical conversation with ${sess.chatHistory.length} interactions logged.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[10px] text-slate-550 font-medium">
                    <span>{sess.chatHistory.length} messages in transcription</span>
                    <span className="text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                      {isOver ? "View performance dashboard" : "Resume session"} →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
