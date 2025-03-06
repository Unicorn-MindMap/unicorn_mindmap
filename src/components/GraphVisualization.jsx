import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import NodeDetailsDialog from "./NodeDetailsDialog";
import DownloadGraphButton from "./Download";
import ChatbotDialog from "./ChatbotDialog";


const GraphVisualization = ({ data, getdata }) => {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [displayData, setDisplayData] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedNode, setFocusedNode] = useState(null);
  const [highlightDepth, setHighlightDepth] = useState(0);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [nodeDetails, setNodeDetails] = useState(null);
  // const [draggingEnabled, setDraggingEnabled] = useState(true);
  // const [fixedNodes, setFixedNodes] = useState(new Set());

  useEffect(() => {
    const nodes = [];
    const links = [];

    const traverseNodes = (node, parentId = null) => {
      // Store full node data in the nodes array
      const nodeData = {
        id: node.id,
        label: node.label,
        code: node.code,
        category: node.category || "Uncategorized",
        color: node.color || "",
        description: node.description || "No description available",
        childrenCount: node.children ? node.children.length : 0,
        linksCount: node.links ? node.links.length : 0,
        // Store the full original node data for dialog display
        originalData: { ...node },
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
          links.push({
            source: node.id,
            target: link.id,
            type: "interrelated",
          });
        });
      }
    };

    traverseNodes(data);
    setGraphData({ nodes, links });
    // Initially show all nodes
    setDisplayData({ nodes, links });

    // Clear focused node when data changes (e.g., after node deletion)
    setFocusedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  }, [data]);

  // Generate suggestions based on user input
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filteredNodes = graphData.nodes.filter((node) => {
      const matchesLabel =
        node.label && node.label.toLowerCase().includes(searchTermLower);
      const matchesCode =
        node.code && node.code.toLowerCase().includes(searchTermLower);
      return matchesLabel || matchesCode;
    });

    // Limit to top 10 suggestions for better UX
    setSuggestions(filteredNodes.slice(0, 10));
    setShowSuggestions(true);
  }, [searchTerm, graphData.nodes]);

  const getConnectedNodesAndLinks = useCallback(
    (nodeId, depth = highlightDepth, visited = new Set(), currentDepth = 0) => {
      const connectedNodes = new Set();
      const connectedLinks = new Set();

      if (currentDepth > depth)
        return { nodes: connectedNodes, links: connectedLinks };

      // Add current node to visited
      visited.add(nodeId);

      // Find all links connected to this node
      graphData.links.forEach((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;

        if (sourceId === nodeId || targetId === nodeId) {
          // Add the link to connected links
          connectedLinks.add(link);

          // Add the connected node
          const connectedNodeId = sourceId === nodeId ? targetId : sourceId;
          const connectedNode = graphData.nodes.find(
            (n) => n.id === connectedNodeId
          );

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
              nextLevel.nodes.forEach((n) => connectedNodes.add(n));
              nextLevel.links.forEach((l) => connectedLinks.add(l));
            }
          }
        }
      });

      return { nodes: connectedNodes, links: connectedLinks };
    },
    [graphData, highlightDepth]
  );

  // Update display data based on focused node and highlight depth
  useEffect(() => {
    if (focusedNode) {
      // Check if the focused node still exists in the graph data
      const focusedNodeObj = graphData.nodes.find(
        (n) => n.id === focusedNode.id
      );

      if (!focusedNodeObj) {
        // If the node doesn't exist anymore, reset the focus
        setFocusedNode(null);
        setDisplayData(graphData);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        return;
      }

      // Get connected nodes and links up to specified depth
      const connected = getConnectedNodesAndLinks(focusedNode.id);

      // Create a new set with the focused node and connected nodes
      const nodesToShow = new Set([focusedNodeObj]);
      connected.nodes.forEach((node) => nodesToShow.add(node));

      // Filter links to only include those between visible nodes
      const linksToShow = Array.from(connected.links);

      // Create the filtered display data
      setDisplayData({
        nodes: [focusedNodeObj, ...Array.from(connected.nodes)],
        links: linksToShow,
      });

      // Update highlight sets for styling
      setHighlightNodes(new Set(connected.nodes));
      setHighlightLinks(new Set(connected.links));
    } else {
      // If no node is focused, show all nodes
      setDisplayData(graphData);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [focusedNode, highlightDepth, getConnectedNodesAndLinks, graphData]);

  const handleNodeClick = useCallback(
    (node) => {
      // Check if the node is valid before proceeding
      if (!node) return;

      // If the node is already focused, show the details dialog
      if (focusedNode && node.id === focusedNode.id) {
        setNodeDetails(node);
        setShowNodeDetails(true);
        return;
      }

      setFocusedNode(node);

      // Focus on clicked node
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        3000
      );
    },
    [focusedNode]
  );

  // Handle node drag end to fix node position
  const handleNodeDragEnd = useCallback((node) => {
    // Fix node position after drag
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    }
  }, []);

  // Handle selecting a suggestion
  const handleSelectSuggestion = (node) => {
    setSearchTerm("");
    setShowSuggestions(false);
    handleNodeClick(node);
  };

  // Handle manual search
  const handleSearch = () => {
    if (searchTerm.trim() !== "") {
      // First try to find an exact match
      const exactMatch = graphData.nodes.find(
        (n) =>
          n.label.toLowerCase() === searchTerm.toLowerCase() ||
          (n.code && n.code.toLowerCase() === searchTerm.toLowerCase())
      );

      if (exactMatch) {
        handleNodeClick(exactMatch);
        return;
      }

      // If no exact match, find the first partial match
      const partialMatch = graphData.nodes.find(
        (n) =>
          n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.code && n.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (partialMatch) {
        handleNodeClick(partialMatch);
      }
    }

    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  const handleClickOutside = () => {
    setShowSuggestions(false);
  };

  //node
  const nodeThreeObject = useCallback(
    (node) => {
      if (!node) return null;

      const isHighlighted = highlightNodes.has(node);
      const isFocused = focusedNode && node.id === focusedNode.id;

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(
            createTextLabel(node.label, isHighlighted, isFocused)
          ),
          depthTest: false,
        })
      );
      //size of the node
      sprite.scale.set(40, 20, 1);
      sprite.position.set(0, 6, 0);
      return sprite;
    },
    [highlightNodes, focusedNode]
  );

  const createTextLabel = (text, isHighlighted, isFocused) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;
    
    
    // Measure text to determine actual space needed
    context.font = "bold 25px Arial";
    const metrics = context.measureText(text);
    const textWidth = metrics.width;

    // Calculate padding and box dimensions
    const padding = 15;
    const boxWidth = Math.min(textWidth + padding * 2, canvas.width - 10);
    const boxHeight = 50; // Fixed height for the box

    // Position the box in the center of the canvas
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;

    // Create gradient background based on node state
    const gradient = context.createLinearGradient(
      boxX,
      boxY,
      boxX + boxWidth,
      boxY + boxHeight
    );
    if (isFocused) {
      gradient.addColorStop(0, "#a8ff78");
      gradient.addColorStop(1, "#78ffd6");
    } else if (isHighlighted) {
      gradient.addColorStop(0, "#ffefba");
      gradient.addColorStop(1, "#ffffff");
    } else {
      gradient.addColorStop(0, "#f8f8f8");
      gradient.addColorStop(1, "#e0e0e0");
    }

    const borderRadius = 10; // Add rounded corners

    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(boxX + borderRadius, boxY);
    context.lineTo(boxX + boxWidth - borderRadius, boxY);
    context.arcTo(
      boxX + boxWidth,
      boxY,
      boxX + boxWidth,
      boxY + borderRadius,
      borderRadius
    );
    context.lineTo(boxX + boxWidth, boxY + boxHeight - borderRadius);
    context.arcTo(
      boxX + boxWidth,
      boxY + boxHeight,
      boxX + boxWidth - borderRadius,
      boxY + boxHeight,
      borderRadius
    );
    context.lineTo(boxX + borderRadius, boxY + boxHeight);
    context.arcTo(
      boxX,
      boxY + boxHeight,
      boxX,
      boxY + boxHeight - borderRadius,
      borderRadius
    );
    context.lineTo(boxX, boxY + borderRadius);
    context.arcTo(boxX, boxY, boxX + borderRadius, boxY, borderRadius);
    context.closePath();
    context.fill();

    // Draw border with proper styling
    context.lineWidth = isFocused ? 3 : isHighlighted ? 2 : 1;
    context.strokeStyle = isFocused
      ? "#005500"
      : isHighlighted
      ? "#0066cc"
      : "#aaaaaa";
    context.stroke();

    // Adjust font size if text is too wide
    let fontSize = 25;
    if (textWidth > boxWidth - padding * 2) {
      fontSize = Math.floor(fontSize * ((boxWidth - padding * 2) / textWidth));
      context.font = `bold ${fontSize}px Arial`;
    }

    // Draw text with shadow
    context.fillStyle = isFocused
      ? "#003300"
      : isHighlighted
      ? "#000066"
      : "#333333";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
  };

  // Function to determine node color
  const getNodeColor = (node) => {
    if (!node) return "gray";

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
    if (!link) return "white";

    if (!highlightLinks.has(link)) {
      return link.type === "parent-child" ? "black" : "blue";
    }

    // Highlighted links
    return "blue";
  };

  // Function to close the node details dialog
  const closeNodeDetails = () => {
    setShowNodeDetails(false);
    setNodeDetails(null);
  };

  // Function to reset view to show all nodes
  const resetView = () => {
    setFocusedNode(null);
    setDisplayData(graphData);
    fgRef.current.zoomToFit(1000);
  };

  // Function to get all related nodes (parent, children, linked)
  const getRelatedNodes = (nodeId) => {
    const relatedNodes = {
      parent: null,
      children: [],
      linkedNodes: [],
    };

    // Find parent node
    const parentLink = graphData.links.find(
      (link) =>
        (typeof link.target === "object" ? link.target.id : link.target) ===
          nodeId && link.type === "parent-child"
    );

    if (parentLink) {
      const parentId =
        typeof parentLink.source === "object"
          ? parentLink.source.id
          : parentLink.source;
      relatedNodes.parent = graphData.nodes.find((n) => n.id === parentId);
    }

    // Find children nodes
    graphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      if (sourceId === nodeId && link.type === "parent-child") {
        const childNode = graphData.nodes.find((n) => n.id === targetId);
        if (childNode) {
          relatedNodes.children.push(childNode);
        }
      }
    });

    // Find linked nodes
    graphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      if (
        (sourceId === nodeId || targetId === nodeId) &&
        link.type === "interrelated"
      ) {
        const linkedNodeId = sourceId === nodeId ? targetId : sourceId;
        const linkedNode = graphData.nodes.find((n) => n.id === linkedNodeId);
        if (linkedNode) {
          relatedNodes.linkedNodes.push(linkedNode);
        }
      }
    });

    return relatedNodes;
  };

  // Highlight matching text in suggestions
  const highlightMatchingText = (text, query) => {
    if (!text) return "";

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span style={{ backgroundColor: "#ffeb3b", fontWeight: "bold" }}>
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={handleClickOutside}
    >
      <div
        style={{
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {/* Search with autocomplete container */}
        <div style={{ position: "relative", minWidth: "250px" }}>
          <input
            type="text"
            placeholder="Search by label or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              if (searchTerm.trim() !== "" && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            style={{
              padding: "12px 2px",
              backgroundColor: "#f0f0f0",
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                maxHeight: "300px",
                overflowY: "auto",
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderTop: "none",
                borderRadius: "0 0 4px 4px",
                zIndex: 1000,
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {suggestions.map((node) => (
                <div
                  key={node.id}
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                  }}
                  onClick={() => handleSelectSuggestion(node)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ fontWeight: "500" }}>
                    {highlightMatchingText(node.label, searchTerm)}
                  </div>
                  {node.code && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Code: {highlightMatchingText(node.code, searchTerm)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          style={{
            padding: "5px 10px",
            backgroundColor: "#f0f0f0",
          }}
        >
          Search
        </button>

        <div
          style={{
            marginLeft: "10px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            border: "1px solid #ccc",
            padding: "5px",
            borderRadius: "4px",
          }}
        >
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

        {focusedNode && (
          <button
            onClick={resetView}
            style={{
              padding: "5px 10px",
              backgroundColor: "#f0f0f0",
            }}
          >
            Show All Nodes
          </button>
        )}

        <div>
          <DownloadGraphButton />
        </div>
        <div>
          <ChatbotDialog />
        </div>
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={displayData} // Use the filtered display data instead of full graph data
        nodeLabel="label"
        nodeAutoColorBy="id"
        linkColor={getLinkColor}
        linkWidth={(link) => (highlightLinks.has(link) ? 0.2 : 0.2)}
        linkDirectionalArrowLength={0}
        linkDirectionalArrowColor={(link) =>
          highlightLinks.has(link) ? "red" : "black"
        }
        backgroundColor="#e6f2fc"
        onNodeClick={handleNodeClick}
        nodeThreeObject={nodeThreeObject}
        nodeColor={getNodeColor}
        onNodeDragEnd={handleNodeDragEnd}
      />

      {/* Node Details Dialog */}
      
      <NodeDetailsDialog
        getData={getdata}
        nodeDetails={nodeDetails}
        onClose={closeNodeDetails}
        highlightDepth={highlightDepth}
        setHighlightDepth={setHighlightDepth}
        getRelatedNodes={getRelatedNodes}
        graphData={graphData}
        handleNodeClick={handleNodeClick}
      />
      
    </div>
  );
};

export default GraphVisualization;
