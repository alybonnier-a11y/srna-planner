import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1t9oLmiJetV3MerHOyatS73-veYLpGsQ",
  authDomain: "srna-planner.firebaseapp.com",
  projectId: "srna-planner",
  storageBucket: "srna-planner.firebasestorage.app",
  messagingSenderId: "426686173226",
  appId: "1:426686173226:web:dbeca561ff2b40d9ed3353",
  measurementId: "G-KN2ZGN4914",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

function getPlannerDocRef(userId) {
  return doc(db, "users", userId, "planners", "summer-2026");
}

const defaultClinicalSchedule = {
  // Alyssa / Saha default schedule.
  // Important correction: NO clinical during week of 6/22 because all 5 days are held open for SIM test-outs.
  // Week of 6/29: clinical resumes Tues/Wed on 6/30 and 7/1.
  May: { 12: ["🩺 Clinical"], 13: ["🩺 Clinical"], 19: ["🩺 Clinical"], 20: ["🩺 Clinical"], 26: ["🩺 Clinical"], 27: ["🩺 Clinical"] },
  June: { 2: ["🩺 Clinical"], 3: ["🩺 Clinical"], 11: ["🩺 Clinical"], 12: ["🩺 Clinical"], 18: ["🩺 Clinical"], 19: ["🩺 Clinical"], 30: ["🩺 Clinical"] },
  July: { 1: ["🩺 Clinical"], 7: ["🩺 Clinical"], 8: ["🩺 Clinical"], 14: ["🩺 Clinical"], 15: ["🩺 Clinical"], 21: ["🩺 Clinical"], 22: ["🩺 Clinical"], 30: ["🩺 Clinical"], 31: ["🩺 Clinical"] },
  August: { 6: ["🩺 Clinical"], 7: ["🩺 Clinical"], 13: ["🩺 Clinical"], 14: ["🩺 Clinical"] },
};

const monthlyCalendarData = {
  May: {
    color: "from-rose-100 to-pink-50",
    accent: "text-rose-300",
    events: {
      11: ["Clinical Faculty Expectations Webex 1800 EST"],
      15: ["Seminar Intro DB", "Clinical Syllabus Attestation"],
      17: ["SIM Syllabus Review Attestation"],
      18: ["Seminar Syllabus Quiz", "Principles 2 Plan for Success", "Clinical Airway Anatomy WB"],
      20: ["Systems Intro DB", "SIM Optional: Adductor/Popliteal"],
      22: ["Systems Assignment 1"],
      23: ["Systems DB 1"],
      25: ["Memorial Day / University Holiday", "Clinical Week 5/25–5/31: No WB", "2 eval screenshots + 2 care plans"],
      26: ["Plagiarism Attestation Quiz"],
      30: ["Systems DB Replies"],
    },
  },
  June: {
    color: "from-violet-100 to-purple-50",
    accent: "text-violet-300",
    events: {
      1: ["Clinical Respiratory Physiology WB", "2 eval screenshots + 2 care plans", "Seminar Presentation 1 week"],
      3: ["SIM Optional: LAST/Pneumo/Machine Failure"],
      6: ["Systems DB 2"],
      8: ["Principles 2 Exam 1", "Clinical Respiratory Pathophys WB", "2 eval screenshots + 2 care plans"],
      13: ["Systems DB Replies"],
      15: ["Seminar Presentation 2 week", "Clinical Airway Management WB", "Mandatory Journal Club TBD", "2 eval screenshots + 2 care plans"],
      22: ["Clinical Cell Communication WB", "Clinical Comprehensive Care Plan #1", "SIM Test-Out Week — keep all 5 days open"],
      24: ["Mandatory SIM Test-Out Class"],
      25: ["Mandatory SIM Test-Out Class"],
      29: ["Seminar 1 Presentation 3 week", "Clinical Week 6/29–7/5: No WB", "Clinical paperwork: 2 eval screenshots + 2 care plans"],
    },
  },
  July: {
    color: "from-red-100 to-orange-50",
    accent: "text-red-300",
    events: {
      2: ["SIM Bronchospasm/Anaphylaxis Quiz"],
      3: ["School Closed"],
      6: ["Clinical ANS A&P WB", "Summative evals + preceptor/site evals"],
      9: ["SIM Hypoxia Quiz"],
      11: ["Systems DB 3 — no peer replies"],
      13: ["Principles 2 AP2 Exam 2", "Clinical ANS Pharm & Patho WB", "2 eval screenshots + 2 care plans", "Seminar Quiz 1 week"],
      19: ["SIM DB #1"],
      20: ["Clinical CV Anatomy & Physiology WB", "2 eval screenshots + 2 care plans", "Seminar Franciscan Values Paper", "Seminar Presentation 4 week"],
      25: ["Systems Assignment 2"],
      27: ["Clinical Valvular Heart Dz WB", "Mandatory Journal Club TBD", "2 eval screenshots + 2 care plans"],
    },
  },
  August: {
    color: "from-blue-100 to-cyan-50",
    accent: "text-blue-300",
    events: {
      2: ["SIM DB #2"],
      3: ["Clinical CV Pathophys WB", "2 eval screenshots + 2 care plans", "Seminar Presentation 5 week"],
      10: ["Principles 2 Exam 3", "Clinical Comprehensive Care Plan #2", "2 eval screenshots + 2 care plans", "Seminar Quiz 2 week"],
      11: ["Systems Professional Practice Paper"],
      17: ["Finals Week", "Principles 2 AP2 Final Exam", "Clinical Make-Up Week", "Summative + site/preceptor evals"],
    },
  },
};

