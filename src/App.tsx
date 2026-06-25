import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, testConnection } from "./firebase/config";
import { InterviewRole, InterviewSession, Feedback } from "./types";
import { safeStorage } from "./lib/storage";

import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import RoleSelector from "./components/RoleSelector";
import ConversationRoom from "./components/ConversationRoom";
import AssessmentReport from "./components/AssessmentReport";
import AdminBoard from "./components/AdminBoard";
import TipsTricksModal from "./components/TipsTricksModal";

import { Sparkles, Loader2, Award, Users, ShieldAlert, LogOut, Code, User, Lightbulb, Settings, History } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [screen, setScreen] = useState<"auth" | "dashboard" | "role_select" | "interview" | "report" | "admin">("auth");
  const [loading, setLoading] = useState(true);
  const [isAdminAuditing, setIsAdminAuditing] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Active session context state
  const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  // Initialize Auth listeners and run Firestore connectivity tests
  useEffect(() => {
    testConnection(); // Verify connection per skill checklists

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      let activeUser = currentUser;
      
      // If Firebase Auth does not have a user, check if we have a sandbox simulated user
      if (!activeUser) {
        const localSessJson = safeStorage.getItem("sandbox_user_session");
        if (localSessJson) {
          try {
            activeUser = JSON.parse(localSessJson);
          } catch (e) {
            console.warn("Failed to parse sandbox user session", e);
          }
        }
      }

      if (activeUser) {
        if (isMounted) setUser(activeUser);
        
        // Fetch or create user profile to verify role permission
        try {
          let localProfile: any = null;
          try {
            const localProfileStr = safeStorage.getItem("user_profile_" + activeUser.uid);
            if (localProfileStr) {
              localProfile = JSON.parse(localProfileStr);
            }
          } catch (profileErr) {
            console.warn("Could not read local profile storage fallback:", profileErr);
          }

          let profileData: any = null;
          try {
            const uDoc = await getDoc(doc(db, "users", activeUser.uid));
            if (uDoc.exists()) {
              profileData = uDoc.data();
            }
          } catch (firestoreErr) {
            console.warn("Firestore profile fetch warning, using local profile:", firestoreErr);
            profileData = localProfile;
          }

          if (profileData) {
            if (isMounted) {
              setUserRole(profileData.role || "user");
              setScreen("dashboard");
            }
          } else {
            // Self-register with "user" role base (or admin if fits specific email criteria)
            const roleVal = (activeUser.email === "siramgarihimabindu@gmail.com") ? "admin" : "user";
            const newProfile = {
              userId: activeUser.uid,
              email: activeUser.email || "",
              displayName: activeUser.displayName || activeUser.email?.split("@")[0] || "Candidate",
              photoURL: activeUser.photoURL || "",
              role: roleVal,
              createdAt: new Date().toISOString()
            };

            try {
              safeStorage.setItem("user_profile_" + activeUser.uid, JSON.stringify(newProfile));
            } catch (err) {
              console.warn("Could not save new local profile:", err);
            }

            try {
              await setDoc(doc(db, "users", activeUser.uid), newProfile);
            } catch (setErr) {
              console.warn("Firestore profile creation warning (continuing with local session):", setErr);
            }

            if (isMounted) {
              setUserRole(roleVal);
              setScreen("dashboard");
            }
          }
        } catch (e) {
          console.warn("Firestore user profile verification failed, using safe fallback:", e);
          if (isMounted) {
            setUserRole("user"); // safe default
            setScreen("dashboard");
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setUserRole("user");
          setScreen("auth");
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (authenticatedUser: any, role: "user" | "admin") => {
    setUser(authenticatedUser);
    setUserRole(role);
    setScreen("dashboard");
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      safeStorage.removeItem("sandbox_user_session");
      await signOut(auth);
      setSelectedSession(null);
      setSelectedRole(null);
      setScreen("auth");
    } catch (err) {
      console.warn("Sign out notice:", err);
    } finally {
      setLoading(false);
    }
  };

  // Drilldown selection from dashboard history
  const handleSelectSession = (session: InterviewSession) => {
    setSelectedSession(session);
    if (session.status === "completed") {
      setScreen("report");
    } else {
      // Resume ongoing interview screen
      const resolvedRoleObj = {
        id: session.role,
        name: session.role === "swe" ? "Software Engineer" : session.role === "pm" ? "Product Manager" : session.role === "da" ? "Data Analyst" : session.role === "ux" ? "UX Designer" : "Marketing Manager",
        description: "",
        topics: [],
        icon: ""
      };
      setSelectedRole(resolvedRoleObj);
      setScreen("interview");
    }
  };

  const activeRoleName = selectedRole?.name || "General focus";

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-between selection:bg-indigo-600/30 selection:text-indigo-200">
      <div className="bg-blobs"></div>
      
      {/* GLOBAL HUD BAR */}
      <header className="glass sticky top-0 z-50 py-3 px-6 backdrop-blur-md rounded-none border-b border-slate-900/60 shadow-lg shadow-black/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between relative">
          {/* Logo and Website Name */}
          <div 
            onClick={() => user && setScreen("dashboard")} 
            className="flex items-center gap-2.5 group cursor-pointer select-none"
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-650 group-hover:text-white transition-all shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400 group-hover:text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block">Interview Practice Partner</span>
              <span className="text-[10px] text-slate-500 font-mono block">Intelligent Interview Assistant</span>
            </div>
          </div>

          {/* User Profile Avatar Dropdown or Login */}
          <div className="flex items-center gap-3">
            {!user ? (
              <button
                onClick={() => setScreen("auth")}
                className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <div className="relative">
                {/* Profile Trigger button */}
                <button
                  id="profile-dropdown-trigger"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 px-2.5 rounded-xl border border-white/5 bg-slate-950/80 hover:bg-slate-900 transition-all cursor-pointer focus:outline-none"
                >
                  <div className="w-6.5 h-6.5 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Avatar" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-300 max-w-[120px] truncate hidden sm:block">
                    {user.displayName || user.email?.split("@")[0] || "Candidate"}
                  </span>
                  <span className="text-slate-500 text-[9px] select-none">▼</span>
                </button>

                {/* Dropdown Overlay / Card */}
                {isProfileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn text-slate-200">
                      {/* User metadata & Role (Session Info is kept internally here) */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80 select-none">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Avatar" />
                          ) : (
                            <User className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">
                            {user.displayName || "Candidate"}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {user.email}
                          </p>
                          {userRole === "admin" && (
                            <span className="inline-block mt-1 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/20">
                              Platform Admin
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Menu Options */}
                      <div className="py-2 space-y-0.5">
                        <button
                          id="dropdown-history-btn"
                          onClick={() => {
                            setScreen("dashboard");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left py-2 px-2 hover:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2.5 cursor-pointer"
                        >
                          <History className="w-4 h-4 text-indigo-400" />
                          <span>Interview History</span>
                        </button>

                        <button
                          id="dropdown-tips-btn"
                          onClick={() => {
                            setIsTipsOpen(true);
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left py-2 px-2 hover:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2.5 cursor-pointer"
                        >
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>Tips & Strategy</span>
                        </button>

                        <button
                          id="dropdown-settings-btn"
                          onClick={() => {
                            setIsSettingsOpen(true);
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left py-2 px-2 hover:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2.5 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Settings</span>
                        </button>

                        {/* Admin board link only shown to authorized admin profiles */}
                        {userRole === "admin" && (
                          <button
                            id="dropdown-admin-btn"
                            onClick={() => {
                              setScreen("admin");
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left py-2 px-2 hover:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2.5 cursor-pointer"
                          >
                            <ShieldAlert className="w-4 h-4 text-emerald-400" />
                            <span>Platform Administration</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-800/80 pt-2">
                        <button
                          id="dropdown-logout-btn"
                          onClick={() => {
                            handleLogout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left py-2 px-2 hover:bg-rose-950/30 hover:text-rose-400 rounded-xl text-xs font-semibold text-slate-450 transition-all flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* RENDER VIEW MODULE PORTALS */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading practicing workspace configuration...</p>
          </div>
        ) : (
          <>
            {screen === "auth" && (
              <AuthScreen onAuthSuccess={handleAuthSuccess} />
            )}

            {screen === "dashboard" && user && (
              <Dashboard
                user={user}
                userRole={userRole}
                onStartSession={() => {
                  setSelectedSession(null);
                  setSelectedRole(null);
                  setScreen("role_select");
                }}
                onSelectSession={handleSelectSession}
                onLogout={handleLogout}
                onGoToAdmin={() => {
                  if (userRole === "admin") {
                    setScreen("admin");
                  }
                }}
                onShowTips={() => setIsTipsOpen(true)}
              />
            )}

            {screen === "role_select" && (
              <RoleSelector
                onSelect={(role) => {
                  setSelectedRole(role);
                  setSelectedSession(null);
                  setScreen("interview");
                }}
                onGoBack={() => setScreen("dashboard")}
              />
            )}

            {screen === "interview" && user && selectedRole && (
              <ConversationRoom
                user={user}
                role={selectedRole}
                existingSession={selectedSession}
                onFinish={(feedbackObj, sessObj) => {
                  setSelectedSession(sessObj);
                  setIsAdminAuditing(false);
                  setScreen("report");
                }}
                onGoBack={() => {
                  setSelectedSession(null);
                  setSelectedRole(null);
                  setScreen("dashboard");
                }}
              />
            )}

            {screen === "report" && selectedSession && (
              <AssessmentReport
                session={selectedSession}
                isAdminAuditing={isAdminAuditing}
                onGoBack={() => {
                  const redirectScreen = isAdminAuditing ? "admin" : "dashboard";
                  setSelectedSession(null);
                  setSelectedRole(null);
                  setScreen(redirectScreen);
                }}
              />
            )}

            {screen === "admin" && userRole === "admin" && (
              <AdminBoard
                onGoBack={() => setScreen("dashboard")}
                onSelectSession={(sess) => {
                  setSelectedSession(sess);
                  setIsAdminAuditing(true);
                  setScreen("report");
                }}
              />
            )}
          </>
        )}
      </main>

      {/* FOOTER METRICS INFO */}
      {screen !== "interview" && (
        <footer className="border-t border-slate-900/60 bg-slate-950 py-5 text-center text-[10px] text-slate-500 space-y-1 select-none">
          <p>© {new Date().getFullYear()} Interview Practice Suite. All rights reserved.</p>
        </footer>
      )}

      {/* Global Tips & Tricks Strategy Modal */}
      <TipsTricksModal isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />

      {/* Global Practice Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md glass bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mb-2 select-none">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>Practice Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">Configure and optimize your AI interview screening session.</p>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">Voice Recognition</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Capture oral responses naturally using real-time speech processing.</p>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/15">Active</span>
              </div>

              <div className="p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">AI Voice Assistant</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Let the Interview Assistant speak questions automatically.</p>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/15">Active</span>
              </div>

              <div className="p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">Interview Intelligence Engine</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Advanced AI-powered interview evaluation and question generation.</p>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/15">Optimized</span>
              </div>

              <div className="p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">System Visual Theme</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">High-contrast obsidian canvas (Eye-safe dark mode).</p>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">Default</span>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
