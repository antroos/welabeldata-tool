import Chat from '../components/Chat';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="fixed top-4 right-4 z-20 flex space-x-2">
        <Link 
          href="/workflow-editor" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-md"
        >
          Workflow Editor
        </Link>
        <Link 
          href="/workflow-viewer" 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 shadow-md"
        >
          View Workflows
        </Link>
        <Link 
          href="/storage-test" 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 shadow-md"
        >
          Storage Test
        </Link>
      </div>
      <Chat />
    </div>
  );
}
