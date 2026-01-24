💬 Real-Time Chat & File Sharing Web App

A real-time messaging web application where users can chat instantly and share documents, photos, and videos. Built to provide fast communication with a clean UI and secure backend APIs.

✨ Key Features

✅ Authentication

Sign Up / Login

Secure password hashing

JWT based authorization

✅ Real-Time Chat

Instant message sending & receiving

Messages update live without page refresh

✅ File Sharing

Send Images 📷

Send Videos 🎥

Send Documents 📄

Upload and share files inside chat

✅ Chat Experience

Message ordering with timestamps

Smooth and responsive UI

Works on desktop and mobile

🛠 Tech Stack

Frontend: React.js

Backend: Node.js, Express.js

Database: MongoDB (Mongoose)

Real-Time: Socket.IO

Auth: JWT + Bcrypt

📂 Project Structure
project/
│── client/         # React frontend
│── server/         # Node + Express backend
│── README.md

⚙️ Setup & Run Locally

1) Clone Repo
2) git clone https://github.com/your-username/project-name.git
cd project-name
4) Backend Setup
cd server
npm install
npm start
5) Frontend Setup
cd ../client

npm install

npm run dev

🔑 Environment Variables

Create .env inside server/:

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

🔥 Real-Time Functionality

Real-time messaging is handled using Socket.IO, enabling:

Instant message delivery

Live updates between users

🔒 Security Notes

Passwords stored using bcrypt hashing

Auth handled using JWT

Environment secrets stored inside .env

<img width="1919" height="911" alt="Screenshot 2026-01-24 230253" src="https://github.com/user-attachments/assets/9c0d990c-c752-420c-ad2e-d22e697cf6cb" />

<img width="1919" height="912" alt="Screenshot 2026-01-24 230315" src="https://github.com/user-attachments/assets/39848365-ebd7-44aa-825f-f999aa7ab506" />

👨‍💻 Author

Tushar Khadde

GitHub:  https://github.com/Tusharkhadde

LinkedIn: https://www.linkedin.com/in/tushar-khadde-192618342/
