import { useEffect, useState } from "react";

const DeleteConfirmation = ({ onConfirm, onCancel, openProp }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(openProp);
  }, [openProp]);

  const styles = {
    dialogContainer: {
      position: "relative",
      bottom: "70px",
      right: open ? "10px" : "-350px", // Slide from right
      transform: "translateY(-50%)",
      transition: "right 0.3s ease-in-out",
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      width: "300px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
    },
    dialogTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "15px",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "space-between",
    },
    cancelButton: {
      backgroundColor: "#e5e7eb",
      color: "#333",
      padding: "8px 12px",
      borderRadius: "6px",
      fontWeight: "bold",
      cursor: "pointer",
      border: "none",
    },
    confirmButton: {
      backgroundColor: "rgb(255, 100, 100)",
      color: "white",
      padding: "8px 12px",
      borderRadius: "6px",
      fontWeight: "bold",
      cursor: "pointer",
      border: "none",
    },
  };

  return (
    <div style={styles.dialogContainer}>
      <div style={styles.dialogTitle}>Are you sure you want to delete this?</div>
      <div style={styles.buttonContainer}>
        <button
          style={styles.cancelButton}
          onClick={() => {
            setOpen(false);
            onCancel && onCancel();
          }}
        >
          Cancel
        </button>
        <button
          style={styles.confirmButton}
          onClick={() => {
            setOpen(false);
            onConfirm();
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
