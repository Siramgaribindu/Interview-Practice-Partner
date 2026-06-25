import { useState } from "react";
import { InterviewSession, Feedback, ROLES } from "../types";
import Markdown from "react-markdown";
import { 
  Award, 
  ArrowLeft, 
  CheckCircle, 
  TrendingUp, 
  ThumbsUp, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  MessageSquare,
  Sparkles,
  ClipboardList,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AssessmentReportProps {
  session: InterviewSession;
  isAdminAuditing?: boolean;
  onGoBack: () => void;
}

export default function AssessmentReport({ session, isAdminAuditing, onGoBack }: AssessmentReportProps) {
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const feedback: Feedback | undefined = session.feedback;

  if (!feedback) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-white">Assessment pending for this session</h2>
        <p className="text-xs text-slate-400 mt-2">
          This interview session is still ongoing or hasn't had their assessment generated yet. Return to the session and click 'Submit for Evaluation'.
        </p>
        <button
          onClick={onGoBack}
          className="mt-6 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          ← Return
        </button>
      </div>
    );
  }

  const roleObj = ROLES.find(r => r.id === session.role);

  // Compute metric rank label
  const getScoreRank = (score: number) => {
    if (score >= 90) return { label: "Elite Performance (Strong Hire)", color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/20" };
    if (score >= 75) return { label: "Proficient Performance (Pass)", color: "text-indigo-400 border-indigo-500/20 bg-indigo-950/20" };
    if (score >= 60) return { label: "Developing Performance (Needs Training)", color: "text-amber-400 border-amber-500/20 bg-amber-950/20" };
    return { label: "Needs Improvement (No Hire)", color: "text-rose-400 border-rose-500/20 bg-rose-950/20" };
  };

  const rank = getScoreRank(feedback.score);

  return (
    <div id="assessment-report" className="w-full max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fadeIn select-text">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <button
            id="back-to-previous-btn"
            onClick={onGoBack}
            className="text-xs text-slate-400 hover:text-white mb-2.5 flex items-center gap-1 cursor-pointer font-medium"
          >
            ← {isAdminAuditing ? "Back to Admin Logs" : "Back to Dashboard"}
          </button>
          
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Screening Scorecard
            </h1>
            <span className="px-2.5 py-0.5 glass text-indigo-400 text-[10px] font-mono font-bold rounded-lg border border-white/5">
              Session Assessment
            </span>
          </div>

          <div className="flex flex-wrap items-center mt-1 text-slate-400 text-xs gap-x-4 gap-y-1">
            <span className="font-bold text-slate-200">{roleObj?.name || session.role}</span>
            <span className="h-3 w-px bg-white/5" />
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(session.createdAt).toLocaleDateString()}</span>
            <span className="h-3 w-px bg-white/5" />
            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {session.chatHistory.length} Conversational Turns</span>
          </div>

          {isAdminAuditing && (
            <div className="mt-3.5 p-2.5 glass text-[11px] text-slate-400 font-mono rounded-xl">
              Auditing Candidate: <strong className="text-white">{session.userDisplayName}</strong> ({session.userEmail})
            </div>
          )}
        </div>
      </div>

      {/* CORE PERFORMANCE SUMMARY BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SCORE GAUGE METER (md:span-4) */}
        <div className="md:col-span-4 glass p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-4">
            Combined Rating
          </span>

          <div className="relative flex items-center justify-center">
            {/* Beautiful SVG progress ring */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                strokeWidth="10"
                stroke="rgba(255, 255, 255, 0.04)"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                strokeWidth="10"
                stroke="url(#indigo-grad)"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - feedback.score / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white tracking-tighter">{feedback.score}%</span>
              <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 font-bold">score</span>
            </div>
          </div>

          <span className={`mt-6 px-3 py-1 text-[11px] font-bold rounded-full border ${rank.color}`}>
            {rank.label}
          </span>
        </div>

        {/* SUMMARY CARD (md:span-8) */}
        <div className="md:col-span-8 glass p-6 rounded-3xl flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8] uppercase tracking-widest font-mono mb-2">
              <Sparkles className="w-4 h-4 animate-pulse" /> Hiring Panel Consensus
            </div>
            <h3 className="text-base font-black text-white leading-snug">
              Performance Snapshot & Synthesis
            </h3>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed">
              {feedback.summary}
            </p>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-slate-500 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>Target threshold for top recruiters to consider interviewing is 85% score.</span>
          </div>
        </div>
      </div>

      {/* STRENGTHS AND WEAKNESSES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* STRENGTHS */}
        <div className="glass p-6 rounded-3xl shadow-md">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5 mb-4 border-b border-white/5 pb-3">
            <ThumbsUp className="w-4.5 h-4.5 text-emerald-400" /> Key Strengths Identified
          </h3>
          <ul className="space-y-3.5">
            {feedback.strengths.map((st, i) => (
              <li key={i} className="flex gap-2.5 items-start text-xs text-slate-200 leading-relaxed">
                <CheckCircle className="w-4 h-4 text-emerald-450 mt-0.5 flex-shrink-0" />
                <span>{st}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* WEAKNESSES / IMPROVEMENT GAP */}
        <div className="glass p-6 rounded-3xl shadow-md">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5 mb-4 border-b border-white/5 pb-3">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-400" /> Improvement Opportunities
          </h3>
          <ul className="space-y-3.5">
            {feedback.weaknesses.map((wk, i) => (
              <li key={i} className="flex gap-2.5 items-start text-xs text-slate-200 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-450 mt-0.5 flex-shrink-0" />
                <span>{wk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RECOMMENDED PRACTICE STEPS & COACHING */}
      <div className="glass border border-white/5 p-6 rounded-3xl shadow-sm">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-[#38bdf8]" /> Actionable Coaching & Insights
        </h3>
        <ul className="space-y-3">
          {feedback.insights.map((ins, i) => (
            <li key={i} className="flex gap-2.5 items-start text-xs text-slate-300 leading-relaxed">
              <span className="w-5 h-5 rounded-lg glass flex items-center justify-center text-indigo-300 font-black text-[10px] flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{ins}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* DETAILED WRITTEN EVALUATION (MARKDOWN DETAILED FEEDBACK) */}
      <div className="glass p-6 rounded-3xl">
        <h3 className="text-sm font-black text-white border-b border-white/5 pb-3 mb-4 flex items-center gap-1.5 select-none">
          <FileText className="w-4.5 h-4.5 text-violet-400" /> Detailed Performance Scorecard
        </h3>
        
        <div className="markdown-body text-xs text-slate-300 leading-relaxed space-y-3">
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-base font-black text-white mt-6 mb-3 border-b border-white/5 pb-2 font-mono uppercase tracking-wider">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold text-slate-200 mt-5 mb-2 font-mono uppercase tracking-wider">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-extrabold text-indigo-400 mt-6 mb-3 border-b border-white/5 pb-2 flex items-center gap-1.5">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-xs font-bold text-slate-300 mt-4 mb-2">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="mb-3.5 text-slate-300 leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-slate-300 pl-1 leading-relaxed">
                  {children}
                </li>
              ),
              hr: () => <hr className="border-white/5 my-6" />,
              strong: ({ children }) => (
                <strong className="text-white font-extrabold">
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-indigo-500/50 pl-4 italic my-4 text-slate-400 bg-white/2 px-3 py-2.5 rounded-r-xl">
                  {children}
                </blockquote>
              ),
            }}
          >
            {feedback.detailedFeedback}
          </Markdown>
        </div>
      </div>

      {/* HISTORIC CHAT TRANSCRIPT DROP DOWN */}
      <div className="border border-white/5 rounded-3xl overflow-hidden shadow-inner">
        <button
          id="toggle-transcript-btn"
          onClick={() => setShowFullTranscript(!showFullTranscript)}
          className="w-full bg-white/5 hover:bg-white/10 px-6 py-4 flex items-center justify-between text-slate-200 font-bold text-xs transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
            {showFullTranscript ? "Collapse dialogue transcription audit" : "Expand dialogue transcription audit"}
          </span>
          {showFullTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFullTranscript && (
          <div className="p-6 glass border-t border-white/5 space-y-4 max-h-[400px] overflow-y-auto">
            {session.chatHistory.map((msg, idx) => {
              const isCand = msg.sender === "candidate";
              return (
                <div key={idx} className={`flex ${isCand ? "justify-end" : "justify-start"} items-start gap-2.5`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs ${
                    isCand 
                      ? "bg-indigo-650 text-slate-100 rounded-tr-none" 
                      : "glass text-slate-300 rounded-tl-none"
                  }`}>
                    <span className="text-[9px] block uppercase font-bold tracking-wider text-slate-500 font-mono mb-1">
                      {isCand ? "Candidate response" : "Recruiter prompt"}
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA FOOTER */}
      <div className="flex justify-center pt-4">
        <button
          id="assessment-close-btn"
          onClick={onGoBack}
          className="py-3 px-8 bg-gradient-to-r from-[#38bdf8] to-[#818cf8] active:scale-95 text-slate-900 font-black text-xs rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer transition-all"
        >
          {isAdminAuditing ? "Exit Session Audit" : "Return to My Dashboard"}
        </button>
      </div>

    </div>
  );
}
