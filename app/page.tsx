// page.tsx
import Image from 'next/image';
import RootLayout from './layout'; 
import Sidebar from './lib/components/Sidebar';

export default function Home() {
  return (
    <RootLayout>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-1/4">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="w-3/4 flex flex-col items-center justify-between p-24">
          {/* Search bar */}
          <div className="search-bar">
            <input type="text" placeholder="What are you looking for?" />
            <button>
              <i className="fas fa-search"></i>
            </button>
          </div>

          <div className="">
            <h1 className="text-blue-500 text-xl">Where's Religion?</h1>
          </div>
        </main>
      </div>
    </RootLayout>
  );
}
