import axios from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

const GraphVisualization = ({ data }) => {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedNode, setFocusedNode] = useState(null);
  const [highlightDepth, setHighlightDepth] = useState(1);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [nodeDetails, setNodeDetails] = useState(null);

  useEffect(() => {
    const nodes = [];
    const links = [];

    const traverseNodes = (node, parentId = null) => {
      // Store full node data in the nodes array
      const nodeData = { 
        id: node.id, 
        label: node.label,
        code: node.code,
        description: node.description || "No description available",
        childrenCount: node.children ? node.children.length : 0,
        linksCount: node.links ? node.links.length : 0,
        // Store the full original node data for dialog display
        originalData: { ...node }
      };
      
      nodes.push(nodeData);

      if (parentId) {
        links.push({ source: parentId, target: node.id, type: "parent-child" });
      }

      if (node.children) {
        node.children.forEach((child) => traverseNodes(child, node.id));
      }

      if (node.links) {
        node.links.forEach((link) => {
          links.push({ source: node.id, target: link.id, type: "interrelated" });
        });
      }
    };

    traverseNodes(data);
    setGraphData({ nodes, links });
  }, [data]);

  const getConnectedNodesAndLinks = useCallback((nodeId, depth = highlightDepth, visited = new Set(), currentDepth = 0) => {
    const connectedNodes = new Set();
    const connectedLinks = new Set();
    
    if (currentDepth > depth) return { nodes: connectedNodes, links: connectedLinks };
    
    // Add current node to visited
    visited.add(nodeId);
    
    // Find all links connected to this node
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === nodeId || targetId === nodeId) {
        // Add the link to connected links
        connectedLinks.add(link);
        
        // Add the connected node
        const connectedNodeId = sourceId === nodeId ? targetId : sourceId;
        const connectedNode = graphData.nodes.find(n => n.id === connectedNodeId);
        
        if (connectedNode && !visited.has(connectedNodeId)) {
          connectedNodes.add(connectedNode);
          
          // Recursively get nodes and links for next level if we haven't reached max depth
          if (currentDepth < depth) {
            const nextLevel = getConnectedNodesAndLinks(
              connectedNodeId, 
              depth, 
              new Set([...visited]), 
              currentDepth + 1
            );
            
            // Merge the results
            nextLevel.nodes.forEach(n => connectedNodes.add(n));
            nextLevel.links.forEach(l => connectedLinks.add(l));
          }
        }
      }
    });
    
    return { nodes: connectedNodes, links: connectedLinks };
  }, [graphData, highlightDepth]);

  const handleNodeClick = useCallback((node) => {
    // If the node is already focused, show the details dialog
    if (focusedNode && node.id === focusedNode.id) {
      setNodeDetails(node);
      setShowNodeDetails(true);
      return;
    }
    
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    setFocusedNode(node);
    
    // Get connected nodes and links up to specified depth
    const connected = getConnectedNodesAndLinks(node.id);
    
    // Add all connected nodes and links to highlight sets
    connected.nodes.forEach(n => newHighlightNodes.add(n));
    connected.links.forEach(l => newHighlightLinks.add(l));

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);

    // Focus on clicked node
    const distance = 120;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      3000
    );
  }, [getConnectedNodesAndLinks, focusedNode]);

  // Update highlights when depth changes
  useEffect(() => {
    if (focusedNode) {
      const newHighlightNodes = new Set();
      const newHighlightLinks = new Set();
      
      // Get connected nodes and links up to specified depth
      const connected = getConnectedNodesAndLinks(focusedNode.id);
      
      // Add all connected nodes and links to highlight sets
      connected.nodes.forEach(n => newHighlightNodes.add(n));
      connected.links.forEach(l => newHighlightLinks.add(l));
  
      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    }
  }, [highlightDepth, focusedNode, getConnectedNodesAndLinks]);

  const handleSearch = () => {
    const node = graphData.nodes.find((n) => n.label.toLowerCase() === searchTerm.toLowerCase());
    if (node) {
      handleNodeClick(node);
    }
  };

  const nodeThreeObject = useCallback((node) => {
    const isHighlighted = highlightNodes.has(node);
    const isFocused = focusedNode && node.id === focusedNode.id;
    
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(createTextLabel(node.label, isHighlighted, isFocused)),
        depthTest: false,
      })
    );
    sprite.scale.set(20, 10, 1);
    sprite.position.set(0, 6, 0);
    return sprite;
  }, [highlightNodes, focusedNode]);

  const createTextLabel = (text, isHighlighted, isFocused) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;
    
    // Background color based on status
    context.fillStyle = isFocused ? "lightgreen" : isHighlighted ? "#ffeeee" : "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = "black";
    context.font = "30px Arial";
    context.fillText(text, 20, 50);

    // Add border with appropriate color
    context.strokeStyle = isFocused ? "black" : isHighlighted ? "red" : "gray";
    context.lineWidth = isFocused ? 4 : isHighlighted ? 3 : 2;
    context.strokeRect(0, 0, canvas.width, canvas.height);

    return canvas;
  };

  // Function to determine node color
  const getNodeColor = (node) => {
    // Focused node is black
    if (focusedNode && node.id === focusedNode.id) {
      return "black";
    }
    
    // Connected nodes are light red
    if (highlightNodes.has(node)) {
      return "rgb(255, 100, 100)";
    }
    
    // Default color for non-highlighted nodes
    return "gray";
  };

  // Function to determine link color based on highlight
  const getLinkColor = (link) => {
    if (!highlightLinks.has(link)) {
      return link.type === "parent-child" ? "blue" : "black";
    }
    
    // Highlighted links
    return "red";
  };

  // Function to close the node details dialog
  const closeNodeDetails = () => {
    setShowNodeDetails(false);
    setNodeDetails(null);
  };

  // Function to get all related nodes (parent, children, linked)
  const getRelatedNodes = (nodeId) => {
    const relatedNodes = {
      parent: null,
      children: [],
      linkedNodes: []
    };

    // Find parent node
    const parentLink = graphData.links.find(
      link => (typeof link.target === 'object' ? link.target.id : link.target) === nodeId 
             && link.type === "parent-child"
    );
    
    if (parentLink) {
      const parentId = typeof parentLink.source === 'object' ? parentLink.source.id : parentLink.source;
      relatedNodes.parent = graphData.nodes.find(n => n.id === parentId);
    }

    // Find children nodes
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === nodeId && link.type === "parent-child") {
        const childNode = graphData.nodes.find(n => n.id === targetId);
        if (childNode) {
          relatedNodes.children.push(childNode);
        }
      }
    });

    // Find linked nodes
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if ((sourceId === nodeId || targetId === nodeId) && link.type === "interrelated") {
        const linkedNodeId = sourceId === nodeId ? targetId : sourceId;
        const linkedNode = graphData.nodes.find(n => n.id === linkedNodeId);
        if (linkedNode) {
          relatedNodes.linkedNodes.push(linkedNode);
        }
      }
    });

    return relatedNodes;
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search node..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "5px" }}
        />
        <button onClick={handleSearch} style={{ padding: "5px 10px" }}>Search</button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <label htmlFor="depth-control">Highlight Depth:</label>
          <input
            id="depth-control"
            type="range"
            min="0"
            max="5"
            value={highlightDepth}
            onChange={(e) => setHighlightDepth(parseInt(e.target.value))}
            style={{ width: "100px" }}
          />
          <span>{highlightDepth}</span>
        </div>
      </div>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="id"
        linkColor={getLinkColor}
        linkWidth={(link) => (highlightLinks.has(link) ? 2 : 1)}
        linkDirectionalArrowLength={0}
        // linkDirectionalArrowLength={3}
        // linkDirectionalArrowRelPos={1.15}
        linkDirectionalArrowColor={(link) => (highlightLinks.has(link) ? "red" : "black")}
        backgroundColor="#e6f2fc"
        onNodeClick={handleNodeClick}
        nodeThreeObject={nodeThreeObject}
        nodeColor={getNodeColor}
      />
      
      {/* Node Details Dialog */}
      {showNodeDetails && nodeDetails && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          zIndex: 1000,
          maxWidth: "800px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#2c3e50" }}>{nodeDetails.label}</h2>
            <button 
              onClick={closeNodeDetails}
              style={{ 
                background: "none", 
                border: "none", 
                fontSize: "24px", 
                cursor: "pointer",
                color: "#7f8c8d"
              }}
            >
              ×
            </button>
          </div>
          
          {/* Description Section */}
          <div style={{ 
            marginBottom: "20px", 
            padding: "15px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "6px",
            border: "1px solid #e9ecef"
          }}>
            <h3 style={{ fontSize: "18px", marginTop: 0, marginBottom: "10px", color: "#34495e" }}>Description</h3>
            <p style={{ margin: 0, color: "#2c3e50", lineHeight: "1.6" }}>
              {nodeDetails.description}
            </p>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee", fontWeight: "bold", width: "30%" }}>ID:</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{nodeDetails.id}</td>
                </tr>
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
          
          {/* Dynamic Depth Control in Dialog */}
          <div style={{ 
            marginBottom: "20px", 
            padding: "15px", 
            backgroundColor: "#e3f2fd", 
            borderRadius: "6px",
            border: "1px solid #bbdefb"
          }}>
            <h3 style={{ fontSize: "18px", marginTop: 0, marginBottom: "10px", color: "#1976d2" }}>Relationship Depth</h3>
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
                    <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#34495e" }}>Parent</h3>
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
                        justifyContent: "space-between"
                      }}
                      onClick={() => {
                        closeNodeDetails();
                        const node = graphData.nodes.find(n => n.id === relatedNodes.parent.id);
                        if (node) handleNodeClick(node);
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#edf2f7"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                          {relatedNodes.parent.label}
                        </div>
                        {relatedNodes.parent.code && (
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {relatedNodes.parent.code}
                          </div>
                        )}
                      </div>
                      <div style={{ color: "#3b82f6", fontSize: "14px" }}>View &rarr;</div>
                    </div>
                  </div>
                )}
                
                {/* Children section */}
                {relatedNodes.children.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#34495e" }}>Children ({relatedNodes.children.length})</h3>
                    <div style={{ maxHeight: "200px", overflowY: "auto", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      {relatedNodes.children.map((child, index) => (
                        <div 
                          key={index}
                          style={{ 
                            padding: "12px", 
                            borderBottom: index < relatedNodes.children.length - 1 ? "1px solid #e2e8f0" : "none",
                            cursor: "pointer",
                            backgroundColor: "#f8fafc",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                          onClick={() => {
                            closeNodeDetails();
                            const node = graphData.nodes.find(n => n.id === child.id);
                            if (node) handleNodeClick(node);
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#edf2f7"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
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
                          <div style={{ color: "#3b82f6", fontSize: "14px" }}>View &rarr;</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Linked nodes section */}
                {relatedNodes.linkedNodes.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#34495e" }}>Linked Nodes ({relatedNodes.linkedNodes.length})</h3>
                    <div style={{ maxHeight: "200px", overflowY: "auto", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      {relatedNodes.linkedNodes.map((linkedNode, index) => (
                        <div 
                          key={index}
                          style={{ 
                            padding: "12px", 
                            borderBottom: index < relatedNodes.linkedNodes.length - 1 ? "1px solid #e2e8f0" : "none",
                            cursor: "pointer",
                            backgroundColor: "#f0f7ff",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                          onClick={() => {
                            closeNodeDetails();
                            const node = graphData.nodes.find(n => n.id === linkedNode.id);
                            if (node) handleNodeClick(node);
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e1effe"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f0f7ff"}
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
                          <div style={{ color: "#3b82f6", fontSize: "14px" }}>View &rarr;</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Original node data (links) */}
          {nodeDetails.originalData && nodeDetails.originalData.links && nodeDetails.originalData.links.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "#34495e" }}>Links Content</h3>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f1f5f9" }}>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #cbd5e0" }}>Target ID</th>
                      <th style={{ textAlign: "left", padding: "12px", borderBottom: "2px solid #cbd5e0" }}>Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodeDetails.originalData.links.map((link, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{link.id}</td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>{link.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// const sampleData = {
//   id: "root-node",
//   label: "UnicornBOX",
//   children: [
//     {
//       id: "economy-node",
//       label: "Economy",
//       code: "UB_ECO",
//       description: "Economy module which enables transactions for claims",
//       children: [
//         {
//           id: "item-types-node",
//           label: "Item types",
//           code: "UB_ECO_IT",
//           description: "Transaction types",
//           children: [
//             {
//               id: "payment-items-node",
//               label: "Payment items",
//               code: "UB_ECO_IT_001",
//               description: "Payment transaction types",
//               children: [],
//               links: []
//             },
//             {
//               id: "cost-items-node",
//               label: "Cost items",
//               code: "UB_ECO_IT_002",
//               description: "Cost transaction types",
//               children: [
//                 {
//                   id: "collection-fee-node",
//                   label: "Collection fee",
//                   code: "UB_ECO_IT_002_01",
//                   description: "Collection fee (Fee charged from debtor for collecting service)",
//                   children: [],
//                   links: []
//                 }
//               ],
//               links: []
//             },
//             {
//               id: "cancellation-items-node",
//               label: "Cancellation items",
//               code: "UB_ECO_IT_003",
//               description: "Cancellation transaction types",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "payment-registration-node",
//           label: "Payment registration",
//           code: "UB_ECO_PR",
//           description: "Recording a payment in the system",
//           children: [
//             {
//               id: "manual-payment-reg-node",
//               label: "Manual payment registration",
//               code: "UB_ECO_PR_001",
//               description: "Adding a payment record manually through frontend to the system",
//               children: [],
//               links: []
//             },
//             {
//               id: "manual-ocr-import-node",
//               label: "Manual OCR import",
//               code: "UB_ECO_PR_002",
//               description: "Importing an OCR from frontend manually",
//               children: [],
//               links: []
//             },
//             {
//               id: "payment-integrations-node",
//               label: "Payment integrations",
//               code: "UB_ECO_PR_003",
//               description: "Automatic payment import through integrations",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "payment-apportionment-node",
//           label: "Payment apportionment",
//           code: "UB_ECO_PA",
//           description: "Apportioning of a received payment as per the configured distribution",
//           children: [
//             {
//               id: "payment-apportionment-edit-node",
//               label: "Payment apportionment edit",
//               code: "UB_ECO_PA_001",
//               description: "Editing an apportionment of a received payment as user prefers",
//               children: [],
//               links: []
//             },
//             {
//               id: "payment-apportionment-revert-node",
//               label: "Payment apportionment revert",
//               code: "UB_ECO_PA_002",
//               description: "Revert the apportionment if something went wrong",
//               children: [],
//               links: []
//             }
//           ],
//           links: [
//             { id: "case-mapping-node", content: "Case mapping link" }
//           ]
//         },
//         {
//           id: "case-mapping-node",
//           label: "Case mapping",
//           code: "UB_ECO_CM",
//           description: "Mapping suitable claim/claims which has remaining balance to an exceeded payment",
//           children: [],
//           links: []
//         },
//         {
//           id: "ledger-node",
//           label: "Ledger",
//           code: "UB_ECO_L",
//           description: "The general ledger that contains transactions in debt collection.",
//           children: [
//             {
//               id: "ledger-update-payment-node",
//               label: "Ledger update with payment",
//               code: "UB_ECO_L_001",
//               description: "Ledger is updated as system recevies a payment for bureau accounts.",
//               children: [],
//               links: [
//                 { id: "payment-transactions-node", content: "Payment transactions link" }
//               ]
//             },
//             {
//               id: "ledger-update-manual-node",
//               label: "Ledger update with manual journal entry",
//               code: "UB_ECO_L_002",
//               description: "Additional entries can be added manually for each ledger.",
//               children: [],
//               links: []
//             },
//             {
//               id: "ledger-update-remit-node",
//               label: "Ledger update with remit",
//               code: "UB_ECO_L_003",
//               description: "Fianl ledger update after the remit.",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "client-invoicing-node",
//           label: "Client invoicing",
//           code: "UB_ECO_CI",
//           description: "Overall invoicing process creditors for their due payments for bureau services",
//           children: [
//             {
//               id: "generate-client-invoice-node",
//               label: "Generate client invoice",
//               code: "UB_ECO_CI_001",
//               description: "Create client invoice",
//               children: [],
//               links: []
//             },
//             {
//               id: "credit-invoice-node",
//               label: "Credit invoice",
//               code: "UB_ECO_CI_002",
//               description: "To reduce the amount owed on a previously issued client invoice",
//               children: [],
//               links: []
//             },
//             {
//               id: "invoice-external-export-node",
//               label: "Invoice external export",
//               code: "UB_ECO_CI_003",
//               description: "Export a generated creditor invoice to an external party",
//               children: [],
//               links: []
//             },
//             {
//               id: "invoice-box-single-export-node",
//               label: "Invoice BOX single export",
//               code: "UB_ECO_CI_004",
//               description: "Export a single generated creditor invoice to UnicornBOX (which will proceed as a subcase)",
//               children: [],
//               links: []
//             },
//             {
//               id: "invoice-box-bulk-export-node",
//               label: "Invoice BOX bulk export",
//               code: "UB_ECO_CI_005",
//               description: "Export generated creditor invoice as a bulk to UnicornBOX (which will proceed as a subcase)",
//               children: [],
//               links: []
//             }
//           ],
//           links: [
//             { id: "payment-transactions-node", content: "Payment transactions link" },
//             { id: "cost-items-node", content: "Cost items link" },
//             { id: "client-order-node", content: "Client order link" }
//           ]
//         },
//         {
//           id: "generate-remit-node",
//           label: "Generate Remit",
//           code: "UB_ECO_GR",
//           description: "Generate a remit",
//           children: [],
//           links: []
//         },
//         {
//           id: "client-account-node",
//           label: "Client account",
//           code: "UB_ECO_CA",
//           description: "Bank accounts used to receive payments coming for bureau",
//           children: [],
//           links: [
//             { id: "payment-items-node", content: "Payment items link" },
//             { id: "payment-transactions-node", content: "Payment transactions link" }
//           ]
//         },
//         {
//           id: "articles-node",
//           label: "Articles",
//           code: "UB_ECO_A",
//           description: "Sellable services",
//           children: [],
//           links: []
//         },
//         {
//           id: "client-order-node",
//           label: "Client order",
//           code: "UB_ECO_CO",
//           description: "Orders generated for creditors invoicing",
//           children: [
//             {
//               id: "generate-order-node",
//               label: "Generate order",
//               code: "UB_ECO_CO_001",
//               description: "Automatically generated orders upon a call to action based on transactions that has happened during the period (after the previous order generation) for creditor belonging claims and system defined configurations",
//               children: [],
//               links: [
//                 { id: "client-order-delete-node", content: "Client order delete link" }
//               ]
//             },
//             {
//               id: "manual-client-order-node",
//               label: "Manual client order",
//               code: "UB_ECO_CO_002",
//               description: "Orders created manually adding articles to charge creditors",
//               children: [],
//               links: [
//                 { id: "client-order-delete-node", content: "Client order delete link" }
//               ]
//             },
//             {
//               id: "client-order-delete-node",
//               label: "Client order delete",
//               code: "UB_ECO_CO_003",
//               description: "Deletion of creditor orders",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "transaction-profile-node",
//           label: "Transaction profile",
//           code: "UB_ECO_TP",
//           description: "",
//           children: [
//             {
//               id: "standard-tp-node",
//               label: "Standard transaction profile",
//               code: "UB_ECO_TP_001",
//               description: "",
//               children: [],
//               links: []
//             },
//             {
//               id: "agreement-tp-node",
//               label: "Agreement transaction profile",
//               code: "UB_ECO_TP_002",
//               description: "",
//               children: [],
//               links: []
//             }
//           ],
//           links: [
//             { id: "covering-sequence-node", content: "Covering Sequence link" }
//           ]
//         },
//         {
//           id: "covering-sequence-node",
//           label: "Covering Sequence",
//           code: "UB_ECO_CS",
//           description: "Contains set of profiles which defines the method of distributing received payments among the transactions within a claim",
//           children: [],
//           links: []
//         }
//       ],
//       links: []
//     },
//     {
//       id: "collection-node",
//       label: "Collection",
//       code: "UB_COL",
//       description: "Where a casehandler handles debt collection related processes",
//       children: [
//         {
//           id: "account-summary-node",
//           label: "Account Summary",
//           code: "UB_COL_AS",
//           description: "Showcases transactions happen upon a specific claim by grouping into set of categories.",
//           children: [],
//           links: [
//             { id: "payment-transactions-node", content: "Payment transactions link" },
//             { id: "cancellation-transactions-node", content: "Cancellation transactions link" },
//             { id: "cost-transactions-node", content: "Cost transactions link" },
//             { id: "client-invoicing-node", content: "Client invoicing link" },
//             { id: "transaction-profile-node", content: "Transaction profile link" }
//           ]
//         },
//         {
//           id: "payment-transactions-node",
//           label: "Payment transactions",
//           code: "UB_COL_PT",
//           description: "Payment transactions transpire",
//           children: [],
//           links: [
//             { id: "payment-items-node", content: "Payment items link" },
//             { id: "payment-apportionment-node", content: "Payment apportionment link" },
//             { id: "payment-registration-node", content: "Payment registration link" },
//             { id: "case-mapping-node", content: "Case mapping link" }
//           ]
//         },
//         {
//           id: "cancellation-transactions-node",
//           label: "Cancellation transactions",
//           code: "UB_COL_CAT",
//           description: "Cancellation transactions transpire",
//           children: [],
//           links: [
//             { id: "cancellation-items-node", content: "Cancellation items link" },
//             { id: "cancellation-transactions-node", content: "Self-reference link" }
//           ]
//         },
//         {
//           id: "cost-transactions-node",
//           label: "Cost transactions",
//           code: "UB_COL_COT",
//           description: "Cost transactions transpire",
//           children: [],
//           links: [
//             { id: "cost-items-node", content: "Cost items link" },
//             { id: "collection-fee-node", content: "Collection fee link" }
//           ]
//         },
//         {
//           id: "interest-rate-node",
//           label: "Interest rate",
//           code: "UB_COL_IR",
//           description: "One of the base element uses for",
//           children: [
//             {
//               id: "fixed-rate-node",
//               label: "Fixed rate",
//               code: "UB_COL_IR_001",
//               description: "Fixed interest rate applicable for interest calculation of a claim",
//               children: [
//                 {
//                   id: "add-fixed-rate-io-node",
//                   label: "Add fixed rate from IO",
//                   code: "UB_COL_IR_001_01",
//                   description: "Addition of an dyanamic interest rate from Subcase/case manually registering screen",
//                   children: [],
//                   links: []
//                 },
//                 {
//                   id: "fixed-rate-bmd-node",
//                   label: "Fixed rate BMD value",
//                   code: "UB_COL_IR_001_02",
//                   description: "Fixed interest rate that is configured in the BMD level and if the other BMD says that 'FixedInterestRate' is yes, then the BMD configured value will be considered for claim interest calculation",
//                   children: [],
//                   links: []
//                 }
//               ],
//               links: []
//             },
//             {
//               id: "no-interest-rate-node",
//               label: "No interest rate",
//               code: "UB_COL_IR_002",
//               description: "Zero interest rate applicable for interest calculation of a claim",
//               children: [],
//               links: []
//             },
//             {
//               id: "standard-rate-node",
//               label: "Standard rate",
//               code: "UB_COL_INT_003",
//               description: "One of the base element uses to calculate the claim interest.",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "claim-interest-node",
//           label: "Claim interest",
//           code: "UB_COL_CI",
//           description: "Interest is applicable for a claim when it passes it's due date. From one day after the claim's due date and up until the current date, interest is calculated.",
//           children: [
//             {
//               id: "running-interest-node",
//               label: "Running interest",
//               code: "UB_COL_CI_001",
//               description: "Daily accumulating interest of a claim",
//               children: [],
//               links: []
//             },
//             {
//               id: "transaction-interest-node",
//               label: "Transaction interest",
//               code: "UB_COL_CI_002",
//               description: "One time interest added through a transaction to a claim",
//               children: [],
//               links: []
//             },
//             {
//               id: "obsolete-interest-node",
//               label: "Obsolete interest",
//               code: "UB_COL_CI_003",
//               description: "Interest amount of the claims where the claim goes beyond the obsolete date.",
//               children: [
//                 {
//                   id: "auto-obsolete-on-node",
//                   label: "Automatic obsolete interest ON",
//                   code: "UB_COL_CI_003_01",
//                   description: "Enabling the obsolete interest option automatically for a claim if the claim is older than three years",
//                   children: [],
//                   links: []
//                 },
//                 {
//                   id: "manual-obsolete-on-node",
//                   label: "Manual obsolete interest ON",
//                   code: "UB_COL_CI_003_02",
//                   description: "Enabling the obsolete interest option manually for a claim if the claim is older than three years. If claim is less than three years, obsolete interest will not apply.",
//                   children: [],
//                   links: []
//                 }
//               ],
//               links: []
//             },
//             {
//               id: "manual-interest-calc-node",
//               label: "Manual interest calculator",
//               code: "UB_COL_CI_004",
//               description: "Uses to view prediction of interest for a future date.",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "transaction-node",
//           label: "Transaction",
//           code: "UB_COL_TRANS",
//           description: "Transactions (charging, payment or a cancellation transactions) that can be performed on a claim",
//           children: [
//             {
//               id: "add-transaction-node",
//               label: "Add transaction",
//               code: "UB_COL_TRANS_001",
//               description: "Adding a transaction (charging, payment or a cancellation transaction)",
//               children: [],
//               links: []
//             },
//             {
//               id: "edit-transaction-node",
//               label: "Edit transaction",
//               code: "UB_COL_TRANS_002",
//               description: "Editing a transaction (charging, payment or a cancellation transaction)",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "obsolete-date-node",
//           label: "Obosolete date",
//           code: "UB_COL_OD",
//           description: "The date when a claim will get expired. To expire, claim should pass three years from claim's voucher date.",
//           children: [],
//           links: []
//         },
//         {
//           id: "enforcements-node",
//           label: "Enforcements",
//           code: "UB_COL_EN",
//           description: "To record the legal process of recovering a debt by seizing and selling the debtor's assets if they don't pay by the deadline",
//           children: [],
//           links: []
//         },
//         {
//           id: "sentences-node",
//           label: "Sentences",
//           code: "UB_COL_SEN",
//           description: "To record verdicts given by the N court mandating the debtor to settle the dues on a particular due date",
//           children: [],
//           links: []
//         },
//         {
//           id: "agreements-node",
//           label: "Agreements",
//           code: "UB_COL_AGR",
//           description: "An agreement between casehandler and the debtor to settle the claim's payments on agreed date(s)",
//           children: [
//             {
//               id: "payment-agreements-node",
//               label: "Payment agreements",
//               code: "UB_COL_AGR_001",
//               description: "An agreement between casehandler and the debtor to settle the full debt payment of a claim on a defined date",
//               children: [],
//               links: []
//             },
//             {
//               id: "part-payments-node",
//               label: "Part payments",
//               code: "UB_COL_AGR_002",
//               description: "A type of an agreement between the casehandler and the debtor to pay the claim's debt payment in installments on predefined dates",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "occurrences-node",
//           label: "Occurrences",
//           code: "UB_COL_OCC",
//           description: "Special events that happen upon a claim",
//           children: [],
//           links: []
//         },
//         {
//           id: "claim-dashboard-node",
//           label: "Claim Dashboard",
//           code: "UB_COL_CD",
//           description: "Displays all the necessary widgets for the case handler at a glance to easily handle the claim functionalities",
//           children: [
//             {
//               id: "subcase-node",
//               label: "Subcase",
//               code: "UB_COL_CD_001",
//               description: "Claim that registered in the system to handle pre-collection stage functionalities",
//               children: [],
//               links: []
//             },
//             {
//               id: "case-node",
//               label: "Case",
//               code: "UB_COL_CD_002",
//               description: "Claim that registered in the system to handle collection stage functionalities",
//               children: [],
//               links: []
//             },
//             {
//               id: "ar-node",
//               label: "AR",
//               code: "UB_COL_CD_003",
//               description: "Connection between a particular debtor and a creditor",
//               children: [],
//               links: []
//             },
//             {
//               id: "creditor-node",
//               label: "Creditor",
//               code: "UB_COL_CD_004",
//               description: "Company that lends money or provides goods/services on credit and expects to be paid back",
//               children: [],
//               links: []
//             },
//             {
//               id: "creditor-group-node",
//               label: "Creditor Group",
//               code: "UB_COL_CD_005",
//               description: "Collection of creditors who often working together in legal or financial matters",
//               children: [],
//               links: []
//             },
//             {
//               id: "payment-tab-node",
//               label: "Payment Tab",
//               code: "UB_COL_CD_006",
//               description: "Showcases the payment distribution related information",
//               children: [],
//               links: []
//             },
//             {
//               id: "bureau-tab-node",
//               label: "Bureau Tab",
//               code: "UB_COL_CD_007",
//               description: "Bureau represents the debt collection agency who collects money onbehalf of creditors. Bureau tab in the system, showcases the bureau specific funtionalities",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         }
//       ],
//       links: []
//     },
//     {
//       id: "admin-node",
//       label: "Admin",
//       code: "UB_ADM",
//       description: "Admin module",
//       children: [
//         {
//           id: "workflow-node",
//           label: "Workflow",
//           code: "UB_ADM_W",
//           description: "Workflow module",
//           children: [
//             {
//               id: "workflow-event-node",
//               label: "Workflow event",
//               code: "UB_ADM_W_001",
//               description: "Event triggered in a claim of the UnicornBOX by a transaction, an operation or a feature",
//               children: [],
//               links: [
//                 { id: "payment-transactions-node", content: "Payment transactions link" }
//               ]
//             },
//             {
//               id: "workflow-state-node",
//               label: "Workflow state",
//               code: "UB_ADM_W_002",
//               description: "State of a claim",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         },
//         {
//           id: "activity-node",
//           label: "Activity",
//           code: "UB_ADM_ACT",
//           description: "Is an element used in the workflow for user to achieve the case handling needs",
//           children: [
//             {
//               id: "activity-type-node",
//               label: "Activity type",
//               code: "UB_ADM_ACT_001",
//               description: "Different types of activities that uses in the system for ease of handling",
//               children: [],
//               links: []
//             },
//             {
//               id: "sp-activities-node",
//               label: "SP activities",
//               code: "UB_ADM_ACT_002",
//               description: "Activities that are created purely based on stored procedures",
//               children: [],
//               links: []
//             },
//             {
//               id: "message-activities-node",
//               label: "Message activities",
//               code: "UB_ADM_ACT_003",
//               description: "Activities that are bind with USC templates",
//               children: [],
//               links: []
//             },
//             {
//               id: "api-activities-node",
//               label: "API activities",
//               code: "UB_ADM_ACT_004",
//               description: "",
//               children: [],
//               links: []
//             },
//             {
//               id: "activity-add-node",
//               label: "Activity add",
//               code: "UB_ADM_ACT_005",
//               description: "Creation of new activities",
//               children: [],
//               links: []
//             },
//             {
//               id: "activity-edit-node",
//               label: "Activity edit",
//               code: "UB_ADM_ACT_006",
//               description: "Update existing activities",
//               children: [],
//               links: []
//             },
//             {
//               id: "activity-delete-node",
//               label: "Activity Delete",
//               code: "UB_ADM_ACT_007",
//               description: "Remove unwanted activities",
//               children: [],
//               links: []
//             },
//             {
//               id: "activity-ordering-node",
//               label: "Activity ordering",
//               code: "UB_ADM_ACT_008",
//               description: "Odering of activities before the activity execution",
//               children: [
//                 {
//                   id: "manual-activity-exec-node",
//                   label: "Manual activity execution",
//                   code: "UB_ADM_ACT_008_01",
//                   description: "Execute activities manually by executing at the momemt or by executing later on",
//                   children: [],
//                   links: []
//                 },
//                 {
//                   id: "workflow-activity-exec-node",
//                   label: "Workflow activity execution",
//                   code: "UB_ADM_ACT_008_02",
//                   description: "Automatic activity execution by the workflow based on states and events",
//                   children: [],
//                   links: []
//                 }
//               ],
//               links: []
//             },
//             {
//               id: "activity-configs-node",
//               label: "Activity configurations",
//               code: "UB_ADM_ACT_009",
//               description: "Add new activities by setting related configurations",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         }
//       ],
//       links: [
//         { id: "collection-fee-node", content: "Collection fee link" }
//       ]
//     },
//     {
//       id: "reports-node",
//       label: "Reports",
//       code: "UB_REP",
//       description: "Contains with different kinds of reports which showcases the certain data required for decision-making. Currently, defined set of reports are available and customized reports are able to make by US upon user requests.",
//       children: [],
//       links: [
//         { id: "ledger-update-remit-node", content: "Ledger update with remit link" },
//         { id: "add-transaction-node", content: "Add transaction link" },
//         { id: "edit-transaction-node", content: "Edit transaction link" },
//         { id: "payment-transactions-node", content: "Payment transactions link" },
//         { id: "cancellation-transactions-node", content: "Cancellation transactions link" }
//       ]
//     },
//     {
//       id: "usc-node",
//       label: "USC",
//       code: "UB_USC",
//       description: "Communication module",
//       children: [
//         {
//           id: "template-node",
//           label: "Template",
//           code: "UB_USC_TEMP",
//           description: "Predefined format that uses as a guide for creating PDF, email, EHF and SMSs that is needed for the debt collection proccesses",
//           children: [
//             {
//               id: "template-rule-assignment-node",
//               label: "Template rule assignment",
//               code: "UB_USC_TEMP_001",
//               description: "Also known as 'section rules' which are use to communicate to the system under which condition, the rule applicable template should be utilized and processed",
//               children: [],
//               links: []
//             }
//           ],
//           links: []
//         }
//       ],
//       links: []
//     },
//     {
//       id: "activity-execution-node",
//       label: "Activity Execution",
//       code: "UB_COL_AE",
//       description: "Uses to execute the created / defined activities",
//       children: [
//         {
//           id: "single-activity-execution-node",
//           label: "Single activity execution",
//           code: "UB_COL_AE_001",
//           description: "Execution of an activity for a single claim",
//           children: [],
//           links: []
//         },
//         {
//           id: "bulk-activity-execution-node",
//           label: "Bulk activity execution",
//           code: "UB_COL_AE_002",
//           description: "Execution of an activity for multiple claims at once",
//           children: [],
//           links: []
//         }
//       ],
//       links: []
//     },
//     {
//       id: "activity-history-node",
//       label: "Activity History",
//       code: "UB_COL_AH",
//       description: "Displays all executed, pending and failed activities along with executed notes and events in a sequencial manner",
//       children: [],
//       links: []
//     }
//   ],
//   links: []
// };


const App = () => {
  const [dataReceved, setDataReceved ] = useState([]);
  const getData = async() => {
      axios.get('http://localhost:5261/api/Graph').then((response) => {
       console.log(response.data);
       setDataReceved(response.data['rootNode']);
       console.log('dataReceved', dataReceved);
      // return response.data;
    }).catch((error) => { console.log(error); }
    );
  }
  console.log('data    Receved', dataReceved['rootNode']);

useEffect(() => {
  getData()
}, [])

  return (
    <GraphVisualization data={dataReceved} />
  );
};
export default App;