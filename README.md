cp# Email Spam Report Tool (Full Stack JS)

📌 Project Overview
A full-stack JavaScript app to test email deliverability across multiple inbox providers. Users start a test, send emails to provided test inboxes, then view a report showing placement (Inbox, Spam, Promotions) and an overall score. Includes history and shareable report links. PDF export is supported.

🧠 How It Works (step-by-step)
1) Start Test: User enters email -> backend generates unique code and returns 5 test inbox addresses and instructions.  
2) Send Emails: User sends a test email (with code in subject/body) to the addresses.  
3) Authenticate: User authenticates with mailbox providers (Gmail, Outlook, Yahoo, iCloud, Proton) via OAuth.  
4) Check Results: Client calls /api/check/:code to detect placement per provider using real API integrations.  
5) Report: UI shows per-inbox results, score, and allows sharing or downloading a PDF.  
6) History: User can view past tests saved in MongoDB.

🧰 Tech Stack
- Frontend: React (Vite) + Tailwind CSS (JavaScript only)
- Backend: Express + MongoDB (Mongoose) (JavaScript only)
- APIs: Gmail API, Microsoft Graph API, Yahoo Mail API, iCloud Mail API, ProtonMail API
- Authentication: OAuth 2.0 for all mailbox providers
- PDF Export: pdfkit for PDF report generation

⚙️ API Endpoints and Flow
- POST /api/start-test -> { code, instructions: { sendTo[], subject, body } }
- POST /api/check/:code -> { code, status, result[], score, createdAt } (requires OAuth tokens)
- GET /api/history/:email -> Test summaries for the email
- GET /api/report/:code/pdf -> Streams PDF report
- GET /api/auth/{provider} -> OAuth authentication URLs for each provider
- GET /api/auth/{provider}/callback -> OAuth callback handlers

📈 Features and Enhancements
- Deliverability score, per-inbox status (Inbox/Spam/Promotions)
- History, shareable link (/report/:code), PDF export
- Polished UI with loading/empty/success/error states and transitions
- Responsive, mobile-friendly

🚀 How to Run Locally
1) Server
   - cd server
   - Create .env with API credentials (see API_SETUP_GUIDE.md):
     - MONGO_URI="your-mongodb-atlas-uri"
     - MONGO_DB_NAME="email_spam_report"
     - CLIENT_ORIGIN="http://localhost:5173"
     - PORT=5000
     - Gmail, Outlook, Yahoo, iCloud, Proton API credentials
   - npm install
   - npm run dev
2) Client
   - cd client
   - Create .env with:
     - VITE_API_URL="http://localhost:5000"
   - npm install
   - npm run dev
3) Open http://localhost:5173
4) Follow API_SETUP_GUIDE.md to configure mailbox APIs

☁️ Deployment Info
- Frontend: Vercel (build: vite)
- Backend: Render (Node/Express)
- Database: MongoDB Atlas
- PDF Storage: Optional (S3/Firebase) if you want to persist generated PDFs (this demo streams them)

✅ Completed Features
- Real Gmail/Outlook/Yahoo/iCloud/Proton API integrations
- OAuth 2.0 authentication for all providers
- Real email detection and placement analysis
- Token management and automatic refresh
- Comprehensive API setup documentation

💡 Future Improvements
- Add email notifications with report links
- Add open/click tracking pixels
- Enhanced error handling and retry mechanisms
- API usage monitoring and rate limiting

👨‍💻 Author
Sammed Ghattad
