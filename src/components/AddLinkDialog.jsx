import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const AddLinkDialog = ({ getdata, nodedetails, onClose, onSave }) => {
    const [targetId, setTargetId] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [allNodes, setAllNodes] = useState([]);

    // Helper function to extract nodes from the tree
    const extractNodes = (node) => {
        let nodes = [{ id: node.id, label: node.label }];
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child) => {
                nodes = nodes.concat(extractNodes(child));
            });
        }
        return nodes;
    };

    // Fetch nodes from backend
    useEffect(() => {
        const fetchNodes = async () => {
            try {
                const response = await axios.get("https://unicorn-mindmap-bcatemfdc2f0encx.southeastasia-01.azurewebsites.net/api/Nodes");

                // Ensure the response contains an array of nodes
                const nodeData = response.data;

                if (Array.isArray(nodeData)) {
                    setAllNodes(nodeData); // API returned an array
                } else if (nodeData.rootNode) {
                    // Assuming the API response is structured as { rootNode: {...} }
                    const extractedNodes = extractNodes(nodeData.rootNode);
                    setAllNodes(extractedNodes);
                } else {
                    setAllNodes([]); // Fallback if response is unexpected
                }
            } catch (error) {
                console.error("Error fetching nodes:", error);
                toast.error("Failed to load nodes");
            }
        };

        fetchNodes();
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setTargetId(value);
        if (value.trim() === "") {
            setSuggestions([]);
        } else {
            setSuggestions(
                allNodes.filter((node) =>
                    node.label.toLowerCase().includes(value.toLowerCase())
                )
            );
        }
    };

    const handleSelectSuggestion = (label) => {
        setTargetId(label);
        setSuggestions([]);
    };

    const handleSave = async () => {
        if (!targetId.trim() || !description.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }

        try {
            setLoading(true);
            const newLink = {
                sourceNodeId: nodedetails.id,
                targetNodeLabel: targetId,
                content: description,
            };
            await axios.post("https://unicorn-mindmap-bcatemfdc2f0encx.southeastasia-01.azurewebsites.net/api/Nodes/links", newLink);
            toast.success("Link added successfully!");
            setTargetId("");
            setDescription("");
            await getdata();
            onSave(newLink);
            onClose();
        } catch (error) {
            console.error("Error saving link:", error);
            toast.error(error.response?.data?.message || "Error saving link");
        } finally {
            setLoading(false);
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3>New Link</h3>
                <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#7f8c8d" }}>
                    ×
                </button>
            </div>
            <div style={{ marginBottom: "20px", maxWidth: "96%" }}>
                <label>
                    Target Node:
                    <input
                        type="text"
                        value={targetId}
                        onChange={handleInputChange}
                        style={{
                            width: "100%",
                            padding: "8px",
                            margin: "8px 0",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                    {suggestions.length > 0 && (
                        <ul style={{ border: "1px solid #ccc", borderRadius: "4px", listStyle: "none", padding: "0", margin: "5px 0", maxHeight: "150px", overflowY: "auto" }}>
                            {suggestions.map((node) => (
                                <li
                                    key={node.id}
                                    onClick={() => handleSelectSuggestion(node.label)}
                                    style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                                >
                                    {node.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </label>
            </div>
            <div style={{ marginBottom: "20px", maxWidth: "96%" }}>
                <label>
                    Description:
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            margin: "8px 0",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "1px solid #7f8c8d",
                        padding: "8px 16px",
                        marginRight: "8px",
                        cursor: "pointer",
                        borderRadius: "4px",
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        background: loading ? "#95afc0" : "#3498db",
                        border: "none",
                        padding: "8px 16px",
                        color: "white",
                        cursor: loading ? "not-allowed" : "pointer",
                        borderRadius: "4px",
                    }}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
};

export default AddLinkDialog;
