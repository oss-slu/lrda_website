import Image from "next/image";
import AddNotePage from "./lib/pages/AddNotePage";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="">
        <h1 className="text-blue-500 text-xl">Where's Religion?</h1>
        <AddNotePage /> {/* This is the note taking componenet */}
      </div>
    </main>
  );
}