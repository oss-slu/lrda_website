import Image from "next/image";
import SearchBar from './components/search_bar';
import AddNotePage from "./lib/pages/add_note_page";
import Sidebar from "./lib/components/sidebar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="">
        <Sidebar />
        <h1 className="text-blue-500 text-xl mb-4">Where's Religion?</h1>
        <SearchBar />
        <h1 className="text-blue-500 text-xl">Where's Religion?</h1>
        <AddNotePage />
      </div>
    </main>
  );
}