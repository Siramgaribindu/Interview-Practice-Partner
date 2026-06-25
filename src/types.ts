export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface Message {
  id: string;
  sender: "interviewer" | "candidate";
  text: string;
  timestamp: string;
  audioUrl?: string; // If user plays text-to-speech
}

export interface Feedback {
  score: number; // 0 - 100
  summary: string;
  strengths: string[];
  weaknesses: string[];
  insights: string[]; // Suggestions for improvement
  detailedFeedback: string; // Markdown detailed breakdown
}

export interface InterviewSession {
  id: string;
  userId: string;
  userEmail?: string; // Helpful for admin view
  userDisplayName?: string; // Helpful for admin view
  role: string; // The role key
  status: "ongoing" | "completed";
  createdAt: string;
  completedAt?: string;
  chatHistory: Message[];
  feedback?: Feedback;
  currentPhase?: string;
}

export interface InterviewRole {
  id: string;
  name: string;
  description: string;
  topics: string[];
  icon: string; // Lucide icon name
}

export const ROLES: InterviewRole[] = [
  {
    id: "swe",
    name: "Software Engineer",
    description: "Simulate a live systems and algorithms interview. Covers system design, data structures, algorithms, and development best practices.",
    topics: ["Data Structures & Algorithms", "System Design", "Scalability", "API Design", "OOP Principles"],
    icon: "Code"
  },
  {
    id: "pm",
    name: "Product Manager",
    description: "Test your product sense, metrics derivation, and product execution. Covers prioritization matrices, wireframing roadmaps, and stakeholder alignment.",
    topics: ["Product Sense", "Execution & Metrics", "Strategy & Case Study", "Prioritization", "User Empathy"],
    icon: "Briefcase"
  },
  {
    id: "da",
    name: "Data Analyst",
    description: "Prepare for data wrangling, analytics, SQL querying, and strategic insight presentation. Focuses on metric design and statistical inference.",
    topics: ["SQL & Database design", "Statistical analysis", "Data Visualization", "Metric formulation", "A/B Testing"],
    icon: "BarChart"
  },
  {
    id: "ux",
    name: "UX Designer",
    description: "Practice design portfolio presentations, critique sessions, and user workflow assessments. Focuses on interaction structures and usability testing.",
    topics: ["User Research", "Wireframing & Prototyping", "Interaction Design", "Usability Testing", "Information Architecture"],
    icon: "Palette"
  },
  {
    id: "marketing",
    name: "Marketing Manager",
    description: "Simulate conversion funnel optimizations, growth hacking channels, user acquisition, brand positioning, and budget allocations.",
    topics: ["Growth Marketing", "Campaign Analytics", "Brand Strategy", "Content Strategy", "Customer Acquisition Cost (CAC)"],
    icon: "Megaphone"
  }
];
