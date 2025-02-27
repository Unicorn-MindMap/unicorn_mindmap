import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const AddLinkDialog = ({ getdata, nodedetails, onClose, onSave }) => {
    const [targetId, setTargetId] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

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
            const response = await axios.post(
                "https://localhost:7029/api/Graph/links",
                newLink
            );

            toast.success("Link added successfully!");
            console.log(response.data);

            // Clear inputs
            setTargetId("");
            setDescription("");

            getdata();
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
        <div>
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
                        marginBottom: "20px",
                    }}
                >
                    <h3>New Link</h3>
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
                <div style={{ marginBottom: "20px", maxWidth: "96%" }}>
                    <label>
                        Target Node:
                        <input
                            type="text"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
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
        </div>
    );
};

export default AddLinkDialog;