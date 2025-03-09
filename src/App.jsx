import { useState, useEffect } from "react";
import axios from "axios";
import GraphVisualization from "./components/GraphVisualization";
import { Toaster } from "react-hot-toast";
import { ScaleLoader } from "react-spinners";


const App = () => {
  const [dataReceived, setDataReceived] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const getData = async () => {
    try {
      const response = await axios.get("https://unicorn-mindmap-bcatemfdc2f0encx.southeastasia-01.azurewebsites.net/api/Nodes");
      // const response = await axios.get("https://localhost:5261/api/Nodes");
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
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <ScaleLoader color="#4B5563" loading={isDataLoading} size={15} />
        </div>
      ) : (
        <GraphVisualization data={dataReceived} getdata={getData} />
      )}
      
    </div>
    
  );
};

export default App;
