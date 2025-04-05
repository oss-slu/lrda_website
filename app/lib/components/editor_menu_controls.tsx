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

        {/* Upload Media Button */}
        <button
          style={{
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          onClick={() => setIsPopupOpen(true)}
        >
          📁 
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
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
          }}
        >
          <h3>Upload Media</h3>
          <input
            type="file"
            accept="image/*,video/*,audio/*"
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
          {uploading && <p>Uploading...</p>}
          <button
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              backgroundColor: "#007BFF",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => setIsPopupOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Overlay */}
      {isPopupOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
          onClick={() => setIsPopupOpen(false)}
        />
      )}
    </>
  );
}
