# SplitWise Clone

A full-stack expense splitting application built with React, Express.js, and MongoDB. Split expenses with friends, family, and roommates easily.

## Features

- **User Authentication**: Secure registration and login system
- **Group Management**: Create and manage expense groups
- **Expense Tracking**: Add and categorize expenses
- **Smart Splitting**: Automatically split expenses equally among group members
- **Balance Calculation**: Real-time balance tracking showing who owes whom
- **Settlement System**: Record payments to settle balances
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: Frontend library with TypeScript
- **Next.js**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Lucide React**: Icon library

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. Navigate to the server directory:
\`\`\`bash
cd server
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update the `.env` file with your configuration:
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/splitwise
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
\`\`\`

5. Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

The backend will run on `http://localhost:5000`

### Frontend Setup

1. In the root directory, install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will run on `http://localhost:3000`

### Database Setup

The application will automatically create the necessary collections when you start using it. No manual database setup is required.

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Groups**: Add groups for different expense categories (roommates, trips, etc.)
3. **Add Members**: Invite friends by email to join your groups
4. **Track Expenses**: Add expenses and specify who should split the cost
5. **View Balances**: See who owes money and who is owed money
6. **Settle Up**: Record payments to balance accounts

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group

### Expenses
- `GET /api/groups/:groupId/expenses` - Get group expenses
- `POST /api/groups/:groupId/expenses` - Add new expense
- `GET /api/groups/:groupId/balances` - Get group balances

### Settlements
- `POST /api/groups/:groupId/settlements` - Record settlement payment

## Project Structure

\`\`\`
splitwise-clone/
├── server/                 # Backend Express.js application
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
├── app/                   # Next.js app directory
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── dashboard.tsx     # Main dashboard component
│   ├── auth-context.tsx  # Authentication context
│   ├── create-group-dialog.tsx
│   ├── add-expense-dialog.tsx
│   └── settle-up-dialog.tsx
└── README.md             # This file
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
\`\`\`

```json file="" isHidden
