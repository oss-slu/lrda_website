import React, { useState } from "react";
import { useTheme } from "@mui/material";
import {
  MenuButtonAddTable,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonIndent,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonSubscript,
  MenuButtonSuperscript,
  MenuButtonTaskList,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUndo,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectFontFamily,
  MenuSelectFontSize,
  MenuSelectHeading,
  MenuSelectTextAlign,
  isTouchDevice,
} from "mui-tiptap";
import { uploadMedia } from "../utils/s3_proxy";

type EditorMenuControlsProps = {
  onMediaUpload: (media: { type: string; uri: string }) => void;
};

export default function EditorMenuControls({
  onMediaUpload,
}: EditorMenuControlsProps) {
  const theme = useTheme();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [uploading, setUploading] = useState(false); // To handle upload status

  // Unified upload handler
  async function handleFileUpload(file: File) {
    const fileType = file.type;
    let mediaType = "image";
  
    if (fileType.startsWith("video/")) {
      mediaType = "video";
    } else if (fileType.startsWith("audio/")) {
      mediaType = "audio";
    }
  
    try {
      setUploading(true);
  
      let processedFile = file;
  
      if (mediaType === "image" && fileType !== "image/jpeg") {
        // Convert to JPEG
        processedFile = await convertToJpeg(file);
      }
  
      const uri = await uploadMedia(processedFile, mediaType);
      setUploading(false);
  
      return { type: mediaType, uri };
    } catch (error) {
      console.error("Media upload failed:", error);
      setUploading(false);
      throw error;
    }
  }

  async function convertToJpeg(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
  
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Failed to get canvas context"));
          }
  
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              return reject(new Error("Failed to convert image to JPEG"));
            }
  
            const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
            });
  
            resolve(jpegFile);
          }, "image/jpeg");
        };
        img.src = event.target?.result as string;
      };
  
      reader.onerror = (err) => {
        reject(err);
      };
  
      reader.readAsDataURL(file);
    });
  }  

  return (
    <>
      <MenuControlsContainer>
        <MenuButtonUndo />
        <MenuButtonRedo />
        <MenuDivider />

        <MenuSelectFontFamily
          options={[
            { label: "Comic Sans", value: "Comic Sans MS, Comic Sans" },
            { label: "Cursive", value: "cursive" },
            { label: "Monospace", value: "monospace" },
            { label: "Serif", value: "serif" },
          ]}
        />

        <MenuDivider />

        <MenuSelectHeading />

        <MenuDivider />

        <MenuSelectFontSize />

        <MenuDivider />

        <MenuButtonBold />
        <MenuButtonItalic />
        <MenuButtonUnderline />
        <MenuButtonStrikethrough />
        <MenuButtonSubscript />
        <MenuButtonSuperscript />

        <MenuDivider />

        <MenuButtonTextColor
          defaultTextColor={theme.palette.text.primary}
          swatchColors={[
            { value: "#000000", label: "Black" },
            { value: "#ffffff", label: "White" },
            { value: "#888888", label: "Grey" },
            { value: "#ff0000", label: "Red" },
            { value: "#ff9900", label: "Orange" },
            { value: "#ffff00", label: "Yellow" },
            { value: "#00d000", label: "Green" },
            { value: "#0000ff", label: "Blue" },
          ]}
        />

        <MenuButtonHighlightColor
          swatchColors={[
            { value: "#595959", label: "Dark grey" },
            { value: "#dddddd", label: "Light grey" },
            { value: "#ffa6a6", label: "Light red" },
            { value: "#ffd699", label: "Light orange" },
            { value: "#ffff00", label: "Yellow" },
            { value: "#99cc99", label: "Light green" },
            { value: "#90c6ff", label: "Light blue" },
            { value: "#8085e9", label: "Light purple" },
          ]}
        />

        <MenuDivider />

        <MenuButtonEditLink />
        <MenuDivider />

        <MenuSelectTextAlign />
        <MenuDivider />

        <MenuButtonOrderedList />
        <MenuButtonBulletedList />
        <MenuButtonTaskList />

        {isTouchDevice() && (
          <>
            <MenuButtonIndent />
            <MenuButtonUnindent />
          </>
        )}

        <MenuDivider />

        <MenuButtonBlockquote />
        <MenuDivider />

        {/* Upload Media Button - Enhanced visibility */}
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-50 transition-colors duration-200 border border-blue-200 bg-blue-50 cursor-pointer text-blue-600 hover:text-blue-700 hover:border-blue-300 hover:shadow-sm"
          onClick={() => setIsPopupOpen(true)}
          title="Upload Media (Images, Videos, Audio)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-medium">Upload</span>
        </button>

        <MenuDivider />

        <MenuButtonHorizontalRule />
        <MenuButtonAddTable />
        <MenuDivider />
        <MenuButtonRemoveFormatting />
        <MenuDivider />
      </MenuControlsContainer>

      {/* Popup Component */}
      {isPopupOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl shadow-2xl border border-gray-200 z-50 min-w-96">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Upload Media</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Choose an image, video, or audio file to add to your note
          </p>
          
          <div className="mb-6">
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-3 file:px-6 
                file:rounded-lg file:border-0 
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white 
                hover:file:bg-blue-700 
                file:cursor-pointer
                transition-colors duration-200
                cursor-pointer"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const uploadedMedia = await handleFileUpload(file);
                    onMediaUpload(uploadedMedia); // Pass media back to parent
                    setIsPopupOpen(false); // Close popup on success
                  } catch (error) {
                    console.error("Error uploading media:", error);
                  }
                }
              }}
            />
          </div>
          {uploading && (
            <div className="flex items-center mb-4 text-blue-600 bg-blue-50 p-3 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm font-medium">Uploading your file...</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
              onClick={() => setIsPopupOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={() => setIsPopupOpen(false)}
        />
      )}
    </>
  );
}
