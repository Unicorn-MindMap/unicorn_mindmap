import React from "react";
import axios from "axios";

const DownloadGraphButton = () => {
  const handleDownload = async () => {
    try {
      const response = await axios.get(
        "https://localhost:5261/api/Nodes/download",
        {
          responseType: "blob", // Ensure response is treated as a file
        }
      );

      // Create a blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create an anchor element to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = "graph_data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: "10px 20px",
          backgroundColor: "#e3f2fd",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
      }}
      
    >
      Download JSON
    </button>
  );
};

export default DownloadGraphButton;