const calendarMonths = [
  { name: "May", days: 31, start: 5 },
  { name: "June", days: 30, start: 1 },
  { name: "July", days: 31, start: 3 },
  { name: "August", days: 31, start: 6 },
];
const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const weeklySchedule = [
  { week: "Week 1 — 5/11", focus: "Clinical launch + syllabus items", tasks: ["5/11 — Clinical Faculty Expectations Webex at 1800 EST", "5/15 — Seminar Intro Discussion Board", "5/15 — Clinical Syllabus Attestation", "5/17 — SIM Syllabus Review Attestation", "Clinical Week 5/11–5/17: No workbook due"] },
  { week: "Week 2 — 5/18", focus: "Airway anatomy + first paperwork week", tasks: ["5/18 — Clinical Airway Anatomy Workbook", "5/18 — Seminar Syllabus Attestation Quiz", "5/18 — Principles 2 Plan for Success", "5/20 — Systems Intro Discussion Board", "5/22 — Systems Assignment 1", "5/23 — Systems DB 1", "Clinical Week 5/18–5/24: 2 Medatrax evaluation screenshots + 2 weekly care plans"] },
  { week: "Week 3 — 5/25", focus: "No workbook, but clinical paperwork continues", tasks: ["5/25 — Memorial Day / University Holiday", "5/26 — Plagiarism Attestation Quiz", "5/30 — Systems DB Replies", "Clinical Week 5/25–5/31: No workbook due", "2 Medatrax evaluation screenshots + 2 weekly care plans"] },
  { week: "Week 4 — 6/1", focus: "Respiratory physiology + Exam 1 prep", tasks: ["6/1 — Respiratory Physiology WB", "6/1 — 2 eval screenshots + 2 care plans", "Week of 6/1 — Seminar Presentation 1", "6/3 or 6/4 — Optional SIM", "6/6 — Systems DB 2", "6/8 — Principles 2 Exam 1"] },
  { week: "Week 5 — 6/8", focus: "Respiratory pathophys + clinical switch", tasks: ["6/8 — Respiratory Pathophys WB", "6/8 — 2 eval screenshots + 2 care plans", "6/13 — Systems DB Replies"] },
  { week: "Week 6 — 6/15", focus: "Airway management + journal club", tasks: ["Week of 6/15 — Seminar Presentation 2", "6/15 — Airway Management WB", "6/15 — Mandatory Journal Club TBD", "6/15 — 2 eval screenshots + 2 care plans"] },
  { week: "Week 7 — 6/22", focus: "Cell communication + care plan + SIM test-out", tasks: ["6/22 — Clinical Cell Communication WB", "6/22 — Clinical Comprehensive Care Plan #1", "6/22–6/28 — SIM Test-Out Week: keep all 5 days open", "6/24 or 6/25 — SIM Mandatory Test-Out Class", "No clinical days scheduled this week"] },
  { week: "Week 8 — 6/29", focus: "No workbook, but paperwork continues", tasks: ["Week of 6/29 — Seminar 1 Presentation 3", "Clinical Week 6/29–7/5: No workbook due", "Alyssa clinical days: Tuesday 6/30 and Wednesday 7/1", "Clinical paperwork: 2 eval screenshots + 2 care plans"] },
  { week: "Week 9 — 7/6", focus: "ANS + first site evaluation items", tasks: ["7/2 — SIM Bronchospasm/Anaphylaxis Quiz", "7/6 — ANS A&P WB", "7/6 — Summative/preceptor/site evals", "7/9 — SIM Hypoxia Quiz", "7/11 — Systems DB 3"] },
  { week: "Week 10 — 7/13", focus: "ANS Pharm/Patho + Exam 2", tasks: ["7/13 — AP2 Exam 2", "7/13 — ANS Pharm & Patho WB", "7/13 — 2 eval screenshots + 2 care plans", "Week of 7/13 — Seminar Quiz 1"] },
  { week: "Week 11 — 7/20", focus: "Cardiac anatomy + Seminar paper", tasks: ["7/19 — SIM DB #1", "7/20 — CV Anatomy & Physiology WB", "7/20 — 2 eval screenshots + 2 care plans", "7/20 — Franciscan Values Paper", "7/25 — Systems Assignment 2"] },
  { week: "Week 12 — 7/27", focus: "Valvular heart disease + journal club", tasks: ["7/27 — Valvular Heart Disease WB", "7/27 — Mandatory Journal Club TBD", "7/27 — 2 eval screenshots + 2 care plans"] },
  { week: "Week 13 — 8/3", focus: "Cardiovascular pathophys", tasks: ["8/2 — SIM DB #2", "8/3 — CV Pathophys WB", "8/3 — 2 eval screenshots + 2 care plans", "Week of 8/3 — Seminar Presentation 5"] },
  { week: "Week 14 — 8/10", focus: "Final stretch + care plan #2", tasks: ["8/10 — Principles 2 Exam 3", "8/10 — Comprehensive Care Plan #2", "8/10 — 2 eval screenshots + 2 care plans", "Week of 8/10 — Seminar Quiz 2", "8/11 — Systems Professional Practice Paper"] },
  { week: "Week 15 — 8/17", focus: "Finals week + clinical wrap-up", tasks: ["8/17 — Finals Week", "8/17 — AP2 Final Exam", "8/17 — Clinical Make-Up Week if needed", "8/17 — Final summative/site/preceptor evals"] },
];

