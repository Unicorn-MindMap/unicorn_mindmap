import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";

const NewNodeDialog = ({ onClose, onSave, nodeDetails, getdata }) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");

  const handleSave = async () => {
    if (!label || !code || !description || !category) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const newNode = {
        id: "",
        label,
        code,
        description,
        category,
        color: "",
        attachments: [],
        children: [],
        links: [],
      };

      const response = await axios.post(
        `https://localhost:5261/api/Nodes?parentId=${nodeDetails.id}`,
        newNode
      );

      toast.success("Node saved successfully!");
      // Clear inputs
      setLabel("");
      setCode("");
      setDescription("");
      setCategory("");

      getdata();
      onSave(newNode);
      onClose();
    } catch (error) {
      console.error("Error saving node:", error);
      toast.error("Error saving node");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        border: "1px solid rgb(77, 78, 79)",
        zIndex: 1000,
        maxWidth: "400px",
        width: "90%",
        maxHeight: "100vh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h3>New Node</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#7f8c8d",
          }}
        >
          ×
        </button>
      </div>
      <div style={{ marginBottom: "10px", maxWidth: "96%" }}>
        <label>
          Label:
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              margin: "8px 0",
              
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px", maxWidth: "96%" }}>
        <label>
          Code:
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              margin: "8px 0",
              
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px", maxWidth: "96%" }}>
        <label>
          Category:
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              margin: "8px 0",
              
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px", maxWidth: "96%" }}>
        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              margin: "8px 0",
              
            }}
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        style={{
          padding: "10px 20px",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Save
      </button>
    </div>
  );
};

export default NewNodeDialog;
