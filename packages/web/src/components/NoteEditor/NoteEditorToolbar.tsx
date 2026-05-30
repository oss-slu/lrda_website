import { useState, RefObject } from 'react';
import { Calendar as CalendarIcon, Download, MapPin } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import type { NoteDraft } from './hooks/useNoteForm';
import TimePicker from './NoteElements/TimePicker';
import LocationPicker from './NoteElements/LocationPicker';

interface NoteEditorToolbarProps {
  isViewingStudentNote: boolean;
  time: Date;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  onTimeChange: (time: Date) => void;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onLocationNameChange: (name: string) => void;
  draft: NoteDraft;
  dateRef: RefObject<HTMLDivElement | null>;
  locationRef: RefObject<HTMLDivElement | null>;
}

export default function NoteEditorToolbar({
  isViewingStudentNote,
  time,
  latitude,
  longitude,
  locationName,
  onTimeChange,
  onLocationChange,
  onLocationNameChange,
  draft,
  dateRef,
  locationRef,
}: NoteEditorToolbarProps) {
  const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = useState(false);

  const handleDownload = async (fileType: 'pdf' | 'docx') => {
    const plainTextContent = new DOMParser().parseFromString(draft.text, 'text/html').body
      .innerText;

    const noteContent = `
      Title: ${draft.title}
      Content: ${plainTextContent}
      Tags: ${draft.tags.map(tag => tag.label).join(', ')}
      Location: ${draft.latitude ?? 'N/A'}, ${draft.longitude ?? 'N/A'}
      Time: ${draft.time}
    `;

    if (fileType === 'pdf') {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.text(noteContent, 10, 10);
      pdf.save(`${draft.title || 'note'}.pdf`);
    } else {
      const { Document, Packer, Paragraph } = await import('docx');
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: `Title: ${draft.title}` }),
              new Paragraph(`Content: ${plainTextContent}`),
              new Paragraph(`Tags: ${draft.tags.map(tag => tag.label).join(', ')}`),
              new Paragraph(`Location: ${draft.latitude ?? 'N/A'}, ${draft.longitude ?? 'N/A'}`),
              new Paragraph(`Time: ${draft.time}`),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${draft.title || 'note'}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast(`Your note has been downloaded as ${fileType.toUpperCase()}`);
  };

  const dateDisplay =
    time instanceof Date && !isNaN(time.getTime()) ? time.toDateString() : 'No date';
  const locationDisplay =
    latitude && longitude ?
      `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    : 'No location';

  return (
    <>
      {isViewingStudentNote ?
        <>
          <span className='inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-600'>
            <CalendarIcon className='h-4 w-4 text-gray-400' />
            {dateDisplay}
          </span>
          <span className='inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-600'>
            <MapPin className='h-4 w-4 text-gray-400' />
            {locationDisplay}
          </span>
        </>
      : <>
          <div ref={dateRef}>
            <TimePicker
              date={time}
              onTimeChange={onTimeChange}
            />
          </div>
          <div ref={locationRef}>
            <LocationPicker
              long={longitude}
              lat={latitude}
              locationName={locationName}
              onLocationChange={(newLong, newLat) => {
                onLocationNameChange('');
                onLocationChange(newLat, newLong);
              }}
              onLocationNameChange={onLocationNameChange}
            />
          </div>
        </>
      }
      <Popover open={isDownloadPopoverOpen} onOpenChange={setIsDownloadPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className='group inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            aria-label='Download note'
          >
            <Download
              aria-label='download'
              className='h-4 w-4 text-gray-700 group-hover:text-blue-600'
            />
            <span>Download</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className='w-48 p-2' align='end'>
          <div className='flex flex-col gap-1'>
            <button
              onClick={async () => {
                setIsDownloadPopoverOpen(false);
                await handleDownload('pdf');
              }}
              className='w-full rounded-md px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none'
            >
              Download as PDF
            </button>
            <button
              onClick={async () => {
                setIsDownloadPopoverOpen(false);
                await handleDownload('docx');
              }}
              className='w-full rounded-md px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none'
            >
              Download as DOCX
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
