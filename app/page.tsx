// import Image from "next/image";

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24">
//       <div className="">
//         <h1 className="text-blue-500 text-xl">Where's Religion?</h1>
//       </div>
//     </main>
//   );
// }

import Image from "next/image";
import { useState } from "react";
import { Editor, EditorState } from "draft-js";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";

function handleError(error: any) {
  console.error(error);
}

export default function Home() {
    const [text, textUpdate] = useState(EditorState.createEmpty());

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="">
        <h1 className="text-blue-500 text-xl">Draft.js Testing Environment</h1>
        <Editor editorState={text} onChange={textUpdate} />
      </div>
      <div className="">
        <h1 className="text-blue-500 text-xl">Lexical Testing Environment</h1>
        <LexicalComposer
          initialConfig={{ namespace: "MyEditor", onError: handleError }}
        >
          <ContentEditable />
        </LexicalComposer>
      </div>
    </main>
  );
}
