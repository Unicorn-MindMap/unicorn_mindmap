import { useState, useEffect } from "react";
import axios from "axios";
import GraphVisualization from "./components/GraphVisualization";
import { Toaster } from "react-hot-toast";


const App = () => {
  const [dataReceived, setDataReceived] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const getData = async () => {
    try {
      const response = await axios.get("https://unicorn-mindmap-bcatemfdc2f0encx.southeastasia-01.azurewebsites.net/api/Nodes");
      setDataReceived(response.data.rootNode);
      setIsDataLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      <Toaster position="top-center" />
      {isDataLoading ? (
        <p style={{ fontSize: '1.5em', color: '#007bff', textAlign: 'center', marginTop: '20px' }}>Loading...</p>
      ) : (
        <GraphVisualization data={dataReceived} />
      )}
      
    </div>
    
  );
};

export default App;
