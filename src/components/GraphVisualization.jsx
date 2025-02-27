import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import NodeDetailsDialog from "./NodeDetailsDialog";

const GraphVisualization = ({ data, getdata }) => {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedNode, setFocusedNode] = useState(null);
  const [highlightDepth, setHighlightDepth] = useState(0);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [draggingEnabled, setDraggingEnabled] = useState(true);
  const [fixedNodes, setFixedNodes] = useState(new Set());

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

  const handleNodeClick = useCallback(
    (node) => {
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
      connected.nodes.forEach((n) => newHighlightNodes.add(n));
      connected.links.forEach((l) => newHighlightLinks.add(l));

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
    },
    [getConnectedNodesAndLinks, focusedNode]
  );

   //Handle node drag end to fix node position
   const handleNodeDragEnd = useCallback((node) => {
    // Fix node position after drag
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }, []);

  // Update highlights when depth changes
  useEffect(() => {
    if (focusedNode) {
      const newHighlightNodes = new Set();
      const newHighlightLinks = new Set();

      // Get connected nodes and links up to specified depth
      const connected = getConnectedNodesAndLinks(focusedNode.id);

      // Add all connected nodes and links to highlight sets
      connected.nodes.forEach((n) => newHighlightNodes.add(n));
      connected.links.forEach((l) => newHighlightLinks.add(l));

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    }
  }, [highlightDepth, focusedNode, getConnectedNodesAndLinks]);

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

  const nodeThreeObject = useCallback(
    (node) => {
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
      sprite.scale.set(20, 10, 1);
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

    // Create gradient background
    const gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
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

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text styling
    context.fillStyle = "black";
    context.font = "bold 25px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Rounded border with more pronounced corners
    const borderRadius = 20; // Increase the radius to make it more rounded
    context.lineWidth = isFocused ? 3 : isHighlighted ? 1.5 : 0.5;
    context.strokeStyle = isFocused ? "black" : isHighlighted ? "red" : "gray";
    context.lineJoin = "round";

    // Draw the rounded rectangle
    context.beginPath();
    context.moveTo(5 + borderRadius, 5);
    context.arcTo(
      canvas.width - 5,
      5,
      canvas.width - 5,
      canvas.height - 5,
      borderRadius
    ); // top-right corner
    context.arcTo(
      canvas.width - 5,
      canvas.height - 5,
      5,
      canvas.height - 5,
      borderRadius
    ); // bottom-right corner
    context.arcTo(5, canvas.height - 5, 5, 5, borderRadius); // bottom-left corner
    context.arcTo(5, 5, canvas.width - 5, 5, borderRadius); // top-left corner
    context.closePath();

    context.stroke();

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
              padding: "8px 2px",
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
      </div>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="id"
        linkColor={getLinkColor}
        linkWidth={(link) => (highlightLinks.has(link) ? 0.5 : 0.5)}
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
