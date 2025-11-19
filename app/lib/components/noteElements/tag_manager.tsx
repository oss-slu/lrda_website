import React, { useState, useEffect, useMemo } from "react";
import { XIcon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Tag {
  label: string;
  origin: "user" | "ai";
}

// Define the props for the TagManager component
interface TagManagerProps {
  inputTags?: (Tag | string)[];// Tags passed to the component, can be either strings or Tag objects
  suggestedTags?: string[];// Suggested tags provided by AI
  onTagsChange: (tags: Tag[]) => void;// Callback to notify parent components of tag changes
  fetchSuggestedTags: () => void;// Function to fetch suggested tags
  disabled?: boolean;// Whether the tag manager is disabled (read-only)
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
      return tags.map(tag => 
        typeof tag === "string" ? { label: tag, origin: "user" } : tag
      );
    };
  }, []);

  const [tags, setTags] = useState<Tag[]>(convertOldTags(inputTags));
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const newTags = convertOldTags(inputTags);
    // Only update if the tags are different to prevent infinite loop
    setTags(prevTags => {
      if (JSON.stringify(prevTags) !== JSON.stringify(newTags)) {
        return newTags;
      }
      return prevTags; // Return the previous tags if they are the same
    });
  }, [inputTags, convertOldTags]); // Removed tags from the dependencies

  const addTag = (tag: string, origin: "user" | "ai") => {
    // Don't add tags if disabled
    if (disabled) {
      return;
    }
    if (tag.includes(" ")) {
      toast("Failed to add tag", {
        description: "Your tag must not contain spaces.",
        duration: 2000,
      });
      setTagInput("");
      return;
    }
    if (tag.length < 1) {
      toast("Failed to add tag", {
        description: "Tags must be at least 1 character.",
        duration: 2000,
      });
      setTagInput("");
      return;
    }
    if (tag.length > 28) {
      toast("Failed to add tag", {
        description: "Tags must be 28 characters or less.",
        duration: 2000,
      });
      setTagInput("");
      return;
    }
    if (tags.find((t) => t.label === tag)) {
      toast("Failed to add tag", {
        description: "Duplicate tags are not allowed.",
        duration: 2000,
      });
      setTagInput("");
      return;
    }

    const newTag = { label: tag, origin };
    setTags((prevTags) => {
      const updatedTags = [...prevTags, newTag];
      onTagsChange(updatedTags); // Notify parent component of tag changes
      return updatedTags;
    });
    setTagInput(""); // Clear input field
  };

  const removeTag = (tagToRemove: string) => {
    // Don't remove tags if disabled
    if (disabled) {
      return;
    }
    setTags((prevTags) => {
      const updatedTags = prevTags.filter((tag) => tag.label !== tagToRemove);
      onTagsChange(updatedTags); // Notify parent component of tag changes
      return updatedTags;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !disabled) {
      addTag(tagInput, "user");
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      setTagInput(event.target.value);
    }
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!disabled) {
      addTag(tag, "ai");
    }
  };

  // Helper function to get validation status
  const getValidationStatus = () => {
    if (tagInput.length === 0) return { valid: true, message: "" };
    if (tagInput.includes(" ")) return { valid: false, message: "No spaces allowed" };
    if (tagInput.length < 1) return { valid: false, message: "Too short (min 1)" };
    if (tagInput.length > 28) return { valid: false, message: "Too long (max 28)" };
    if (tags.find((t) => t.label === tagInput)) return { valid: false, message: "Already exists" };
    return { valid: true, message: "Press Enter to add" };
  };

  const validation = getValidationStatus();

  return (
    <div>
  <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <div className="relative flex-1 min-w-[90px] max-w-[280px]">
          <Input
            value={tagInput}
            placeholder="Add tags..."
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            maxLength={28}
            disabled={disabled}
            readOnly={disabled}
            className={`bg-white pr-16 ${
              disabled ? "cursor-default opacity-60" : ""
            } ${
              tagInput.length > 0 && !validation.valid 
                ? "border-red-300 focus-visible:ring-red-500" 
                  : tagInput.length >= 1 && tagInput.length <= 28 && validation.valid
                ? "border-green-300 focus-visible:ring-green-500"
                : ""
            }`}
          />
          {tagInput.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className={`text-xs font-medium ${
                validation.valid ? "text-green-600" : "text-red-600"
              }`}>
                {tagInput.length}
                {validation.valid ? " ✓" : " ✗"}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={fetchSuggestedTags}
          disabled={disabled}
          className={`p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all shadow-sm ml-1 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title="Generate AI tags"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        {tagInput.length > 0 && validation.message && (
          <span className={`text-xs ${
            validation.valid ? "text-green-600" : "text-red-600"
          }`}>
            {validation.message}
          </span>
        )}
        {tags
          .filter((tag) => tag.origin === "user")
          .map((tag, index) => (
            <div
              key={index}
              className="flex text-xs items-center gap-2 bg-gray-200 px-2 py-1 rounded"
            >
              <button
                onClick={() => removeTag(tag.label)}
                disabled={disabled}
                className={`text-gray-600 hover:text-gray-900 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <XIcon className="h-3 w-3" />
              </button>
              {tag.label}
            </div>
          ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {tags
          .filter((tag) => tag.origin === "ai")
          .map((tag, index) => (
            <div
              key={index}
              className="flex text-xs items-center gap-2 bg-purple-200 text-purple-800 px-2 py-1 rounded"
            >
              <button
                onClick={() => removeTag(tag.label)}
                disabled={disabled}
                className={`text-purple-600 hover:text-purple-900 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <XIcon className="h-3 w-3" />
              </button>
              {tag.label}
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
                disabled={disabled}
                className={`text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded hover:bg-purple-300 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
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