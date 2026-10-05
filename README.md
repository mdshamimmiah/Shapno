# Outlet Display Monitoring - Full Stack

এই project-এ Frontend + Backend দুটোই আছে।

## Structure
- frontend = React + Vite
- backend = Node.js + Express
- database = MongoDB-ready
- image upload = backend API দিয়ে local uploads-ready
- outlet add/edit/delete
- manager display submission
- zonal dashboard
- submitted/pending status

## Run
1. Root folder-এ terminal খুলুন
2. npm install
3. npm run install-all
4. backend/.env.example কপি করে backend/.env বানান
5. npm run dev

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Important
MongoDB URI না দিলে demo in-memory data ব্যবহার করবে। Server restart করলে demo data reset হবে।
Real online shared system-এর জন্য MongoDB Atlas এবং cloud image storage connect করতে হবে।
