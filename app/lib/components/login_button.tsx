"use client";
import React, { useState } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

type LoginButtonProps = {
  username: string;
  password: string;
};

const user = User.getInstance();

const LoginButton: React.FC<LoginButtonProps> = ({ username, password }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [canAgree, setCanAgree] = useState(false); // Enable "Agree" button when scrolled to the end

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop === target.clientHeight) {
      setCanAgree(true);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      console.error("Username or password cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const status = await user.login(username, password);

      if (status === "alreadyAccepted") {
        window.location.href = "/lib/pages/map"; // Redirect to the main page
        return;
      }

      if (status === "success") {
        setShowAgreement(true); // Show agreement modal if not already accepted
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    setIsLoading(false);
  };

  const handleAcceptAgreement = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user found.");
  
      // Use the instance method on the User class
      await user.acceptAgreement(currentUser.uid);
  
      setShowAgreement(false);
  
      // Redirect after accepting the agreement
      window.location.href = "/lib/pages/map";
    } catch (error) {
      console.error("Failed to update agreement status:", error);
    }
  };

  return (
    <div>
      <Button
        onClick={handleLogin}
        className={`${
          isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50`}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Login"}
      </Button>

      {showAgreement && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 w-4/5 max-w-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6">User Agreement</h2>
            <div
              className="h-[500px] overflow-y-auto border rounded-md p-6 mb-6"
              onScroll={handleScroll}
            >
              <p>
                {/* Add your user agreement content here */}
              <br/> RESEARCHER RELEASE AND LICENSE</p><br/>
<p><b>Effective September 2018
Revised November 2024</b>
</p>
<br/>

<p>Each of these releases is for you, the researcher, and not for subjects of research.</p>

<p>Where’s Religion? is a platform for collecting and sharing research across multiple institutions and affiliations. Use of Where’s Religion? does not extend any institutional oversight or liability by Saint Louis University. It is the responsibility of each researcher (or, in the case of classes, instructor) to determine if their use of Where's Religion? requires approval through their local Institutional Review Board (IRB). Further documentation may be required upon request.</p>

<p><b>PROJECT INFORMATION</b></p>
<p>Where’s Religion? is a research and teaching project built, maintained, and promoted by the Center on Lived Religion and directed by Dr. Rachel McBride Lindsey, Saint Louis University.
The purpose of the project is to gather and preserve evidence of religious practices and diversity as it is lived in the modern world, including audio and visual recordings associated with religious and cultural practices. Your cooperation will allow our research team to highlight and study the diversity of religious spaces, practices, and events. We appreciate your participation.
Video recordings, photographs, audio sound recordings, and interviews will be preserved in a publicly accessible archive and may be edited for various uses. Such uses primarily involve a public posting on a website associated with COLR, but subsequent uses may include term papers, theses, dissertations, articles, and books. Additional uses may include digital exhibits, radio and television programs, films, and other forms of public display and dissemination. In addition, other researchers may request and receive reproductions of the recording and/or transcript(s), and, as advanced electronic technologies continue to evolve, the recordings may be made available via other electronic and remote access technologies. In all events, Saint Louis University will care for the recordings in a manner that will best provide for their preservation and at the same time make them most readily accessible to researchers and various publics.
CONSENT FOR USE OF IMAGE, VOICE, and LIKENESS</p>
<p>Having read the preceding Where’s Religion? project information on this form, I hereby irrevocably consent to and authorize Saint Louis University (“SLU”) to photograph and/or videotape me, and record my voice, conversation, sounds, images, and likeness in connection with the project.
I hereby grant all rights to SLU and its affiliates, licensees, successors and assignees (collectively, the “University”) to use the results of such videotaping, photography, and/or recording, including my name and biographical information, in perpetuity, throughout the world. I understand that the University may duplicate and distribute this recording, video, or likeness in whole or part worldwide for research, educational, or non-commercial purposes, including but not limited to, through an online, open website.</p>
<p><b>CONSENT FOR USE OF MATERIALS</b></p>
<p>I hereby grant the University a worldwide, royalty-free, non-exclusive, perpetual (for the duration of the applicable copyright) sublicensable license to make use of and make copies of my speech, presentation, video, photography, writing, and other works in connection with Where’s Religion? and the Center on Lived Religion (COLR), in whole or in part, in all types of media, as well as any component parts or files thereof. This license includes the rights for permanent archiving and public access, and to make derivative works. I understand that giving my permission is voluntary and does not alter my ownership of the copyright or other rights to the work that I might have. I understand that this license does not prevent me from entering into similar arrangements with other parties or from exercising any rights that I may have in the work. However, I understand that I may need to inform subsequent publishers or others that I have granted this license.
The rights granted to the University may be exercised in all media and formats whether now known or hereafter devised, and include the right to make such modifications as are necessary to exercise the rights in other media and formats. I represent, warrant and certify that I have obtained proper permission for any third-party material used within my work. The University is granted the right to use all of my work in any manner that they deem appropriate. This grant includes any physical or digital educational uses including, but not limited to, inclusion in the COLR archives, exhibition, display, reformatting for preservation and access purposes, and making works available for research and scholarship.
I waive the right to receive any payment for the University’s use of material described in this release. I also waive any right to inspect or approve finished photographs, audio, video, multimedia, or advertising recordings and copy or printed matter or computer generated scanned image and other electronic media.</p>
<p><b>STUDENT WAIVER (if applicable)</b></p>
<p>In connection with the use of the work(s) as set forth above, I hereby waive the confidentiality provisions of the Federal Family Educational and Privacy Rights Act of 1974 with respect to the content of the work(s) and with respect to information concerning my authorship of the work(s), including my name and status as a student at an academic institution.
I acknowledge that I have read and fully understood the contents of this document, and have freely signed below.
</p>
              <p className="mt-6 text-center font-bold">End of Agreement</p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-700 transition"
                onClick={() => setShowAgreement(false)}
              >
                Decline
              </button>
              <button
                className={`px-6 py-3 bg-green-500 text-white rounded-md ${
                  canAgree ? "hover:bg-green-700" : "opacity-50 cursor-not-allowed"
                } transition`}
                disabled={!canAgree}
                onClick={handleAcceptAgreement}
              >
                Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginButton;
