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
    {
      id: "node-1",
      label: "Collection",
      code: "UB_COL",
      children: [
        {
          id: "node-1_1",
          label: "Account Summary",
          code: "UB_COL_AS",
          children: [],
          links: [
            { id: "node-2_1_1", content: "Payment transactions link" },
            { id: "node-1_2", content: "Cancellation transactions link" },
            { id: "node-1_3", content: "Cost transactions link" },
            { id: "node-3_5", content: "Client invoicing link" },
            { id: "node-3_10", content: "Transaction profile link" }
          ]
        },
        {
          id: "node-1_2",
          label: "Cancellation transactions",
          code: "UB_COL_CAT",
          children: [],
          links: [
            { id: "node-3_1_3", content: "Cancellation items link" },
            { id: "node-1_2", content: "Self-reference link" }
          ]
        },
        {
          id: "node-1_3",
          label: "Cost transactions",
          code: "UB_COL_COT",
          children: [],
          links: [
            { id: "node-3_1_2", content: "Cost items link" },
            { id: "node-3_1_2_1", content: "Collection fee link" }
          ]
        },
        {
          id: "node-1_4",
          label: "Claim Dashboard",
          code: "UB_COL_CD",
          children: [
            { id: "node-1_4_1", label: "Subcase", code: "UB_COL_CD_001", children: [], links: [] },
            { id: "node-1_4_2", label: "Case", code: "UB_COL_CD_002", children: [], links: [] },
            { id: "node-1_4_3", label: "AR", code: "UB_COL_CD_003", children: [], links: [] },
            { id: "node-1_4_4", label: "Creditor", code: "UB_COL_CD_004", children: [], links: [] },
            { id: "node-1_4_5", label: "Creditor Group", code: "UB_COL_CD_005", children: [], links: [] },
            { id: "node-1_4_6", label: "Payment Tab", code: "UB_COL_CD_006", children: [], links: [] },
            { id: "node-1_4_7", label: "Bureau Tab", code: "UB_COL_CD_007", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-1_5",
          label: "Interest rate",
          code: "UB_COL_IR",
          children: [
            { id: "node-1_5_1", label: "Standard rate", code: "UB_COL_IR_001", children: [], links: [] },
            { id: "node-1_5_2", label: "Fixed interest", code: "UB_COL_IR_002", children: [], links: [] },
            { id: "node-1_5_3", label: "No interest rate", code: "UB_COL_IR_003", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-1_6",
          label: "Fixed rate",
          code: "UB_COL_INT_001",
          children: [
            { id: "node-1_6_1", label: "Add fixed rate from IO", code: "UB_COL_INT_001_01", children: [], links: [] },
            { id: "node-1_6_2", label: "Fixed rate BMD value", code: "UB_COL_INT_001_02", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-1_7",
          label: "No interest rate",
          code: "UB_COL_INT_002",
          children: [],
          links: []
        },
        {
          id: "node-1_8",
          label: "Claim interest",
          code: "UB_COL_CI",
          children: [
            { id: "node-1_8_1", label: "Running interest", code: "UB_COL_CI_001", children: [], links: [] },
            { id: "node-1_8_2", label: "Transaction interest", code: "UB_COL_CI_002", children: [], links: [] },
            { 
              id: "node-1_8_3", 
              label: "Obsolete interest", 
              code: "UB_COL_CI_003", 
              children: [
                { id: "node-1_8_3_1", label: "Automatic obsolete interest ON", code: "UB_COL_CI_003_01", children: [], links: [] }
              ], 
              links: [] 
            }
          ],
          links: []
        },
        {
          id: "node-1_9",
          label: "Transaction",
          code: "UB_COL_TRANS",
          children: [
            { id: "node-1_9_1", label: "Add transaction", code: "UB_COL_TRANS_001", children: [], links: [] },
            { id: "node-1_9_2", label: "Edit transaction", code: "UB_COL_TRANS_002", children: [], links: [] }
          ],
          links: []
        },
        { id: "node-1_10", label: "Obosolete date", code: "UB_COL_OD", children: [], links: [] },
        { id: "node-1_11", label: "Enforcements", code: "UB_COL_EN", children: [], links: [] },
        { id: "node-1_12", label: "Sentences", code: "UB_COL_SEN", children: [], links: [] },
        { id: "node-1_13", label: "Agreements", code: "UB_COL_AGR", children: [], links: [] },
        { id: "node-1_14", label: "Occurrences", code: "UB_COL_OCC", children: [], links: [] },
        { id: "node-1_15", label: "Part payments", code: "UB_COL_PP", children: [], links: [] },
        {
          id: "node-2_1_1",
          label: "Payment transactions",
          code: "UB_COL_PT",
          children: [],
          links: [
            { id: "node-3_1_1", content: "Payment items link" },
            { id: "node-3_3", content: "Payment apportionment link" },
            { id: "node-3_2", content: "Payment registration link" },
            { id: "node-3_4", content: "Case mapping link" }
          ]
        }
      ],
      links: []
    },
    {
      id: "node-2",
      label: "Admin",
      code: "UB_ADM",
      children: [
        {
          id: "node-2_1",
          label: "Workflow",
          code: "UB_ADM_W",
          children: [
            { 
              id: "node-2_1_1", 
              label: "Workflow events", 
              code: "UB_ADM_W_001", 
              children: [], 
              links: [
                { id: "node-2_1_1", content: "Payment transactions link" }
              ] 
            },
            { id: "node-2_1_2", label: "Workflow state", code: "UB_ADM_W_002", children: [], links: [] }
          ],
          links: []
        }
      ],
      links: [
        { id: "node-3_1_2_1", content: "Collection fee link" }
      ]
    },
    {
      id: "node-3",
      label: "Economy",
      code: "UB_ECO",
      children: [
        {
          id: "node-3_1",
          label: "Item types",
          code: "UB_ECO_IT",
          children: [
            { id: "node-3_1_1", label: "Payment items", code: "UB_ECO_IT_001", children: [], links: [] },
            { 
              id: "node-3_1_2", 
              label: "Cost items", 
              code: "UB_ECO_IT_002", 
              children: [
                { id: "node-3_1_2_1", label: "Collection fee", code: "UB_ECO_IT_002_01", children: [], links: [] }
              ], 
              links: [] 
            },
            { id: "node-3_1_3", label: "Cancellation items", code: "UB_ECO_IT_003", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-3_2",
          label: "Payment registration",
          code: "UB_ECO_PR",
          children: [
            { id: "node-3_2_1", label: "Manual payment registration", code: "UB_ECO_PR_001", children: [], links: [] },
            { id: "node-3_2_2", label: "Manual OCR import", code: "UB_ECO_PR_002", children: [], links: [] },
            { id: "node-3_2_3", label: "Payment integrations", code: "UB_ECO_PR_003", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-3_3",
          label: "Payment apportionment",
          code: "UB_ECO_PA",
          children: [
            { id: "node-3_3_1", label: "Payment apportionment edit", code: "UB_ECO_PA_001", children: [], links: [] },
            { id: "node-3_3_2", label: "Payment apportionment revert", code: "UB_ECO_PA_002", children: [], links: [] }
          ],
          links: [
            { id: "node-3_4", content: "Case mapping link" }
          ]
        },
        {
          id: "node-3_4",
          label: "Case mapping",
          code: "UB_ECO_CM",
          children: [],
          links: []
        },
        {
          id: "node-3_5",
          label: "Client invoicing",
          code: "UB_ECO_CI",
          children: [
            { id: "node-3_5_1", label: "Generate client invoice", code: "UB_ECO_CI_001", children: [], links: [] },
            { id: "node-3_5_2", label: "Credit invoice", code: "UB_ECO_CI_002", children: [], links: [] },
            { id: "node-3_5_3", label: "Invoice external export", code: "UB_ECO_CI_003", children: [], links: [] },
            { id: "node-3_5_4", label: "Invoice BOX single export", code: "UB_ECO_CI_004", children: [], links: [] },
            { id: "node-3_5_5", label: "Invoice BOX bulk export", code: "UB_ECO_CI_005", children: [], links: [] }
          ],
          links: [
            { id: "node-2_1_1", content: "Payment transactions link" },
            { id: "node-3_1_2", content: "Cost items link" },
            { id: "node-3_9", content: "Client order link" }
          ]
        },
        {
          id: "node-3_6",
          label: "Ledger",
          code: "UB_ECO_L",
          children: [
            { 
              id: "node-3_6_1", 
              label: "Ledger update with payment", 
              code: "UB_ECO_L_001", 
              children: [], 
              links: [
                { id: "node-2_1_1", content: "Payment transactions link" }
              ] 
            },
            { id: "node-3_6_2", label: "Ledger update with manual journal entry", code: "UB_ECO_L_002", children: [], links: [] },
            { id: "node-3_6_3", label: "Ledger update with remit", code: "UB_ECO_L_003", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-3_7",
          label: "Generate Remit",
          code: "UB_ECO_GR",
          children: [],
          links: []
        },
        {
          id: "node-3_8",
          label: "Client account",
          code: "UB_ECO_CA",
          children: [],
          links: [
            { id: "node-3_1_1", content: "Payment items link" },
            { id: "node-2_1_1", content: "Payment transactions link" }
          ]
        },
        {
          id: "node-3_9",
          label: "Client order",
          code: "UB_ECO_CO",
          children: [
            { 
              id: "node-3_9_1", 
              label: "Generate order", 
              code: "UB_ECO_CO_001", 
              children: [], 
              links: [
                { id: "node-3_9_3", content: "Client order delete link" }
              ] 
            },
            { 
              id: "node-3_9_2", 
              label: "Manual client order", 
              code: "UB_ECO_CO_002", 
              children: [], 
              links: [
                { id: "node-3_9_3", content: "Client order delete link" }
              ] 
            },
            { id: "node-3_9_3", label: "Client order delete", code: "UB_ECO_CO_003", children: [], links: [] }
          ],
          links: []
        },
        {
          id: "node-3_10",
          label: "Transaction profile",
          code: "UB_ECO_TP",
          children: [
            { id: "node-3_10_1", label: "Standard transaction profile", code: "UB_ECO_TP_001", children: [], links: [] },
            { id: "node-3_10_2", label: "Agreement transaction profile", code: "UB_ECO_TP_002", children: [], links: [] }
          ],
          links: [
            { id: "node-3_11", content: "Covering Sequence link" }
          ]
        },
        {
          id: "node-3_11",
          label: "Covering Sequence",
          code: "UB_ECO_CS",
          children: [],
          links: []
        },
        {
          id: "node-3_12",
          label: "Articles",
          code: "UB_ECO_A",
          children: [],
          links: []
        }
      ],
      links: []
    },
    {
      id: "node-4",
      label: "Reports",
      children: [],
      links: [
        { id: "node-3_6_3", content: "Ledger update with remit link" },
        { id: "node-1_9_1", content: "Add transaction link" },
        { id: "node-1_9_2", content: "Edit transaction link" },
        { id: "node-2_1_1", content: "Payment transactions link" },
        { id: "node-1_2", content: "Cancellation transactions link" }
      ]
    }
  ],
  links: []
};

const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GraphVisualization data={sampleData} />
    </div>
  );
};

export default App;
