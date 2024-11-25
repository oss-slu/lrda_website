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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [curRec, setCurRec] = useState<string | undefined>(audioArray[0]?.uri);
  const [placeVal, setPlaceVal] = useState<string>("No Recordings");
  const audioPlayerRef = useRef<AudioPlayer>(null);

  useEffect(() => {
    if (audioArray.length > 0) {
      setPlaceVal("Select Recording");
      setCurRec(audioArray[0]?.uri);
    } else {
      setPlaceVal("No Recordings");
      setCurRec(undefined);
    }
    resetAudioPlayer();
  }, [audioArray]);

  const resetAudioPlayer = () => {
    if (audioPlayerRef.current && audioPlayerRef.current.audio.current) {
      audioPlayerRef.current.audio.current.pause();
      audioPlayerRef.current.audio.current.currentTime = 0;
    }
  };

  const handleSelectChange = (selectedURI: string) => {
    const selectedIdx = audioArray.findIndex((audio) => audio.uri === selectedURI);
    if (selectedIdx >= 0) {
      setCurRec(selectedURI);
      setCurrentIdx(selectedIdx);
    }
  };

  const handleIncrementRecs = () => {
    if (audioArray.length > 0) {
      const nextIdx = (currentIdx + 1) % audioArray.length;
      setCurrentIdx(nextIdx);
      setCurRec(audioArray[nextIdx].uri);
    }
  };

  const handleDecrementRecs = () => {
    if (audioArray.length > 0) {
      const prevIdx = (currentIdx - 1 + audioArray.length) % audioArray.length;
      setCurrentIdx(prevIdx);
      setCurRec(audioArray[prevIdx].uri);
    }
  };

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    toast("Status Update", {
      description: "Audio upload in progress.",
      duration: 2000,
    });

    const file = event.target.files?.[0];
    if (!file) return;

    const location = await uploadAudio(file);
    if (location !== "error") {
      const newAudio = new AudioType({
        type: "audio",
        uuid: uuidv4(),
        uri: location,
        name: file.name,
        isPlaying: false,
        duration: "0:00",
      });

      toast("Status Update", {
        description: "Audio upload success!",
        duration: 4000,
      });

      if (setAudio) {
        setAudio((prevAudio) => [...prevAudio, newAudio]);
      }
    } else {
      toast("Status Update", {
        description: "Audio Upload Failed! Please try again later.",
        duration: 4000,
      });
    }
  }

  const currentAudio = audioArray.find((audio) => audio.uri === curRec);

  return (
    <div className="flex flex-col items-center p-2 h-min min-w-[90px] max-w-[280px] shadow-sm rounded-md border border-border bg-white">
      <div className="flex flex-row max-w-[280px] w-[100%] justify-evenly align-center items-center cursor-pointer h-10">
        {editable && (
          <Popover>
            <PopoverTrigger asChild>
              <FileUp className="primary" />
            </PopoverTrigger>
            <PopoverContent className="z-30">
              <div className="flex p-4 flex-col justify-center items-center w-96 min-w-[90px] max-w-[280px] h-min bg-white shadow-lg rounded-md">
                <div className="px-4">Upload Audio Here.</div>
                <div className="px-4 mb-3">It must be of type '.mp3'</div>
                <Input
                  type="file"
                  accept=".mp3"
                  onChange={(e) => handleFileChange(e)}
                />
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Select
          data-testid="audio-select"
          onValueChange={handleSelectChange}
          value={curRec}
        >
          <SelectTrigger placeholder={placeVal} className="w-[180px]">
            <SelectValue placeholder={placeVal} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {audioArray.length > 0 ? (
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
      {curRec && (
        <AudioPlayer
          ref={audioPlayerRef}
          src={curRec}
          data-testid="audio-player"
          className="flex flex-row p-3 rounded-md w-[90]"
          onClickNext={handleIncrementRecs}
          onClickPrevious={handleDecrementRecs}
        />
      )}
    </div>
  );
};

export default AudioPicker;
