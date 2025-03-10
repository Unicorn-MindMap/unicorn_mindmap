import React, { useState, useEffect } from "react";
import NewNodeDialog from "./NewNodeDialog";
import AddLinkDialog from "./AddLinkDialog";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import UpdateNodeDialog from "./UpdateNodeDialog";
import AttachmentManager from "./AttachmentManager";
import DeleteConfirmation from "./DeleteConfirmation";
import LinkDetailsManager from "./LinkDetailsManager";


const NodeDetailsDialog = ({
  nodeDetails,
  onClose,
  getRelatedNodes,
  graphData,
  handleNodeClick,
  getData,
}) => {
  const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);
  const [isUpdateNodeDialogOpen, setIsUpdateNodeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewLinkDialogOpen, setIsNewLinkDialogOpen] = useState(false);
  const [deletingLinkIds, setDeletingLinkIds] = useState({});
  const [currentNodeDetails, setCurrentNodeDetails] = useState(nodeDetails);
  const [showAttachmentManager, setShowAttachmentManager] = useState(false);
  const [showDeleteNodeConfirm, setShowDeleteNodeConfirm] = useState(false);
  const [showDeleteLinkConfirm, setShowDeleteLinkConfirm] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Update currentNodeDetails when nodeDetails prop changes
  useEffect(() => {
    setCurrentNodeDetails(nodeDetails);
  }, [nodeDetails]);

  // Re-render component with fresh data after operations
  const refreshNodeDetails = async () => {
    try {
      // Assuming getData fetches the entire graph
      await getData();
      
      // Find the updated node in the refreshed data
      // This requires you to expose the updated graph data somehow
      // One approach is to modify getData to return the updated data
      const updatedNode = graphData.nodes.find(node => node.id === currentNodeDetails.id);
      
      if (updatedNode) {
        setCurrentNodeDetails({
          ...updatedNode,
          originalData: {
            ...updatedNode.originalData,
            links: graphData.links.filter(link => link.source === updatedNode.id || link.target === updatedNode.id)
          }
        });
      }
    } catch (error) {
      console.error("Failed to refresh node details:", error);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    setIsMaximized(true);
    setIsMinimized(false);
  };

  const handleRestore = () => {
    setIsMaximized(false);
    setIsMinimized(false);
  };

  if (!currentNodeDetails) return null;

  const relatedNodes = getRelatedNodes(currentNodeDetails.id);

  const handleNewNodeSave = async (newNode) => {
    setIsNewNodeDialogOpen(false);
  };
  const handleUpdateNodeSave = async (updatedNode) => {
    setIsUpdateNodeDialogOpen(false);
    setCurrentNodeDetails(updatedNode);
  };


  const handleNewLinkSave = async (newLink) => {  
    await refreshNodeDetails();
    setIsNewLinkDialogOpen(false);
  };

  const handleDelete = async () => {
    setShowDeleteNodeConfirm(false); // Close confirmation dialog
    setLoading(true);
  
    try {
      await axios.delete(
        `https://unicorn-mindmap-bcatemfdc2f0encx.southindia-01.azurewebsites.net/api/Nodes/${currentNodeDetails.id}`
      ).then(async(response) => {

        await getData();
        toast.success("Node deleted successfully.");
        onClose(); // Close the details dialog after successful deletion
      });
    } catch (error) {
      toast.error("Failed to delete the node.");
      console.error("Failed to delete the node:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleDeleteLink = async () => {
    setShowDeleteLinkConfirm(false); // Close confirmation dialog
    if (!selectedLinkId) return;
  
    setDeletingLinkIds((prev) => ({ ...prev, [selectedLinkId]: true }));
  
    try {
      await axios.delete(
        `https://unicorn-mindmap-bcatemfdc2f0encx.southindia-01.azurewebsites.net/api/Nodes/links?sourceId=${currentNodeDetails.id}&targetId=${selectedLinkId}`
      );
  
      // Refresh node details to update links
      await refreshNodeDetails();
  
      toast.success("Link deleted successfully.");
      // Note: Not closing the dialog after link deletion
    } catch (error) {
      toast.error("Failed to delete the link.");
      console.error("Failed to delete the link:", error);
    } finally {
      setDeletingLinkIds((prev) => ({ ...prev, [selectedLinkId]: false }));
      setSelectedLinkId(null);
    }
  };

   // Render minimized view when isMinimized is true
   if (isMinimized) {
    return (
      <div 
        style={{
          position: "fixed",
          bottom: "0",
          left: "0",
          backgroundColor: "white",
          padding: "10px 15px",
          borderRadius: "0 8px 0 0",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "200px",
        }}
        onClick={handleRestore}
      >
        <span style={{ fontWeight: "500", fontSize: "14px", marginRight: "10px" }}>
          {currentNodeDetails.label}
        </span>
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRestore();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              padding: "2px 5px",
            }}
            title="Restore"
          >
            ↗
          </button>
        </div>
      </div>
    );
  }
  return (
    
    <div
    style={{
      position: "fixed",
      top: isMaximized ? "0" : "50%",
      left: "0",
      transform: isMaximized ? "none" : "translateY(-50%)",
      backgroundColor: "white",
      padding: "25px",
      borderRadius: isMaximized ? "0" : "0 8px 8px 0",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      width: isMaximized ? "70%" : "30%",
      height: isMaximized ? "90%" : "70%",
      maxWidth: isMaximized ? "none" : "400px",
      maxHeight: isMaximized ? "none" : "100vh",
      overflow: "auto",
      
    }}
    >
<div
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          display: "flex",
          zIndex: 1001,
        }}
      >
        
        <button
          onClick={handleMinimize}
          style={{
            background: "none",
            border: "none", 
            fontSize: "18px",
            cursor: "pointer",
            padding: "5px 8px",
            color: "#555",
          }}
          title="Minimize"
        >
          —
        </button>
        {isMaximized ? (
          <button
            onClick={handleRestore}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              padding: "5px 8px",
              color: "#555",
            }}
            title="Restore"
          >
            ⧉
          </button>
        ) : (
          <button
            onClick={handleMaximize}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              padding: "5px 8px",
              color: "#555",
            }}
            title="Maximize"
          >
            ⤢
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            padding: "0 8px",
            color: "#555",
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "15px",
        }}
      >
        <h3>{currentNodeDetails.label} <br /> <span style={{fontSize:"12px"}}>{currentNodeDetails.category}</span></h3>
        <button
          onClick={() => setIsNewNodeDialogOpen(true)}
          style={{
            padding: "8px", backgroundColor: "#e3f2fd", borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
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
            padding: "8px", backgroundColor: "#e3f2fd", borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}
          title="Edit Node"
        >
          <FaEdit />
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

      <div style={{  textAlign: "center" }}>
      <button
        onClick={() => setShowAttachmentManager(!showAttachmentManager)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#e3f2fd",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {showAttachmentManager ? "Hide Attachments" : "Attachments"}
      </button>

      {showAttachmentManager && <AttachmentManager nodeDetails={currentNodeDetails}/>}
    </div>
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
                    {/* {relatedNodes.parent.category && (
                      <div style={{ fontSize: "14px", color: "#64748b" }}>
                        {relatedNodes.parent.category}
                      </div>
                    )} */}
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

      
      {/* Related nodes section */}
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
  <LinkDetailsManager
    currentNodeDetails={currentNodeDetails} 
    refreshNodeDetails={refreshNodeDetails} 
    handleNodeClick={handleNodeClick}
    onClose={onClose}
    graphData={graphData}
  />
</div>

      <button
        onClick={() => setShowDeleteNodeConfirm(true)}
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

      {/* Delete link confirmation modal */}
      {showDeleteLinkConfirm && (
        <div style={{ position: "relative", bottom: "150px", left: "50px", right: "0px", zIndex: 10 }}>
          <DeleteConfirmation
            openProp={true}
            onConfirm={handleDeleteLink}
            onCancel={() => setShowDeleteLinkConfirm(false)}
          />
        </div>
      )}

      {/* Delete node confirmation modal */}
      {showDeleteNodeConfirm && (
        <DeleteConfirmation
          openProp={true}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteNodeConfirm(false)}
        />
      )}

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