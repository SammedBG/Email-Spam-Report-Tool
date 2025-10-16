# Email Spam Report Tool (Full Stack JS)

📌 Project Overview
A full-stack JavaScript app to test email deliverability across multiple inbox providers. Users start a test, send emails to provided test inboxes, then view a report showing placement (Inbox, Spam, Promotions) and an overall score. Includes history and shareable report links. PDF export is supported.

🧠 How It Works (step-by-step)
1) Start Test: User enters email -> backend generates unique code and returns 5 test inbox addresses and instructions.  
2) Send Emails: User sends a test email (with code in subject/body) to the addresses.  
3) Check Results: Client calls /api/check/:code to detect placement per provider (simulated by default).  
4) Report: UI shows per-inbox results, score, and allows sharing or downloading a PDF.  
5) History: User can view past tests saved in MongoDB.

🧰 Tech Stack
- Frontend: React (Vite) + Tailwind CSS (JavaScript only)
- Backend: Express + MongoDB (Mongoose) (JavaScript only)
- Optional: pdfkit for PDF export (server)

⚙️ API Endpoints and Flow
- POST /api/start-test -> { code, instructions: { sendTo[], subject, body } }
- GET /api/check/:code -> { code, status, result[], score, createdAt }
- GET /api/history/:email -> Test summaries for the email
- GET /api/report/:code/pdf -> Streams PDF report

📈 Features and Enhancements
- Deliverability score, per-inbox status (Inbox/Spam/Promotions)
- History, shareable link (/report/:code), PDF export
- Polished UI with loading/empty/success/error states and transitions
- Responsive, mobile-friendly

🚀 How to Run Locally
1) Server
   - cd server
   - Create .env with:
     - MONGO_URI="your-mongodb-atlas-uri"
     - MONGO_DB_NAME="email_spam_report"
     - CLIENT_ORIGIN="http://localhost:5173"
     - PORT=5000
   - npm install
   - npm run dev
2) Client
   - cd client
   - Create .env with:
     - VITE_API_URL="http://localhost:5000"
   - npm install
   - npm run dev
3) Open http://localhost:5173

☁️ Deployment Info
- Frontend: Vercel (build: vite)
- Backend: Render (Node/Express)
- Database: MongoDB Atlas
- PDF Storage: Optional (S3/Firebase) if you want to persist generated PDFs (this demo streams them)

💡 Future Improvements
- Integrate Gmail/Outlook APIs for real detection
- Add email notifications with report links
- Add open/click tracking pixels
- Authentication for private histories

👨‍💻 Author
Sammed Ghattad
