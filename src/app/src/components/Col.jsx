import { useState } from "react";
import Rvo from "./Rvo";
import "./Col.css";

export default function Col({ name, defaults = [] }) {
  const [rvos, setRvos] = useState([...defaults]);

  const handleDelete = (e) => {
    console.log(e.id);
    setRvos((r) => {
      return r.filter((e) => e !== r);
    });
  };

  return (
    <div className="col">
      <h2>{name}</h2>
      {rvos.map((r) => (
        <Rvo rvo={r} onDelete={handleDelete} id={r} key={r} />
      ))}
    </div>
  );
}
