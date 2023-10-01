// components/Sidebar.tsx

import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="flex flex-col p-4 bg-gray-200 h-full">
      {/* Other sidebar content can go here */}
      
      <Link href="/add-note">
        <a className="mt-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded">
          Add Note
        </a>
      </Link>

      {/* More sidebar content can go here */}
    </div>
  );
};

export default Sidebar;
