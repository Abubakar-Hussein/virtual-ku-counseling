
========================================================================
             VIRTUAL KU COUNSELING - SYSTEM SETUP GUIDE
========================================================================



------------------------------------------------------------------------
DETAILS
------------------------------------------------------------------------


Name:                  ABUBAKAR HUSSEIN
Student ID:            J17S/12673/2022
Supervisor:            Dr. LUCY GITAU 
Course:                BSc. Computer Science
Year:                  2025/2026
Project Name:           Virtual KU Counseling Booking and Scheduling System





This guide provides step-by-step instructions to set up and run the
Virtual KU Counseling Booking and Scheduling System on your local machine.

------------------------------------------------------------------------
1. PREREQUISITES
------------------------------------------------------------------------
Before getting started, make sure you have the following installed:

  * Node.js          - Version 18.x or 20.x (LTS recommended)
  * npm              - Node Package Manager (comes with Node.js)
  * MongoDB          - Local server running at localhost:27017
                       or a MongoDB Atlas cloud URI
  * Gemini API Key   - From Google AI Studio (for AI assistant tools)
  * Gmail Account    - (Optional) For email alerts (requires an App Password)

------------------------------------------------------------------------
2. INSTALLATION STEPS
------------------------------------------------------------------------

STEP 1: Open the project folder in your command prompt or terminal:
  cd "C:\Users\akrhu\OneDrive\Desktop\Virtual KU app\ku-counseling"

STEP 2: Install the required dependencies:
  npm install

------------------------------------------------------------------------
3. ENVIRONMENT VARIABLES CONFIGURATION
------------------------------------------------------------------------
Create a file named ".env.local" in the root directory (ku-counseling/)
and paste the configuration below. Update values as needed.

  ----------------------------------------------------------------------
  # Database Connection (MongoDB)
  MONGODB_URI=mongodb+srv://admin:<password>@cluster0.lz4xxow.mongodb.net/?appName=Cluster0

  # NextAuth Settings (Authentication)
  NEXTAUTH_SECRET=ku-counseling-super-secret-change-me-in-production
  NEXTAUTH_URL=http://localhost:3000

  # Email Configuration (SMTP Server - Optional)
  EMAIL_SERVER_HOST=smtp.gmail.com
  EMAIL_SERVER_PORT=465
  EMAIL_SERVER_USER=your-email@gmail.com
  EMAIL_SERVER_PASSWORD=your-gmail-app-password

  # Google Meet Link Integration
  GOOGLE_MEET_BASE_URL=https://meet.google.com

  # Default Admin Access Credentials (Bypasses database checks)
  ADMIN_EMAIL=admin@ku.ac.ke
  ADMIN_PASSWORD=Admin@123

  # Google Gemini API
  GEMINI_API_KEY=your-gemini-api-key-here
  ----------------------------------------------------------------------

  NOTE:
  * NEXTAUTH_SECRET: Use a secure random string in production.
  * EMAIL_SERVER_PASSWORD: If using Gmail, this must be an 'App Password'
    created from your Google Account settings, not your login password.

------------------------------------------------------------------------
4. RUNNING THE APPLICATION
------------------------------------------------------------------------

* To run in DEVELOPMENT mode (with hot-reloading):
    npm run dev

  Then open http://localhost:3000 in your browser.

* To build and run in PRODUCTION mode:
    npm run build
    npm start

------------------------------------------------------------------------
5. VERIFICATION & TESTING
------------------------------------------------------------------------

* Verify database connection:
    node test-mongo.js

* Initial Admin Login:
    Go to http://localhost:3000
    Use the default admin credentials:
      - Email:    admin@ku.ac.ke
      - Password: Admin@123
========================================================================
