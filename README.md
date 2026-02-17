# TodoApp-React

A modern todo application built with React, Node.js, and Express. Features user authentication, todo management with inline editing, filtering, sorting, and real-time sync between client and server.

## Features

- User authentication (register/login)
- Create, read, update, delete todos
- Inline editing with Save/Cancel
- Filter by status (All/Active/Completed)
- Sort by created, edited, title, or status
- Real-time sync with server
- Persistent sessions with localStorage
- Status messages (no popups)
- Responsive design

## Quick Start

### Prerequisites
- Node.js v16+ 
- npm v7+

### Installation & Run

```bash
# Install dependencies
npm install

# Run both server and client
npm run dev

# Or run separately:
npm run dev:server  # Backend on http://localhost:3000
npm run dev:client  # Frontend on http://localhost:5173
```

### Build for Production
```bash
npm run build
```

## Tech Stack

- **Frontend**: React 19, Vite, React Context API
- **Backend**: Express.js, Node.js
- **Data**: localStorage (client), JSON file (server)
- **Auth**: Bearer token authentication

## Project Structure

```
├── api/
│   ├── backend.js              # Express server
│   └── data.json               # User and todo data
├── src/
│   ├── components/             # React components
│   ├── context/                # Authentication context
│   ├── hooks/                  # Custom hooks
│   ├── css/                    # Stylesheets
│   └── App.jsx                 # Main component
└── package.json
```

## API Endpoints

**Authentication:**
- `POST /register` - Create account
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current user

**Todos** (all require Bearer token):
- `GET /todos` - Get all todos
- `POST /todos` - Create todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo

## Notes

- For development only (passwords stored in plain text)
- Gradual migration from vanilla JS to React
- Uses localStorage for client-side persistence

## Author

Coded by Leo Gurdian using React, Node.js, HTML, CSS, JavaScript. February 2026.

## License

ISC
