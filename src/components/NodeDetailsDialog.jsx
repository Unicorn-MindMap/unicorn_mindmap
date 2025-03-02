import React, { useState, useEffect } from "react";
import NewNodeDialog from "./NewNodeDialog";
import AddLinkDialog from "./AddLinkDialog";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import UpdateNodeDialog from "./UpdateNodeDialog";


const NodeDetailsDialog = ({
  nodeDetails,
  onClose,
  highlightDepth,
  setHighlightDepth,
  getRelatedNodes,
  graphData,
  handleNodeClick,
  getData,
  isFixed,
  onReleaseNode
}) => {
  const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);
  const [isUpdateNodeDialogOpen, setIsUpdateNodeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNewLinkDialogOpen, setIsNewLinkDialogOpen] = useState(false);
  const [deletingLinkIds, setDeletingLinkIds] = useState({});
  const [currentNodeDetails, setCurrentNodeDetails] = useState(nodeDetails);
  
  // Update currentNodeDetails when nodeDetails prop changes
  useEffect(() => {
    setCurrentNodeDetails(nodeDetails);
  }, [nodeDetails]);

  // Update currentNodeDetails when graphData changes
  useEffect(() => {
    if (graphData && currentNodeDetails) {
      // Find the updated node in the refreshed graph data
      const updatedNode = graphData.nodes.find(node => node.id === currentNodeDetails.id);
      
      if (updatedNode) {
        // Get all links related to this node
        const nodeLinks = graphData.links.filter(
          link => link.source === updatedNode.id || link.target === updatedNode.id
        );
        
        // Update the current node details with the latest data
        setCurrentNodeDetails({
          ...updatedNode,
          originalData: {
            ...updatedNode.originalData,
            links: nodeLinks
          }
        });
      }
    }
  }, [graphData, currentNodeDetails?.id]);

  // Method to explicitly refresh node details from the API
  const refreshNodeDetails = async () => {
    try {
      await getData();
      // The useEffect hook above will handle updating the state
    } catch (error) {
      console.error("Failed to refresh node details:", error);
    }
  };

  if (!currentNodeDetails) return null;

  const relatedNodes = getRelatedNodes(currentNodeDetails.id);

  const handleNewNodeSave = async (newNode) => {
    // Handle new node creation logic here
    await getData();
    setIsNewNodeDialogOpen(false);
  };
  
  const handleUpdateNodeSave = async (updatedNode) => {
    // Handle updated node logic here
    await getData();
    setIsUpdateNodeDialogOpen(false);
  };

  const handleAttachmentAdded = async () => {
    await refreshNodeDetails();
  };
  const handleNewLinkSave = async (newLink) => {
    // Handle new link creation logic here
    await getData();
    setIsNewLinkDialogOpen(false);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this node?"
    );
    if (!confirmDelete) return;
    onClose();
    setLoading(true);
    setError("");
  
    try {
      await axios.delete(`https://localhost:5261/api/Nodes/${currentNodeDetails.id}`);
      await getData();
      toast.success("Node deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete the node.");
      setError("Failed to delete the node.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (targetId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this link?"
    );
    if (!confirmDelete) return;
    
    setDeletingLinkIds(prev => ({ ...prev, [targetId]: true }));
    setError("");

    try {
      await axios.delete(`https://localhost:5261/api/Nodes/links?sourceId=${currentNodeDetails.id}&targetId=${targetId}`);
      await getData();
      toast.success("Link deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete the link.");
      setError("Failed to delete the link.");
    } finally {
      setDeletingLinkIds(prev => ({ ...prev, [targetId]: false }));
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "0",
        transform: "translateY(-50%)",
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "0 8px 8px 0",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        zIndex: 1000,
        maxWidth: "400px",
        width: "30%",
        height:"70%",
        maxHeight: "100vh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>{currentNodeDetails.label} <br /> <span style={{fontSize:"12px"}}>{currentNodeDetails.category}</span></h3>
        <button
          onClick={() => setIsNewNodeDialogOpen(true)}
          style={{
            fontSize: "13px",
            backgroundColor: "#e3f2fd",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "0 5px",
            padding: "5px",
          }}
          title="Add Child Node"
        >
          <FaPlus />
        </button>
        <button
          onClick={() => setIsNewLinkDialogOpen(true)}
          style={{
            fontSize: "13px",
            backgroundColor: "#e3f2fd",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "0 5px",
            padding: "5px 10px",
          }}
          title="Add Link"
        >
          AddLink
        </button>
        <button
          onClick={() => setIsUpdateNodeDialogOpen(true)}
          style={{
            fontSize: "13px",
            backgroundColor: "#e3f2fd",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "0 5px",
            padding: "5px",
          }}
          title="Edit Node"
        >
          <FaEdit />
        </button>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            marginLeft: "5px",
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
        }}
      >
        <p style={{ margin: 0, color: "#2c3e50", lineHeight: "1.6" }}>
          {currentNodeDetails.description}
        </p>
      </div>

 





      {/* Related nodes section */}
      {(() => {
        const relatedNodes = getRelatedNodes(currentNodeDetails.id);
        return (
          <div>
            {/* Parent section */}
            {relatedNodes.parent && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    marginBottom: "12px",
                    color: "#34495e",
                  }}
                >
                  Parent
                </h3>
                <div
                  style={{
                    padding: "12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: "#f8fafc",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={() => {
                    onClose(); // Close current dialog
                    const node = graphData.nodes.find(
                      (n) => n.id === relatedNodes.parent.id
                    );
                    if (node) handleNodeClick(node);
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#edf2f7")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                >
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      {relatedNodes.parent.label}
                    </div>
                    {relatedNodes.parent.category && (
                      <div style={{ fontSize: "14px", color: "#64748b" }}>
                        {relatedNodes.parent.category}
                      </div>
                    )}
                  </div>
                  <div style={{ color: "#3b82f6", fontSize: "14px" }}>
                    View &rarr;
                  </div>
                </div>
              </div>
            )}

            {/* Children section */}
            {relatedNodes.children.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    marginBottom: "12px",
                    color: "#34495e",
                  }}
                >
                  Children ({relatedNodes.children.length})
                </h3>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {relatedNodes.children.map((child, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        borderBottom:
                          index < relatedNodes.children.length - 1
                            ? "1px solid #e2e8f0"
                            : "none",
                        cursor: "pointer",
                        backgroundColor: "#f8fafc",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onClick={() => {
                        onClose(); // Close current dialog
                        const node = graphData.nodes.find(
                          (n) => n.id === child.id
                        );
                        if (node) handleNodeClick(node);
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#edf2f7")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                    >
                      <div>
                        <div style={{ fontWeight: "500", marginBottom: "3px" }}>
                          {child.label}
                        </div>
                        {child.code && (
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {child.code}
                          </div>
                        )}
                      </div>
                      <div style={{ color: "#3b82f6", fontSize: "14px" }}>
                        View &rarr;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked nodes section */}
            {relatedNodes.linkedNodes.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    marginBottom: "12px",
                    color: "#34495e",
                  }}
                >
                  Linked Nodes ({relatedNodes.linkedNodes.length})
                </h3>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {relatedNodes.linkedNodes.map((linkedNode, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        borderBottom:
                          index < relatedNodes.linkedNodes.length - 1
                            ? "1px solid #e2e8f0"
                            : "none",
                        cursor: "pointer",
                        backgroundColor: "#f0f7ff",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      onClick={() => {
                        onClose(); // Close current dialog
                        const node = graphData.nodes.find(
                          (n) => n.id === linkedNode.id
                        );
                        if (node) handleNodeClick(node);
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e1effe")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f0f7ff")
                      }
                    >
                      <div>
                        <div style={{ fontWeight: "500", marginBottom: "3px" }}>
                          {linkedNode.label}
                        </div>
                        {linkedNode.code && (
                          <div style={{ fontSize: "14px", color: "#3b82f6" }}>
                            {linkedNode.code}
                          </div>
                        )}
                      </div>
                      <div style={{ color: "#3b82f6", fontSize: "14px" }}>
                        View &rarr;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Original node data (links) */}
      {currentNodeDetails.originalData &&
        currentNodeDetails.originalData.links &&
        currentNodeDetails.originalData.links.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3
              style={{
                fontSize: "18px",
                marginBottom: "12px",
                color: "#34495e",
              }}
            >
              Source Links Content
            </h3>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                overflow: "hidden",
                marginBottom: "10px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "2px solid #cbd5e0",
                      }}
                    >
                      Target
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom: "2px solid #cbd5e0",
                      }}
                    >
                      Content
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        borderBottom: "2px solid #cbd5e0",
                        width: "60px",
                      }}
                    >
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentNodeDetails.originalData.links.map((link, index) => {
                    const targetNode = graphData.nodes.find(
                      (n) => n.id === link.id
                    );
                    return (
                      <tr
                        key={index}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          {targetNode ? targetNode.label : "Unknown"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          {link.content}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #e2e8f0",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLink(link.id);
                            }}
                            disabled={deletingLinkIds[link.id]}
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "4px",
                              borderRadius: "4px",
                              transition: "background-color 0.2s",
                            }}
                            title="Delete link"
                            onMouseOver={(e) => 
                              (e.currentTarget.style.backgroundColor = "#fee2e2")
                            }
                            onMouseOut={(e) => 
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            {deletingLinkIds[link.id] ? (
                              <span>...</span>
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          padding: "8px 16px",
          backgroundColor: "rgb(255, 100, 100)",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {loading ? "Deleting..." : "Delete Node"}
      </button>
      {isNewNodeDialogOpen && (
        <NewNodeDialog
          getdata={getData}
          nodeDetails={currentNodeDetails}
          onClose={() => setIsNewNodeDialogOpen(false)}
          onSave={handleNewNodeSave}
        />
      )}
      {isUpdateNodeDialogOpen && (
        <UpdateNodeDialog
          getdata={getData}
          nodeDetails={currentNodeDetails}
          onClose={() => setIsUpdateNodeDialogOpen(false)}
          onSave={handleUpdateNodeSave}
        />
      )}
      {isNewLinkDialogOpen && (
        <AddLinkDialog
          getdata={getData}
          nodedetails={currentNodeDetails}
          onClose={() => setIsNewLinkDialogOpen(false)}
          onSave={handleNewLinkSave}
        />
      )}
    </div>
  );
};

export default NodeDetailsDialog;