import { useState } from "react";
import Cals from "./Cals";
import "./App.css";

function App() {
  const [cals, setCals] = useState(["TT3", "TT4"]);

  return (
    <div className="container">
      <Cals />
    </div>
  );
}

export default App;
