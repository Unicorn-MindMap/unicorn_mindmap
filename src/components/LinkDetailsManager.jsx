import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaCheck, FaTimes, FaTrash, FaSearch, FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";

const LinkDetailsManager = ({ currentNodeDetails, refreshNodeDetails, handleNodeClick, onClose, graphData }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [deletingLinkIds, setDeletingLinkIds] = useState({});
  const [nodeLabels, setNodeLabels] = useState({}); // Store node labels
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); // Add this for delete confirmation

  // Fetch all links when component mounts or currentNodeDetails changes
  useEffect(() => {
    fetchLinks();
  }, [currentNodeDetails]);

  // Fetch node labels for connected nodes
  const fetchNodeLabels = async (nodeIds) => {
    try {
      // Fetch node details for each ID
      const nodeDetails = await Promise.all(
        nodeIds.map(
          (id) =>
            axios
              .get(`https://unicorn-mindmap-bcatemfdc2f0encx.southindia-01.azurewebsites.net/api/Nodes/${id}`)
              .then((res) => ({ id, label: res.data.label || `Node ${id}` }))
              .catch(() => ({ id, label: `Node ${id}` })) // Fallback if fetch fails
        )
      );

      // Convert to object with id as key and label as value
      const labelsMap = nodeDetails.reduce((acc, node) => {
        acc[node.id] = node.label;
        return acc;
      }, {});

      setNodeLabels(labelsMap);
    } catch (err) {
      console.error("Error fetching node labels:", err);
    }
  };

  const fetchLinks = async () => {
    if (!currentNodeDetails || !currentNodeDetails.id) return;

    setLoading(true);
    try {
      const response = await axios.get(
        "https://unicorn-mindmap-bcatemfdc2f0encx.southindia-01.azurewebsites.net/api/Nodes/links"
      );
      // const response = await axios.get(
      //   "https://localhost:5261/api/Nodes/links"
      // );

      // Filter links related to the current node
      const relevantLinks = response.data.filter(
        (link) =>
          link.sourceNodeId === currentNodeDetails.id ||
          link.targetNodeId === currentNodeDetails.id
      );
      setLinks(relevantLinks);

      // Get unique connected node IDs
      const connectedNodeIds = [
        ...new Set(
          relevantLinks.map((link) =>
            link.sourceNodeId === currentNodeDetails.id
              ? link.targetNodeId
              : link.sourceNodeId
          )
        ),
      ];

      // Fetch labels for connected nodes
      await fetchNodeLabels(connectedNodeIds);

      setError(null);
    } catch (err) {
      console.error("Error fetching links:", err);
      setError("Failed to load link details. Please try again.");
      toast.error("Failed to load link details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (link) => {
    setEditingLinkId(link.id);
    setEditContent(link.content || "");
  };

  const handleEditCancel = () => {
    setEditingLinkId(null);
    setEditContent("");
  };

  const handleEditSave = async (link) => {
    try {
      await axios.put(`https://unicorn-mindmap-bcatemfdc2f0encx.southindia-01.azurewebsites.net/api/Nodes/links/${link.id}`, {
        ...link,
        content: editContent,
      });

      // Update local state
      setLinks((prevLinks) =>
        prevLinks.map((l) =>
          l.id === link.id ? { ...l, content: editContent } : l
        )
      );

      setEditingLinkId(null);
      setEditContent("");

      if (refreshNodeDetails) {
        await refreshNodeDetails();
      }

      toast.success("Link content updated successfully");
    } catch (err) {
      console.error("Error updating link content:", err);
      toast.error("Failed to update link content");
    }
  };

  // New functions for delete confirmation
  const handleDeleteConfirm = (linkId) => {
    setConfirmingDeleteId(linkId);
  };

  const handleDeleteCancel = () => {
    setConfirmingDeleteId(null);
  };

  const handleDeleteLink = async (linkId) => {
    setDeletingLinkIds((prev) => ({ ...prev, [linkId]: true }));

    try {
      // Find the specific link to delete
      const linkToDelete = links.find(link => link.id === linkId);
      
      if (!linkToDelete) {
        throw new Error("Link not found");
      }

      // Use the correct URL format with proper parameters
      await axios.delete(`https://unicorn-mindmap-bcatemfdc2f0encx.southindia-01.azurewebsites.net/api/Nodes/links?sourceId=${linkToDelete.sourceNodeId}&targetId=${linkToDelete.targetNodeId}`);

      // Update local state
      setLinks((prevLinks) => prevLinks.filter((link) => link.id !== linkId));

      if (refreshNodeDetails) {
        await refreshNodeDetails();
      }

      toast.success("Link deleted successfully");
    } catch (err) {
      console.error("Error deleting link:", err);
      toast.error("Failed to delete link");
    } finally {
      setDeletingLinkIds((prev) => ({ ...prev, [linkId]: false }));
      setConfirmingDeleteId(null); // Reset confirmation state
    }
  };

  // Function to navigate to a linked node
  const navigateToNode = (nodeId) => {
    if (!graphData || !handleNodeClick || !onClose) {
      console.warn("Navigation props are missing. Cannot navigate to linked node.");
      return;
    }
    
    // Find the node in graphData
    const node = graphData.nodes.find((n) => n.id === nodeId);
    
    if (node) {
      // Close the current dialog
      onClose();
      // Open the details dialog for the selected node
      handleNodeClick(node);
    } else {
      toast.error("Linked node not found in the graph data");
    }
  };

  if (loading && links.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading link details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "#e53e3e", padding: "15px", textAlign: "center" }}>
        {error}
        <button
          onClick={fetchLinks}
          style={{
            marginLeft: "10px",
            padding: "5px 10px",
            backgroundColor: "#e2e8f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#718096", padding: "15px" }}>
        No links found for this node.
      </div>
    );
  }

  // Group links by connected node
  const linksByNode = links.reduce((acc, link) => {
    const connectedNodeId =
      link.sourceNodeId === currentNodeDetails.id
        ? link.targetNodeId
        : link.sourceNodeId;

    if (!acc[connectedNodeId]) {
      acc[connectedNodeId] = [];
    }
    acc[connectedNodeId].push(link);
    return acc;
  }, {});

  // Filter nodes based on search term
  const filteredLinksByNode = Object.entries(linksByNode).filter(([nodeId]) => {
    const nodeLabel = nodeLabels[nodeId] || `Node ${nodeId}`;
    return nodeLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div style={{ 
        marginTop: "20px",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "15px" 
      }}>
        <h3 style={{ fontSize: "18px", color: "#2d3748", margin: 0 }}>
          Linked Nodes ({links.length})
        </h3>
        
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          position: "relative",
          width: "200px" 
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by label"
            style={{
              padding: "8px 12px",
              paddingLeft: "8px",
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
              width: "100%",
              fontSize: "14px",
            }}
          />
          
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#718096",
                display: "flex",
                alignItems: "center",
              }}
              title="Clear search"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>

      {filteredLinksByNode.length === 0 && searchTerm && (
        <div style={{ textAlign: "center", color: "#718096", padding: "15px", backgroundColor: "#f7fafc", borderRadius: "6px" }}>
          No nodes found matching "{searchTerm}"
        </div>
      )}

      {filteredLinksByNode.map(([nodeId, nodeLinks]) => (
        <div
          key={nodeId}
          style={{
            marginBottom: "20px",
            backgroundColor: "#f7fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: "#edf2f7",
              padding: "10px 15px",
              borderBottom: "1px solid #e2e8f0",
              fontWeight: "500",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>{nodeLabels[nodeId] || `Node ${nodeId}`}</span>
            {/* Add View button for navigation */}
            {handleNodeClick && onClose && graphData && (
              <button
                onClick={() => navigateToNode(nodeId)}
                style={{ color: "#3b82f6", fontSize: "14px",backgroundColor: "#edf2f7"}}
                title="Navigate to node"
              >
                View <FaArrowRight size={10} />
              </button>
            )}
          </div>

          {nodeLinks.map((link) => (
            <div
              key={link.id}
              style={{
                padding: "15px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#4a5568",
                }}
              >
                <span>
                  {link.sourceNodeId === currentNodeDetails.id
                    ? "Outgoing"
                    : "Incoming"}{" "}
                  Link
                </span>
                <div>
                  {editingLinkId === link.id ? (
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => handleEditSave(link)}
                        style={{
                          backgroundColor: "#c6f6d5",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#38a169",
                        }}
                        title="Save"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        style={{
                          backgroundColor: "#fed7d7",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#e53e3e",
                        }}
                        title="Cancel"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : confirmingDeleteId === link.id ? (
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deletingLinkIds[link.id]}
                        style={{
                          backgroundColor: "#c6f6d5",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#38a169",
                          opacity: deletingLinkIds[link.id] ? 0.7 : 1,
                        }}
                        title="Confirm delete"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={handleDeleteCancel}
                        style={{
                          backgroundColor: "#fed7d7",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#e53e3e",
                        }}
                        title="Cancel delete"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => handleEditStart(link)}
                        style={{
                          backgroundColor: "#e2e8f0",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#4a5568",
                        }}
                        title="Edit link content"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(link.id)}
                        style={{
                          backgroundColor: "#fed7d7",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#e53e3e",
                        }}
                        title="Delete link"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingLinkId === link.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: "96%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e0",
                    minHeight: "60px",
                    resize: "vertical",
                  }}
                  placeholder="Enter link content here..."
                />
              ) : (
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                    minHeight: "30px",
                  }}
                >
                  {link.content || (
                    <span style={{ color: "#a0aec0", fontStyle: "italic" }}>
                      No content
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default LinkDetailsManager;