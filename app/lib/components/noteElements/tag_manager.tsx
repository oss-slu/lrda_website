import React, { useState, useEffect } from "react";
import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TagManagerProps {
  inputTags?: string[];
  suggestedTags?: string[];
  onTagsChange: (tags: string[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ inputTags, suggestedTags, onTagsChange }) => {
  const [tags, setTags] = useState<string[]>(inputTags || []);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (inputTags !== tags) {
      setTags(inputTags || []);
    }
  }, [inputTags]);

  const addTag = (tag: string) => {
    if (tag.includes(" ")) {
      toast("Failed to add tag", {
        description: "Your tag must not contain spaces.",
        duration: 2000,
      });
      setTagInput("");
      return;
    }
    if (tag.length <= 2) {
      toast("Failed to add tag", {
        description: "Tags must be longer than 2 characters.",
        duration: 2000,
      });
      return;
    }
    if (tags.includes(tag)) {
      toast("Failed to add tag", {
        description: "Duplicate tags are not allowed.",
        duration: 2000,
      });
      setTagInput("");
      return;
    }
    if (tag && !tags.includes(tag) && tag.length > 2 && !tag.includes(" ")) {
      setTags((prevTags) => {
        const updatedTags = [...prevTags, tag];
        onTagsChange(updatedTags);
        return updatedTags;
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prevTags) => {
      const updatedTags = prevTags.filter((tag) => tag !== tagToRemove);
      onTagsChange(updatedTags);
      return updatedTags;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      addTag(tagInput);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const handleSuggestedTagClick = (tag: string) => {
    addTag(tag);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 bg-none">
        <Input
          value={tagInput}
          placeholder="Add tags..."
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          className="flex-1 min-w-[90px] max-w-[280px] bg-white"
        />
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex text-xs items-center gap-2 bg-gray-200 px-2 py-1 rounded"
          >
            <button
              onClick={() => removeTag(tag)}
              className="text-gray-600 hover:text-gray-900"
            >
              <XIcon className="h-3 w-3" />
            </button>
            {tag}
          </div>
        ))}
      </div>
      {suggestedTags && suggestedTags.length > 0 && (
        <div className="mt-4">
          <h4>Suggested Tags:</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedTags.map((tag, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedTagClick(tag)}
                className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded hover:bg-purple-300"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