function A(id, sortDate, course, assignment, due, priority = "High", notes = "") {
  return { id, sortDate, course, assignment, due, status: "Not Started", priority, notes };
}
const starterAssignments = [
  A(1,"2026-05-11","Clinical","Faculty Expectations Webex at 1800 EST","5/11","Critical","Updated NSG 661 syllabus Week 1"),
  A(2,"2026-05-15","Seminar 1","Intro Discussion Board","5/15"), A(3,"2026-05-15","Clinical","Syllabus Attestation","5/15","Critical"), A(4,"2026-05-17","SIM","Syllabus Review Attestation","5/17","Critical"),
  A(5,"2026-05-18","Seminar 1","Syllabus Attestation Quiz","5/18","Critical"), A(6,"2026-05-18","Principles 2","Plan for Success","5/18"), A(7,"2026-05-18","Clinical","Airway Anatomy WB","5/18"),
  A(8,"2026-05-20","Systems","Intro Discussion Board","5/20"), A(9,"2026-05-20","SIM","Optional Class: Adductor Canal & Popliteal Canal","5/20 or 5/21","Low"), A(10,"2026-05-22","Systems","Assignment 1","5/22"), A(11,"2026-05-23","Systems","Discussion Board 1","5/23"), A(12,"2026-05-25","University Days to Know","Memorial Day / University Holiday","5/25","Medium"), A(13,"2026-05-25","Clinical","Clinical Week 5/25–5/31: 2 eval screenshots + 2 weekly care plans","5/25","Critical"), A(14,"2026-05-26","Systems","Plagiarism Attestation Quiz","5/26","Critical"), A(15,"2026-05-30","Systems","Discussion Board Replies","5/30"),
  A(16,"2026-06-01","Clinical","Respiratory Physiology WB","6/1"), A(17,"2026-06-01","Clinical","2 eval screenshots + 2 weekly care plans","6/1","Critical"), A(18,"2026-06-01","Seminar 1","Student Presentation 1 / Optional Live or Discussion Post","Week of 6/1","Medium"), A(19,"2026-06-03","SIM","Optional Class: LAST, Pneumoperitoneum, Anesthesia Machine Failure","6/3 or 6/4","Low"), A(20,"2026-06-06","Systems","Discussion Board 2","6/6"), A(21,"2026-06-08","Principles 2","EXAM 1","6/8","Critical"), A(22,"2026-06-08","Clinical","Respiratory Pathophysiology WB","6/8"), A(23,"2026-06-08","Clinical","2 eval screenshots + 2 weekly care plans","6/8","Critical"), A(24,"2026-06-13","Systems","Discussion Board Replies","6/13"), A(25,"2026-06-15","Seminar 1","Student Presentation 2 / Optional Live or Discussion Post","Week of 6/15","Medium"), A(26,"2026-06-15","Clinical","Airway Management WB","6/15"), A(27,"2026-06-15","Clinical","Mandatory Journal Club Session","6/15 TBD","Critical"), A(28,"2026-06-15","Clinical","2 eval screenshots + 2 weekly care plans","6/15","Critical"), A(29,"2026-06-22","Clinical","Cell Communication WB","6/22"), A(30,"2026-06-22","Clinical","Comprehensive Care Plan #1","6/22","Critical"), A(31,"2026-06-22","SIM","Test-Out Week — keep all 5 days open","Week of 6/22","Critical"), A(32,"2026-06-24","SIM","Mandatory Classes in Indy / Test-Out Week","6/24 or 6/25","Critical"), A(33,"2026-06-29","Seminar 1","Student Presentation 3 / Optional Live or Discussion Post","Week of 6/29","Medium"), A(34,"2026-06-29","Clinical","Clinical Week 6/29–7/5: No WB + 2 eval screenshots + 2 weekly care plans","6/29","Critical","Alyssa clinical days this week: Tues 6/30 and Wed 7/1"),
  A(35,"2026-07-02","SIM","Bronchospasm/Anaphylaxis Quiz","7/2"), A(36,"2026-07-06","Clinical","ANS Anatomy & Physiology WB","7/6"), A(37,"2026-07-06","Clinical","Summative evals + preceptor evals + first clinical site eval","7/6","Critical"), A(38,"2026-07-09","SIM","Hypoxia Quiz","7/9"), A(39,"2026-07-11","Systems","Discussion Board 3 — No Peer Responses","7/11"), A(40,"2026-07-13","Principles 2","AP2: EXAM 2","7/13","Critical"), A(41,"2026-07-13","Clinical","ANS Pharmacology & Pathophysiology WB","7/13"), A(42,"2026-07-13","Clinical","2 eval screenshots + 2 weekly care plans","7/13","Critical"), A(43,"2026-07-13","Seminar 1","Quiz 1 over Student Presentations 1–3","Week of 7/13"), A(44,"2026-07-19","SIM","Discussion Board #1","7/19","Medium"), A(45,"2026-07-20","Clinical","Cardiovascular Anatomy & Physiology WB","7/20"), A(46,"2026-07-20","Clinical","2 eval screenshots + 2 weekly care plans","7/20","Critical"), A(47,"2026-07-20","Seminar 1","Franciscan Values Paper","7/20"), A(48,"2026-07-20","Seminar 1","Student Presentation 4 / Optional Live or Discussion Post","Week of 7/20","Medium"), A(49,"2026-07-25","Systems","Assignment 2","7/25"), A(50,"2026-07-27","Clinical","Valvular Heart Disease WB","7/27"), A(51,"2026-07-27","Clinical","Mandatory Journal Club Session","7/27 TBD","Critical"), A(52,"2026-07-27","Clinical","2 eval screenshots + 2 weekly care plans","7/27","Critical"),
  A(53,"2026-08-02","SIM","Discussion Board #2","8/2","Medium"), A(54,"2026-08-03","Clinical","Cardiovascular Pathophysiology WB","8/3"), A(55,"2026-08-03","Clinical","2 eval screenshots + 2 weekly care plans","8/3","Critical"), A(56,"2026-08-03","Seminar 1","Student Presentation 5 / Optional Live or Discussion Post","Week of 8/3","Medium"), A(57,"2026-08-10","Principles 2","EXAM 3","8/10","Critical"), A(58,"2026-08-10","Clinical","Comprehensive Care Plan #2","8/10","Critical"), A(59,"2026-08-10","Clinical","2 eval screenshots + 2 weekly care plans","8/10","Critical"), A(60,"2026-08-10","Seminar 1","Quiz 2 over Student Presentations 4 & 5","Week of 8/10"), A(61,"2026-08-11","Systems","Professional Practice Paper","8/11"), A(62,"2026-08-17","University Days to Know","Finals Week","8/17–8/21"), A(63,"2026-08-17","Principles 2","AP2 Final Exam","8/17","Critical"), A(64,"2026-08-17","Clinical","Clinical Make-Up Week","8/17"), A(65,"2026-08-17","Clinical","Final summative evals + site/preceptor evals","8/17","Critical"),
];

