import { ROLES, InterviewRole } from "../types";
import { Code, Briefcase, BarChart, Palette, Megaphone, ArrowRight, Play, Sparkles } from "lucide-react";

interface RoleSelectorProps {
  onSelect: (role: InterviewRole) => void;
  onGoBack: () => void;
}

// Map key code names to dynamic Lucide elements
const iconMap: { [key: string]: any } = {
  Code: Code,
  Briefcase: Briefcase,
  BarChart: BarChart,
  Palette: Palette,
  Megaphone: Megaphone
};

export default function RoleSelector({ onSelect, onGoBack }: RoleSelectorProps) {

  return (
    <div id="role-selector-screen" className="w-full max-w-5xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            id="back-to-dash-btn"
            onClick={onGoBack}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-all mb-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Select Your Focus Domain <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Our AI Practice Partner adapts the technical interview based on real screening queries used by hiring panels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLES.map((role) => {
          const IconComponent = iconMap[role.icon] || Code;
          return (
            <div
              id={`role-card-${role.id}`}
              key={role.id}
              className="group glass glass-hover hover:scale-[1.02] p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="inline-flex items-center justify-center p-3 glass rounded-xl mb-4 text-indigo-400 group-hover:text-indigo-300 transition-all">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white transition-all">
                  {role.name}
                </h3>
                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed mb-4">
                  {role.description}
                </p>

                <div className="border-t border-white/5 pt-3.5 mb-6">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2 font-mono">
                    Core Assessment Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[9px] font-mono font-medium rounded-md glass text-slate-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                id={`start-role-${role.id}`}
                onClick={() => onSelect(role)}
                className="w-full py-2.5 px-4 glass glass-hover hover:bg-gradient-to-r hover:from-[#38bdf8] hover:to-[#818cf8] hover:text-slate-900 border-white/10 text-xs font-bold rounded-xl text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group/btn"
              >
                <span>Practice Session</span>
                <Play className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
