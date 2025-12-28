#  Cipher SQL Studio

Cipher SQL Studio is your interactive playground for mastering SQL in a safe, sandboxed environment. Write, test, and optimize SQL queries against realistic database schemas while getting instant feedback on your queries.

##  Why Cipher SQL Studio?

- **Learn by Doing**: Practice with real SQL syntax and see immediate results
- **Safe Sandbox**: Experiment without worrying about breaking anything
- **Structured Learning**: Progress through carefully designed exercises
- **Real-world Scenarios**: Work with datasets that mirror actual business cases
- **Track Your Progress**: Save your work and monitor your improvement over time

##  Features

- Interactive SQL editor with syntax highlighting
- Multiple database schemas for practice
- Real-time query execution and results
- Progress tracking and user authentication
- Sample datasets for learning
- Responsive design for all devices

##  Getting Started

Let's get you up and running with Cipher SQL Studio in just a few minutes!

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (v4.4 or later)
- PostgreSQL (v12 or later)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kapilsharma72/SQL_Studio_Playground.git
   cd cipher-sql-studio
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   - Copy `.env.example` to `.env` in the project root
   - Configure the following variables in your `.env` file:

   ```bash
   # Database Configuration
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_NAME=CipherSQLStudio
   DB_HOST=localhost
   DB_PORT=5000

   # Sandbox database (for user practice)
   DB_SANDBOX_USER=sandbox_user
   DB_SANDBOX_PASSWORD=your_sandbox_password
   DB_SANDBOX_NAME=CipherSQLStudio
   DB_SANDBOX_HOST=localhost
   DB_SANDBOX_PORT=5432

   # Server Configuration
   NODE_ENV=development
   PORT=5001
   JWT_SECRET=your_secure_jwt_secret
   JWT_EXPIRES_IN=90d
   
   # MongoDB Configuration
   MONGO_URL=mongodb://localhost:27017/ciphersqlstudio
   
   # Security
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX=100  # requests per window
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```
   
   >  **Important**: Never commit your `.env` file to version control! It contains sensitive information.

### Database Setup

1. **MongoDB Setup**
   - Ensure MongoDB is running locally
   - The application will create necessary collections automatically

2. **PostgreSQL Setup**
   - Create a new PostgreSQL database
   - Run the setup script:
     ```bash
     cd server
     node setup-db.js
     ```
   - Seed sample data:
     ```bash
     node scripts/seedAssignments.js
     node scripts/setupPostgresSchemas.js
     ```

##  Running the Application

Once everything is set up, follow these steps to start the application:

1. **Start the server**
   ```bash
   cd server
   npm start
   ```

2. **Start the client**
   ```bash
   cd client
   npm start
   ```

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

##  Project Structure

Here's how everything is organized to keep the codebase maintainable and scalable:

```
cipher-sql-studio/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable UI components
│       ├── pages/         # Application pages
│       └── services/      # API services
│
└── server/                # Backend Node.js application
    ├── config/           # Configuration files
    ├── controllers/      # Request handlers
    ├── models/           # Database models
    ├── routes/           # API routes
    └── utils/            # Utility functions
```

##  Technology Stack

### Frontend
- **React**: For building responsive and interactive user interfaces
- **Redux**: State management for consistent data flow
- **Material-UI**: Pre-built components for a polished, professional look
- **React Query**: Efficient data fetching and caching

### Backend
- **Node.js & Express**: Fast, scalable server infrastructure
- **JWT Authentication**: Secure user authentication
- **Rate Limiting**: API protection against abuse

### Databases
- **PostgreSQL**: Robust relational database for structured data
- **MongoDB**: Flexible NoSQL for document storage
- **Connection Pooling**: Efficient database connections management

### Development Tools
- **ESLint & Prettier**: Code quality and formatting
- **Nodemon**: Automatic server restarts during development
- **Docker**: Containerization for consistent environments


<div align="center">
  Made with ❤️ by Kapil Sharma
</div>
