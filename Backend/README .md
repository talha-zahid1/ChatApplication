# ChatApplication — Backend

A real-time chat backend built with **Django**, **Django REST Framework**, and **Django Channels**. Supports private messaging, group chats, media uploads, user profiles, and WebSocket-based live communication.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django + Django REST Framework |
| Real-time | Django Channels (WebSocket) |
| Auth | SimpleJWT |
| Database | SQLite (dev) |
| Channel Layer | Redis |
| Server | Daphne (ASGI) |

---

## ⚙️ Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/talha-zahid1/ChatApplication.git
cd ChatApplication/Backend

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

# 3. Install dependencies
pip install -r requirement.txt

# 4. Start Redis (via Docker)
docker run -p 6379:6379 redis

# 5. Run migrations
python manage.py migrate

# 6. Start the server
daphne -p 8000 backend.asgi:application
```

---

## 🔐 Authentication

All protected endpoints require a JWT Access Token in the request header:

```
Authorization: Bearer <access_token>
```

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/register/` | ❌ | Register a new user |
| `POST` | `/api/token/` | ❌ | Login — get access & refresh tokens |
| `POST` | `/api/token/refresh/` | ❌ | Refresh access token |

**Register Request Body:**
```json
{
  "username": "talha",
  "email": "talha@email.com",
  "password": "pass123"
}
```

**Register Response:**
```json
{
  "status": true,
  "message": "User Registered",
  "username": "talha",
  "user_id": 1,
  "email": "talha@email.com",
  "tokens": {
    "access": "<access_token>",
    "refresh": "<refresh_token>"
  }
}
```

---

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/user/search/?q=<username>` | ❌ | Search user by exact username |
| `GET` | `/api/user/?q=<username>` | ✅ | Get user info (own if no query) |

---

### Profile

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/profile/` | ✅ | Upload profile picture |
| `GET` | `/api/profile/` | ✅ | Get profile picture URL |
| `PUT` | `/api/profile/` | ✅ | Update profile picture |
| `DELETE` | `/api/profile/` | ✅ | Delete profile picture |

**POST/PUT** — `multipart/form-data`:
```
profile_pic: <image file>
```

---

### Bio

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bio/` | ✅ | Get bio |
| `PUT` | `/api/bio/` | ✅ | Update bio |
| `DELETE` | `/api/bio/` | ✅ | Remove bio |

**PUT Request Body:**
```json
{ "bio": "Hello, I'm Talha!" }
```

---

### Private Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/private-room/` | ✅ | Create or get private room with a user |

**Request Body:**
```json
{ "rec_id": 2 }
```

**Response:**
```json
{ "room_id": 5 }
```

---

### Group Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/group/create/` | ✅ | Create a new group |
| `POST` | `/api/group/join/` | ✅ | Join a group by group_id |
| `GET` | `/api/group/join/?q=<name>` | ✅ | Search groups by name |
| `POST` | `/api/group/` | ✅ | Get room_id from group_id |
| `GET` | `/api/group/members/<room_id>/` | ✅ | See all members of a group |
| `POST` | `/api/group/add/<room_id>/` | ✅ | Add a user to group (Admin only) |
| `POST` | `/api/group/remove/` | ✅ | Remove a user from group (Admin only) |
| `GET` | `/api/group/leave/<room_id>/` | ✅ | Leave a group |
| `DELETE` | `/api/group/delete/<room_id>/` | ✅ | Delete a group (Admin only) |

**Create Group Request Body:**
```json
{
  "group_name": "Dev Team",
  "members": [2, 3, 4]
}
```

**Create Group Response:**
```json
{
  "status": true,
  "group_id": "uuid-here",
  "room_id": 10
}
```

---

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/<room_id>/` | ✅ | Get paginated messages of a room |
| `POST` | `/api/messages/seen/` | ✅ | Mark messages as read |
| `DELETE` | `/api/messages/delete/<msg_id>/` | ✅ | Delete a message |

**GET Messages Response:**
```json
{
  "next": "<cursor_url>",
  "results": [
    {
      "message_id": 1,
      "message": "Hello!",
      "is_read": false,
      "sender_id": 3,
      "timestamp": "2025-07-15T10:00:00Z"
    }
  ]
}
```

**Mark as Seen Request Body:**
```json
{ "message_ids": [1, 2, 3] }
```

---

### Inbox

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/inbox/` | ✅ | Get all conversations with last message |

**Response:**
```json
{
  "status": true,
  "last_message": [
    {
      "message": "Hey!",
      "room_id": 5,
      "sender_id": 2,
      "rec_id": [1],
      "is_group": false,
      "group_name": null
    }
  ]
}
```

---

### Media

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/media/` | ❌ | Upload a media file |
| `DELETE` | `/api/media/delete/` | ✅ | Delete a media file |

**POST** — `multipart/form-data`:
```
media: <file>
```

**DELETE Request Body:**
```json
{ "filepath": "/media/filename.jpg" }
```

---

### Conversations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `DELETE` | `/api/conversation/delete/<room_id>/` | ✅ | Delete a conversation (members only) |

---

## 🔌 WebSocket

Connect to a chat room in real-time:

```
ws://localhost:8000/ws/chat/<room_id>/
```

JWT token must be passed as a query parameter:

```
ws://localhost:8000/ws/chat/5/?token=<access_token>
```

### Send a Message

Send plain text after connecting:

```
Hello World
```

### Receive a Message

```json
{
  "message_id": 1,
  "message": "Hello World",
  "is_read": false,
  "sender_id": 3,
  "timestamp": "2025-07-15T10:00:00Z"
}
```

### Ping / Pong (Keep-alive)

```
Send:    ping
Receive: pong
```

### Close Codes

| Code | Reason |
|---|---|
| `4003` | User not a member of the room |

---

## 📁 Project Structure

```
Backend/
├── backend/          # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── asgi.py
├── chatapp/          # Main app
│   ├── models.py
│   ├── serializer.py
│   ├── pagination.py
│   ├── middleware.py
│   ├── routing.py
│   ├── views/
│   └── migrations/
├── manage.py
└── requirement.txt
```

---

## 📝 Notes

- Cursor-based pagination is used for messages (efficient for large chats)
- Only group **admin** (creator) can add/remove members or delete the group
- Media files are stored locally under `media/` — use cloud storage (S3/Cloudinary) in production
- `db.sqlite3` and `media/` are excluded from version control via `.gitignore`
