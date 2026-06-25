import React, { useState, useEffect, useRef } from "react";
import { Message, InterviewRole, Feedback, InterviewSession } from "../types";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { safeStorage } from "../lib/storage";
import { 
  Send, 
  Mic, 
  MicOff, 
  Speaker, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Loader2,
  Clock,
  ArrowRight
} from "lucide-react";

const INTERVIEW_STAGES = [
  { id: "intro", label: "Introduction", phaseName: "Introduction & Background" },
  { id: "goals", label: "Career Goals", phaseName: "Interests & Career Goals" },
  { id: "education", label: "Education / Exp", phaseName: "Education & Experience" },
  { id: "projects", label: "Projects", phaseName: "Projects & Practical Experience" },
  { id: "tech", label: "Technical Qs", phaseName: "Technical Questions" },
  { id: "behavioral", label: "Behavioral", phaseName: "Behavioral/HR Questions" },
  { id: "candidate_qs", label: "Your Questions", phaseName: "Candidate Questions" },
  { id: "wrapup", label: "Wrap-up", phaseName: "Wrap-up & Evaluation" },
];

interface ConversationRoomProps {
  user: any;
  role: InterviewRole;
  existingSession?: InterviewSession | null;
  onFinish: (feedback: Feedback, session: InterviewSession) => void;
  onGoBack: () => void;
}

