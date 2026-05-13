import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
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
const PLANNER_DOC_REF = doc(db, "planners", "alyssa-summer-2026");

const clinicalSchedule = {
  // Saha, A tentative Hendricks schedule from email:
  // May 11–June 7 = Tues/Wed clinical
  // June 8–June 28 = Thurs/Fri clinical
  // July 6–July 26 = Tues/Wed clinical
  // July 27–Aug 14 = Thurs/Fri clinical
  May: {
    12: ["🩺 Clinical"],
    13: ["🩺 Clinical"],
    19: ["🩺 Clinical"],
    20: ["🩺 Clinical"],
    26: ["🩺 Clinical"],
    27: ["🩺 Clinical"],
  },
  June: {
    2: ["🩺 Clinical"],
    3: ["🩺 Clinical"],
    11: ["🩺 Clinical"],
    12: ["🩺 Clinical"],
    18: ["🩺 Clinical"],
    19: ["🩺 Clinical"],
    25: ["🩺 Clinical"],
    26: ["🩺 Clinical"],
  },
  July: {
    7: ["🩺 Clinical"],
    8: ["🩺 Clinical"],
    14: ["🩺 Clinical"],
    15: ["🩺 Clinical"],
    21: ["🩺 Clinical"],
    22: ["🩺 Clinical"],
    30: ["🩺 Clinical"],
    31: ["🩺 Clinical"],
  },
  August: {
    6: ["🩺 Clinical"],
    7: ["🩺 Clinical"],
    13: ["🩺 Clinical"],
    14: ["🩺 Clinical"],
  },
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
      22: ["Clinical Cell Communication WB", "Comprehensive Care Plan #1", "SIM Test-Out Week"],
      24: ["Mandatory SIM Test-Out Class"],
      25: ["Mandatory SIM Test-Out Class"],
      29: ["Seminar Presentation 3 week", "Clinical Week 6/29–7/5: No WB", "2 eval screenshots + 2 care plans"],
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
  {
    week: "Week 1 — 5/11",
    focus: "Clinical launch + syllabus items",
    tasks: [
      "5/11 — Clinical Faculty Expectations Webex at 1800 EST",
      "5/15 — Seminar Intro Discussion Board",
      "5/15 — Clinical Syllabus Attestation",
      "5/17 — SIM Syllabus Review Attestation",
      "Clinical Week 5/11–5/17: No workbook due",
      "Clinical: Tues/Wed",
    ],
  },
  {
    week: "Week 2 — 5/18",
    focus: "Airway anatomy + first full clinical paperwork week",
    tasks: [
      "5/18 — Clinical Airway Anatomy Workbook",
      "5/18 — Seminar Syllabus Attestation Quiz",
      "5/18 — Principles 2 Plan for Success",
      "5/20 — Systems Intro Discussion Board",
      "5/20 or 5/21 — Optional SIM Adductor Canal & Popliteal",
      "5/22 — Systems Assignment 1",
      "5/23 — Systems Discussion Board 1",
      "Clinical Week 5/18–5/24: 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Clinical: Tues/Wed",
    ],
  },
  {
    week: "Week 3 — 5/25",
    focus: "No clinical workbook, but paperwork still due",
    tasks: [
      "5/25 — Memorial Day / University Holiday",
      "5/26 — Plagiarism Attestation Quiz",
      "5/30 — Systems Discussion Board Replies",
      "Clinical Week 5/25–5/31: No workbook due",
      "Clinical Week 5/25–5/31: 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Clinical: Tues/Wed",
    ],
  },
  {
    week: "Week 4 — 6/1",
    focus: "Respiratory physiology + Exam 1 prep",
    tasks: [
      "6/1 — Clinical Respiratory Physiology Workbook",
      "6/1 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Week of 6/1 — Seminar Presentation 1 or discussion alternative",
      "6/3 or 6/4 — SIM Optional LAST/Pneumoperitoneum/Machine Failure",
      "6/6 — Systems Discussion Board 2",
      "6/8 — Principles 2 Exam 1",
      "Clinical: Tues/Wed until switch on 6/8",
    ],
  },
  {
    week: "Week 5 — 6/8",
    focus: "Respiratory pathophys + clinical switch week",
    tasks: [
      "6/8 — Clinical Respiratory Pathophysiology Workbook",
      "6/8 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "6/13 — Systems Discussion Board Replies",
      "Clinical: Thurs/Fri after 6/8 switch",
    ],
  },
  {
    week: "Week 6 — 6/15",
    focus: "Airway management + journal club",
    tasks: [
      "Week of 6/15 — Seminar Presentation 2 or discussion alternative",
      "6/15 — Clinical Airway Management Workbook",
      "6/15 — Mandatory Journal Club Session time TBD",
      "6/15 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Clinical: Thurs/Fri",
    ],
  },
  {
    week: "Week 7 — 6/22",
    focus: "Cell communication + comprehensive care plan + SIM test-out",
    tasks: [
      "6/22 — Clinical Cell Communication Workbook",
      "6/22 — Comprehensive Care Plan #1",
      "6/22–6/28 — SIM Test-Out Week",
      "6/24 or 6/25 — Mandatory SIM Test-Out Class",
      "Clinical: Thurs/Fri",
    ],
  },
  {
    week: "Week 8 — 6/29",
    focus: "No clinical workbook, but paperwork still due",
    tasks: [
      "Week of 6/29 — Seminar Presentation 3 or discussion alternative",
      "Clinical Week 6/29–7/5: No workbook due",
      "Clinical Week 6/29–7/5: 2 Medatrax evaluation screenshots + 2 weekly care plans",
    ],
  },
  {
    week: "Week 9 — 7/6",
    focus: "ANS + first clinical site evaluation items",
    tasks: [
      "7/2 — SIM Bronchospasm/Anaphylaxis Quiz",
      "7/6 — Clinical ANS Anatomy & Physiology Workbook",
      "7/6 — Summative evaluations, preceptor evals, and first clinical site eval due",
      "7/9 — SIM Hypoxia Quiz",
      "7/11 — Systems DB 3, no peer responses",
      "Clinical: Tues/Wed",
    ],
  },
  {
    week: "Week 10 — 7/13",
    focus: "ANS Pharm/Patho + Exam 2",
    tasks: [
      "7/13 — Principles 2 AP2 Exam 2",
      "7/13 — Clinical ANS Pharmacology & Pathophysiology Workbook",
      "7/13 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Week of 7/13 — Seminar Quiz 1 over presentations 1–3",
      "Clinical: Tues/Wed",
    ],
  },
  {
    week: "Week 11 — 7/20",
    focus: "Cardiovascular anatomy + Seminar paper",
    tasks: [
      "7/19 — SIM Discussion Board #1",
      "7/20 — Clinical Cardiovascular Anatomy & Physiology Workbook",
      "7/20 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "7/20 — Seminar Franciscan Values Paper",
      "Week of 7/20 — Seminar Presentation 4 or discussion alternative",
      "7/25 — Systems Assignment 2",
      "Clinical: Tues/Wed",
    ],
  },
  {
    week: "Week 12 — 7/27",
    focus: "Valvular heart disease + journal club + switch to Thurs/Fri",
    tasks: [
      "7/27 — Clinical Valvular Heart Disease Workbook",
      "7/27 — Mandatory Journal Club Session time TBD",
      "7/27 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Clinical: Thurs/Fri after 7/27 switch",
    ],
  },
  {
    week: "Week 13 — 8/3",
    focus: "Cardiovascular pathophys",
    tasks: [
      "8/2 — SIM Discussion Board #2",
      "8/3 — Clinical Cardiovascular Pathophysiology Workbook",
      "8/3 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Week of 8/3 — Seminar Presentation 5 or discussion alternative",
      "Clinical: Thurs/Fri",
    ],
  },
  {
    week: "Week 14 — 8/10",
    focus: "Final exam prep + comprehensive care plan #2",
    tasks: [
      "8/10 — Principles 2 Exam 3",
      "8/10 — Clinical Comprehensive Care Plan #2",
      "8/10 — 2 Medatrax evaluation screenshots + 2 weekly care plans",
      "Week of 8/10 — Seminar Quiz 2 over presentations 4 & 5",
      "8/11 — Systems Professional Practice Paper",
      "Clinical: Thurs/Fri through 8/14",
    ],
  },
  {
    week: "Week 15 — 8/17",
    focus: "Finals week + clinical wrap-up",
    tasks: [
      "8/17 — Finals Week begins",
      "8/17 — Principles 2 AP2 Final Exam",
      "8/17 — Clinical Make-Up Week if needed",
      "8/17 — Final summative evaluations + site/preceptor evals",
    ],
  },
];

