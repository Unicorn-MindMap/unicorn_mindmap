import React, { useState } from 'react';
import NewNodeDialog from './NewNodeDialog';
import AddLinkDialog from './AddLinkDialog';
import axios from 'axios';
import { FaPlus, FaEdit } from "react-icons/fa";
import toast from 'react-hot-toast';

const NodeDetailsDialog = ({ nodeDetails, onClose, highlightDepth, setHighlightDepth, getRelatedNodes, graphData, handleNodeClick, getData }) => {
  const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNewLinkDialogOpen, setIsNewLinkDialogOpen] = useState(false);
  if (!nodeDetails) return null;
  

  const relatedNodes = getRelatedNodes(nodeDetails.id);

  const handleNewNodeSave = (newNode) => {
    
  };
  const handleNewLinkSave = (newLink) => {
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this node?");
    if (!confirmDelete) return;
    onClose();
    setLoading(true);
    setError("");

    try {
      await axios.delete(`https://localhost:7029/api/Graph/${nodeDetails.id}`);
      getData();
      toast.success("Node deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete the node.");
      setError("Failed to delete the node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: "50%", left: "12.5%", transform: "translate(-50%, -50%)",
      backgroundColor: "white", padding: "25px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      zIndex: 1000, maxWidth: "400px", width: "90%", maxHeight: "100vh", overflow: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>{nodeDetails.label}</h3>
        <button onClick={() => setIsNewNodeDialogOpen(true)} style={{ fontSize:"13px", backgroundColor: "#e3f2fd", border: "none", borderRadius: "4px", cursor: "pointer" }}><FaPlus /></button>
        <button onClick={() => setIsNewLinkDialogOpen(true)} style={{ fontSize:"13px", backgroundColor: "#e3f2fd", border: "none", borderRadius: "4px", cursor: "pointer" }}>AddLink</button>
        <button onClick={() => setIsNewNodeDialogOpen(true)} style={{ fontSize:"13px", backgroundColor: "#e3f2fd", border: "none", borderRadius: "4px", cursor: "pointer" }}><FaEdit /></button>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer" }}>×</button>
      </div>

      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px", border: "1px solid #e9ecef" }}>
        <p style={{ margin: 0, color: "#2c3e50", lineHeight: "1.6" }}>{nodeDetails.description}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            
            {nodeDetails.code && (
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>Code:</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{nodeDetails.code}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>Children:</td>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{nodeDetails.childrenCount || 0}</td>
            </tr>
            <tr>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>Links:</td>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{nodeDetails.linksCount || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "6px", border: "1px solid #bbdefb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="dialog-depth-control">Highlight Depth:</label>
          <input
            id="dialog-depth-control"
            type="range"
            min="0"
            max="5"
            value={highlightDepth}
            onChange={(e) => setHighlightDepth(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontWeight: "bold", minWidth: "25px", textAlign: "center" }}>{highlightDepth}</span>
        </div>
        
      </div>
      {/* Related nodes section */}
      {(() => {
            const relatedNodes = getRelatedNodes(nodeDetails.id);
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
                        <div
                          style={{ fontWeight: "bold", marginBottom: "4px" }}
                        >
                          {relatedNodes.parent.label}
                        </div>
                        {relatedNodes.parent.code && (
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {relatedNodes.parent.code}
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
                            <div
                              style={{ fontWeight: "500", marginBottom: "3px" }}
                            >
                              {child.label}
                            </div>
                            {child.code && (
                              <div
                                style={{ fontSize: "14px", color: "#64748b" }}
                              >
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
                            <div
                              style={{ fontWeight: "500", marginBottom: "3px" }}
                            >
                              {linkedNode.label}
                            </div>
                            {linkedNode.code && (
                              <div
                                style={{ fontSize: "14px", color: "#3b82f6" }}
                              >
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
          {nodeDetails.originalData &&
            nodeDetails.originalData.links &&
            nodeDetails.originalData.links.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    marginBottom: "12px",
                    color: "#34495e",
                  }}
                >
                  Links Content
                </h3>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    overflow: "hidden",
                    marginBottom: "10px"
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
                          Target ID
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
                      </tr>
                    </thead>
                    <tbody>
                      {nodeDetails.originalData.links.map((link, index) => (
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
                            {link.id}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            {link.content}
                          </td>
                        </tr>
                      ))}
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
          fontSize: "16px",}}
      >
        {loading ? "Deleting..." : "Delete Node"}
      </button>
      {isNewNodeDialogOpen && <NewNodeDialog getdata={getData} nodeDetails={nodeDetails} onClose={() => setIsNewNodeDialogOpen(false)} onSave={handleNewNodeSave} />}
        {isNewLinkDialogOpen && <AddLinkDialog getdata={getData} nodedetails={nodeDetails} onClose={() => setIsNewLinkDialogOpen(false)} onSave={handleNewLinkSave} />}
    </div>
  );
};

export default NodeDetailsDialog;