import React, { useEffect, useMemo, useRef, useState } from 'react';
import { lazy, Suspense } from 'react';

const AudioPlayer = lazy(() => import('react-h5-audio-player'));
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { toast } from 'sonner';
import { FileUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AudioMedia } from '@/app/types';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { uploadAudio } from '@/app/lib/utils/s3_proxy';

type AudioPickerProps = {
  audioArray: AudioMedia[];
  setAudio?: React.Dispatch<React.SetStateAction<AudioMedia[]>>;
  editable?: boolean;
};

const AudioPicker: React.FC<AudioPickerProps> = ({ audioArray, setAudio, editable }) => {
  // Stable key that changes when the array changes, used to reset selection state
  const arrayKey = useMemo(() => audioArray.map(a => a.uuid).join(','), [audioArray]);

  return (
    <AudioPickerInner
      key={arrayKey}
      audioArray={audioArray}
      setAudio={setAudio}
      editable={editable}
    />
  );
};

const AudioPickerInner: React.FC<AudioPickerProps> = ({ audioArray, setAudio, editable }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [curRec, setCurRec] = useState<string | undefined>();
  const audioPlayerRef = useRef<any>(null);

  const placeVal = audioArray.length >= 1 ? 'Select Recording' : 'No Recordings';

  // Pause player on unmount (triggered by key change from outer component)
  useEffect(() => {
    const player = audioPlayerRef.current;
    return () => {
      if (player?.audio?.current) {
        player.audio.current.pause();
        player.audio.current.currentTime = 0;
      }
    };
  }, []);

  // Handle the selection of an audio recording
  const handleSelectChange = (selectedURI: string) => {
    const selectedIdx = audioArray.findIndex(audio => audio.uri === selectedURI);
    if (selectedIdx >= 0) {
      setCurRec(selectedURI);
      setCurrentIdx(selectedIdx);
    }
  };

  // Navigate to the next recording in the array
  const handleIncrementRecs = () => {
    const nextIdx = (currentIdx + 1) % audioArray.length;
    setCurrentIdx(nextIdx);
    setCurRec(audioArray[nextIdx]?.uri);
  };

  // Navigate to the previous recording in the array
  const handleDecrementRecs = () => {
    const prevIdx = (currentIdx - 1 + audioArray.length) % audioArray.length;
    setCurrentIdx(prevIdx);
    setCurRec(audioArray[prevIdx]?.uri);
  };

  // Unified upload handler for audio files
  async function handleFileUpload(file: File) {
    if (file.type !== 'audio/mpeg') {
      toast('Error', { description: 'Only MP3 files are supported.', duration: 4000 });
      return;
    }

    toast('Status Update', {
      description: 'Audio upload in progress.',
      duration: 2000,
    });

    try {
      const uri = await uploadAudio(file);
      const newAudio: AudioMedia = {
        type: 'audio',
        uuid: uuidv4(),
        uri,
        name: file.name,
        duration: '0:00',
      };

      toast('Status Update', {
        description: 'Audio upload success!',
        duration: 4000,
      });

      if (setAudio) {
        setAudio(prev => [...prev, newAudio]);
      }
    } catch (error) {
      console.error('Audio upload failed:', error);
      toast('Error', {
        description: 'Audio Upload Failed! Please try again later.',
        duration: 4000,
      });
    }
  }

  const currentAudio = audioArray.find(audio => audio.uri === curRec); // Current audio based on selected URI
  const currentUUID = currentAudio ? currentAudio.uuid : null;

  return (
    <div className='flex h-min min-w-[90px] max-w-[280px] flex-col items-center rounded-md border border-border bg-white p-4 shadow-sm'>
      <div className='align-center flex h-10 w-[100%] max-w-[280px] cursor-pointer flex-row items-center justify-evenly'>
        {editable ?
          <Popover>
            <PopoverTrigger asChild>
              <FileUp className='primary' />
            </PopoverTrigger>
            <PopoverContent className='z-30'>
              <div className='flex h-min w-96 min-w-[90px] max-w-[280px] flex-col items-center justify-center rounded-md bg-white p-6 shadow-lg'>
                <div className='mb-2 font-medium text-gray-900'>Upload Audio Here</div>
                <div className='mb-4 text-sm text-gray-600'>It must be of type '.mp3'</div>

                {/* File input for audio upload */}
                <Input
                  type='file'
                  accept='.mp3'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        : null}

        {/* Audio selection dropdown */}
        <Select
          data-testid='audio-select'
          onValueChange={handleSelectChange}
          key={currentUUID}
          defaultValue={curRec}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder={placeVal} defaultValue={'SelectRecording'} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {audioArray.length >= 1 ?
                audioArray.map(audio => (
                  <SelectItem key={audio.uuid} value={audio.uri} data-testid='audio-option'>
                    {audio.name}
                  </SelectItem>
                ))
              : <SelectLabel>No Recordings</SelectLabel>}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Audio player for playback */}
      <Suspense fallback={null}>
        <AudioPlayer
          ref={audioPlayerRef}
          data-testid='audio-player'
          src={curRec}
          className='flex w-[90] flex-row rounded-md p-3'
          onClickNext={handleIncrementRecs}
          onClickPrevious={handleDecrementRecs}
          key={currentUUID}
        />
      </Suspense>
    </div>
  );
};

export default AudioPicker;
