
# 💬 Chat App Frontend

This is the React frontend for the real-time Chat App built using React, Vite, and Tailwind CSS. It connects to a Django backend (using Django REST Framework and WebSockets via Django Channels).

> 🚀 Live Demo (if deployed): [Click Here](https://your-frontend-url.vercel.app)pending.....

---

## 🔧 Features

✅ User Authentication (Login & Signup)  
✅ Real-time messaging using WebSockets  
✅ Edit & delete your own messages  
✅ Message reactions (👍 ❤️ 😂 etc.)  
✅ File sharing (images, PDFs, etc.)  
✅ Profile picture, name, and bio update  
✅ Seen/Delivered indicator  
✅ Typing indicators  
✅ Pagination (infinite scroll)  

---

## 📁 Project Structure

```
📦 chat-frontend
├── public/
├── src/
│   ├── api.js
│   ├── App.jsx
│   ├── main.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Thread.jsx
│   │   └── Profile.jsx
│   └── components/
│       └── Navbar.jsx
└── tailwind.config.js
```

---

## ⚙️ Setup & Installation

1. 📦 Clone the repo

```bash
git clone https://github.com/Manveer101/chat-app-frontend.git
cd chat-app-frontend
```

2. 📁 Install dependencies

```bash
npm install
```

3. 🔗 Connect to your backend

Create a `.env` file and add your API base URL:

```env
VITE_API_BASE_URL=https://mychatapp-1-ooe6.onrender.com/api/
```

4. 🧪 Run development server

```bash
npm run dev
```

---

## 🚀 Build for Production

```bash
npm run build
```

To preview the build:

```bash
npm run preview
```

---

## 🌐 Deployment (Vercel Recommended)

1. Push your code to GitHub.
2. Connect your GitHub repo to [Vercel](https://vercel.com/).
3. Add the environment variable:
   - `VITE_API_BASE_URL = https://your-backend-url/api/`
4. Deploy and done ✅

---

## 🙌 Contributors

Made with ❤️ by [Manveer Singh](https://github.com/manveer11011)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
