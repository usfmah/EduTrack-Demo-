# EduTrack Demo

Static demo of **EduTrack — Educational Workflow and Progress Tracking System**: a centralized
dashboard that reduces manual follow-up between managers, instructors, and students by tracking
task assignments, deadlines, progress history, and reviews in one place.

No backend or database — all data is a bundled demo dataset (`js/data.js`), with user-created
tasks/materials persisted in the browser via `localStorage`.

## Pages / Roles

| Page | Role | What it shows |
|---|---|---|
| `index.html` | Overview | Hero, role cards, features, workflow, scope |
| `manager.html` | Company Manager | Instructor performance, delay alerts, assign-task modal, materials review, student progress, reports, approvals, history |
| `instructor.html` | Instructor | Responsibilities, create student tasks, review queue, course materials (create / submit / approve / revise) |
| `student.html` | Student | Assigned tasks with submit flow, progress ring, feedback, published materials, deadlines |

## Project structure

```
index.html  manager.html  instructor.html  student.html
css/style.css        # navy/indigo/amber education theme
js/data.js           # shared demo dataset (window.EduData)
js/app.js            # toasts, badges, notifications, task/material stores
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

Just open `index.html` in a browser — no build step, no dependencies.
