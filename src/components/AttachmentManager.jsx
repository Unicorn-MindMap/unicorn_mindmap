import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import axios from "axios";

const AttachmentManager = ({ nodeDetails }) => {
  const [attachments, setAttachments] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("User Story");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fileTypes = ["User Story", "User Guide", "Test Cases"];

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await axios.get(
          `https://localhost:5261/api/Nodes/attachments_get/${nodeDetails.id}`
        );
        setAttachments(response.data);
      } catch (error) {
        console.error("Error fetching attachments:", error);
      }
    };
    
    if (nodeDetails && nodeDetails.id) {
      fetchAttachments();
    }
  }, [attachments, nodeDetails]);

  // Validate inputs
  const validateInputs = () => {
    const newErrors = {};
    
    if (!fileName.trim()) {
      newErrors.fileName = "Link name is required";
    }
    
    if (!fileUrl.trim()) {
      newErrors.fileUrl = "URL is required";
    } else {
      // Check if URL is valid
      try {
        // Attempt to create a URL object (will throw if invalid)
        new URL(fileUrl.startsWith('http') ? fileUrl : `https://${fileUrl}`);
      } catch (e) {
        newErrors.fileUrl = "Please enter a valid URL";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAttachment = async () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    
    // Ensure URL has http/https
    const normalizedUrl = fileUrl.startsWith('http') ? fileUrl : `https://${fileUrl}`;
    
    const newAttachment = {
      id: "",
      fileName,
      fileType,
      fileUrl: normalizedUrl,
    };
    
    try {
      const response = await axios.post(
        `https://localhost:5261/api/Nodes/attachment_add/${nodeDetails.id}`,
        newAttachment
      );
      
      // Update attachments with the new one from response
      setAttachments([...attachments, response.data]);
      
      // Reset form
      setFileName("");
      setFileUrl("");
      setFileType("User Story");
      setShowDialog(false);
      setErrors({});
    } catch (error) {
      console.error("Error adding attachment:", error);
      setErrors({ submit: "Failed to add attachment. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this attachment?"
    );
    if (!isConfirmed) return;
    
    try {
      await axios.delete(
        `https://localhost:5261/api/Nodes/attachments_remove/${id}`
      );
      setAttachments(attachments.filter((att) => att.id !== id));
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  // Helper function to safely format URLs
  const formatUrl = (url) => {
    if (!url) return "#"; // Return safe default if URL is null/undefined
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: "bold" }}>
          Attachments
        </h2>
        <button
          onClick={() => setShowDialog(true)}
          style={{
            padding: "8px",
            backgroundColor: "#e3f2fd",
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Add attachment"
        >
          <FaPlus size={14} />
        </button>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <a
                href={formatUrl(attachment.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "none" }}
              >
                {attachment.fileName} <span style={{ marginLeft: "10px", color: "#6b7280" }}>
                  ({attachment.fileType})
                </span>
              </a>
              <button
                onClick={() => handleDelete(attachment.id)}
                style={{
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                }}
                aria-label="Delete attachment"
              >
                <FaTimes size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af" }}
        >
          No attachments yet
        </div>
      )}

      {/* Add Attachment Dialog */}
      {showDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "100%",
              maxWidth: "420px",
              margin: "0 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>
                Add New Attachment
              </h3>
              <button
                onClick={() => setShowDialog(false)}
                style={{
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  Link Name
                </label>
                <input
                  type="text"
                  placeholder="Enter URL Name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: errors.fileName ? "1px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                  }}
                />
                {errors.fileName && (
                  <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.fileName}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  URL
                </label>
                <input
                  type="text"
                  placeholder="Enter URL"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: errors.fileUrl ? "1px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                  }}
                />
                {errors.fileUrl && (
                  <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.fileUrl}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "4px",
                  }}
                >
                  File Type
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                  }}
                >
                  {fileTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {errors.submit && (
                <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "8px" }}>
                  {errors.submit}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: "8px",
                }}
              >
                <button
                  onClick={() => setShowDialog(false)}
                  style={{
                    padding: "8px 16px",
                    color: "#4b5563",
                    background: "none",
                    border: "none",
                    marginRight: "8px",
                    cursor: "pointer",
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttachment}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#e3f2fd",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentManager;