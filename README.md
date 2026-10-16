# CivicLens (MVP v1.0)
> **AI-Assisted Civic Issue Documentation & Cautious Complaint Drafting**

CivicLens helps residents, community volunteers, and civic evaluators turn a single photo of a possible civic issue into a structured, evidence-based description and a polite, ready-to-copy complaint draft.

---

## 🎯 Product Principle & Boundaries (PRD Compliance)
> **Product Principle:** CivicLens assists with **drafting only**. It does not verify the issue or the photo, submit a complaint, or confirm which authority is responsible.

### Supported Scope (MVP v1.0)
1. **Potholes**: Road surface damage, asphalt cavities, pavement fragmentation.
2. **Garbage Accumulation**: Visible waste in public walkways or open lots.
3. **Broken Streetlights**: Damaged luminaires, tilted or unlit poles.
4. **Caution Handling for Unclear Evidence**: Refuses to force a classification on blurry, dark, or insufficient photos.
5. **Scope Boundary Enforcement**: Explicitly notifies users when an observation (e.g. tree branch, animal) is outside MVP categories.

### Out of Scope (Section 7 of PRD)
- No automatic portal submission
- No authority identification
- No photo authentication certification
- No live GPS / automatic geocoding requirement (uses user text faithfully)
- No user profiles or logins
- No speculative causes, depth measurements, dates, or legal severity ratings

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

---

## 🧪 Evaluator & Hackathon Testing Guide

CivicLens includes built-in 1-click test cases corresponding to the PRD Success Criteria:
1. **Road Pothole** — Evaluates cautious identification without unsupported depth claims.
2. **Garbage Accumulation** — Evaluates separation of visible waste from speculative origins/schedules.
3. **Broken Streetlight** — Evaluates observation of fixture state without assuming electrical status.
4. **Unclear / Low-Light Image** — Validates PRD Requirement 4.3 (communicates uncertainty instead of forcing classification).
5. **Fallen Tree Branch (Scope Test)** — Validates PRD Section 6 & 7 (gracefully explains MVP scope boundaries).

---

## 🛠 Tech Stack
<br>
team members
<br>
Rahul raj
<br>
Varnit Surmaan
<br>
Rohan negi
<br>
Piyush mewar
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS with custom civic aesthetic
- **Icons:** Lucide React
- **AI Engine:** Dual-mode (Instant PRD-compliant local heuristic reasoning + optional Google Gemini Multimodal Vision API integration)
