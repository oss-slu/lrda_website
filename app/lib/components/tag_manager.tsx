import React, { useState, useEffect } from "react";
import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagManagerProps {
  inputTags?: string[];
}

const TagManager: React.FC<TagManagerProps> = ({ inputTags }) => {
    const [tags, setTags] = useState<string[]>(inputTags || []);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (inputTags !== tags) { 
      setTags(inputTags || []);
    }
  }, [inputTags]);


  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags((prevTags) => [...prevTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      addTag(tagInput);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  return (
    <div className="mt-2">
      <Input
        value={tagInput}
        placeholder="Add tags here!"
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        className="w-min"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-gray-200 px-2 py-1 rounded"
          >
            <button
              onClick={() => removeTag(tag)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              <XIcon className="h-3 w-3"/>
            </button>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagManager;