const starterAssignments = [
  { id: 1, sortDate: "2026-05-11", assignment: "Faculty Expectations Webex at 1800 EST", course: "Clinical", due: "5/11", status: "Not Started", priority: "Critical", notes: "Updated NSG 661 syllabus Week 1" },
  { id: 2, sortDate: "2026-05-15", assignment: "Intro Discussion Board", course: "Seminar 1", due: "5/15", status: "Not Started", priority: "High", notes: "Professional bio discussion board" },
  { id: 3, sortDate: "2026-05-15", assignment: "Syllabus Attestation", course: "Clinical", due: "5/15", status: "Not Started", priority: "Critical", notes: "Clinical syllabus attestation" },
  { id: 4, sortDate: "2026-05-17", assignment: "Syllabus Review Attestation", course: "SIM", due: "5/17", status: "Not Started", priority: "Critical", notes: "SIM syllabus review attestation" },
  { id: 5, sortDate: "2026-05-18", assignment: "Syllabus Attestation Quiz", course: "Seminar 1", due: "5/18", status: "Not Started", priority: "Critical", notes: "Required quiz" },
  { id: 6, sortDate: "2026-05-18", assignment: "Plan for Success", course: "Principles 2", due: "5/18", status: "Not Started", priority: "High", notes: "Principles 2 assignment" },
  { id: 7, sortDate: "2026-05-18", assignment: "Airway Anatomy WB", course: "Clinical", due: "5/18", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 8, sortDate: "2026-05-20", assignment: "Intro Discussion Board", course: "Systems", due: "5/20", status: "Not Started", priority: "High", notes: "Systems intro discussion" },
  { id: 9, sortDate: "2026-05-20", assignment: "Optional Class: Adductor Canal & Popliteal Canal", course: "SIM", due: "5/20 or 5/21", status: "Not Started", priority: "Low", notes: "Optional class" },
  { id: 10, sortDate: "2026-05-22", assignment: "Assignment 1", course: "Systems", due: "5/22", status: "Not Started", priority: "High", notes: "Systems assignment" },
  { id: 11, sortDate: "2026-05-23", assignment: "Discussion Board 1", course: "Systems", due: "5/23", status: "Not Started", priority: "High", notes: "Initial discussion board post" },
  { id: 12, sortDate: "2026-05-25", assignment: "Memorial Day / University Holiday", course: "University Days to Know", due: "5/25", status: "Not Started", priority: "Medium", notes: "No workbook due this week" },
  { id: 13, sortDate: "2026-05-25", assignment: "Clinical Week 5/25–5/31: 2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "5/25", status: "Not Started", priority: "Critical", notes: "Updated NSG 661 schedule" },
  { id: 14, sortDate: "2026-05-26", assignment: "Plagiarism Attestation Quiz", course: "Systems", due: "5/26", status: "Not Started", priority: "Critical", notes: "Required attestation quiz" },
  { id: 15, sortDate: "2026-05-30", assignment: "Discussion Board Replies", course: "Systems", due: "5/30", status: "Not Started", priority: "High", notes: "Peer replies" },

  { id: 16, sortDate: "2026-06-01", assignment: "Respiratory Physiology WB", course: "Clinical", due: "6/1", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 17, sortDate: "2026-06-01", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "6/1", status: "Not Started", priority: "Critical", notes: "Clinical Week 6/1–6/7" },
  { id: 18, sortDate: "2026-06-01", assignment: "Student Presentation 1 / Optional Live or Discussion Post", course: "Seminar 1", due: "Week of 6/1", status: "Not Started", priority: "Medium", notes: "Attend optional live or complete discussion post" },
  { id: 19, sortDate: "2026-06-03", assignment: "Optional Class: LAST, Pneumoperitoneum, Anesthesia Machine Failure", course: "SIM", due: "6/3 or 6/4", status: "Not Started", priority: "Low", notes: "Optional SIM class" },
  { id: 20, sortDate: "2026-06-06", assignment: "Discussion Board 2", course: "Systems", due: "6/6", status: "Not Started", priority: "High", notes: "Systems discussion board" },
  { id: 21, sortDate: "2026-06-08", assignment: "EXAM 1", course: "Principles 2", due: "6/8", status: "Not Started", priority: "Critical", notes: "Principles 2 exam" },
  { id: 22, sortDate: "2026-06-08", assignment: "Respiratory Pathophysiology WB", course: "Clinical", due: "6/8", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 23, sortDate: "2026-06-08", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "6/8", status: "Not Started", priority: "Critical", notes: "Clinical Week 6/8–6/14" },
  { id: 24, sortDate: "2026-06-13", assignment: "Discussion Board Replies", course: "Systems", due: "6/13", status: "Not Started", priority: "High", notes: "Peer replies" },
  { id: 25, sortDate: "2026-06-15", assignment: "Student Presentation 2 / Optional Live or Discussion Post", course: "Seminar 1", due: "Week of 6/15", status: "Not Started", priority: "Medium", notes: "Attend optional live or complete discussion post" },
  { id: 26, sortDate: "2026-06-15", assignment: "Airway Management WB", course: "Clinical", due: "6/15", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 27, sortDate: "2026-06-15", assignment: "Mandatory Journal Club Session", course: "Clinical", due: "6/15 TBD", status: "Not Started", priority: "Critical", notes: "Time TBD" },
  { id: 28, sortDate: "2026-06-15", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "6/15", status: "Not Started", priority: "Critical", notes: "Clinical Week 6/15–6/21" },
  { id: 29, sortDate: "2026-06-22", assignment: "Cell Communication WB", course: "Clinical", due: "6/22", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 30, sortDate: "2026-06-22", assignment: "Comprehensive Care Plan #1", course: "Clinical", due: "6/22", status: "Not Started", priority: "Critical", notes: "Major assignment" },
  { id: 31, sortDate: "2026-06-22", assignment: "SIM Test-Out Week", course: "Clinical", due: "Week of 6/22", status: "Not Started", priority: "Critical", notes: "Listed in updated NSG 661 schedule" },
  { id: 32, sortDate: "2026-06-24", assignment: "Mandatory Classes in Indy / Test-Out Week", course: "SIM", due: "6/24 or 6/25", status: "Not Started", priority: "Critical", notes: "Epidural, spinal, interscalene, adductor canal, popliteal, LAST, pneumoperitoneum, anesthesia machine failure" },
  { id: 33, sortDate: "2026-06-29", assignment: "Student Presentation 3 / Optional Live or Discussion Post", course: "Seminar 1", due: "Week of 6/29", status: "Not Started", priority: "Medium", notes: "Attend optional live or complete discussion post" },
  { id: 34, sortDate: "2026-06-29", assignment: "Clinical Week 6/29–7/5: No WB + 2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "6/29", status: "Not Started", priority: "Critical", notes: "Updated NSG 661 schedule" },

  { id: 35, sortDate: "2026-07-02", assignment: "Bronchospasm/Anaphylaxis Quiz", course: "SIM", due: "7/2", status: "Not Started", priority: "High", notes: "SIM quiz" },
  { id: 36, sortDate: "2026-07-06", assignment: "ANS Anatomy & Physiology WB", course: "Clinical", due: "7/6", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 37, sortDate: "2026-07-06", assignment: "Summative evals + preceptor evals + first clinical site eval", course: "Clinical", due: "7/6", status: "Not Started", priority: "Critical", notes: "Updated NSG 661 Week 9" },
  { id: 38, sortDate: "2026-07-09", assignment: "Hypoxia Quiz", course: "SIM", due: "7/9", status: "Not Started", priority: "High", notes: "SIM quiz" },
  { id: 39, sortDate: "2026-07-11", assignment: "Discussion Board 3 — No Peer Responses", course: "Systems", due: "7/11", status: "Not Started", priority: "High", notes: "No peer responses" },
  { id: 40, sortDate: "2026-07-13", assignment: "AP2: EXAM 2", course: "Principles 2", due: "7/13", status: "Not Started", priority: "Critical", notes: "Principles 2 exam" },
  { id: 41, sortDate: "2026-07-13", assignment: "ANS Pharmacology & Pathophysiology WB", course: "Clinical", due: "7/13", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 42, sortDate: "2026-07-13", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "7/13", status: "Not Started", priority: "Critical", notes: "Clinical Week 7/13–7/19" },
  { id: 43, sortDate: "2026-07-13", assignment: "Quiz 1 over Student Presentations 1–3", course: "Seminar 1", due: "Week of 7/13", status: "Not Started", priority: "High", notes: "Seminar quiz" },
  { id: 44, sortDate: "2026-07-19", assignment: "Discussion Board #1", course: "SIM", due: "7/19", status: "Not Started", priority: "Medium", notes: "SIM discussion board" },
  { id: 45, sortDate: "2026-07-20", assignment: "Cardiovascular Anatomy & Physiology WB", course: "Clinical", due: "7/20", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 46, sortDate: "2026-07-20", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "7/20", status: "Not Started", priority: "Critical", notes: "Clinical Week 7/20–7/26" },
  { id: 47, sortDate: "2026-07-20", assignment: "Franciscan Values Paper", course: "Seminar 1", due: "7/20", status: "Not Started", priority: "High", notes: "Paper" },
  { id: 48, sortDate: "2026-07-20", assignment: "Student Presentation 4 / Optional Live or Discussion Post", course: "Seminar 1", due: "Week of 7/20", status: "Not Started", priority: "Medium", notes: "Attend optional live or complete discussion post" },
  { id: 49, sortDate: "2026-07-25", assignment: "Assignment 2", course: "Systems", due: "7/25", status: "Not Started", priority: "High", notes: "Systems assignment" },
  { id: 50, sortDate: "2026-07-27", assignment: "Valvular Heart Disease WB", course: "Clinical", due: "7/27", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 51, sortDate: "2026-07-27", assignment: "Mandatory Journal Club Session", course: "Clinical", due: "7/27 TBD", status: "Not Started", priority: "Critical", notes: "Time TBD" },
  { id: 52, sortDate: "2026-07-27", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "7/27", status: "Not Started", priority: "Critical", notes: "Clinical Week 7/27–8/2" },

  { id: 53, sortDate: "2026-08-02", assignment: "Discussion Board #2", course: "SIM", due: "8/2", status: "Not Started", priority: "Medium", notes: "SIM discussion board" },
  { id: 54, sortDate: "2026-08-03", assignment: "Cardiovascular Pathophysiology WB", course: "Clinical", due: "8/3", status: "Not Started", priority: "High", notes: "Workbook" },
  { id: 55, sortDate: "2026-08-03", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "8/3", status: "Not Started", priority: "Critical", notes: "Clinical Week 8/3–8/9" },
  { id: 56, sortDate: "2026-08-03", assignment: "Student Presentation 5 / Optional Live or Discussion Post", course: "Seminar 1", due: "Week of 8/3", status: "Not Started", priority: "Medium", notes: "Attend optional live or complete discussion post" },
  { id: 57, sortDate: "2026-08-10", assignment: "EXAM 3", course: "Principles 2", due: "8/10", status: "Not Started", priority: "Critical", notes: "Principles 2 exam" },
  { id: 58, sortDate: "2026-08-10", assignment: "Comprehensive Care Plan #2", course: "Clinical", due: "8/10", status: "Not Started", priority: "Critical", notes: "Major assignment" },
  { id: 59, sortDate: "2026-08-10", assignment: "2 eval screenshots + 2 weekly care plans", course: "Clinical", due: "8/10", status: "Not Started", priority: "Critical", notes: "Clinical Week 8/10–8/16" },
  { id: 60, sortDate: "2026-08-10", assignment: "Quiz 2 over Student Presentations 4 & 5", course: "Seminar 1", due: "Week of 8/10", status: "Not Started", priority: "High", notes: "Seminar quiz" },
  { id: 61, sortDate: "2026-08-11", assignment: "Professional Practice Paper", course: "Systems", due: "8/11", status: "Not Started", priority: "High", notes: "Systems paper" },
  { id: 62, sortDate: "2026-08-17", assignment: "Finals Week", course: "University Days to Know", due: "8/17–8/21", status: "Not Started", priority: "High", notes: "Finals week" },
  { id: 63, sortDate: "2026-08-17", assignment: "AP2 Final Exam", course: "Principles 2", due: "8/17", status: "Not Started", priority: "Critical", notes: "Final exam" },
  { id: 64, sortDate: "2026-08-17", assignment: "Clinical Make-Up Week", course: "Clinical", due: "8/17", status: "Not Started", priority: "High", notes: "Clinical make-up week if needed" },
  { id: 65, sortDate: "2026-08-17", assignment: "Final summative evals + site/preceptor evals", course: "Clinical", due: "8/17", status: "Not Started", priority: "Critical", notes: "Final clinical evaluation items" },
];

const clinicalChecks = [
  "Patient assignment obtained / chart reviewed",
  "Care plan prepared before every anesthetic",
  "Care plan signed by preceptor",
  "Plan B anesthetic included",
  "3 comorbidities + anesthetic implications included",
  "3 surgical considerations + anesthetic implications included",
  "Ready to start case by 0700",
  "Airway concerns reviewed",
  "Meds/pressors/fluids reviewed",
  "Clinical eval submitted / screenshot uploaded",
  "Medatrax hours/cases updated",
  "Coordinator approved dismissal before leaving",
  "Things to review saved",
];

const statusOptions = ["Not Started", "In Progress", "Waiting", "Submitted", "Complete"];
const priorityOptions = ["Critical", "High", "Medium", "Low"];
const courseOptions = ["NSG 611-S", "NSG 615", "NSG 661", "Systems", "Principles 2", "Missing Syllabus"];

function getFilteredAssignments(assignments, filter) {
  if (filter === "All") return assignments;
  if (filter === "Active") return assignments.filter((a) => a.status !== "Complete" && a.status !== "Submitted");
  if (filter === "Critical") return assignments.filter((a) => a.priority === "Critical");
  return assignments.filter((a) => a.course === filter);
}

function getCompletionPercent(assignments) {
  if (!assignments.length) return 0;
  const completed = assignments.filter((a) => a.status === "Complete" || a.status === "Submitted").length;
  return Math.round((completed / assignments.length) * 100);
}

function makeClinicalTemplateText(clinical, checked) {
  const completedChecks = Object.keys(checked || {}).filter((key) => checked[key]);
  return `CLINICAL DAY TEMPLATE\nDate: ${clinical.date}\nSite: ${clinical.site}\nPreceptor: ${clinical.preceptor}\n\nCases:\n${clinical.cases}\n\nAirway/Anesthesia Concerns:\n${clinical.airway}\n\nMeds/Pressors/Fluids:\n${clinical.meds}\n\nLearning Points:\n${clinical.learning}\n\nThings to Review:\n${clinical.review}\n\nCompleted Checklist:\n${completedChecks.map((item) => `- ${item}`).join("\n")}`;
}

function makeBrainDumpText(brainDump) {
  return brainDump.map((item) => item.trim()).filter(Boolean).map((b, i) => `${i + 1}. ${b}`).join("\n");
}

function makeAssignmentExportText(assignments) {
  return assignments.map((a) => `${a.course} | ${a.assignment} | Due: ${a.due} | Status: ${a.status} | Priority: ${a.priority}`).join("\n");
}

async function safeCopy(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

const STORAGE_KEY = "srna-command-center-summer-2026-v1";

function loadSavedState() {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Unable to load saved SRNA planner state.", error);
    return null;
  }
}

function saveState(state) {
  if (typeof window === "undefined" || !window.localStorage) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Unable to save SRNA planner state.", error);
    return false;
  }
}

function clearSavedState() {
  if (typeof window === "undefined" || !window.localStorage) return false;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn("Unable to clear saved SRNA planner state.", error);
    return false;
  }
}

