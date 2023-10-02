// components/Sidebar.tsx

import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="mt-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded">
    <Link href="/add-note">
      Add Note
    </Link>
  </div>
  
  );
};

export default Sidebar;
