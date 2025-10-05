# BioScience RAG - AI Research Assistant Frontend

A modern Next.js 14 chatbot interface for biological science research, designed for the NASA Space Apps Challenge 2025. Features real-time AI conversations, chat history management, and beautiful Bento-style question cards.

## ✨ Features

- 🤖 **AI-Powered Chat**: Real-time streaming conversations with biological science focus
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📱 **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- 🗂️ **Chat History**: Persistent session management with sidebar navigation
- 🎯 **Quick Questions**: Pre-built Bento-style cards for common research topics
- 🔗 **Source Links**: Embedded research citations in AI responses
- 🌙 **Dark Theme**: Professional shadcn dark theme with high contrast
- 🚀 **NASA Space Apps**: Optimized for space science research

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** or **pnpm**
- **Git** for version control

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/limy-uk/bioscience-rag
   cd bioscience-rag
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

## 🔧 Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```env
# Required: n8n Backend API Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
# Replace with your n8n webhook URL

# Optional: Additional Configuration
NEXT_PUBLIC_APP_NAME="BioScience RAG"
NEXT_PUBLIC_APP_DESCRIPTION="AI Research Assistant for Biological Sciences"

# Development (optional)
NEXT_PUBLIC_DEVELOPMENT_MODE=true
```

### Environment Variable Details

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `N8N_WEBHOOK_URL` | ✅ **Yes** | Your n8n webhook endpoint for chat API | `http://localhost:5678/webhook/chat` |
| `NEXT_PUBLIC_APP_NAME` | ❌ No | Application name displayed in UI | `"BioScience RAG"` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | ❌ No | App description for metadata | `"AI Research Assistant"` |
| `NEXT_PUBLIC_DEVELOPMENT_MODE` | ❌ No | Enable development features | `false` |

## 🚀 Running the Application

### Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Linting with auto-fix
npm run lint:fix
```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   └── chat/          # Chat API endpoint
│   ├── globals.css        # Global styles and Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # React components
│   └── chat/              # Chat-related components
│       ├── ChatInterface.tsx  # Main chat container
│       ├── ChatSidebar.tsx    # Chat history sidebar
│       ├── ChatInput.tsx      # Message input component
│       ├── MessageList.tsx    # Message display area
│       └── MessageBubble.tsx  # Individual message bubble
├── lib/                   # Utility libraries
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── public/                # Static assets
├── .env.local            # Environment variables (create this)
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🎨 Customization

### Color Theme

The app uses a custom color palette defined in `tailwind.config.js`:

```javascript
// Current theme: Shadcn Green with Dark Background
colors: {
  'cosmic': {
    500: '#22c55e',  // Primary green
    600: '#16a34a',  // Darker green
    // ... full color scale
  }
}
```

### Background Gradient

Modify the background in `tailwind.config.js`:

```javascript
backgroundImage: {
  'space-gradient': 'linear-gradient(135deg, #020817 0%, #0f172a 50%, #1e293b 100%)',
}
```

### Question Cards

Update the pre-built questions in `components/chat/MessageList.tsx`:

```typescript
// Add or modify question cards
<button onClick={() => onQuestionClick?.("Your custom question here")}>
  // Card content
</button>
```

## 🔌 n8n Backend Integration

This frontend connects to an n8n workflow for AI processing. Ensure your n8n instance:

1. **Has a webhook endpoint** configured to receive POST requests
2. **Accepts JSON payload** with this structure:
   ```json
   {
     "message": "user message",
     "sessionId": "unique-session-id"
   }
   ```
3. **Returns streaming response** or JSON with:
   ```json
   {
     "response": "AI response text",
     "sources": ["url1", "url2"]  // optional
   }
   ```

## 📱 Responsive Design

The interface is fully responsive with breakpoints:
- **Mobile**: < 768px (single column, drawer sidebar)
- **Tablet**: 768px - 1024px (optimized layout)
- **Desktop**: > 1024px (full sidebar, multi-column)

## 🚀 Deployment


### Docker

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment

```bash
# Build for production
npm run build

# On server, install dependencies and start
npm ci --only=production
npm start
```

## 🔧 Troubleshooting

### Common Issues

**1. n8n Connection Failed**
```
Error: n8n API error: 404 Not Found
```
- Check `N8N_WEBHOOK_URL` in `.env.local`
- Ensure n8n instance is running
- Verify webhook endpoint exists

**2. Build Errors**
```
Type error: Cannot find module...
```
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (must be 18+)

**3. Styling Issues**
```
Styles not loading or incorrect
```
- Run `npm run dev` to rebuild Tailwind CSS
- Clear browser cache
- Check `tailwind.config.js` for proper paths

### Development Tips

- Use **React DevTools** for component debugging
- Check **Network tab** for API request issues  
- Use **Next.js DevTools** for performance monitoring
- Enable **TypeScript strict mode** for better type safety


## 📄 License

This project is created for the NASA Space Apps Challenge 2025.

## 🚀 NASA Space Apps Challenge 2025

Built with ❤️ for advancing biological science research in space exploration.

---

For additional support or questions, please open an issue in the repository.