function downloadPlannerBackup(data) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `srna-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.warn("Unable to export planner backup.", error);
    return false;
  }
}

async function importPlannerBackup(file) {
  try {
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    console.warn("Unable to import planner backup.", error);
    return null;
  }
}

function mergeAssignmentsWithDefaults(savedAssignments) {
  if (!Array.isArray(savedAssignments)) return starterAssignments;

  const savedById = new Map(savedAssignments.map((item) => [item.id, item]));
  const mergedDefaults = starterAssignments.map((item) => ({ ...item, ...(savedById.get(item.id) || {}) }));
  const defaultIds = new Set(starterAssignments.map((item) => item.id));
  const customAssignments = savedAssignments.filter((item) => !defaultIds.has(item.id));

  return [...mergedDefaults, ...customAssignments].sort((a, b) => String(a.sortDate || "9999-99-99").localeCompare(String(b.sortDate || "9999-99-99")));
}

function buildPlannerState({ assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump }) {
  return {
    assignments,
    filter,
    activeTab,
    clinical,
    checked,
    calendarChecked,
    weeklyChecked,
    brainDump,
  };
}

function runSelfTests() {
  const sample = [
    { status: "Complete", priority: "Critical", course: "A", assignment: "One", due: "Today" },
    { status: "Submitted", priority: "High", course: "B", assignment: "Two", due: "Tomorrow" },
    { status: "Not Started", priority: "Critical", course: "A", assignment: "Three", due: "Friday" },
  ];

  console.assert(getCompletionPercent(sample) === 67, "Completion percent should round to 67% for 2/3 complete/submitted.");
  console.assert(getCompletionPercent([]) === 0, "Completion percent should be 0 for an empty assignment list.");
  console.assert(getFilteredAssignments(sample, "Active").length === 1, "Active filter should exclude Complete and Submitted.");
  console.assert(getFilteredAssignments(sample, "Critical").length === 2, "Critical filter should return critical items.");
  console.assert(getFilteredAssignments(sample, "A").length === 2, "Course filter should return matching course items.");
  console.assert(makeBrainDumpText(["one", "", " two "]) === "1. one\n2. two", "Brain dump should trim blanks and renumber.");
  console.assert(makeClinicalTemplateText({ date: "5/11", site: "Hendricks", preceptor: "", cases: "Case", airway: "", meds: "", learning: "", review: "" }, { "Medatrax updated": true }).includes("Site: Hendricks"), "Clinical template should include site.");
  console.assert(makeClinicalTemplateText({ date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" }, { "Medatrax updated": true }).includes("- Medatrax updated"), "Clinical template should include checked checklist items.");
  console.assert(makeAssignmentExportText(sample).includes("Due: Today"), "Assignment export should include due dates.");
  console.assert(!monthlyCalendarData.May.events[13], "Removed prior-week SIM pharm entry quiz from May 13.");
  console.assert(!starterAssignments.some((item) => item.assignment.includes("Pharm Entry")), "Removed Pharm Entry Quiz from assignment starter list.");
  console.assert(!starterAssignments.some((item) => item.assignment.includes("Bootcamp")), "Removed Bootcamp from assignment starter list.");
  console.assert(clinicalSchedule.May[26]?.length === 1 && !clinicalSchedule.May[28], "Clinical schedule should not mark every day after 5/26.");
  console.assert(mergeAssignmentsWithDefaults([{ id: 1, status: "Complete" }]).find((item) => item.id === 1).status === "Complete", "Saved assignment status should merge into defaults.");
  console.assert(mergeAssignmentsWithDefaults([{ id: 999, assignment: "Custom", sortDate: "2026-09-01" }]).some((item) => item.id === 999), "Custom assignments should be preserved.");
}

if (typeof window !== "undefined") {
  runSelfTests();
}

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200 ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`min-h-[92px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200 ${props.className || ""}`}
    />
  );
}

function SelectBox({ value, onChange, options, label }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function ActionButton({ children, onClick, variant = "primary", className = "", type = "button", ariaLabel }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-[0.99]";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-red-600 hover:bg-red-50",
  };
  return (
    <button type={type} aria-label={ariaLabel} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}

function buildCalendarCells(month) {
  const cells = [];
  for (let i = 0; i < month.start; i += 1) cells.push(null);
  for (let day = 1; day <= month.days; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getPriorityTone(priority) {
  if (priority === "Critical") return "red";
  if (priority === "High") return "orange";
  if (priority === "Medium") return "blue";
  return "green";
}

function getEventTone(event) {
  if (event.includes("Clinical")) return "border-green-200 bg-green-100 text-green-800";
  if (event.includes("EXAM") || event.includes("Exam") || event.includes("Quiz") || event.includes("Final")) return "border-red-200 bg-red-100 text-red-800";
  if (event.includes("SIM")) return "border-blue-200 bg-blue-100 text-blue-800";
  if (event.includes("Seminar")) return "border-orange-200 bg-orange-100 text-orange-800";
  if (event.includes("Systems")) return "border-yellow-200 bg-yellow-100 text-yellow-800";
  if (event.includes("Clinical") || event.includes("WB") || event.includes("care plans")) return "border-green-200 bg-green-100 text-green-800";
  return "border-slate-200 bg-white text-slate-700";
}

function makeEventId(month, day, event, eventIndex) {
  return `${month}-${day}-${eventIndex}-${event}`;
}

export default function SRNACommandCenter() {
  const savedState = useMemo(() => loadSavedState(), []);
  const [assignments, setAssignments] = useState(() => mergeAssignmentsWithDefaults(savedState?.assignments));
  const [filter, setFilter] = useState(savedState?.filter || "All");
  const [activeTab, setActiveTab] = useState(savedState?.activeTab || "calendar");
  const [newAssignment, setNewAssignment] = useState({ assignment: "", course: "NSG 661", due: "", priority: "Medium", status: "Not Started", notes: "" });
  const [clinical, setClinical] = useState(savedState?.clinical || { date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" });
  const [checked, setChecked] = useState(savedState?.checked || {});
  const [calendarChecked, setCalendarChecked] = useState(savedState?.calendarChecked || {});
  const [weeklyChecked, setWeeklyChecked] = useState(savedState?.weeklyChecked || {});
  const [brainDump, setBrainDump] = useState(savedState?.brainDump || ["", "", "", "", ""]);
  const [copyMessage, setCopyMessage] = useState(savedState ? "Loaded saved planner progress from this browser." : "");
  const [cloudStatus, setCloudStatus] = useState("Connecting to Firebase...");
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const filteredAssignments = useMemo(() => getFilteredAssignments(assignments, filter), [assignments, filter]);
  const completion = getCompletionPercent(assignments);
  const activeCount = getFilteredAssignments(assignments, "Active").length;
  const criticalCount = getFilteredAssignments(assignments, "Critical").filter((a) => a.status !== "Complete" && a.status !== "Submitted").length;
  const calendarItemCount = Object.keys(calendarChecked).filter((key) => calendarChecked[key]).length;

  useEffect(() => {
    let isMounted = true;

    async function loadCloudPlanner() {
      try {
        const snapshot = await getDoc(PLANNER_DOC_REF);

        if (!isMounted) return;

        if (snapshot.exists()) {
          const cloud = snapshot.data();
          setAssignments(mergeAssignmentsWithDefaults(cloud.assignments || []));
          setFilter(cloud.filter || "All");
          setActiveTab(cloud.activeTab || "calendar");
          setClinical(cloud.clinical || { date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" });
          setChecked(cloud.checked || {});
          setCalendarChecked(cloud.calendarChecked || {});
          setWeeklyChecked(cloud.weeklyChecked || {});
          setBrainDump(cloud.brainDump || ["", "", "", "", ""]);
          setCloudStatus("Cloud sync connected. Loaded planner from Firebase.");
        } else {
          setCloudStatus("Cloud sync connected. No cloud planner existed yet, so this device will create it.");
        }
      } catch (error) {
        console.warn("Unable to load planner from Firebase.", error);
        setCloudStatus("Firebase connection failed. Check Firestore setup/rules. Local autosave is still working.");
      } finally {
        if (isMounted) setCloudLoaded(true);
      }
    }

    loadCloudPlanner();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const plannerState = buildPlannerState({ assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump });

    const saved = saveState({
      ...plannerState,
      savedAt: new Date().toISOString(),
    });

    if (!saved) {
      setCopyMessage("Autosave could not save in this browser. Use copy/export as backup.");
    }

    if (!cloudLoaded) return;

    const timeout = window.setTimeout(async () => {
      try {
        await setDoc(
          PLANNER_DOC_REF,
          {
            ...plannerState,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setCloudStatus("Cloud sync saved.");
      } catch (error) {
        console.warn("Unable to save planner to Firebase.", error);
        setCloudStatus("Cloud sync failed. Check Firestore database/rules. Local autosave still works.");
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump, cloudLoaded]);

  const updateAssignment = (id, field, value) => {
    setAssignments((current) => current.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const addAssignment = () => {
    if (!newAssignment.assignment.trim()) {
      setCopyMessage("Add an assignment name first.");
      return;
    }
    setAssignments((current) => [{ id: Date.now(), ...newAssignment, assignment: newAssignment.assignment.trim() }, ...current]);
    setNewAssignment({ assignment: "", course: "NSG 661", due: "", priority: "Medium", status: "Not Started", notes: "" });
    setCopyMessage("Assignment added.");
  };

  const deleteAssignment = (id) => {
    setAssignments((current) => current.filter((a) => a.id !== id));
  };

  const handleCopy = async (text, successMessage) => {
    const copied = await safeCopy(text);
    setCopyMessage(copied ? successMessage : "Copy is not supported in this browser. The content is still visible on screen to select/copy manually.");
  };

  const addBrainLine = () => setBrainDump((current) => [...current, ""]);

  const exportPlanner = () => {
    const exportData = {
      ...buildPlannerState({ assignments, filter, activeTab, clinical, checked, calendarChecked, weeklyChecked, brainDump }),
      exportedAt: new Date().toISOString(),
    };

    const exported = downloadPlannerBackup(exportData);
    setCopyMessage(exported ? "Planner backup downloaded. Upload this file on another device to sync your progress." : "Unable to export planner backup.");
  };

  const handleImportPlanner = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imported = await importPlannerBackup(file);

    if (!imported) {
      setCopyMessage("Unable to import planner backup.");
      return;
    }

    setAssignments(mergeAssignmentsWithDefaults(imported.assignments || []));
    setFilter(imported.filter || "All");
    setActiveTab(imported.activeTab || "calendar");
    setClinical(imported.clinical || { date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" });
    setChecked(imported.checked || {});
    setCalendarChecked(imported.calendarChecked || {});
    setWeeklyChecked(imported.weeklyChecked || {});
    setBrainDump(imported.brainDump || ["", "", "", "", ""]);

    setCopyMessage("Planner backup imported successfully.");
  };

  const resetSavedPlanner = () => {
    clearSavedState();
    setAssignments(starterAssignments);
    setFilter("All");
    setActiveTab("calendar");
    setClinical({ date: "", site: "", preceptor: "", cases: "", airway: "", meds: "", learning: "", review: "" });
    setChecked({});
    setCalendarChecked({});
    setWeeklyChecked({});
    setBrainDump(["", "", "", "", ""]);
    setCopyMessage("Saved planner progress cleared and reset.");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Summer 2026</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">SRNA Command Center</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Interactive calendar, assignment list, clinical template, and weekly brain dump. Autosaves locally and syncs to Firebase for cross-device access.</p>
          </div>

          <div className="grid grid-cols-4 gap-3 md:w-[600px]">
            <Card className="p-4">
              <div className="text-xs text-slate-500">Assignments</div>
              <div className="mt-1 text-2xl font-bold">{completion}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Active</div>
              <div className="mt-1 text-2xl font-bold">{activeCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Critical</div>
              <div className="mt-1 text-2xl font-bold">{criticalCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Calendar Done</div>
              <div className="mt-1 text-2xl font-bold">{calendarItemCount}</div>
            </Card>
          </div>
        </header>

        {copyMessage ? <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">{copyMessage}</div> : null}

        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-bold">Autosave + Firebase sync</div>
              <div className="text-xs text-slate-600">{cloudStatus}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="secondary" onClick={exportPlanner}>Export backup</ActionButton>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
                Import backup
                <input type="file" accept="application/json" className="hidden" onChange={handleImportPlanner} />
              </label>
              <ActionButton variant="secondary" onClick={resetSavedPlanner}>Reset saved progress</ActionButton>
            </div>
          </div>
        </Card>

        <nav className="grid grid-cols-5 gap-2 rounded-2xl bg-slate-200 p-1 md:w-[920px]">
          {[
            { key: "calendar", label: "📅 Calendar" },
            { key: "schedule", label: "🗓 Weekly Plan" },
            { key: "assignments", label: "☑ Assignments" },
            { key: "clinical", label: "🩺 Clinical" },
            { key: "brain", label: "🧠 Brain Dump" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "calendar" && (
          <section className="space-y-8">
            <Card className="p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Interactive Semester Calendar</h2>
                  <p className="text-sm text-slate-600">Checkboxes are built into each clinical day and assignment. Prior-week bootcamp and Pharm Entry Quiz were removed.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">Cross-checked</Badge>
                  <ActionButton variant="secondary" onClick={() => setCalendarChecked({})}>Clear calendar checks</ActionButton>
                </div>
              </div>
            </Card>

            <div className="space-y-10">
              {calendarMonths.map((month) => {
                const monthInfo = monthlyCalendarData[month.name];
                const cells = buildCalendarCells(month);

                return (
                  <Card key={month.name} className={`overflow-hidden border-0 bg-gradient-to-br ${monthInfo.color}`}>
                    <div className="p-6 md:p-8">
                      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                          <div className={`text-6xl font-black opacity-70 md:text-8xl ${monthInfo.accent}`}>2026</div>
                          <h2 className="-mt-6 text-4xl font-light italic tracking-wide md:text-6xl">{month.name}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
                          <Badge tone="orange">Principles/Seminar</Badge>
                          <Badge tone="blue">Simulation</Badge>
                          <Badge tone="green">Clinical Days</Badge>
                          <Badge tone="purple">Workbook/Care Plan</Badge>
                          <Badge tone="red">Exams/Quizzes</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500 md:text-sm">
                        {weekdayHeaders.map((day) => (
                          <div key={day} className="py-2">{day}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {cells.map((day, index) => {
                          const assignmentEvents = day ? monthInfo.events[day] || [] : [];
                          const clinicalEvents = day ? (clinicalSchedule[month.name]?.[day] || []) : [];
                          const events = [...clinicalEvents, ...assignmentEvents];

                          return (
                            <div
                              key={`${month.name}-${index}`}
                              className={`min-h-[130px] rounded-2xl border border-white/60 bg-white/60 p-2 backdrop-blur-sm md:min-h-[165px] ${events.length ? "shadow-sm" : "opacity-70"}`}
                            >
                              {day ? (
                                <>
                                  <div className="mb-2 text-right text-sm font-bold md:text-base">{day}</div>
                                  <div className="space-y-1">
                                    {events.map((event, eventIndex) => {
                                      const eventId = makeEventId(month.name, day, event, eventIndex);
                                      const isDone = !!calendarChecked[eventId];
                                      return (
                                        <label
                                          key={eventId}
                                          className={`flex cursor-pointer items-start gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-medium leading-tight md:text-xs ${getEventTone(event)} ${isDone ? "opacity-55 line-through" : ""}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isDone}
                                            onChange={(e) => setCalendarChecked({ ...calendarChecked, [eventId]: e.target.checked })}
                                            className="mt-0.5 h-3 w-3 shrink-0"
                                          />
                                          <span>{event}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "schedule" && (
          <section className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Week-by-Week Survival Plan</h2>
                  <p className="text-sm text-slate-600">Grouped by workload so you can plan ahead without staring at 200 little boxes.</p>
                </div>
                <Badge tone="orange">High workload summer</Badge>
              </div>
            </Card>

            <div className="grid gap-4">
              {weeklySchedule.map((week, weekIndex) => (
                <Card key={week.week} className="p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{week.week}</h3>
                      <p className="text-sm text-slate-600">{week.focus}</p>
                    </div>
                    <Badge tone="blue">Plan ahead week</Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    {week.tasks.map((task, index) => {
                      const id = `${weekIndex}-${index}-${task}`;
                      const done = !!weeklyChecked[id];
                      return (
                        <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 ${done ? "opacity-55 line-through" : ""}`}>
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={(event) => setWeeklyChecked({ ...weeklyChecked, [id]: event.target.checked })}
                            className="mt-1 h-4 w-4"
                          />
                          <span className="text-sm">{task}</span>
                        </label>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeTab === "assignments" && (
          <section className="space-y-4">
            <Card className="p-4">
              <h2 className="mb-3 text-xl font-bold">Add assignment</h2>
              <div className="grid gap-3 md:grid-cols-6">
                <TextInput className="md:col-span-2" placeholder="Assignment" value={newAssignment.assignment} onChange={(e) => setNewAssignment({ ...newAssignment, assignment: e.target.value })} />
                <SelectBox label="Course" value={newAssignment.course} onChange={(v) => setNewAssignment({ ...newAssignment, course: v })} options={courseOptions} />
                <TextInput placeholder="Due date" value={newAssignment.due} onChange={(e) => setNewAssignment({ ...newAssignment, due: e.target.value })} />
                <SelectBox label="Priority" value={newAssignment.priority} onChange={(v) => setNewAssignment({ ...newAssignment, priority: v })} options={priorityOptions} />
                <ActionButton onClick={addAssignment}>+ Add</ActionButton>
              </div>
              <TextInput className="mt-3" placeholder="Notes" value={newAssignment.notes} onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })} />
            </Card>

            <div className="flex flex-wrap gap-2">
              {["All", "Active", "Critical", ...courseOptions].map((f) => (
                <ActionButton key={f} variant={filter === f ? "primary" : "secondary"} className="rounded-full" onClick={() => setFilter(f)}>{f}</ActionButton>
              ))}
              <ActionButton variant="secondary" className="rounded-full" onClick={() => handleCopy(makeAssignmentExportText(filteredAssignments), "Assignment list copied.")}>Copy visible list</ActionButton>
            </div>

            <div className="grid gap-3">
              {filteredAssignments.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="grid gap-3 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-3">
                      <TextInput value={a.assignment} onChange={(e) => updateAssignment(a.id, "assignment", e.target.value)} />
                    </div>
                    <div className="md:col-span-1"><Badge>{a.course}</Badge></div>
                    <div className="md:col-span-2"><TextInput value={a.due} onChange={(e) => updateAssignment(a.id, "due", e.target.value)} /></div>
                    <div className="md:col-span-2"><SelectBox label="Status" value={a.status} onChange={(v) => updateAssignment(a.id, "status", v)} options={statusOptions} /></div>
                    <div className="md:col-span-1"><Badge tone={getPriorityTone(a.priority)}>{a.priority}</Badge></div>
                    <div className="md:col-span-2"><TextInput value={a.notes} onChange={(e) => updateAssignment(a.id, "notes", e.target.value)} /></div>
                    <ActionButton ariaLabel={`Delete ${a.assignment}`} variant="danger" onClick={() => deleteAssignment(a.id)}>×</ActionButton>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeTab === "clinical" && (
          <section className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Clinical Day Template</h2>
                  <p className="text-sm text-slate-600">Use this for patient lookup, post-clinical notes, and care-plan-worthy cases.</p>
                </div>
                <ActionButton onClick={() => handleCopy(makeClinicalTemplateText(clinical, checked), "Clinical note copied.")}>Copy clinical note</ActionButton>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <TextInput placeholder="Date" value={clinical.date} onChange={(e) => setClinical({ ...clinical, date: e.target.value })} />
                <TextInput placeholder="Site" value={clinical.site} onChange={(e) => setClinical({ ...clinical, site: e.target.value })} />
                <TextInput placeholder="Preceptor" value={clinical.preceptor} onChange={(e) => setClinical({ ...clinical, preceptor: e.target.value })} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TextArea placeholder="Cases / procedures" value={clinical.cases} onChange={(e) => setClinical({ ...clinical, cases: e.target.value })} />
                <TextArea placeholder="Airway + anesthesia concerns" value={clinical.airway} onChange={(e) => setClinical({ ...clinical, airway: e.target.value })} />
                <TextArea placeholder="Meds, pressors, fluids, local anesthetics" value={clinical.meds} onChange={(e) => setClinical({ ...clinical, meds: e.target.value })} />
                <TextArea placeholder="Learning points / preceptor pearls" value={clinical.learning} onChange={(e) => setClinical({ ...clinical, learning: e.target.value })} />
              </div>

              <TextArea className="mt-3" placeholder="Things to review later" value={clinical.review} onChange={(e) => setClinical({ ...clinical, review: e.target.value })} />

              <h3 className="mt-5 text-lg font-bold">Quick checklist</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {clinicalChecks.map((item) => (
                  <label key={item} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={!!checked[item]}
                      onChange={(event) => setChecked({ ...checked, [item]: event.target.checked })}
                      className="h-4 w-4 rounded border-slate-400"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </Card>
          </section>
        )}

        {activeTab === "brain" && (
          <section className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Weekly Brain Dump</h2>
                  <p className="text-sm text-slate-600">Dump it here. Organize later. This is the “get it out of my head before I forget it” zone.</p>
                </div>
                <ActionButton onClick={() => handleCopy(makeBrainDumpText(brainDump), "Brain dump copied.")}>Copy brain dump</ActionButton>
              </div>

              <div className="space-y-3">
                {brainDump.map((item, i) => (
                  <TextInput
                    key={i}
                    placeholder={`Brain dump item ${i + 1}`}
                    value={item}
                    onChange={(e) => {
                      const next = [...brainDump];
                      next[i] = e.target.value;
                      setBrainDump(next);
                    }}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton variant="secondary" onClick={addBrainLine}>Add line</ActionButton>
                <ActionButton variant="secondary" onClick={() => setBrainDump(["", "", "", "", ""])}>Clear</ActionButton>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
