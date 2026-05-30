import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { FileText, Search } from 'lucide-react';
import type { Note } from '@/app/types';
import type { StudentInfo } from '@/app/services/instructor.types';
import { useNotesStore } from '@/app/stores/notesStore';
import { extractTextFromHtml } from '@/app/utils/sanitize';
import { getNoteStatus, statusConfig, isUnreviewed, isReviewed } from '@/app/utils/noteStatus';
import SearchBarNote from '@/app/components/search_bar_note';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface InstructorSidebarProps {
  notes: Note[];
  students: StudentInfo[];
  onNoteSelect: (note: Note) => void;
}

export function InstructorSidebar({ notes, students, onNoteSelect }: InstructorSidebarProps) {
  const { selectedNoteId, setSelectedNoteId } = useNotesStore(
    useShallow(state => ({
      selectedNoteId: state.selectedNoteId,
      setSelectedNoteId: state.setSelectedNoteId,
    })),
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'unreviewed' | 'reviewed'>('unreviewed');
  const [selectedStudentId, setSelectedStudentId] = useState('all');

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

  const filteredNotes = useMemo(() => {
    const byTab = notes.filter(activeTab === 'unreviewed' ? isUnreviewed : isReviewed);

    const byStudent =
      selectedStudentId !== 'all' ? byTab.filter(n => n.creator === selectedStudentId) : byTab;

    if (!searchQuery.trim()) return byStudent;
    const q = searchQuery.toLowerCase();
    return byStudent.filter(
      n =>
        n.title.toLowerCase().includes(q) ||
        (Array.isArray(n.tags) && n.tags.some(t => t.label.toLowerCase().includes(q))),
    );
  }, [notes, activeTab, selectedStudentId, searchQuery]);

  const handleSelect = (note: Note) => {
    setSelectedNoteId(note.id);
    onNoteSelect(note);
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className='flex h-full w-[380px] shrink-0 flex-col border-r border-gray-200 bg-gray-50'>
      <div className='flex-1 overflow-y-auto p-4'>
        <SearchBarNote onSearch={setSearchQuery} />

        <div className='mt-2'>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='All Students' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Students</SelectItem>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='mt-2'>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'unreviewed' | 'reviewed')}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='unreviewed' className='text-sm font-semibold'>
                Unreviewed
              </TabsTrigger>
              <TabsTrigger value='reviewed' className='text-sm font-semibold'>
                Reviewed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className='mt-4 flex flex-col gap-2'>
          {filteredNotes.length === 0 && !isSearching && (
            <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
              <div className='mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
                <FileText className='h-10 w-10 text-blue-600' />
              </div>
              <h3 className='mb-2 text-xl font-bold text-gray-900'>No notes here</h3>
              <p className='max-w-sm text-sm leading-relaxed text-gray-600'>
                No student notes match the current filter.
              </p>
            </div>
          )}

          {filteredNotes.length === 0 && isSearching && (
            <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
              <div className='mb-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
                <Search className='h-10 w-10 text-gray-400' />
              </div>
              <h3 className='mb-2 text-xl font-bold text-gray-900'>No results found</h3>
              <p className='max-w-sm text-sm leading-relaxed text-gray-600'>
                Try adjusting your search or check the other tab.
              </p>
            </div>
          )}

          {filteredNotes.map(note => {
            const isSelected = note.id === selectedNoteId;
            const status = getNoteStatus(note);
            const badge = statusConfig[status];
            const studentName = studentMap.get(note.creator) ?? 'Unknown Student';
            let preview = extractTextFromHtml(note.text);
            if (!preview || preview === 'undefined') {
              preview = 'Empty note';
            }

            return (
              <div
                key={note.id}
                className={`cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                  isSelected ?
                    'border-blue-400 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => handleSelect(note)}
              >
                <div className='flex flex-col gap-1 p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='truncate text-xs font-medium text-blue-600'>
                      {studentName}
                    </span>
                    <span className='shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'>
                      {note.time instanceof Date ?
                        note.time.toLocaleDateString()
                      : new Date(note.time).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <h3 className='flex-1 truncate text-sm font-semibold text-gray-900'>
                      {note.title || 'Untitled'}
                    </h3>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                  <p className='line-clamp-1 text-xs leading-relaxed text-gray-600'>{preview}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
