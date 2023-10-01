// page.tsx
import Image from "next/image";
import RootLayout from './layout'; 

export default function Home() {
  return (
    <RootLayout>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
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
    </RootLayout>
  );
}
