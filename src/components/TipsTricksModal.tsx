import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  CheckCircle, 
  HelpCircle, 
  Lightbulb, 
  Layers, 
  Target, 
  ClipboardList, 
  AlertCircle,
  ThumbsUp,
  Code2,
  Bookmark
} from "lucide-react";

interface TipsTricksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "star" | "questions" | "communication" | "checklist";

export default function TipsTricksModal({ isOpen, onClose }: TipsTricksModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("star");

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="tips-tricks-modal-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10"
      >
        {/* Backdrop glass */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          id="tips-tricks-modal-content"
          className="relative w-full max-w-4xl max-h-[85vh] md:max-h-[80vh] flex flex-col bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/5 flex items-start justify-between bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/10">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Technical Interview Strategy Guide
                  <span className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    STAR & Strategy
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actionable techniques, structuring models, and mental check-ins utilized by top engineering candidates.
                </p>
              </div>
            </div>
            
            <button
              id="close-tips-tricks-top"
              onClick={onClose}
              className="p-1.5 rounded-lg glass glass-hover text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close Guide"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Navigator Tabs */}
          <div className="px-5 sm:px-6 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/60 shrink-0">
            <button
              id="tab-star"
              onClick={() => setActiveTab("star")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "star" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>STAR Method</span>
            </button>
            
            <button
              id="tab-questions"
              onClick={() => setActiveTab("questions")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "questions" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Clarifying Questions</span>
            </button>

            <button
              id="tab-communication"
              onClick={() => setActiveTab("communication")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "communication" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Thinking Out Loud</span>
            </button>

            <button
              id="tab-checklist"
              onClick={() => setActiveTab("checklist")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "checklist" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Success Checklist</span>
            </button>
          </div>

          {/* Tab Content Wrapper */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-950/20">
            
            {/* STAR FRAMEWORK TAB */}
            {activeTab === "star" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass p-4 rounded-2xl bg-indigo-950/10 border-indigo-500/10 space-y-2">
                  <h4 className="text-sm font-black text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Why STAR Matters
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The <strong>STAR Method</strong> is the gold standard for answering behavioral and situational technical prompts. It forces you to anchor your abstract accomplishments into concrete stories detailing your exact ownership, trade-off analysis, and subsequent quantifiable results. Use it to avoid trailing off or writing unstructured thoughts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* S - Situation */}
                  <div className="glass p-4 rounded-xl border-white/5 space-y-2 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center font-mono font-black text-xs">S</span>
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Situation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Set the scene by offering critical, high-level context of the engineering challenge. What was the state of the product, client friction point, or system debt? Keep it brief (15% of your talk).
                    </p>
                    <div className="bg-slate-905/30 p-2 rounded text-[10px] text-[#38bdf8] font-mono leading-relaxed">
                      "Our payments database experienced severe deadlock issues whenever batch refunds ran during peak hours."
                    </div>
                  </div>

                  {/* T - Task */}
                  <div className="glass p-4 rounded-xl border-white/5 space-y-2 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#818cf8]/10 text-[#818cf8] flex items-center justify-center font-mono font-black text-xs">T</span>
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Task</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Detail what you were personally tasked with resolving. Include scale parameters (e.g. throughput requirements, latency constraints) or business goals to contextualize the difficulty (10% of talk).
                    </p>
                    <div className="bg-slate-905/30 p-2 rounded text-[10px] text-[#818cf8] font-mono leading-relaxed">
                      "Simplify locking mechanisms to bring peak database refund locks down below 50ms while ensuring ACID compliance."
                    </div>
                  </div>

                  {/* A - Action */}
                  <div className="glass p-4 rounded-xl border-white/5 space-y-2 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-black text-xs">A</span>
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Action (60% weights)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This is the core. Focus on what <strong>you</strong> specifically evaluated and implemented. Mention design patterns, algorithms, frameworks, and why you selected them over solid alternatives. Discuss trade-offs!
                    </p>
                    <div className="bg-slate-905/30 p-2 rounded text-[10px] text-amber-400 font-mono leading-relaxed">
                      "I migrated locks to optimistic concurrency control, introduced Redis as intermediate caching, and decoupled the queries."
                    </div>
                  </div>

                  {/* R - Result */}
                  <div className="glass p-4 rounded-xl border-white/5 space-y-2 hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-black text-xs">R</span>
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Result</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Share the positive, quantifiable outcomes. What metrics improved? How was team delivery affected? Share post-mortems or lessons learned. Real data makes your answers indisputable (15% of talk).
                    </p>
                    <div className="bg-slate-905/30 p-2 rounded text-[10px] text-emerald-400 font-mono leading-relaxed">
                      "Locks dropped by 92% (averaging 4ms), preventing refund failures and saving 20 engineering support hours per week."
                    </div>
                  </div>
                </div>

                <div className="p-4 glass rounded-2xl bg-[#38bdf8]/5 border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                    💡 Executive Pro-Tip for STAR Method
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Always prepare <strong>three distinct stories</strong> before an interview, representing: a time you solved a complex technical bug, a time you dealt with ambiguous product specifications, and a time you had healthy project friction with a peer. Structure all three according to these pillars.
                  </p>
                </div>
              </div>
            )}

            {/* CLARIFYING QUESTIONS TAB */}
            {activeTab === "questions" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass p-4 rounded-2xl border-indigo-500/10 bg-indigo-950/10 space-y-2">
                  <h4 className="text-sm font-black text-indigo-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4.5 h-4.5" /> What are Clarifying Questions?
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Interviewers often present broad, open-ended, or intentionally vague prompt sheets. Candidates who jump straight into coding or architecture layout without framing the parameters usually fail immediately. 
                    <strong> Asking clarifying questions</strong> shows mature product craftsmanship, system awareness, and professional user-centrism.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Core Areas to Clarify in System & Coding Questions
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-4 glass rounded-xl space-y-2 border-white/5">
                      <span className="text-xs font-bold text-[#818cf8] block">1. Scale & Traffic Assumptions</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Find out standard and peak metrics. Are you supporting 1,000 requests per day, or 100,000 requests per second? This directly determines whether you design a simple monolith or decoupled distributed queues.
                      </p>
                      <span className="text-[10px] text-indigo-300 italic block font-mono">"What are our peak read vs. write ratios?"</span>
                    </div>

                    <div className="p-4 glass rounded-xl space-y-2 border-white/5">
                      <span className="text-xs font-bold text-[#38bdf8] block">2. Input Formats & Constraint Space</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Understand data flow structures. Are input strings ASCII-only or UTF-8? Do users upload files, images, or metadata packages? Can we fit data sets in standard memory or does it require database paging?
                      </p>
                      <span className="text-[10px] text-indigo-300 italic block font-mono">"Can we assume inputs contain no duplication and fit in local RAM?"</span>
                    </div>

                    <div className="p-4 glass rounded-xl space-y-2 border-white/5">
                      <span className="text-xs font-bold text-amber-400 block">3. User Experience & SLAs</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        What latency is acceptable to the end user? Is extreme real-time synchronization required (e.g. Chat apps), or is high consistency and ledger transaction exactness essential (e.g. Ledger updates)?
                      </p>
                      <span className="text-[10px] text-indigo-300 italic block font-mono">"Is immediate consistency critical, or is eventual consistency acceptable?"</span>
                    </div>

                    <div className="p-4 glass rounded-xl space-y-2 border-white/5">
                      <span className="text-xs font-bold text-emerald-400 block">4. Boundary & Edge Cases</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Clarify how the application handles downtime, network interruptions, or abnormal user scenarios (like empty records, malicious inputs, or high load).
                      </p>
                      <span className="text-[10px] text-indigo-300 italic block font-mono">"How should the backend proceed if the third-party payment partner is down?"</span>
                    </div>

                  </div>
                </div>

                <div className="p-4 border border-rose-500/10 bg-rose-950/10 rounded-2xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" /> What NOT to do
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Do not ask thirty minor questions. Focus on the <strong>top 2 or 3 critical questions</strong> that actually impact your algorithm, technology selection, or implementation approach.
                  </p>
                </div>
              </div>
            )}

            {/* THINKING OUT LOUD TAB */}
            {activeTab === "communication" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass p-4 rounded-2xl border-indigo-500/10 bg-indigo-950/10 space-y-2">
                  <h4 className="text-sm font-black text-indigo-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4.5 h-4.5" /> Articulate the "Mental Draft"
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Interviewers do not want a silent genius who reveals a perfect answer after twenty minutes of complete silence. They value collaborative engineers who can co-design. 
                    <strong> Vocalizing your thoughts</strong>, even during blockages, allows the interviewer to provide gentle hints, saves time, and establishes healthy team dynamics.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Phrasing Patterns to Practice
                  </h5>

                  <div className="space-y-3">
                    <div className="flex gap-3 p-3.5 glass rounded-xl border-white/5">
                      <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-[10px] shrink-0 mt-0.5">1</div>
                      <div>
                        <span className="text-xs font-bold text-white block">When exploring solutions:</span>
                        <p className="text-xs text-indigo-300 italic mt-0.5">
                          "I can start with a basic brute-force solution involving nested loops, which runs in O(N²) time. However, to optimize, we can trade O(N) memory by introducing a hash map to reduce runtime to O(N). Let's sketch that down..."
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3.5 glass rounded-xl border-white/5">
                      <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-[10px] shrink-0 mt-0.5">2</div>
                      <div>
                        <span className="text-xs font-bold text-white block">When writing code or planning architecture:</span>
                        <p className="text-xs text-indigo-300 italic mt-0.5">
                          "Now I am choosing to model this session state using a centralized state token rather than a cookie. This prevents cookie overflow and scale concerns later. I will implement a safe key validation layer first."
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3.5 glass rounded-xl border-white/5">
                      <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-[10px] shrink-0 mt-0.5">3</div>
                      <div>
                        <span className="text-xs font-bold text-white block">When you encounter a technical bug or logic block:</span>
                        <p className="text-xs text-indigo-300 italic mt-0.5">
                          "I see that my outer counter variable is going out of bounds for single-element arrays here. Let's trace it manually with an index of 0 to see how we should update our loop guard condition..."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-2xl flex gap-3">
                  <ThumbsUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-extrabold text-white block">How to handle silence safely:</span>
                    <p className="text-[11px] text-slate-350 mt-1 leading-relaxed">
                      If you need 60 seconds of silent thinking to compute math or design a complex code block, make an explicit contract with the interviewer: 
                      <em> "I will take a silent minute to concentrate on the recursive math here and write down potential test outputs, then I will explain what I concluded."</em>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PREPARATION CHECKLIST TAB */}
            {activeTab === "checklist" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass p-4 rounded-2xl border-indigo-500/10 bg-indigo-950/10 space-y-2">
                  <h4 className="text-sm font-black text-indigo-300 flex items-center gap-1.5">
                    <ClipboardList className="w-4.5 h-4.5" /> The Tactical Execution Checklist
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Keep these pillars in mind as you practice with our companion AI platform to train dynamic responses.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Phase 1: The Initial 5 Minutes */}
                  <div className="p-4 glass border-white/5 space-y-3 rounded-2xl">
                    <h5 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wider font-mono text-[10px] text-[#38bdf8]">
                      Phase 1: Initial 5 Minutes
                    </h5>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>State the prompt back in your own words to verify absolute comprehension.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Ask minimum of <b>2 high-impact clarifying questions</b> (scale, input format).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Explicitly write out <b>two test inputs</b> including one boundary case (e.g. empty or null).</span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 2: Design and Drafting */}
                  <div className="p-4 glass border-white/5 space-y-3 rounded-2xl">
                    <h5 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wider font-mono text-[10px] text-[#818cf8]">
                      Phase 2: Concept Design
                    </h5>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Outline a brute-force approach first to secure baseline feasibility.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Announce time and space complexity upfront before drawing code (e.g., O(N) Time, O(1) Space).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Contract with the interviewer before finalizing: <em>"Does this approach sound logical?"</em></span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 3: Active Coding */}
                  <div className="p-4 glass border-white/5 space-y-3 rounded-2xl">
                    <h5 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wider font-mono text-[10px] text-amber-400">
                      Phase 3: Active Coding
                    </h5>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Use clean, self-documenting naming for variables and classes rather than "x", "y", "temp".</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Voice out-loud why certain code helpers, maps, or functions are being declared.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Avoid rushing. Accuracy is cleaner than fast but heavily buggy code.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 4: Dry Runs & Wrap-up */}
                  <div className="p-4 glass border-white/5 space-y-3 rounded-2xl">
                    <h5 className="font-extrabold text-white border-b border-white/5 pb-2 uppercase tracking-wider font-mono text-[10px] text-emerald-400">
                      Phase 4: Synthesis & dry run
                    </h5>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Trace your written variables manually with a test input (e.g. `n = 4`). Show how counters change step-by-step.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Confirm if you require code refactoring to improve modularity.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Connect the story back using the <b>STAR Result</b> to conclude beautifully.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 border-t border-white/5 bg-slate-900/80 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 inline text-indigo-400" /> Keep this panel ready when practicing interview sessions.
            </span>
            <button
              id="close-tips-tricks-btn"
              onClick={onClose}
              className="w-full sm:w-auto py-2 px-5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15 text-center"
            >
              Understand & Apply Strategy
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
