import React, { useState } from 'react';
import axios from 'axios';

const ChatbotDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  // Function to convert basic markdown to HTML
  const markdownToHtml = (text) => {
    if (!text) return '';
    
    // Convert bold: *text* or **text** to <strong>text</strong>
    let html = text.replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, (match, p1, p2) => {
      const content = p1 || p2;
      return `<strong>${content}</strong>`;
    });
    
    // Convert italic: _text_ to <em>text</em>
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Convert inline code: `code` to <code>code</code>
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert bullet lists: * item to <li>item</li>
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    
    // Wrap adjacent <li> elements in <ul>
    html = html.replace(/(<li>.*?<\/li>)(?:\n|$)+/g, '<ul>$1</ul>');
    
    // Convert headings: # Heading to <h1>Heading</h1>
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    
    // Convert paragraphs with newlines
    html = html.replace(/\n\s*\n/g, '</p><p>');
    
    // Wrap in paragraph tags if not already a block element
    if (!html.match(/^<[uo]l|<p|<h[1-6]|<blockquote|<pre/)) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!message.trim()) return;
  
    // Add user message to chat history
    const userMessage = { role: 'user', content: message };
    setChatHistory([...chatHistory, userMessage]);
  
    setIsLoading(true);
  
    try {
      // Send the full chat history to the backend
      const response = await axios.post('https://mindmap3dinstance-bgg3brbwahgxdqgq.southeastasia-01.azurewebsites.net/api/Nodes/chatbot/gemini', { 
        messages: [...chatHistory, userMessage] 
      });
      
      const data = response.data;
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  
      // Extract content from Gemini API response structure
      let assistantContent = 'Sorry, no response was generated.';
      
      if (parsedData.candidates && 
          parsedData.candidates[0] && 
          parsedData.candidates[0].content && 
          parsedData.candidates[0].content.parts && 
          parsedData.candidates[0].content.parts[0] && 
          parsedData.candidates[0].content.parts[0].text) {
        assistantContent = parsedData.candidates[0].content.parts[0].text;
      }
  
      // Add assistant response to chat history
      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
      };
  
      setChatHistory((prevHistory) => [...prevHistory, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };
  
  return (
    <div>
      {/* Chat Button */}
      <button 
        onClick={toggleDialog}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#4a69bd',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        {isOpen ? '×' : '💬'}
      </button>

      {/* Chat Dialog */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '350px',
          height: '500px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#4a69bd',
            color: 'white',
            padding: '15px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Gemini Assistant</span>
            <button 
              onClick={toggleDialog}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {chatHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                marginTop: '20px'
              }}>
                How can I help you today?
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div 
                  key={index}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.role === 'user' ? '#4a69bd' : '#f1f1f1',
                    color: msg.role === 'user' ? 'white' : 'black',
                    padding: '10px 15px',
                    borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                    maxWidth: '70%',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div 
                      className="formatted-content"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: '#f1f1f1',
                color: 'black',
                padding: '10px 15px',
                borderRadius: '18px 18px 18px 0',
                maxWidth: '70%'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>•</span>
                  <span style={{ animation: 'pulse 1s infinite 0.2s' }}>•</span>
                  <span style={{ animation: 'pulse 1s infinite 0.4s' }}>•</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              padding: '10px',
              borderTop: '1px solid #e0e0e0'
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px 15px',
                border: '1px solid #ccc',
                borderRadius: '20px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              style={{
                backgroundColor: '#4a69bd',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                marginLeft: '10px',
                cursor: message.trim() ? 'pointer' : 'default',
                opacity: message.trim() ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➤
            </button>
          </form>

          {/* CSS Animation */}
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 0.4; }
                50% { opacity: 1; }
                100% { opacity: 0.4; }
              }
              
              /* Style the formatted content */
              .formatted-content {
                width: 100%;
              }
              
              .formatted-content p {
                margin: 0 0 8px 0;
              }
              
              .formatted-content p:last-child {
                margin-bottom: 0;
              }
              
              .formatted-content strong {
                font-weight: bold;
              }
              
              .formatted-content em {
                font-style: italic;
              }
              
              .formatted-content code {
                background-color: rgba(0, 0, 0, 0.05);
                padding: 2px 4px;
                border-radius: 3px;
                font-family: monospace;
              }
              
              .formatted-content ul, .formatted-content ol {
                margin: 0;
                padding-left: 20px;
              }
              
              .formatted-content h1, .formatted-content h2, .formatted-content h3 {
                margin: 8px 0;
                font-weight: bold;
              }
              
              .formatted-content h1 {
                font-size: 1.4em;
              }
              
              .formatted-content h2 {
                font-size: 1.2em;
              }
              
              .formatted-content h3 {
                font-size: 1.1em;
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default ChatbotDialog;