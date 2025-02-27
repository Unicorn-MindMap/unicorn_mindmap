import axios from 'axios';
import { useState } from 'react';
import {toast} from 'react-hot-toast';

const NewNodeDialog = ({ onClose, onSave, nodeDetails, graphData, getdata }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const handleSave = async () => {
    
    try {
      const newNode = {
        id: "", 
        label: label,
        code: code,
        description: description,
        children: [], // Empty array as per schema
        links: []
      };
  
      const response = await axios.post(
        `https://localhost:7029/api/Graph?parentId=${nodeDetails.id}`, // Make sure `nodeDetails.id` exists
        newNode
      );
      toast.success("Node saved successfully!");
      console.log(response.data);
  
      // Clear inputs
      setLabel('');
      setCode('');
      setDescription('');
      getdata();
      onSave(newNode);
      onClose();
      
    } catch (error) {
      console.error("Error saving node:", error);
      toast.error("Error saving node");
    }
  };
  
  
  


  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", border: "1px solid rgb(77, 78, 79)",
      zIndex: 1000, maxWidth: "400px", width: "90%", maxHeight: "100vh", overflow: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>New Node</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#7f8c8d" }}>×</button>
      </div>
      <div style={{ marginBottom: "20px", maxWidth: "96%" }}>
        <label>
          Label:
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
        </label>
      </div>
      <div style={{ marginBottom: "20px", maxWidth: "96%" }}>
        <label>
          Code:
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
        </label>
        </div>
      <div style={{ marginBottom: "20px", maxWidth: "96%" }}>
        <label>
          Description:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", padding: "8px", margin: "8px 0" }} />
        </label>
      </div>
      <button onClick={handleSave} style={{ padding: "10px 20px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save</button>
    </div>
  );
};

export default NewNodeDialog;