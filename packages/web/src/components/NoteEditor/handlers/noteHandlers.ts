import React from 'react';
import { Tag } from '@/types';

export const handleTitleChange = (
  setTitle: React.Dispatch<React.SetStateAction<string>>,
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  setTitle(event.target.value);
};

export const handleLocationChange = (
  setLongitude: React.Dispatch<React.SetStateAction<number | null>>,
  setLatitude: React.Dispatch<React.SetStateAction<number | null>>,
  newLongitude: number,
  newLatitude: number,
) => {
  setLatitude(newLatitude);
  setLongitude(newLongitude);
};

export const handleTimeChange = (
  setTime: React.Dispatch<React.SetStateAction<Date>>,
  newDate: Date,
) => {
  setTime(newDate);
};

export const handleTagsChange = (
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>,
  newTags: (Tag | string)[],
) => {
  const formattedTags = newTags.map(tag =>
    typeof tag === 'string' ? { label: tag, origin: 'user' as const } : tag,
  );
  setTags(formattedTags);
};

export const handleEditorChange = (
  setEditorContent: React.Dispatch<React.SetStateAction<string>>,
  content: string,
) => {
  setEditorContent(content);
};
