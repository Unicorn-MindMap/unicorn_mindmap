import { useState, useEffect } from "react";
import axios from "axios";
import GraphVisualization from "./components/GraphVisualization";
import { Toaster } from "react-hot-toast";


const App = () => {
  const [dataReceived, setDataReceived] = useState([]);

  const getData = async () => {
    try {
      const response = await axios.get("https://mindmap3dinstance-bgg3brbwahgxdqgq.southeastasia-01.azurewebsites.net/api/Nodes");
      setDataReceived(response.data.rootNode);
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
      <GraphVisualization data={dataReceived} getdata={getData}/>
      
    </div>
    
  );
};

export default App;
