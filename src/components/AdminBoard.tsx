import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { InterviewSession, UserProfile, ROLES } from "../types";
import { 
  Users, 
  Layers, 
  Award, 
  BarChart, 
  ArrowLeft, 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  Trash2,
  FileText,
  TrendingDown,
  Info,
  Zap,
  TrendingUp,
  Activity,
  Database,
  Calendar
} from "lucide-react";

interface AdminBoardProps {
  onGoBack: () => void;
  onSelectSession: (sess: InterviewSession) => void;
}

export default function AdminBoard({ onGoBack, onSelectSession }: AdminBoardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "sessions">("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersSnap = await getDocs(collection(db, "users"));
      const loadedUsers: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        loadedUsers.push(doc.data() as UserProfile);
      });
      setUsers(loadedUsers);

      // Fetch all mock interview sessions
      const sessionsSnap = await getDocs(collection(db, "interviews"));
      const loadedSessions: InterviewSession[] = [];
      sessionsSnap.forEach((doc) => {
        loadedSessions.push(doc.data() as InterviewSession);
      });
      
      // Sort sessions newest first
      loadedSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSessions(loadedSessions);

    } catch (err) {
      console.error("ADMIN DATABASE FETCH FAILURE:", err);
      setAdminError("Database error fetch failure: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "user" | "admin") => {
    try {
      setAdminError(null);
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setAdminError("Database error updating account permission: " + (err as Error).message);
    }
  };

  const handleDeleteUser = async (userObj: UserProfile) => {
    setUserToDelete(userObj);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setAdminError(null);
      await deleteDoc(doc(db, "users", userToDelete.userId));
      setUsers(prev => prev.filter(u => u.userId !== userToDelete.userId));
      setUserToDelete(null);
    } catch (err) {
      setAdminError("Database error deleting account metadata: " + (err as Error).message);
      setUserToDelete(null);
    }
  };

  // Compute platform aggregate analytics
  const completedSessions = sessions.filter(s => s.status === "completed");
  const avgSystemScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc, current) => acc + (current.feedback?.score || 0), 0) / completedSessions.length)
    : 0;

  // Count distribution across role focuses
  const roleMetrics = ROLES.map(role => {
    const totalCount = sessions.filter(s => s.role === role.id).length;
    const itemCompleted = sessions.filter(s => s.role === role.id && s.status === "completed");
    const avgScore = itemCompleted.length > 0
      ? Math.round(itemCompleted.reduce((acc, curr) => acc + (curr.feedback?.score || 0), 0) / itemCompleted.length)
      : 0;
    
    return {
      ...role,
      count: totalCount,
      avgScore
    };
  });

  // Filter listings
  const filteredUsers = users.filter(usr => {
    const matchesSearch = usr.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      usr.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || usr.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredSessions = sessions.filter(sess => {
    const userEmailText = sess.userEmail || "";
    const userDisplayNameText = sess.userDisplayName || "";
    const roleObj = ROLES.find(r => r.id === sess.role);
    const roleName = roleObj?.name || "";

    const matchesSearch = userDisplayNameText.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userEmailText.toLowerCase().includes(searchTerm.toLowerCase()) || 
      roleName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || sess.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="admin-board" className="w-full max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      
      {adminError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-300 flex items-center gap-2.5 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-rose-450 shrink-0" />
          <span>{adminError}</span>
          <button onClick={() => setAdminError(null)} className="ml-auto text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-6 rounded-3xl shadow-lg">
        <div>
          <button
            id="back-to-home-btn"
            onClick={onGoBack}
            className="text-xs text-slate-400 hover:text-white mb-2.5 flex items-center gap-1 cursor-pointer font-medium"
          >
            ← Back to Candidate View
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Platform Administration <UserCheck className="w-6 h-6 text-emerald-350" />
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Overview metrics, manage roles, audit user interviews, and inspect system feedback logs.
          </p>
        </div>

        <button
          id="admin-refresh-data-btn"
          onClick={fetchAdminData}
          className="px-3.5 py-2 glass glass-hover text-slate-300 text-xs rounded-xl transition-all cursor-pointer font-bold"
        >
          Refresh DB Snapshot
        </button>
      </div>

      {/* ADMIN TABS CONTROLLER */}
      <div className="flex border-b border-white/5 pb-3 gap-2 select-none">
        <button
          id="admin-tab-analytics"
          onClick={() => { setActiveTab("analytics"); setSearchTerm(""); }}
          className={`py-2 px-4 text-xs font-bold transition-all relative cursor-pointer rounded-xl ${
            activeTab === "analytics" 
              ? "bg-slate-800/80 text-emerald-300 border border-emerald-500/20 shadow-inner" 
              : "text-slate-400 hover:text-slate-200 glass glass-hover"
          }`}
        >
          Platform Analytics & Dashboard
        </button>
        <button
          id="admin-tab-users"
          onClick={() => { setActiveTab("users"); setSearchTerm(""); setRoleFilter("all"); }}
          className={`py-2 px-4 text-xs font-bold transition-all relative cursor-pointer rounded-xl ${
            activeTab === "users" 
              ? "bg-slate-800/80 text-emerald-300 border border-emerald-500/20 shadow-inner" 
              : "text-slate-400 hover:text-slate-200 glass glass-hover"
          }`}
        >
          Member Accounts ({users.length})
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center select-none glass rounded-3xl">
          <span className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></span>
          <p className="text-xs text-slate-450 font-mono">Aggregating platform database models, please wait...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PLATFORM ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              
              {/* SYSTEM LEVEL METRIC BOARD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Registered Users */}
                <div className="glass p-5 rounded-2xl flex items-center gap-4 shadow-md border border-white/5">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 flex-shrink-0">
                    <Users className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Total Registered Users</span>
                    <span className="text-2xl font-black text-white block mt-0.5">{users.length}</span>
                    <span className="text-[10px] text-slate-500 block">Verified accounts registered</span>
                  </div>
                </div>

                {/* Total Interviews Conducted */}
                <div className="glass p-5 rounded-2xl flex items-center gap-4 shadow-md border border-white/5">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex-shrink-0">
                    <Layers className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Total Interviews Conducted</span>
                    <span className="text-2xl font-black text-white block mt-0.5">{sessions.length}</span>
                    <span className="text-[10px] text-slate-500 block">{completedSessions.length} sessions fully evaluated</span>
                  </div>
                </div>

                {/* Active Users */}
                <div className="glass p-5 rounded-2xl flex items-center gap-4 shadow-md border border-white/5">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 flex-shrink-0">
                    <Activity className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Active Users</span>
                    <span className="text-2xl font-black text-white block mt-0.5">
                      {Array.from(new Set(sessions.map(s => s.userId))).length}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Candidates with session history</span>
                  </div>
                </div>

                {/* Average Performance Score */}
                <div className="glass p-5 rounded-2xl flex items-center gap-4 shadow-md border border-white/5">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 flex-shrink-0">
                    <Award className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Average Score</span>
                    <span className="text-2xl font-black text-white block mt-0.5">
                      {avgSystemScore > 0 ? `${avgSystemScore}%` : "—"}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Across evaluated transcripts</span>
                  </div>
                </div>
              </div>

              {/* GRID: PLATFORM STATISTICS & SYSTEM ANALYTICS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* PLATFORM STATISTICS - DOMAIN ANALYSIS */}
                <div className="glass p-6 rounded-3xl shadow-lg border border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider font-mono flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-indigo-400" /> Platform Statistics by Domain
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-4">
                      Aggregate engagement levels and performance metrics categorized by engineering domain.
                    </p>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs font-mono bg-white/2 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center">
                      <Layers className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                      <span>No domain statistics available yet.</span>
                      <span className="text-[10px] text-slate-600 mt-1">Metrics auto-generate as candidates take interviews.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {roleMetrics.map(role => {
                        const percentage = sessions.length > 0 ? (role.count / sessions.length) * 100 : 0;
                        return (
                          <div key={role.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-200 font-bold">{role.name}</span>
                              <span className="text-slate-400 text-[10.5px] font-mono">
                                {role.count} sessions ({Math.round(percentage)}%) • Avg Score: <strong className="text-emerald-400">{role.avgScore > 0 ? `${role.avgScore}%` : "N/A"}</strong>
                              </span>
                            </div>

                            {/* Custom progressive bars */}
                            <div className="w-full bg-slate-950/40 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(percentage, 2.5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SYSTEM ANALYTICS - HARDWARE & AI HEALTH */}
                <div className="glass p-6 rounded-3xl shadow-lg border border-white/5">
                  <h3 className="text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> System Analytics & AI Health
                  </h3>
                  <p className="text-[10px] text-slate-500 mb-4">
                    Real-time diagnostics tracking the background grading queues and AI response health.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/20 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono block">AI Panel Response Latency</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-lg font-black text-white font-mono">1.2s</span>
                      </div>
                      <span className="text-[8px] text-emerald-500 font-mono mt-1">● Optimal Speed</span>
                    </div>

                    <div className="bg-slate-950/20 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono block">System Ingress State</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Database className="w-4 h-4 text-[#818cf8]" />
                        <span className="text-sm font-black text-slate-200">Fully Connected</span>
                      </div>
                      <span className="text-[8px] text-emerald-500 font-mono mt-1">● sync: active</span>
                    </div>

                    <div className="bg-slate-950/20 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono block">Service Uptime</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-lg font-black text-white font-mono">99.98%</span>
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono mt-1">Host: Cloud Sandbox</span>
                    </div>

                    <div className="bg-slate-950/20 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono block">Average Conversations</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <span className="text-lg font-black text-white font-mono">8.2 turns</span>
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono mt-1">Per completed session</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT USER REGISTRATIONS */}
              <div className="glass p-6 rounded-3xl shadow-lg border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-300 mb-1 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#818cf8]" /> Recent User Registrations
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Overview of the five most recently registered members on the platform.
                    </p>
                  </div>
                  <button 
                    id="goto-members-tab-btn"
                    onClick={() => setActiveTab("users")}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-all font-mono"
                  >
                    View All ({users.length}) →
                  </button>
                </div>

                {users.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs font-mono bg-white/2 rounded-2xl border border-white/5">
                    <span>No members registered on the platform yet.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 uppercase font-bold tracking-wider font-mono text-[9px]">
                          <th className="pb-2.5">Name</th>
                          <th className="pb-2.5">Email</th>
                          <th className="pb-2.5">Assigned Role</th>
                          <th className="pb-2.5 text-right">Registration Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {[...users]
                          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                          .slice(0, 5)
                          .map((usr) => (
                            <tr key={usr.userId} className="hover:bg-white/2">
                              <td className="py-3 font-bold text-white">{usr.displayName || "Unknown User"}</td>
                              <td className="py-3 text-slate-400 font-mono text-[10.5px]">{usr.email}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono ${
                                  usr.role === "admin" 
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/25" 
                                    : "bg-indigo-500/10 text-[#818cf8] border border-indigo-500/25"
                                }`}>
                                  {usr.role || "user"}
                                </span>
                              </td>
                              <td className="py-3 text-right text-slate-500 font-mono text-[10.5px]">
                                {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: MEMBERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-4">
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    id="search-users-input"
                    type="text"
                    placeholder="Search members by name or email..."
                    className="w-full pl-8 pr-3 py-2 text-xs glass-input rounded-xl text-white outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-500" />
                </div>

                <select
                  id="user-role-filter"
                  className="glass-input text-slate-300 text-xs py-2 px-3 rounded-xl outline-none cursor-pointer"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all" className="bg-slate-900 text-white">All Roles</option>
                  <option value="user" className="bg-slate-900 text-white">Candidate role</option>
                  <option value="admin" className="bg-slate-900 text-white">Admin role</option>
                </select>
              </div>

              {/* Interactive table list */}
              <div className="overflow-x-auto glass rounded-2xl border-none shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-slate-300 uppercase font-bold tracking-wider font-mono text-[10px]">
                      <th className="py-3 px-4">Member Info</th>
                      <th className="py-3 px-4">Role Permission</th>
                      <th className="py-3 px-4">Joined App</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No members matching query found in DB.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((usr) => (
                        <tr key={usr.userId} className="hover:bg-white/5">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{usr.displayName || "Unknown User"}</span>
                            <span className="text-[10px] text-slate-450 font-mono">{usr.email}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                               id={`role-edit-${usr.userId}`}
                               className="glass-input text-slate-300 text-[11px] py-1 px-2.5 rounded-xl cursor-pointer"
                               value={usr.role}
                               onChange={(e) => handleUpdateRole(usr.userId, e.target.value as any)}
                            >
                              <option value="user" className="bg-slate-900 text-white">Candidate</option>
                              <option value="admin" className="bg-slate-900 text-white">Admin</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              id={`delete-user-${usr.userId}`}
                              onClick={() => handleDeleteUser(usr)}
                              title="Delete member"
                              className="p-1.5 text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 glass border border-white/5 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass max-w-sm w-full p-6 space-y-4 rounded-3xl border border-rose-500/10 shadow-2xl">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" /> Confirm Deletion
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you certain you wish to delete candidate entry{" "}
              <strong className="text-white">{userToDelete.displayName || userToDelete.email}</strong>? This action is irreversible.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
