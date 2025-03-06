import { useEffect, useState } from "react";

const DeleteConfirmation = ({ onConfirm, onCancel , openProp}) => {
  const [open, setOpen] = useState(false);

console.log(openProp);
useEffect(() => {
    setOpen(openProp);
    console.log("open : " , open);  
}, [openProp]);

  const styles = {
  
    dialogBackdrop: {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    dialogContent: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      width: "300px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
    <>
     
      {open && (
        <div style={styles.dialogBackdrop} onClick={() => { setOpen(false); onCancel && onCancel(); }}>
          <div style={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.dialogTitle}>Are you sure you want to delete this?</div>
            <div style={styles.buttonContainer}>
              <button
                style={styles.cancelButton}
                onClick={() => { setOpen(false); onCancel && onCancel(); }}
              >
                Cancel
              </button>
              <button
                style={styles.confirmButton}
                onClick={() => { setOpen(false); onConfirm(); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteConfirmation;
