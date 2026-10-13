/* EduTrack demo dataset — shared across manager / instructor / student pages */
window.EduData = {
  instructorTasks: [
    { id: "INS-101", title: "Prepare Week 4 lesson plan — Algebra", instructor: "Sarah Chen", course: "Mathematics 101", deadline: "2026-10-18", status: "In Progress", progress: 65 },
    { id: "INS-102", title: "Grade Midterm Assessments", instructor: "David Okafor", course: "Physics Fundamentals", deadline: "2026-10-15", status: "Under Review", progress: 85 },
    { id: "INS-103", title: "Upload Lab Videos — Module 3", instructor: "Priya Nair", course: "Chemistry Basics", deadline: "2026-10-20", status: "Submitted", progress: 100 },
    { id: "INS-104", title: "Design Quiz: Essay Structure", instructor: "Emily Roberts", course: "English Composition", deadline: "2026-10-12", status: "Overdue", progress: 40 },
    { id: "INS-105", title: "Review Student Portfolios", instructor: "Michael Torres", course: "Art & Design", deadline: "2026-10-25", status: "Not Started", progress: 5 },
    { id: "INS-106", title: "Finalize Capstone Rubric", instructor: "Sarah Chen", course: "Mathematics 101", deadline: "2026-10-28", status: "Completed", progress: 100 }
  ],
  studentTasks: [
    { id: "STU-201", title: "Algebra Problem Set 4", lesson: "Linear Equations", course: "Mathematics 101", assignee: "Alex Johnson", deadline: "2026-10-16", status: "In Progress" },
    { id: "STU-202", title: "Physics Lab Report — Motion", lesson: "Kinematics Lab", course: "Physics Fundamentals", assignee: "Maria Garcia", deadline: "2026-10-14", status: "Submitted" },
    { id: "STU-203", title: "Titration Worksheet", lesson: "Acids & Bases", course: "Chemistry Basics", assignee: "James Wilson", deadline: "2026-10-11", status: "Overdue" },
    { id: "STU-204", title: "Persuasive Essay Draft", lesson: "Essay Structure", course: "English Composition", assignee: "Sophie Lee", deadline: "2026-10-17", status: "Under Review" },
    { id: "STU-205", title: "Color Theory Exercise", lesson: "Design Basics", course: "Art & Design", assignee: "Daniel Kim", deadline: "2026-10-19", status: "Pending" },
    { id: "STU-206", title: "Quadratic Functions Quiz", lesson: "Quadratics", course: "Mathematics 101", assignee: "Alex Johnson", deadline: "2026-10-10", status: "Revision Required" },
    { id: "STU-207", title: "Waves Practice Problems", lesson: "Wave Properties", course: "Physics Fundamentals", assignee: "Maria Garcia", deadline: "2026-10-09", status: "Completed" },
    { id: "STU-208", title: "Poetry Analysis", lesson: "Literary Devices", course: "English Composition", assignee: "Sophie Lee", deadline: "2026-10-22", status: "Pending" }
  ],
  students: [
    { id: "S-01", name: "Alex Johnson", initials: "AJ", course: "Mathematics 101", completion: 82, overdue: 0 },
    { id: "S-02", name: "Maria Garcia", initials: "MG", course: "Physics Fundamentals", completion: 91, overdue: 0 },
    { id: "S-03", name: "James Wilson", initials: "JW", course: "Chemistry Basics", completion: 58, overdue: 2 },
    { id: "S-04", name: "Sophie Lee", initials: "SL", course: "English Composition", completion: 74, overdue: 1 },
    { id: "S-05", name: "Daniel Kim", initials: "DK", course: "Art & Design", completion: 66, overdue: 1 }
  ],
  notifications: [
    { id: "N-1", title: "Task overdue: Essay Structure Quiz", desc: "Emily Roberts missed the Oct 12 deadline. Reminder sent.", time: "10 min ago", type: "danger" },
    { id: "N-2", title: "Lab Videos submitted for review", desc: "Priya Nair submitted Module 3 videos. Manager approval pending.", time: "1 hr ago", type: "info" },
    { id: "N-3", title: "Revision requested: Quadratics Quiz", desc: "Alex Johnson needs to revise 3 answers before resubmission.", time: "3 hrs ago", type: "warning" },
    { id: "N-4", title: "Midterm grading 85% complete", desc: "David Okafor is on track for the Oct 15 deadline.", time: "Yesterday", type: "success" },
    { id: "N-5", title: "New student enrolled", desc: "Daniel Kim joined Art & Design. Welcome tasks assigned.", time: "Yesterday", type: "info" },
    { id: "N-6", title: "Weekly report ready", desc: "On-time rate 87%. 2 tasks overdue across 4 courses.", time: "2 days ago", type: "neutral" }
  ],
  history: [
    { id: "H-1", task: "Grade Midterm Assessments", actor: "David Okafor", from: "In Progress", to: "Under Review", time: "2026-10-13 09:20" },
    { id: "H-2", task: "Upload Lab Videos — Module 3", actor: "Priya Nair", from: "In Progress", to: "Submitted", time: "2026-10-12 16:05" },
    { id: "H-3", task: "Persuasive Essay Draft", actor: "Sophie Lee", from: "Submitted", to: "Under Review", time: "2026-10-12 11:40" },
    { id: "H-4", task: "Quadratic Functions Quiz", actor: "Sarah Chen", from: "Submitted", to: "Revision Required", time: "2026-10-11 15:12" },
    { id: "H-5", task: "Design Quiz: Essay Structure", actor: "System", from: "In Progress", to: "Overdue", time: "2026-10-12 00:01" },
    { id: "H-6", task: "Titration Worksheet", actor: "System", from: "Pending", to: "Overdue", time: "2026-10-11 00:01" },
    { id: "H-7", task: "Finalize Capstone Rubric", actor: "Manager", from: "Under Review", to: "Completed", time: "2026-10-10 14:30" }
  ],
  courses: [
    { id: "C-01", title: "Mathematics 101", lessons: 24, instructor: "Sarah Chen", students: 42, progress: 78, color: "#3B5BFD" },
    { id: "C-02", title: "Physics Fundamentals", lessons: 18, instructor: "David Okafor", students: 35, progress: 64, color: "#0EA5A4" },
    { id: "C-03", title: "English Composition", lessons: 16, instructor: "Emily Roberts", students: 38, progress: 71, color: "#F59E0B" },
    { id: "C-04", title: "Chemistry Basics", lessons: 20, instructor: "Priya Nair", students: 30, progress: 55, color: "#8B5CF6" }
  ],
  materials: [
    { id: "MAT-01", title: "Week 4 Slides — Linear Equations", course: "Mathematics 101", type: "Slides", owner: "Sarah Chen", updated: "2026-10-12", status: "Under Review", link: "", desc: "Slide deck covering linear equations with worked examples." },
    { id: "MAT-02", title: "Kinematics Lab Video — Part 2", course: "Physics Fundamentals", type: "Video", owner: "David Okafor", updated: "2026-10-11", status: "Submitted", link: "", desc: "Lab walkthrough video, pending manager/reviewer approval." },
    { id: "MAT-03", title: "Essay Structure Worksheet", course: "English Composition", type: "Worksheet", owner: "Emily Roberts", updated: "2026-10-09", status: "Approved", link: "", desc: "Printable worksheet on essay structure, published to students." },
    { id: "MAT-04", title: "Acids & Bases Quiz Bank", course: "Chemistry Basics", type: "Quiz", owner: "Priya Nair", updated: "2026-10-08", status: "Draft", link: "", desc: "Draft quiz bank, not yet submitted for review." }
  ]
};
