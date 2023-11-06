import SearchBar from "./lib/components/search_bar";
import Sidebar from "./lib/components/side_bar";
import NoteComponent from "./lib/components/note_component";
import Link from "next/link";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div>
        <Link className="text-blue-500 text-xl mb-4" href="/lib/pages/loginPage" >Login</Link>
      </div>
      <div className="">
        <Sidebar />
        <h1 className="text-blue-500 text-xl mb-4">Where's Religion?</h1>
        <SearchBar />
        <NoteComponent />
        
      </div>
    </main>
  );
}
