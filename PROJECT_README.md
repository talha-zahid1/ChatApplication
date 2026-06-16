# ChatApplication

A full-stack real-time chat application that allows users to communicate through private and group conversations. Built with a Django REST Framework backend and a React + TypeScript frontend, it uses WebSockets to deliver messages instantly without page refresh.

Users can register, set up their profile, search for other users, start private chats, create group rooms, and send messages — all in real time.

---

## ✨ Features

### 💬 Messaging
- Real-time messaging via WebSockets (Django Channels)
- Private one-on-one conversations
- Group chats with multiple members
- Message history with cursor-based pagination
- Mark messages as read / seen
- Delete individual messages

### 👥 Group Management
- Create groups with multiple members
- Search and join existing groups
- Admin can add or remove members
- Admin can delete the group
- Any member can leave a group

### 👤 User & Profile
- Register and login with JWT authentication
- Upload, update, and delete profile picture
- Add, update, and remove bio
- Search users by username

### 📁 Media
- Upload media files (images, etc.) to attach in chat
- Delete uploaded media files

### 📥 Inbox
- View all conversations with the latest message preview
- Supports both private and group conversations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Django, Django REST Framework |
| Real-time | Django Channels (WebSocket) |
| Auth | JWT (SimpleJWT) |
| Channel Layer | Redis |
| Database | SQLite (development) |
| ASGI Server | Daphne |

---

## 📁 Project Structure

```
ChatApplication/
├── Backend/
│   ├── backend/          # Django project config (settings, urls, asgi)
│   ├── chatapp/          # Main app (models, views, serializers, consumers)
│   ├── manage.py
│   └── requirement.txt
└── Frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── tsconfig.json
```

---

## 🚀 Getting Started

### Backend

```bash
cd Backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirement.txt

# Start Redis
docker run -p 6379:6379 redis

# Run migrations
python manage.py migrate

# Start server
daphne -p 8000 backend.asgi:application
```

### Frontend

```bash
cd Frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 🔌 WebSocket

Real-time chat connects via:

```
ws://localhost:8000/ws/chat/<room_id>/?token=<access_token>
```

---

## 📄 API Documentation

See [Backend README](./Backend/README.md) for full API reference including all endpoints, request/response examples, and WebSocket details.




