import { useEffect, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

const GraphVisualization = ({ data }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const nodes = [];
    const links = [];

    const traverseNodes = (node, parentId = null) => {
      nodes.push({ id: node.id, label: node.label });

      if (parentId) {
        links.push({ source: parentId, target: node.id });
        links.push({ source: node.id, target: parentId }); // Add reverse link for undirected graph
      }

      if (node.children) {
        node.children.forEach((child) => traverseNodes(child, node.id));
      }

      if (node.links) {
        node.links.forEach((link) => {
          links.push({ source: node.id, target: link.id });
          links.push({ source: link.id, target: node.id }); // Add reverse link for undirected graph
        });
      }
    };

    traverseNodes(data);
    setGraphData({ nodes, links });
  }, [data]);

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeLabel="label"
      nodeAutoColorBy="id"
      linkColor={() => "black"}
      linkDirectionalArrowLength={3}
      linkDirectionalArrowRelPos={1}
      backgroundColor="#e6f2fc"
      nodeThreeObject={(node) => {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(createTextLabel(node.label)),
            depthTest: false,
          })
        );
        sprite.scale.set(20, 10, 1);
        sprite.position.set(0, 6, 0);
        return sprite;
      }}
    />
  );
};

const createTextLabel = (text) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 128;
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";
  context.font = "30px Arial"; // Increase the font size here
  context.fillText(text, 20, 50);

  // Add border
  context.strokeStyle = "black"; // Border color
  context.lineWidth = 2; // Border width
  context.strokeRect(0, 0, canvas.width, canvas.height);

  return canvas;
};

const sampleData = {
  id: "node-0",
  label: "UnicornBOX",
  children: [
    { id: "node-1", label: "Collection", children: [], links: [] },
    { id: "node-2", label: "Communication(COM)", children: [], links: [] },
    {
      id: "node-3",
      label: "Economy",
      children: [
        {
          id: "node-3_1",
          label: "Remiting",
          children: [
            {
              id: "node-3_1_1",
              label: "Remit file",
              children: [],
              links: [
                {
                  id: "node-3_2",
                  content: "Link to Payment list for reference.",
                },
              ],
            },
          ],
          links: [],
        },
        {
          id: "node-3_2",
          label: "Payment list",
          children: [
            {
              id: "node-3_2_1",
              label: "Matched payments",
              children: [],
              links: [
                
              ],
            },
          ],
          links: [{
            id: "node-3_1_1",
            content: "Link to Remit file for processing.",
          }],
        },
      ],
      links: [],
    },
  ],
};

const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GraphVisualization data={sampleData} />
    </div>
  );
};

export default App;
