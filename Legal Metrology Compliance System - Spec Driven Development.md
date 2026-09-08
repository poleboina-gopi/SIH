# 📌 Legal Metrology Compliance System — Product Specification (Spec-Driven)

---

## 1. 🧠 Overview

A software system that automatically checks compliance of packaged commodities under the **Legal Metrology (Packaged Commodities) Rules, 2011** by analyzing product images, labels, and packaging data.

The system uses **image processing + OCR + rule-based validation** to detect violations and generate compliance reports.

---

## 2. 🎯 Goals

- Automate compliance checking process
- Reduce manual inspection workload
- Improve enforcement efficiency
- Ensure consumer protection & transparency

---

## 3. 👥 User Roles

### 3.1 Inspector / Enforcement Officer
- Upload product images
- Scan labels
- View compliance reports
- Track inspection history

### 3.2 Admin
- Manage users
- View analytics dashboards
- Configure rules (optional advanced)

### 3.3 System (AI Engine)
- Extract text using OCR
- Validate compliance rules
- Generate reports

---

## 4. 🔄 Core Workflow

Upload Image → OCR Processing → Extract Declarations → Validate Rules → Detect Violations → Generate Report → Store History

---

## 5. 🧩 Core Features

### 5.1 Authentication
- Secure login (JWT-based)
- Role-based access control

---

### 5.2 Product Scanning

#### Image Upload
- Upload product images (label/package)
- Multiple image support

#### OCR Processing
- Extract text from images
- Identify key fields:
  - Manufacturer details
  - MRP
  - Net quantity
  - Date of packing/manufacture
  - Consumer care details

---

### 5.3 Compliance Validation Engine

#### Rule-Based Checks
- Mandatory declarations presence
- Correct format validation
- Placement validation (basic)
- MRP format check
- Date format validation

#### Violation Detection
- Missing fields
- Incorrect values
- Non-standard formatting

---

### 5.4 Font Size & Readability Analysis
- Detect text clarity
- Approximate font size validation
- Flag unreadable labels

---

### 5.5 Report Generation

#### Compliance Report
- Status: Compliant / Non-Compliant
- List of violations
- Extracted data

#### Export Options
- PDF report
- Editable format (JSON/CSV)

---

### 5.6 Dashboard

#### Inspector Dashboard
- Total scans
- Violations summary
- Recent inspections

#### Admin Dashboard
- System analytics
- Department-wise violations
- Compliance trends

---

### 5.7 Repository System

- Store scanned products
- Maintain compliance history
- Search & filter records

---

## 6. 🗄️ Database Design

### Users Table
- id
- name
- email
- password
- role

---

### Products Table
- id
- product_name
- image_url
- uploaded_by
- created_at

---

### Scans Table
- id
- product_id
- extracted_text
- compliance_status
- created_at

---

### Violations Table
- id
- scan_id
- violation_type
- description

---

### Reports Table
- id
- scan_id
- report_url
- generated_at

---

## 7. 🔌 API Endpoints

### Auth
- POST /login
- POST /register

---

### Scan & OCR
- POST /upload-image
- POST /process-ocr

---

### Compliance
- POST /validate
- GET /report/:id

---

### Dashboard
- GET /stats
- GET /violations

---

## 8. 🖥️ Frontend Pages

- Login Page
- Dashboard
- Upload/Scan Page
- Scan Results Page
- Compliance Report Page
- Admin Dashboard

---

## 9. ⚙️ Tech Stack (Suggested)

### Frontend
- React + TypeScript
- Tailwind CSS

### Backend
- Node.js + Express

### AI / OCR
- Tesseract OCR / Google Vision API

### Database
- MongoDB / PostgreSQL

### Storage
- Cloudinary / AWS S3

---

## 10. 🚀 Advanced Features (High Impact)

- AI-based label detection
- Image segmentation
- Duplicate product detection
- Real-time scanning (mobile camera)
- NLP-based validation
- Auto rule updates

---

## 11. 📊 Future Scope

- Integration with government databases
- Mobile inspection app
- Barcode/QR scanning
- E-commerce compliance monitoring

---

## 12. 🧪 Edge Cases

- Blurry images
- Multi-language labels
- Partial data extraction
- Fake/edited labels

---

## 13. 🔐 Security

- JWT Authentication
- Role-based authorization
- Secure file uploads
- Data encryption

---

## 14. 📦 Deployment

- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas
- AI APIs: Cloud-based

---

## 15. 🏁 Definition of Done

- OCR working accurately
- Compliance rules implemented
- Report generation functional
- Dashboard working
- Fully deployed system

---

## 16. 💡 Key Innovation

Combines:
- AI (OCR + NLP)
- Rule Engine
- Compliance Automation

To solve real-world regulatory problem at scale.

---

## 17. 📘 Documentation Required

- Architecture diagram
- API documentation
- Deployment guide
- User manual

---

## 18. 🎯 Final Output

A complete intelligent system that:
- Scans packaged products
- Detects compliance issues automatically
- Generates legal-ready reports
- Helps enforcement officers act faster