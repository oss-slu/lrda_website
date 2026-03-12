import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Tag } from '@lrda/shared';

interface TagManagerProps {
  inputTags?: (Tag | string)[];
  suggestedTags?: string[];
  onTagsChange: (tags: Tag[]) => void;
  fetchSuggestedTags: () => void;
  disabled?: boolean;
}

const TagManager: React.FC<TagManagerProps> = ({
  inputTags = [],
  suggestedTags,
  onTagsChange,
  fetchSuggestedTags,
  disabled = false,
}) => {
  const convertOldTags = useMemo(() => {
    return (tags: (Tag | string)[]): Tag[] => {
      return tags.map(tag => (typeof tag === 'string' ? { label: tag, origin: 'user' } : tag));
    };
  }, []);

  const [tags, setTags] = useState<Tag[]>(convertOldTags(inputTags));
  const [tagInput, setTagInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newTags = convertOldTags(inputTags);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync pattern
    setTags(prevTags => {
      if (JSON.stringify(prevTags) !== JSON.stringify(newTags)) {
        return newTags;
      }
      return prevTags;
    });
  }, [inputTags, convertOldTags]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const addTag = (tag: string, origin: 'user' | 'ai') => {
    if (disabled) return;
    const trimmed = tag.trim();
    if (trimmed.includes(' ')) {
      toast('Tags cannot contain spaces', { duration: 2000 });
      setTagInput('');
      return;
    }
    if (trimmed.length < 1) {
      setTagInput('');
      return;
    }
    if (trimmed.length > 28) {
      toast('Tag is too long (max 28 characters)', { duration: 2000 });
      setTagInput('');
      return;
    }
    if (tags.find(t => t.label === trimmed)) {
      toast('Tag already exists', { duration: 2000 });
      setTagInput('');
      return;
    }

    const newTag = { label: trimmed, origin };
    setTags(prevTags => {
      const updatedTags = [...prevTags, newTag];
      onTagsChange(updatedTags);
      return updatedTags;
    });
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    setTags(prevTags => {
      const updatedTags = prevTags.filter(tag => tag.label !== tagToRemove);
      onTagsChange(updatedTags);
      return updatedTags;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag(tagInput, 'user');
    }
    if (event.key === 'Escape') {
      setIsAdding(false);
      setTagInput('');
    }
    if (event.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag) removeTag(lastTag.label);
    }
  };

  const handleBlur = () => {
    if (tagInput.trim()) {
      addTag(tagInput, 'user');
    }
    setIsAdding(false);
  };

  return (
    <div>
      <div className='flex flex-wrap items-center gap-1.5'>
        {tags.map((tag, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              tag.origin === 'ai' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tag.label}
            {!disabled && (
              <button
                onClick={() => removeTag(tag.label)}
                className={`-mr-0.5 ml-0.5 rounded-full p-0.5 transition-colors ${
                  tag.origin === 'ai' ?
                    'hover:bg-purple-200 hover:text-purple-900'
                  : 'hover:bg-gray-300 hover:text-gray-900'
                }`}
              >
                <X className='h-3 w-3' />
              </button>
            )}
          </span>
        ))}

        {!disabled && (
          <>
            {isAdding ?
              <input
                ref={inputRef}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder='Type tag...'
                maxLength={28}
                className='h-6 w-24 rounded-full border border-gray-300 bg-white px-2.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
              />
            : <button
                onClick={() => setIsAdding(true)}
                className='inline-flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700'
              >
                <Plus className='h-3 w-3' />
                <span>Add tag</span>
              </button>
            }

            <button
              onClick={fetchSuggestedTags}
              className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-purple-500 transition-colors hover:bg-purple-50 hover:text-purple-700'
              title='Suggest tags with AI'
            >
              <Sparkles className='h-3 w-3' />
            </button>
          </>
        )}
      </div>

      {suggestedTags && suggestedTags.length > 0 && !disabled && (
        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
          <span className='text-xs text-gray-400'>Suggested:</span>
          {suggestedTags
            .filter(tag => !tags.find(t => t.label === tag))
            .map((tag, index) => (
              <button
                key={index}
                onClick={() => addTag(tag, 'ai')}
                className='inline-flex items-center gap-1 rounded-full border border-dashed border-purple-300 px-2.5 py-0.5 text-xs text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-50'
              >
                <Plus className='h-3 w-3' />
                {tag}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default TagManager;