const clinicalChecks = ["Patient assignment obtained / chart reviewed", "Care plan prepared before every anesthetic", "Care plan signed by preceptor", "Plan B anesthetic included", "3 comorbidities + anesthetic implications included", "3 surgical considerations + anesthetic implications included", "Ready to start case by 0700", "Airway concerns reviewed", "Meds/pressors/fluids reviewed", "Clinical eval submitted / screenshot uploaded", "Medatrax hours/cases updated", "Coordinator approved dismissal before leaving", "Things to review saved"];
const statusOptions = ["Not Started", "In Progress", "Waiting", "Submitted", "Complete"];
const priorityOptions = ["Critical", "High", "Medium", "Low"];
const courseOptions = ["All", "Active", "Critical", "Clinical", "Seminar 1", "SIM", "Systems", "Principles 2", "University Days to Know"];

function getFilteredAssignments(assignments, filter) {
  if (filter === "All") return assignments;
  if (filter === "Active") return assignments.filter((a) => a.status !== "Complete" && a.status !== "Submitted");
  if (filter === "Critical") return assignments.filter((a) => a.priority === "Critical");
  return assignments.filter((a) => a.course === filter);
}
function getCompletionPercent(assignments) {
  if (!assignments.length) return 0;
  const done = assignments.filter((a) => a.status === "Complete" || a.status === "Submitted").length;
  return Math.round((done / assignments.length) * 100);
}
function cloneSchedule(schedule) { return JSON.parse(JSON.stringify(schedule || {})); }
function flattenClinicalSchedule(schedule) {
  const rows = [];
  Object.entries(schedule || {}).forEach(([month, days]) => Object.entries(days || {}).forEach(([day, events]) => rows.push({ month, day: Number(day), events })));
  const monthOrder = { May: 1, June: 2, July: 3, August: 4 };
  return rows.sort((a, b) => monthOrder[a.month] - monthOrder[b.month] || a.day - b.day);
}
function addClinicalScheduleDay(schedule, month, day, label = "🩺 Clinical") {
  const dayNumber = Number(day);
  if (!month || !dayNumber || dayNumber < 1 || dayNumber > 31) return schedule;
  const next = cloneSchedule(schedule);
  if (!next[month]) next[month] = {};
  if (!next[month][dayNumber]) next[month][dayNumber] = [];
  if (!next[month][dayNumber].includes(label)) next[month][dayNumber].push(label);
  return next;
}
function removeClinicalScheduleDay(schedule, month, day) {
  const next = cloneSchedule(schedule);
  if (next[month]) delete next[month][Number(day)];
  return next;
}
function makeClinicalTemplateText(clinical, checked) {
  const completed = Object.keys(checked || {}).filter((key) => checked[key]);
  return `CLINICAL DAY TEMPLATE\nDate: ${clinical.date}\nSite: ${clinical.site}\nPreceptor: ${clinical.preceptor}\n\nCases:\n${clinical.cases}\n\nAirway/Anesthesia Concerns:\n${clinical.airway}\n\nMeds/Pressors/Fluids:\n${clinical.meds}\n\nLearning Points:\n${clinical.learning}\n\nThings to Review:\n${clinical.review}\n\nCompleted Checklist:\n${completed.map((item) => `- ${item}`).join("\n")}`;
}
function makeBrainDumpText(brainDump) { return brainDump.map((x) => x.trim()).filter(Boolean).map((x, i) => `${i + 1}. ${x}`).join("\n"); }
function makeAssignmentExportText(assignments) { return assignments.map((a) => `${a.course} | ${a.assignment} | Due: ${a.due} | Status: ${a.status} | Priority: ${a.priority}`).join("\n"); }
async function safeCopy(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

const STORAGE_KEY = "srna-command-center-summer-2026-v2";
function loadSavedState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
function clearSavedState() { try { localStorage.removeItem(STORAGE_KEY); return true; } catch { return false; } }
function mergeAssignmentsWithDefaults(savedAssignments) {
  if (!Array.isArray(savedAssignments)) return starterAssignments;
  const savedById = new Map(savedAssignments.map((item) => [item.id, item]));
  const merged = starterAssignments.map((item) => ({ ...item, ...(savedById.get(item.id) || {}) }));
  const defaultIds = new Set(starterAssignments.map((item) => item.id));
  const custom = savedAssignments.filter((item) => !defaultIds.has(item.id));
  return [...merged, ...custom].sort((a, b) => String(a.sortDate || "9999-99-99").localeCompare(String(b.sortDate || "9999-99-99")));
}
function buildPlannerState(state) { return state; }
function downloadPlannerBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `srna-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
}
async function importPlannerBackup(file) { try { return JSON.parse(await file.text()); } catch { return null; } }

function Card({ children, className = "" }) { return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>; }
function TextInput(props) { return <input {...props} className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200 ${props.className || ""}`} />; }
function TextArea(props) { return <textarea {...props} className={`min-h-[92px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200 ${props.className || ""}`} />; }
function SelectBox({ value, onChange, options, label }) { return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>; }
function ActionButton({ children, onClick, variant = "primary", className = "", type = "button" }) {
  const variants = { primary: "bg-slate-900 text-white hover:bg-slate-700", secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100", danger: "text-red-600 hover:bg-red-50" };
  return <button type={type} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}>{children}</button>;
}
function Badge({ children, tone = "slate" }) {
  const tones = { slate: "bg-slate-100 text-slate-700", red: "bg-red-100 text-red-700", orange: "bg-orange-100 text-orange-700", green: "bg-green-100 text-green-700", blue: "bg-blue-100 text-blue-700", purple: "bg-purple-100 text-purple-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}
function buildCalendarCells(month) { const cells = []; for (let i = 0; i < month.start; i++) cells.push(null); for (let d = 1; d <= month.days; d++) cells.push(d); while (cells.length % 7 !== 0) cells.push(null); return cells; }
function getPriorityTone(priority) { return priority === "Critical" ? "red" : priority === "High" ? "orange" : priority === "Medium" ? "blue" : "green"; }
function getEventTone(event) {
  // Color code to match the uploaded Summer 2026 Due Date Calendar:
  // Clinical = red, SIM = blue, Systems = green, Seminar 1 = orange, Principles 2 = purple.
  if (event.includes("SIM")) return "border-blue-200 bg-blue-100 text-blue-800";
  if (event.includes("Systems")) return "border-green-200 bg-green-100 text-green-800";
  if (event.includes("Seminar")) return "border-orange-200 bg-orange-100 text-orange-800";
  if (event.includes("Principles") || event.includes("AP2") || event.includes("EXAM")) return "border-purple-200 bg-purple-100 text-purple-800";
  if (event.includes("Clinical") || event.includes("🩺") || event.includes("eval") || event.includes("care plan") || event.includes("WB") || event.includes("Journal Club") || event.includes("Medatrax")) return "border-red-200 bg-red-100 text-red-800";
  return "border-slate-200 bg-white text-slate-700";
}
function makeEventId(month, day, event, i) { return `${month}-${day}-${i}-${event}`; }

export default function SRNACommandCenter() {
  const savedState = useMemo(() => loadSavedState(), []);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [assignments, setAssignments] = useState(() => mergeAssignmentsWithDefaults(savedState?.assignments));
  const [filter, setFilter] = useState(savedState?.filter || "All");
  const [activeTab, setActiveTab] = useState(savedState?.activeTab || "calendar");
  const [newAssignment, setNewAssignment] = useState({ assignment: "", course: "Clinical", due: "", priority: "Medium", status: "Not Started", notes: "" });
  const [clinical, setClinical] = useState(savedState?.clinical || { date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" });
  const [customClinicalSchedule, setCustomClinicalSchedule] = useState(() => savedState?.customClinicalSchedule || defaultClinicalSchedule);
  const [newClinicalDay, setNewClinicalDay] = useState({ month: "May", day: "", label: "🩺 Clinical" });
  const [checked, setChecked] = useState(savedState?.checked || {});
  const [calendarChecked, setCalendarChecked] = useState(savedState?.calendarChecked || {});
  const [weeklyChecked, setWeeklyChecked] = useState(savedState?.weeklyChecked || {});
  const [brainDump, setBrainDump] = useState(savedState?.brainDump || ["", "", "", "", ""]);
  const [copyMessage, setCopyMessage] = useState(savedState ? "Loaded saved planner progress from this browser." : "");
  const [cloudStatus, setCloudStatus] = useState("Sign in to sync across devices.");
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const filteredAssignments = useMemo(() => getFilteredAssignments(assignments, filter), [assignments, filter]);
  const completion = getCompletionPercent(assignments);
  const activeCount = getFilteredAssignments(assignments, "Active").length;
  const criticalCount = getFilteredAssignments(assignments, "Critical").filter((a) => a.status !== "Complete" && a.status !== "Submitted").length;
  const calendarItemCount = Object.keys(calendarChecked).filter((key) => calendarChecked[key]).length;

  useEffect(() => onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthLoading(false); setCloudLoaded(false); if (!currentUser) setCloudStatus("Sign in with Google to sync your planner across devices."); }), []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    async function loadCloudPlanner() {
      try {
        setCloudStatus("Loading your planner from Firebase...");
        const snapshot = await getDoc(getPlannerDocRef(user.uid));
        if (!isMounted) return;
        if (snapshot.exists()) {
          const cloud = snapshot.data();
          setAssignments(mergeAssignmentsWithDefaults(cloud.assignments || []));
          setFilter(cloud.filter || "All");
          setActiveTab(cloud.activeTab || "calendar");
          setClinical(cloud.clinical || { date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" });
          setCustomClinicalSchedule(cloud.customClinicalSchedule || defaultClinicalSchedule);
          setChecked(cloud.checked || {}); setCalendarChecked(cloud.calendarChecked || {}); setWeeklyChecked(cloud.weeklyChecked || {}); setBrainDump(cloud.brainDump || ["", "", "", "", ""]);
          setCloudStatus("Cloud sync connected. Loaded your personal planner.");
        } else setCloudStatus("Cloud sync connected. Creating your personal planner...");
      } catch (error) { console.warn(error); setCloudStatus("Firebase connection failed. Check Authentication/Firestore rules. Local autosave still works."); }
      finally { if (isMounted) setCloudLoaded(true); }
    }
    loadCloudPlanner();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    const plannerState = buildPlannerState({ assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump, customClinicalSchedule });
    saveState({ ...plannerState, savedAt: new Date().toISOString() });
    if (!cloudLoaded || !user) return;
    const timeout = window.setTimeout(async () => {
      try { await setDoc(getPlannerDocRef(user.uid), { ...plannerState, ownerUid: user.uid, ownerEmail: user.email || "", updatedAt: serverTimestamp() }, { merge: true }); setCloudStatus("Cloud sync saved to your account."); }
      catch (error) { console.warn(error); setCloudStatus("Cloud sync failed. Local autosave still works."); }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump, customClinicalSchedule, cloudLoaded, user]);

  const handleGoogleSignIn = async () => { try { setCloudStatus("Opening Google sign-in..."); await signInWithPopup(auth, googleProvider); } catch (error) { console.warn(error); setCloudStatus("Google sign-in failed. Make sure Google provider is enabled in Firebase Authentication."); } };
  const handleSignOut = async () => { await signOut(auth); setUser(null); setCloudStatus("Signed out. Local autosave still works on this device."); };
  const addAssignment = () => { if (!newAssignment.assignment.trim()) return; setAssignments((current) => [{ id: Date.now(), sortDate: "9999-99-99", ...newAssignment, assignment: newAssignment.assignment.trim() }, ...current]); setNewAssignment({ assignment: "", course: "Clinical", due: "", priority: "Medium", status: "Not Started", notes: "" }); };
  const updateAssignment = (id, field, value) => setAssignments((current) => current.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  const deleteAssignment = (id) => setAssignments((current) => current.filter((a) => a.id !== id));
  const handleAddClinicalDay = () => { setCustomClinicalSchedule((current) => addClinicalScheduleDay(current, newClinicalDay.month, newClinicalDay.day, newClinicalDay.label || "🩺 Clinical")); setNewClinicalDay({ ...newClinicalDay, day: "" }); setCopyMessage("Clinical day added to your personal schedule."); };
  const handleRemoveClinicalDay = (month, day) => { setCustomClinicalSchedule((current) => removeClinicalScheduleDay(current, month, day)); setCopyMessage("Clinical day removed from your personal schedule."); };
  const handleRestoreDefaultClinicalSchedule = () => { setCustomClinicalSchedule(defaultClinicalSchedule); setCopyMessage("Restored the default clinical schedule template."); };
  const resetSavedPlanner = () => { clearSavedState(); setAssignments(starterAssignments); setFilter("All"); setActiveTab("calendar"); setClinical({ date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" }); setCustomClinicalSchedule(defaultClinicalSchedule); setChecked({}); setCalendarChecked({}); setWeeklyChecked({}); setBrainDump(["", "", "", "", ""]); setCopyMessage("Saved planner progress cleared and reset."); };
  const exportPlanner = () => { downloadPlannerBackup({ assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump, customClinicalSchedule, exportedAt: new Date().toISOString() }); setCopyMessage("Planner backup downloaded."); };
  const handleImportPlanner = async (event) => { const file = event.target.files?.[0]; if (!file) return; const imported = await importPlannerBackup(file); if (!imported) return setCopyMessage("Unable to import planner backup."); setAssignments(mergeAssignmentsWithDefaults(imported.assignments || [])); setCustomClinicalSchedule(imported.customClinicalSchedule || defaultClinicalSchedule); setChecked(imported.checked || {}); setCalendarChecked(imported.calendarChecked || {}); setWeeklyChecked(imported.weeklyChecked || {}); setBrainDump(imported.brainDump || ["", "", "", "", ""]); setCopyMessage("Planner backup imported."); };
  const handleCopy = async (text, message) => setCopyMessage((await safeCopy(text)) ? message : "Copy unavailable in this browser.");

  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Summer 2026</p><h1 className="text-3xl font-bold tracking-tight md:text-5xl">SRNA Command Center</h1><p className="mt-2 max-w-2xl text-slate-600">Interactive calendar, assignment list, clinical template, and weekly brain dump. Each signed-in student gets a private editable schedule.</p></div><div className="grid grid-cols-4 gap-3 md:w-[600px]"><Card className="p-4"><div className="text-xs text-slate-500">Assignments</div><div className="mt-1 text-2xl font-bold">{completion}%</div></Card><Card className="p-4"><div className="text-xs text-slate-500">Active</div><div className="mt-1 text-2xl font-bold">{activeCount}</div></Card><Card className="p-4"><div className="text-xs text-slate-500">Critical</div><div className="mt-1 text-2xl font-bold">{criticalCount}</div></Card><Card className="p-4"><div className="text-xs text-slate-500">Calendar Done</div><div className="mt-1 text-2xl font-bold">{calendarItemCount}</div></Card></div></header>
    {copyMessage ? <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">{copyMessage}</div> : null}
    <Card className="p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-sm font-bold">Autosave + personal Firebase sync</div><div className="text-xs text-slate-600">{authLoading ? "Checking sign-in..." : cloudStatus}</div>{user ? <div className="mt-1 text-xs text-slate-500">Signed in as {user.email}</div> : null}</div><div className="flex flex-wrap gap-2">{user ? <ActionButton variant="secondary" onClick={handleSignOut}>Sign out</ActionButton> : <ActionButton onClick={handleGoogleSignIn}>Sign in with Google</ActionButton>}<ActionButton variant="secondary" onClick={exportPlanner}>Export backup</ActionButton><label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">Import backup<input type="file" accept="application/json" className="hidden" onChange={handleImportPlanner} /></label><ActionButton variant="secondary" onClick={resetSavedPlanner}>Reset</ActionButton></div></div></Card>
    <nav className="grid grid-cols-5 gap-2 rounded-2xl bg-slate-200 p-1 md:w-[920px]">{[{key:"calendar",label:"📅 Calendar"},{key:"schedule",label:"🗓 Weekly Plan"},{key:"assignments",label:"☑ Assignments"},{key:"clinical",label:"🩺 Clinical"},{key:"brain",label:"🧠 Brain Dump"}].map((tab)=><button key={tab.key} type="button" onClick={()=>setActiveTab(tab.key)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab===tab.key?"bg-white text-slate-900 shadow-sm":"text-slate-600 hover:bg-slate-100"}`}>{tab.label}</button>)}</nav>

    {activeTab === "calendar" && <section className="space-y-8"><Card className="p-5"><h2 className="text-2xl font-bold">Interactive Semester Calendar</h2><p className="text-sm text-slate-600">Each student can customize their own clinical dates from the Clinical tab.</p></Card>{calendarMonths.map((month)=>{const monthInfo=monthlyCalendarData[month.name]; const cells=buildCalendarCells(month); return <Card key={month.name} className={`overflow-hidden border-0 bg-gradient-to-br ${monthInfo.color}`}><div className="p-6 md:p-8"><div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><div className={`text-6xl font-black opacity-70 md:text-8xl ${monthInfo.accent}`}>2026</div><h2 className="-mt-6 text-4xl font-light italic tracking-wide md:text-6xl">{month.name}</h2></div><div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3"><Badge tone="green">Clinical</Badge><Badge tone="red">Exams/Quizzes</Badge><Badge tone="blue">SIM</Badge><Badge tone="orange">Seminar</Badge><Badge tone="purple">Workbook/Care Plan</Badge></div></div><div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500 md:text-sm">{weekdayHeaders.map((d)=><div key={d} className="py-2">{d}</div>)}</div><div className="grid grid-cols-7 gap-2">{cells.map((day,index)=>{const assignmentEvents=day ? monthInfo.events[day] || [] : []; const clinicalEvents=day ? customClinicalSchedule[month.name]?.[day] || [] : []; const events=[...clinicalEvents,...assignmentEvents]; return <div key={`${month.name}-${index}`} className={`min-h-[130px] rounded-2xl border border-white/60 bg-white/60 p-2 backdrop-blur-sm md:min-h-[165px] ${events.length?"shadow-sm":"opacity-70"}`}>{day ? <><div className="mb-2 text-right text-sm font-bold md:text-base">{day}</div><div className="space-y-1">{events.map((event,i)=>{const id=makeEventId(month.name,day,event,i); const done=!!calendarChecked[id]; return <label key={id} className={`flex cursor-pointer items-start gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-medium leading-tight md:text-xs ${getEventTone(event)} ${done?"opacity-55 line-through":""}`}><input type="checkbox" checked={done} onChange={(e)=>setCalendarChecked({...calendarChecked,[id]:e.target.checked})} className="mt-0.5 h-3 w-3 shrink-0"/><span>{event}</span></label>})}</div></> : null}</div>})}</div></div></Card>})}</section>}

    {activeTab === "schedule" && <section className="space-y-4">{weeklySchedule.map((week,wi)=><Card key={week.week} className="p-5"><h3 className="text-xl font-bold">{week.week}</h3><p className="text-sm text-slate-600">{week.focus}</p><div className="mt-4 space-y-2">{week.tasks.map((task,i)=>{const id=`${wi}-${i}-${task}`; const done=!!weeklyChecked[id]; return <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 ${done?"opacity-55 line-through":""}`}><input type="checkbox" checked={done} onChange={(e)=>setWeeklyChecked({...weeklyChecked,[id]:e.target.checked})} className="mt-1 h-4 w-4"/><span className="text-sm">{task}</span></label>})}</div></Card>)}</section>}

    {activeTab === "assignments" && <section className="space-y-4"><Card className="p-4"><h2 className="mb-3 text-xl font-bold">Add assignment</h2><div className="grid gap-3 md:grid-cols-6"><TextInput className="md:col-span-2" placeholder="Assignment" value={newAssignment.assignment} onChange={(e)=>setNewAssignment({...newAssignment,assignment:e.target.value})}/><SelectBox label="Course" value={newAssignment.course} onChange={(v)=>setNewAssignment({...newAssignment,course:v})} options={["Clinical","Seminar 1","SIM","Systems","Principles 2","University Days to Know"]}/><TextInput placeholder="Due date" value={newAssignment.due} onChange={(e)=>setNewAssignment({...newAssignment,due:e.target.value})}/><SelectBox label="Priority" value={newAssignment.priority} onChange={(v)=>setNewAssignment({...newAssignment,priority:v})} options={priorityOptions}/><ActionButton onClick={addAssignment}>+ Add</ActionButton></div><TextInput className="mt-3" placeholder="Notes" value={newAssignment.notes} onChange={(e)=>setNewAssignment({...newAssignment,notes:e.target.value})}/></Card><div className="flex flex-wrap gap-2">{courseOptions.map((f)=><ActionButton key={f} variant={filter===f?"primary":"secondary"} className="rounded-full" onClick={()=>setFilter(f)}>{f}</ActionButton>)}<ActionButton variant="secondary" className="rounded-full" onClick={()=>handleCopy(makeAssignmentExportText(filteredAssignments),"Assignment list copied.")}>Copy visible list</ActionButton></div><div className="grid gap-3">{filteredAssignments.map((a)=><Card key={a.id} className="p-4"><div className="grid gap-3 md:grid-cols-12 md:items-center"><div className="md:col-span-3"><TextInput value={a.assignment} onChange={(e)=>updateAssignment(a.id,"assignment",e.target.value)}/></div><div className="md:col-span-1"><Badge>{a.course}</Badge></div><div className="md:col-span-2"><TextInput value={a.due} onChange={(e)=>updateAssignment(a.id,"due",e.target.value)}/></div><div className="md:col-span-2"><SelectBox label="Status" value={a.status} onChange={(v)=>updateAssignment(a.id,"status",v)} options={statusOptions}/></div><div className="md:col-span-1"><Badge tone={getPriorityTone(a.priority)}>{a.priority}</Badge></div><div className="md:col-span-2"><TextInput value={a.notes} onChange={(e)=>updateAssignment(a.id,"notes",e.target.value)}/></div><ActionButton variant="danger" onClick={()=>deleteAssignment(a.id)}>×</ActionButton></div></Card>)}</div></section>}

    {activeTab === "clinical" && <section className="space-y-4"><Card className="p-5"><div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold">Clinical Day Template</h2><p className="text-sm text-slate-600">Use this for patient lookup, post-clinical notes, and care-plan-worthy cases.</p></div><ActionButton onClick={()=>handleCopy(makeClinicalTemplateText(clinical,checked),"Clinical note copied.")}>Copy clinical note</ActionButton></div><div className="grid gap-3 md:grid-cols-3"><TextInput placeholder="Date" value={clinical.date} onChange={(e)=>setClinical({...clinical,date:e.target.value})}/><TextInput placeholder="Site" value={clinical.site} onChange={(e)=>setClinical({...clinical,site:e.target.value})}/><TextInput placeholder="Preceptor" value={clinical.preceptor} onChange={(e)=>setClinical({...clinical,preceptor:e.target.value})}/></div><div className="mt-4 grid gap-3 md:grid-cols-2"><TextArea placeholder="Cases / procedures" value={clinical.cases} onChange={(e)=>setClinical({...clinical,cases:e.target.value})}/><TextArea placeholder="Airway + anesthesia concerns" value={clinical.airway} onChange={(e)=>setClinical({...clinical,airway:e.target.value})}/><TextArea placeholder="Meds, pressors, fluids, local anesthetics" value={clinical.meds} onChange={(e)=>setClinical({...clinical,meds:e.target.value})}/><TextArea placeholder="Learning points / preceptor pearls" value={clinical.learning} onChange={(e)=>setClinical({...clinical,learning:e.target.value})}/></div><TextArea className="mt-3" placeholder="Things to review later" value={clinical.review} onChange={(e)=>setClinical({...clinical,review:e.target.value})}/>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h3 className="text-lg font-bold">Personal Clinical Schedule</h3><p className="text-sm text-slate-600">Each classmate can add/remove their own clinical days. This saves to their own Google/Firebase account.</p></div><ActionButton variant="secondary" onClick={handleRestoreDefaultClinicalSchedule}>Restore default</ActionButton></div><div className="mt-4 grid gap-3 md:grid-cols-5"><SelectBox label="Clinical month" value={newClinicalDay.month} onChange={(v)=>setNewClinicalDay({...newClinicalDay,month:v})} options={["May","June","July","August"]}/><TextInput placeholder="Day, ex: 12" value={newClinicalDay.day} onChange={(e)=>setNewClinicalDay({...newClinicalDay,day:e.target.value})}/><TextInput className="md:col-span-2" placeholder="Label" value={newClinicalDay.label} onChange={(e)=>setNewClinicalDay({...newClinicalDay,label:e.target.value})}/><ActionButton onClick={handleAddClinicalDay}>Add clinical day</ActionButton></div><div className="mt-4 grid gap-2 md:grid-cols-2">{flattenClinicalSchedule(customClinicalSchedule).map((row)=><div key={`${row.month}-${row.day}`} className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm"><span><strong>{row.month} {row.day}</strong> — {row.events.join(", ")}</span><ActionButton variant="danger" onClick={()=>handleRemoveClinicalDay(row.month,row.day)}>Remove</ActionButton></div>)}</div></div>
      <h3 className="mt-5 text-lg font-bold">Quick checklist</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{clinicalChecks.map((item)=><label key={item} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><input type="checkbox" checked={!!checked[item]} onChange={(e)=>setChecked({...checked,[item]:e.target.checked})} className="h-4 w-4 rounded border-slate-400"/><span>{item}</span></label>)}</div></Card></section>}

    {activeTab === "brain" && <section><Card className="p-5"><div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold">Weekly Brain Dump</h2><p className="text-sm text-slate-600">Dump it here. Organize later.</p></div><ActionButton onClick={()=>handleCopy(makeBrainDumpText(brainDump),"Brain dump copied.")}>Copy brain dump</ActionButton></div><div className="space-y-3">{brainDump.map((item,i)=><TextInput key={i} placeholder={`Brain dump item ${i+1}`} value={item} onChange={(e)=>{const next=[...brainDump]; next[i]=e.target.value; setBrainDump(next);}}/>)}</div><div className="mt-4 flex flex-wrap gap-2"><ActionButton variant="secondary" onClick={()=>setBrainDump((current)=>[...current,""])}>Add line</ActionButton><ActionButton variant="secondary" onClick={()=>setBrainDump(["","","","",""])}>Clear</ActionButton></div></Card></section>}
  </div></div>;
}
