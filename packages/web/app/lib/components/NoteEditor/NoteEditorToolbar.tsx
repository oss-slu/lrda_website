'use client';

import React, { useState, RefObject } from 'react';
import { Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Document, Packer, Paragraph } from 'docx';
import { toast } from 'sonner';
import TimePicker from './NoteElements/TimePicker';
import LocationPicker from './NoteElements/LocationPicker';
import { handleTimeChange, handleLocationChange } from './handlers/noteHandlers';
import type { NoteStateType, NoteHandlersType } from './hooks/useNoteState';

interface NoteEditorToolbarProps {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  isViewingStudentNote: boolean;
  onLocationChange: () => void;
  onTimeChange: () => void;
  dateRef: RefObject<HTMLDivElement | null>;
  locationRef: RefObject<HTMLDivElement | null>;
}

export default function NoteEditorToolbar({
  noteState,
  noteHandlers,
  isViewingStudentNote,
  onLocationChange,
  onTimeChange,
  dateRef,
  locationRef,
}: NoteEditorToolbarProps) {
  const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = useState<boolean>(false);

  const handleDownload = async (fileType: 'pdf' | 'docx') => {
    const plainTextContent = new DOMParser().parseFromString(noteState.editorContent, 'text/html')
      .body.innerText;

    const noteContent = `
      Title: ${noteState.title}
      Content: ${plainTextContent}
      Tags: ${noteState.tags.map(tag => tag.label).join(', ')}
      Location: ${noteState.latitude}, ${noteState.longitude}
      Time: ${noteState.time}
    `;

    if (fileType === 'pdf') {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.text(noteContent, 10, 10);
      pdf.save(`${noteState.title || 'note'}.pdf`);
    } else if (fileType === 'docx') {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: `Title: ${noteState.title}`,
              }),
              new Paragraph(`Content: ${plainTextContent}`),
              new Paragraph(`Tags: ${noteState.tags.map(tag => tag.label).join(', ')}`),
              new Paragraph(`Location: ${noteState.latitude}, ${noteState.longitude}`),
              new Paragraph(`Time: ${noteState.time}`),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${noteState.title || 'note'}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast(`Your note has been downloaded as ${fileType.toUpperCase()}`);
  };

  return (
    <>
      <div ref={dateRef}>
        <TimePicker
          initialDate={noteState.time || new Date()}
          onTimeChange={newDate => {
            handleTimeChange(noteHandlers.setTime, newDate);
            onTimeChange();
          }}
          disabled={isViewingStudentNote}
        />
      </div>
      <div ref={locationRef}>
        <LocationPicker
          long={noteState.longitude}
          lat={noteState.latitude}
          onLocationChange={(newLong, newLat) => {
            handleLocationChange(
              noteHandlers.setLongitude,
              noteHandlers.setLatitude,
              newLong,
              newLat,
            );
            onLocationChange();
          }}
          disabled={isViewingStudentNote}
        />
      </div>
      <Popover open={isDownloadPopoverOpen} onOpenChange={setIsDownloadPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className='group inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
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
