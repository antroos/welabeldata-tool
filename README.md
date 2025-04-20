# Chat LLM

A web application for chatting with OpenAI language models. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Chat interface for communicating with GPT models
- Support for GPT-4 and GPT-3.5 Turbo
- Real-time model switching
- Clean and responsive UI
- TypeScript for type safety
- Tailwind CSS for styling

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chat-llm
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technologies Used

- Next.js 13+
- React 18+
- TypeScript
- Tailwind CSS
- OpenAI API

## Project Structure

- `/src/app` - Next.js app router files
- `/src/components` - React components
- `/src/app/api` - API routes for backend functionality

## License

MIT 