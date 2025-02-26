import React, { useState } from 'react';

const AddNodeDialog = ({ parentNode, onClose, onAddNode }) => {
  const [newNode, setNewNode] = useState({
    label: '',
    code: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewNode(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate input
    if (!newNode.label.trim()) {
      alert('Label is required');
      return;
    }
    onAddNode(newNode);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Add New Node</h2>
        {parentNode && (
          <p>
            Parent Node: <strong>{parentNode.label}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="label"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}
            >
              Label *
            </label>
            <input
              type="text"
              id="label"
              name="label"
              value={newNode.label}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="code"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}
            >
              Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={newNode.code}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="description"
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={newNode.description}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNodeDialog;