# FSOLS
### FPT SE CAPSTONE Project - Free Smart Online Learning System - FA25

---

## Tooling & Stack:

- [Node.js](https://nodejs.org/en) (backend)
- [React.js](https://react.dev/) (frontend)
- [npm](https://www.npmjs.com/) (JavaScript package manager)
- [TailwindCSS](https://tailwindcss.com/) (utility CSS)
- [Render](https://render.com/) (deployment platform)
- [Github](https://github.com) (version control)
- [ESLint](https://eslint.org/) (linting)
- [Prisma](https://www.prisma.io/mySQL) (ORM)
- [MySQL](https://www.mysql.com/) (database)

---

## Project overview:

This monorepo contains the code for the FSOLS website, including:
- React.js frontend in `client/` directory
- Node. js backend in `server/` directory

---

## Getting Started:

### 1. Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v22 or higher)
- Git
- MySQL (v8 or higher)

```
# Check Node.js version

node -v

# Check npm version

npm -v

# Install npm

npm install -g npm@latest
```

### 2. Clone the repository:

```
git clone https://github.com/PhungNhatTan/FSOLS.git
cd FSOLS
```

### 3. Install dependencies:

```
# Install all dependencies
npm install
```

### 4. Start development server

```
# Start the development server
npm run dev
```

The application will be available at:  http://localhost:5173/

---

## Development workflow

### Available scripts:

```
# Development
npm run dev
npm run server
npm run client

# Production
npm start
npm run build-client

# Code quality
npm run lint
npm run lint:client
npm run lint:server
```

### Project structure

### Code quality

This project use ESLint for linting and formatting:

```
# Check whole project
npm run lint

# Check client
npm run lint:client

# Check server
npm run lint:server
```