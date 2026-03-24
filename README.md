# 🧬 Medi Health - Enterprise DNA Cryptography System

**Medi Health** is a high-security medical records encryption platform designed for healthcare professionals and patients. It utilizes a state-of-the-art **4-Layer DNA-based Cryptography** pipeline to ensure HIPAA-compliant data security, end-to-end.

---

## 🔒 The 4-Layer DNA Pipeline

The core of Medi Health is a custom cryptographic engine that transforms medical data (text and images) through four distinct biological-inspired layers:

1.  **DNA Encoding**: Binary data is mapped to DNA nucleotide bases (A, T, C, G) using a dynamic, shuffled mapping scheme unique to each data chunk.
2.  **DNA XOR**: Each base sequence undergoes a bitwise-equivalent XOR operation with a CSPRNG-generated pseudo-random key.
3.  **Base Complement**: Sequences are transformed through biological complementation (A ↔ T, C ↔ G), adding a layer of non-linear complexity.
4.  **Seeded Permutation**: The final sequence is shuffled using a multi-round Fisher-Yates permutation seeded by the master key, preventing frequency analysis attacks.

---

## ✨ Key Features

### 👨‍⚕️ Doctor Portal
- **Advanced Dashboard**: Real-time stats for encryption history and report distribution.
- **Secure Encryption**: Dual-mode support for sensitive clinical notes (Text) and diagnostic reports (Images).
- **History Tracking**: Secure, persistent log of all encrypted records with cloud-synced metadata.
- **Auto-Key Derivation**: Secure 24-character master key generation for patient sharing.

### 👤 Patient Portal
- **Zero-Knowledge Decryption**: Decrypt reports locally in-browser; the server never sees the plaintext or the master key.
- **Informational Dashboard**: Detailed breakdown of encryption technology, supported report types, and security protocols.
- **Secure Copy & View**: High-fidelity rendering of decrypted text reports and images.

### 🛡️ System Security
- **Supabase Auth Integration**: Robust, enterprise-grade authentication for all users.
- **Row-Level Security (RLS)**: Cryptographically enforced data isolation at the database level.
- **Zero-Storage of Keys**: Master keys are never stored on the server, ensuring full data sovereignty for the user.
- **Sleek Dark UI**: A professional, glassmorphic interface powered by Tailwind CSS v4.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend**: Python 3.10+, Flask, DNA-Crypto-Engine (Custom).
- **Database**: Supabase (PostgreSQL), Cloud Storage (Supabase Buckets).
- **DevOps**: Environment-based configuration, RESTful API architecture.

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed

### 2. Database Configuration
1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the contents of `SUPABASE_TABLES.sql`.
4. (Optional but recommended) Run `FIX_RLS.sql` to ensure backend compatibility with custom RLS rules.

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Create a `backend/.env` with your `SUPABASE_URL` and `SUPABASE_KEY` (service_role).*

### 4. Frontend Setup
```bash
cd medi-health-app
npm install
npm run dev
```
*Create a `medi-health-app/.env` with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.*

---

## 📁 Project Structure

```text
crypto/
├── backend/              # Flask API & DNA Logic
│   ├── app.py           # Main entry point
│   ├── dna_crypto.py    # Biological mapping engine
│   └── supabase_client.py
├── medi-health-app/     # React Dashboard
│   ├── src/
│   │   ├── components/  # Doctor & Patient Portals
│   │   └── lib/         # Supabase connection
├── SUPABASE_TABLES.sql   # Database schema
└── FIX_RLS.sql          # Security policy fixes
```

---

## 📜 Disclaimer
This system is designed for medical data security research and high-performance demonstration. While it follows HIPAA principles, always ensure compliance with your local healthcare data regulations before production use.
