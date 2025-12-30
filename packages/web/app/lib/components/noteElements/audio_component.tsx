import React, { useEffect, useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { toast } from "sonner";
import { FileUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudioType } from "../../models/media_class";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { uploadAudio } from "../../utils/s3_proxy";

type AudioPickerProps = {
  audioArray: AudioType[];
  setAudio?: React.Dispatch<React.SetStateAction<AudioType[]>>;
  editable?: boolean;
};

const AudioPicker: React.FC<AudioPickerProps> = ({
  audioArray,
  setAudio,
  editable,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0); // Current index of the selected audio
  const [curRec, setCurRec] = useState<string | undefined>(); // Current audio URI
  const [placeVal, setPlaceVal] = useState<string>("No Recordings"); // Placeholder text for the select dropdown
  const audioPlayerRef = useRef<AudioPlayer>(null); // Reference to the audio player

  useEffect(() => {
    // Reset state when audioArray changes
    if (audioArray.length >= 1) {
      setPlaceVal("Select Recording");
    } else {
      setPlaceVal("No Recordings");
    }
    if (audioPlayerRef.current && audioPlayerRef.current.audio.current) {
      audioPlayerRef.current.audio.current.pause();
      audioPlayerRef.current.audio.current.currentTime = 0;
    }
    setCurRec(undefined);
    setCurrentIdx(0);
  }, [audioArray]);

  // Handle the selection of an audio recording
  const handleSelectChange = (selectedURI: string) => {
    const selectedIdx = audioArray.findIndex(
      (audio) => audio.uri === selectedURI
    );
    if (selectedIdx >= 0) {
      setCurRec(selectedURI);
      setCurrentIdx(selectedIdx);
    }
  };

  // Navigate to the next recording in the array
  const handleIncrementRecs = () => {
    const nextIdx = (currentIdx + 1) % audioArray.length;
    setCurrentIdx(nextIdx);
    setCurRec(audioArray[nextIdx].uri);
  };

  // Navigate to the previous recording in the array
  const handleDecrementRecs = () => {
    const prevIdx = (currentIdx - 1 + audioArray.length) % audioArray.length;
    setCurrentIdx(prevIdx);
    setCurRec(audioArray[prevIdx].uri);
  };

  // Unified upload handler for audio files
  async function handleFileUpload(file: File) {
    if (file.type !== "audio/mpeg") {
      toast("Error", { description: "Only MP3 files are supported.", duration: 4000 });
      return;
    }

    toast("Status Update", {
      description: "Audio upload in progress.",
      duration: 2000,
    });

    try {
      const location = await uploadAudio(file);
      if (location !== "error") {
        const newAudio = new AudioType({
          type: "audio",
          uuid: uuidv4(),
          uri: location,
          name: file.name,
          isPlaying: false,
          duration: "0:00", // Placeholder duration, as duration extraction isn't implemented
        });

        toast("Status Update", {
          description: "Audio upload success!",
          duration: 4000,
        });

        if (setAudio) {
          setAudio((prev) => [...prev, newAudio]);
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Audio upload failed:", error);
      toast("Error", {
        description: "Audio Upload Failed! Please try again later.",
        duration: 4000,
      });
    }
  }

  const currentAudio = audioArray.find((audio) => audio.uri === curRec); // Current audio based on selected URI
  const currentUUID = currentAudio ? currentAudio.uuid : null;

  return (
    <div className="flex flex-col items-center p-4 h-min min-w-[90px] max-w-[280px] shadow-sm rounded-md border border-border bg-white">
      <div className="flex flex-row max-w-[280px] w-[100%] justify-evenly align-center items-center cursor-pointer h-10">
        {editable ? (
          <Popover>
            <PopoverTrigger asChild>
              <FileUp className="primary" />
            </PopoverTrigger>
            <PopoverContent className="z-30">
              <div className="flex p-6 flex-col justify-center items-center w-96 min-w-[90px] max-w-[280px] h-min bg-white shadow-lg rounded-md">
                <div className="mb-2 font-medium text-gray-900">Upload Audio Here</div>
                <div className="mb-4 text-sm text-gray-600">It must be of type '.mp3'</div>

                {/* File input for audio upload */}
                <Input
                  type="file"
                  accept=".mp3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        {/* Audio selection dropdown */}
        <Select
          data-testid="audio-select"
          onValueChange={handleSelectChange}
          key={currentUUID}
          defaultValue={curRec}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={placeVal}
              defaultValue={"SelectRecording"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {audioArray.length >= 1 ? (
                audioArray.map((audio) => (
                  <SelectItem
                    key={audio.uuid}
                    value={audio.uri}
                    data-testid="audio-option"
                  >
                    {audio.name}
                  </SelectItem>
                ))
              ) : (
                <SelectLabel>No Recordings</SelectLabel>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Audio player for playback */}
      <AudioPlayer
        ref={audioPlayerRef}
        data-testid="audio-player"
        src={curRec}
        className="flex flex-row p-3 rounded-md w-[90]"
        onClickNext={handleIncrementRecs}
        onClickPrevious={handleDecrementRecs}
        key={currentUUID}
      />
    </div>
  );
};

export default AudioPicker;