export default function ConversationRoom({ user, role, existingSession, onFinish, onGoBack }: ConversationRoomProps) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingState, setSpeakingState] = useState<"idle" | "thinking" | "speaking" | "listening">("idle");
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // Phase tracking state
  const [currentPhase, setCurrentPhase] = useState<string>("Introduction & Background");
  
  // Voice Recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Time metrics
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Init or restore session
  useEffect(() => {
    if (existingSession) {
      setSession(existingSession);
      if (existingSession.currentPhase) {
        setCurrentPhase(existingSession.currentPhase);
      }
      const isOver = existingSession.status === "completed";
      setSpeakingState(isOver ? "idle" : "idle");
      // compute seconds elapsed roughly or start fresh
      setSecondsElapsed(0);
    } else {
      // Create new session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const initialSession: InterviewSession = {
        id: newSessionId,
        userId: user.uid,
        userEmail: user.email || "guest@practice.com",
        userDisplayName: user.displayName || "Guest Candidate",
        role: role.id,
        status: "ongoing",
        createdAt: new Date().toISOString(),
        chatHistory: [],
        currentPhase: "Introduction & Background"
      };
      
      setSession(initialSession);
      saveSessionToFirestore(initialSession);
      
      // Request initial welcome & question from AI
      fetchAIResponse([], newSessionId);
    }

    // Start timer for session metrics
    timerRef.current = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAudioSpeech();
    };
  }, [role, existingSession]);

  // Synchronize component state to Firestore
  const saveSessionToFirestore = async (updatedSession: InterviewSession) => {
    // Save to local storage backup per sandbox resilience
    try {
      const localKey = "user_interviews_" + updatedSession.userId;
      let localSessions: InterviewSession[] = [];
      const existingStr = safeStorage.getItem(localKey);
      if (existingStr) {
        localSessions = JSON.parse(existingStr);
      }
      const index = localSessions.findIndex(s => s.id === updatedSession.id);
      if (index > -1) {
        localSessions[index] = updatedSession;
      } else {
        localSessions.push(updatedSession);
      }
      safeStorage.setItem(localKey, JSON.stringify(localSessions));
    } catch (localErr) {
      console.warn("Local storage backup saving failed:", localErr);
    }

    try {
      await setDoc(doc(db, "interviews", updatedSession.id), updatedSession);
    } catch (err) {
      console.warn("Firestore persistence warning (continuing with local backup):", err);
    }
  };

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.chatHistory, speakingState]);

  const [isTtsAvailable, setIsTtsAvailable] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis && "SpeechSynthesisUtterance" in window) {
        setIsTtsAvailable(true);
      }
    } catch (e) {
      console.warn("Speech Synthesis resides in a restricted cross-origin context:", e);
      setIsTtsAvailable(false);
    }
  }, []);

  // Initialize Speech Recognition standard support
  useEffect(() => {
    try {
      const SpeechRecognitionAPI = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
      if (SpeechRecognitionAPI) {
        try {
          const rec = new SpeechRecognitionAPI();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "en-US";

          rec.onstart = () => {
            setIsRecording(true);
            setSpeakingState("listening");
            setRecognitionError(null);
          };

          rec.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            if (finalTranscript) {
              setInputText(prev => prev + (prev ? " " : "") + finalTranscript);
            }
          };

          rec.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === "not-allowed") {
              setRecognitionError("Microphone access denied. Please allow microphone permissions in metadata and your browser settings.");
            } else {
              setRecognitionError(`Speech recognition details: ${event.error}`);
            }
            setIsRecording(false);
            setSpeakingState("idle");
          };

          rec.onend = () => {
            setIsRecording(false);
            setSpeakingState(prev => prev === "listening" ? "idle" : prev);
          };

          recognitionRef.current = rec;
        } catch (err: any) {
          console.error("Failed to initialize speech recognition:", err);
          setRecognitionError("Speech recognition initialization blocked by browser or iframe security settings.");
        }
      } else {
        setRecognitionError("Native speech recognition API is not supported in this browser. Please type answers manually.");
      }
    } catch (e: any) {
      console.error("Failed to read SpeechRecognition constructors:", e);
      setRecognitionError("Native speech recognition access is restricted by iframe config.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Text to speech implementation
  const speakAIResponse = (text: string) => {
    stopAudioSpeech();
    if (!isTtsAvailable) return;

    try {
      // Filter out code snippets or excessive markdown before reading
      const cleanText = text
        .replace(/```[\s\S]*?```/g, "[Code demonstration skipped for speech reading]")
        .replace(/[*#`_\-]/g, "")
        .trim();

      const SpeechSynthesisUtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!SpeechSynthesisUtteranceClass) return;
      const utterance = new SpeechSynthesisUtteranceClass(cleanText);
      utterance.lang = "en-US";
      
      // Choose a premium voice if it exists
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith("en") && 
        (voice.name.includes("Google") || voice.name.includes("Natural") || voice.name.includes("Samantha"))
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setSpeakingState("speaking");
      utterance.onend = () => setSpeakingState("idle");
      utterance.onerror = () => setSpeakingState("idle");

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis speak error:", e);
      setSpeakingState("idle");
    }
  };

  const stopAudioSpeech = () => {
    if (!isTtsAvailable) return;
    try {
      window.speechSynthesis.cancel();
      setSpeakingState("idle");
    } catch (e) {
      console.error("Speech Synthesis cancel error:", e);
    }
  };

  // Toggle capturing user mic
  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setRecognitionError("No vocal parser configured. Please type answers manually.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      stopAudioSpeech();
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.error("Failed to start voice listener:", err);
      }
    }
  };

  // Submit candidate response
  const handleSendMessage = async (textToSend?: string) => {
    const finalMsgText = textToSend || inputText;
    if (!finalMsgText.trim() || !session || loading || session.status === "completed") return;

    // Turn off recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    stopAudioSpeech();
    setLoading(true);
    setSpeakingState("thinking");

    const candidateMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: "candidate",
      text: finalMsgText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...session.chatHistory, candidateMsg];
    const updatedSession: InterviewSession = {
      ...session,
      chatHistory: updatedHistory
    };

    setSession(updatedSession);
    setInputText("");
    await saveSessionToFirestore(updatedSession);

    // Call server to fetch AI's reply
    await fetchAIResponse(updatedHistory, session.id);
  };

  // Dispatch API turn request
  const fetchAIResponse = async (history: Message[], sessId: string) => {
    try {
      const response = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: role.name,
          chatHistory: history
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to contact practice helper server.");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: `msg_${Date.now()}`,
        sender: "interviewer",
        text: data.text,
        timestamp: new Date().toISOString()
      };

      if (data.currentPhase) {
        setCurrentPhase(data.currentPhase);
      }

      setSession(prev => {
        if (!prev) return null;
        const finalSess: InterviewSession = {
          ...prev,
          chatHistory: [...prev.chatHistory, aiMsg],
          currentPhase: data.currentPhase || prev.currentPhase
        };
        saveSessionToFirestore(finalSess);
        
        // Speak response if autoSpeak is set
        if (autoSpeak) {
          // Speak on a microscopic delay so DOM updates or state resolves nicely
          setTimeout(() => speakAIResponse(data.text), 150);
        }

        return finalSess;
      });

      setSpeakingState("idle");
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        sender: "interviewer",
        text: `⚠️ Connection trouble: ${err.message || "Failed to retrieve response from practicing partner. Verify API key configurations."}`,
        timestamp: new Date().toISOString()
      };
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          chatHistory: [...prev.chatHistory, errorMsg]
        };
      });
      setSpeakingState("idle");
    } finally {
      setLoading(false);
    }
  };

  // Complete and trigger evaluation synthesis
  const handleFinishAndGenerateFeedback = async () => {
    if (!session || loading || session.chatHistory.length < 2) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioSpeech();
    setLoading(true);
    setSpeakingState("thinking");

    try {
      const response = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: role.name,
          chatHistory: session.chatHistory
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Hiring panel scoring error.");
      }

      const feedbackData: Feedback = await response.json();

      const completedSession: InterviewSession = {
        ...session,
        status: "completed",
        completedAt: new Date().toISOString(),
        feedback: feedbackData
      };

      setSession(completedSession);
      await saveSessionToFirestore(completedSession);

      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);

      // Callback to display summary card
      onFinish(feedbackData, completedSession);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        sender: "interviewer",
        text: `⚠️ Scoring system error: ${err.message || "Unable to produce grading reports. Please check your network and try again."}`,
        timestamp: new Date().toISOString()
      };
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          chatHistory: [...prev.chatHistory, errorMsg]
        };
      });
    } finally {
      setLoading(false);
    }
  };

  // Format stopwatch output
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Avatar states graphic representation helper
  const renderAvatarDetails = () => {
    let color = "bg-indigo-600 border-indigo-400";
    let stateLabel = "Offline";
    let rippleClass = "";

    switch (speakingState) {
      case "idle":
        color = "bg-indigo-600 border-indigo-500/50";
        stateLabel = "Interviewer Ready";
        break;
      case "thinking":
        color = "bg-amber-600 border-amber-500 animate-pulse";
        stateLabel = "Panel is evaluating...";
        break;
      case "listening":
        color = "bg-emerald-600 border-emerald-500";
        stateLabel = "Interviewer listening...";
        rippleClass = "animate-ping opacity-75";
        break;
      case "speaking":
        color = "bg-indigo-500 border-indigo-300";
        stateLabel = "Interviewer speaking...";
        rippleClass = "animate-pulse opacity-90";
        break;
    }

    return (
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-2.5">
          {rippleClass && (
            <div className={`absolute w-14 h-14 rounded-full bg-indigo-500/30 ${rippleClass}`}></div>
          )}
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative ${color} shadow-lg transition-all duration-300`}>
            {speakingState === "thinking" ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : speakingState === "listening" ? (
              <Mic className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-100" />
            )}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-slate-400">
          {stateLabel}
        </span>
      </div>
    );
  };

  const isOngoing = session?.status === "ongoing";

  const latestAiMessage = session?.chatHistory
    ? [...session.chatHistory].reverse().find(msg => msg.sender === "interviewer")
    : null;

  return (
    <div id="interview-room-screen" className="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col min-h-[calc(100vh-140px)] justify-between gap-6 animate-fadeIn">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            id="quit-practice-btn"
            onClick={onGoBack}
            className="text-xs glass glass-hover text-slate-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            ← Quit Screen
          </button>
          <div className="h-4 w-px bg-white/5" />
          <div>
            <h2 className="text-sm font-black text-white leading-tight">
              {role.name} Board
            </h2>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3" /> Session: {formatTime(secondsElapsed)}
            </p>
          </div>
        </div>

        {/* Floating companion status */}
        <div className="flex items-center gap-3">
          {renderAvatarDetails()}

          <div className="h-8 w-px bg-white/5 hidden sm:block" />

          {/* Voice configuration control toggle */}
          <button
            id="toggle-speak-btn"
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (autoSpeak) stopAudioSpeech();
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              autoSpeak 
                ? "glass neon-pill"
                : "glass text-slate-400 hover:text-slate-200"
            }`}
            title={autoSpeak ? "Mute automatic Speech Synthesis" : "Unmute automatic Speech Synthesis"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {isOngoing && session && session.chatHistory.length >= 2 && (
            <button
              id="finish-interview-btn"
              onClick={handleFinishAndGenerateFeedback}
              disabled={loading}
              className="py-2.5 px-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:opacity-90 active:scale-95 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <span>Submit for Evaluation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {recognitionError && (
        <div className="mb-3 p-2.5 bg-amber-950/35 border border-amber-500/30 text-amber-300 text-[11px] rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
          <span>{recognitionError}</span>
        </div>
      )}

      {/* Dynamic Interview Stage Progress Tracker */}
      <div className="w-full glass bg-slate-950/20 border border-white/5 rounded-2xl p-3 mb-4 shrink-0 overflow-hidden select-none">
        <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
          <span className="text-[10px] font-extrabold text-[#818cf8] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Current Stage: <span className="text-white font-black">{currentPhase}</span>
          </span>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
            Step {Math.max(1, INTERVIEW_STAGES.findIndex(s => s.phaseName === currentPhase) + 1)} of 8
          </span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 relative mt-1.5">
          {INTERVIEW_STAGES.map((stage, idx) => {
            const currentIdx = INTERVIEW_STAGES.findIndex(s => s.phaseName === currentPhase);
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            
            return (
              <div key={stage.id} className="flex flex-col gap-1 text-center" title={stage.phaseName}>
                {/* Visual Line Segment */}
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                    : isCompleted 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                    : "bg-white/10"
                }`} />
                <span className={`text-[8.5px] font-bold tracking-tight truncate transition-all ${
                  isActive 
                    ? "text-[#818cf8] font-extrabold" 
                    : isCompleted 
                    ? "text-emerald-400" 
                    : "text-slate-500"
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROMINENT INTERVIEWER QUESTION CONTAINER */}
      <div className="flex-shrink-0 min-h-[140px] md:min-h-[160px] bg-slate-900/40 border border-indigo-500/15 rounded-2xl p-5 md:p-6 shadow-xl mb-4 backdrop-blur-md flex flex-col justify-between transition-all relative">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 select-none">
            <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-indigo-400 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${speakingState === "speaking" ? "block" : "hidden"}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${speakingState === "speaking" ? "bg-indigo-400" : "bg-indigo-500/55"}`}></span>
              </span>
              Current Question
            </span>
            
            {latestAiMessage && isTtsAvailable && (
              <button
                id="replay-current-question-btn"
                onClick={() => speakAIResponse(latestAiMessage.text)}
                className="py-1 px-3 bg-indigo-650/40 hover:bg-indigo-650 border border-indigo-500/30 hover:border-indigo-400 text-[11px] font-bold text-indigo-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Speaker className="w-3.5 h-3.5" /> Replay voice
              </button>
            )}
          </div>
          
          <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed whitespace-pre-wrap flex-1 flex flex-col justify-start text-left">
            {latestAiMessage ? latestAiMessage.text : (
              <div className="flex items-center justify-start py-4 text-slate-500 text-sm gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="font-mono">AI Interviewer is preparing the question...</span>
              </div>
            )}
          </div>
        </div>

        {speakingState === "thinking" && (
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-start items-center gap-2.5 animate-pulse select-none">
            <span className="text-xs font-mono text-indigo-400/80">AI Interviewer is thinking</span>
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS - INPUT SECTION */}
      {isOngoing ? (
        <div className="space-y-2">
          {isRecording && (
            <div className="p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-mono text-center flex items-center justify-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Voice Mode Active. Speak clearly into your microphone... (Press the microphone button again to finish speaking)</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              id="voice-mic-toggle-btn"
              onClick={handleToggleVoiceInput}
              disabled={loading}
              className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isRecording
                  ? "bg-rose-950/40 border-rose-500/50 text-rose-300 animate-pulse hover:bg-rose-900/40"
                  : "glass glass-hover text-slate-400 hover:text-white border-white/5"
              }`}
              title={isRecording ? "Stop mic recording" : "Record voice answer"}
            >
              {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
            </button>

            <div className="flex-1 relative">
              <input
                id="message-input"
                type="text"
                placeholder={isRecording ? "Listening to voice input..." : "Type your detailed answer response..."}
                disabled={loading || !isOngoing}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white outline-none placeholder-slate-500 transition-all"
              />
            </div>

            <button
              id="send-message-btn"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              className="px-5 bg-gradient-to-r from-[#38bdf8] to-[#818cf8] hover:opacity-90 disabled:opacity-40 text-slate-900 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <span className="text-xs font-bold text-white block">This Interview Session Has Been Completed</span>
              <span className="text-[10px] text-slate-400">Detailed performance panels and transcript analysis have been compiled successfully.</span>
            </div>
          </div>
          <button
            id="back-to-home-btn"
            onClick={onGoBack}
            className="py-1.5 px-3 glass glass-hover text-slate-200 text-xs font-bold rounded-lg border-white/5 cursor-pointer flex items-center gap-1"
          >
            <span>Exit Practicing Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
