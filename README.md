# ⚖️ Legal Metrology Compliance System (AI-Powered)

An intelligent, end-to-end automated compliance verification platform for packaged commodities under the **Legal Metrology (Packaged Commodities) Rules, 2011** and the **Legal Metrology Act, 2009** (India).

---

## 📌 Features

- **Automated Label Inspection**: Upload packaging label photos or use webcams to extract statutory declarations via OCR.
- **Rules Engine (Rules 2011)**:
  - **Rule 6(1)(a)**: Complete manufacturer/packer/importer physical address verification.
  - **Rule 6(1)(b)**: Generic or common commodity name.
  - **Rule 6(1)(c)**: Net quantity validation (strictly enforces legal units: `g`, `kg`, `ml`, `l`; flags illegal symbols like `gms`, `ml.`).
  - **Rule 6(1)(d)**: Month & Year of packing/mfg format (`MM/YYYY` or `Month YYYY`).
  - **Rule 6(1)(e)**: Maximum Retail Price (MRP) mandatory tax clause (`inclusive of all taxes`).
  - **Rule 6(1)(n)**: Consumer care phone **and** email ID.
  - **Rule 6(1)(m)**: Country of Origin for imported commodities.
  - **Rule 7**: Numeral height and font readability analysis.
  - **Section 36 Penalties**: Automatic fine calculation and **Form 1 Statutory Show Cause Notice** drafting.
- **Interactive Visual Verification**: Interactive SVG/Canvas bounding boxes displaying detected declaration regions.
- **Inspector Hub & Admin Analytics**:
  - Inspector dashboard with KPI counters and 1-click benchmark test samples.
  - Joint Controller / Admin dashboard with violation frequency charts and live Statutory Rules Configurator.
- **Audit Repository**: Full historical register with instant search and status filtering.
- **Multi-Format Export**: Official PDF / Print view, Legal JSON, and CSV.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS Design System (Government-grade dark/light mode), Lucide Icons
- **AI / OCR**: Tesseract OCR engine, NLP & Regex Metrology Extraction heuristics
- **Backend**: Node.js, Express.js, JWT Authentication, Multer file upload
- **Database**: Local JSON Document Store (`server/data/db.json`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
# Server listens on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
# Vite dev server runs at http://localhost:5173
```

### 4. Demo Accounts
- **Inspector**: `inspector@gov.in` / `inspector123`
- **Admin**: `admin@gov.in` / `admin123`
*(Or use the 1-click Demo buttons on the login screen)*

---

## 📂 Project Architecture

```
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Navbar, BoundingBoxOverlay
│   │   ├── data/               # Benchmark packaging test labels
│   │   ├── pages/              # Inspector, Scan, Results, Report, Admin, Repository
│   │   ├── services/           # API client
│   │   ├── types/              # TypeScript definitions
│   │   ├── App.tsx             # Root router & role management
│   │   └── index.css           # Custom Directorate design system
├── server/                     # Express.js REST API
│   ├── src/
│   │   ├── routes/             # Auth, Scan, Compliance, Dashboard, Rules
│   │   ├── rules/              # Statutory Legal Metrology Rules specification
│   │   ├── services/           # NLP Parser & Compliance Engine
│   │   ├── db.js               # JSON document store & seed data
│   │   └── index.js            # Express server entry point
│   └── data/                   # Persistent database file (db.json)
└── Legal Metrology Compliance System - Spec Driven Development.md
```

---

## ⚖️ Statutory Framework

Developed strictly in accordance with:
- **Legal Metrology Act, 2009** (Act No. 1 of 2010)
- **Legal Metrology (Packaged Commodities) Rules, 2011** (as amended)
- **Section 36 & Section 48** (Offences, Penalties & Compounding Provisions)
