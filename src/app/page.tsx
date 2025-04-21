import Chat from '../components/Chat';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="fixed top-4 right-4 z-20">
        <Link 
          href="/workflow-editor" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-md"
        >
          Open Workflow Editor
        </Link>
      </div>
      <Chat />
    </div>
  );
}
