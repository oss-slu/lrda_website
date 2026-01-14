import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';

const DownloadNote = () => {
  const router = useRouter();
  const { title, content, tags, time, longitude, latitude } = router.query;

  const handleDownload = (format: string) => {
    const noteContent = {
      title: title || 'Untitled Note',
      content: content || '',
      tags:
        tags ?
          Array.isArray(tags) ?
            tags
          : [tags]
        : [],
      location: { longitude, latitude },
      time,
    };

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text(noteContent.title as string, 10, 10);
      doc.setFontSize(12);
      doc.text(`Time: ${noteContent.time}`, 10, 20);
      doc.text(
        `Location: ${noteContent.location.longitude}, ${noteContent.location.latitude}`,
        10,
        30,
      );
      doc.text('Tags:', 10, 40);
      noteContent.tags.forEach((tag, index) => {
        doc.text(`- ${tag}`, 10, 50 + index * 10);
      });
      doc.text('Content:', 10, 60 + noteContent.tags.length * 10);
      doc.text(noteContent.content as string, 10, 70 + noteContent.tags.length * 10);
      doc.save(`${noteContent.title || 'note'}.pdf`);
    } else if (format === 'docx') {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: noteContent.title as string, heading: 'Title' }),
              new Paragraph({ text: `Time: ${noteContent.time}` }),
              new Paragraph({
                text: `Location: ${noteContent.location.longitude}, ${noteContent.location.latitude}`,
              }),
              new Paragraph({ text: 'Tags:' }),
              ...noteContent.tags.map((tag: string) => new Paragraph({ text: `- ${tag}` })),
              new Paragraph({ text: 'Content:' }),
              new Paragraph({ text: noteContent.content as string }),
            ],
          },
        ],
      });

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${noteContent.title || 'note'}.docx`);
      });
    }
  };

  return (
    <div className='flex h-screen flex-col items-center justify-center bg-gray-100'>
      <h1 className='mb-6 text-2xl font-bold'>Download Your Note</h1>
      <div className='flex space-x-4'>
        <button
          className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
          onClick={() => handleDownload('pdf')}
        >
          Download as PDF
        </button>
        <button
          className='rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600'
          onClick={() => handleDownload('docx')}
        >
          Download as DOCX
        </button>
      </div>
      <button
        className='mt-4 rounded bg-gray-300 px-4 py-2 hover:bg-gray-400'
        onClick={() => router.back()}
      >
        Back to Editor
      </button>
    </div>
  );
};

export default DownloadNote;
