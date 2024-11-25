"use client"; // This marks this component as client-side only

import { Button } from "@/components/ui/button";
import { File } from "lucide-react";

interface DownloadButtonProps {
  attachmentId: string;
  filename: string;
  courseId: string;
}

const DownloadButton = ({
  attachmentId,
  filename,
  courseId,
}: DownloadButtonProps) => {
  const handleDownload = async () => {
    try {
      // Make a fetch request to your API route for downloading the file
      const response = await fetch(
        `/api/courses/${courseId}/attachments/${attachmentId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch the file");
      }

      // Create a Blob from the response and trigger the download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <Button
      asChild
      variant="ghost"
      className="ml-auto"
      onClick={handleDownload} // Attach the download handler here
    >
      <span>Download</span>
    </Button>
  );
};

export default DownloadButton;
