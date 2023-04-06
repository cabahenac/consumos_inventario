import { useState } from "react";

export default function Cals() {
  const [cals, setCals] = useState(["TT3", "TT4"]);

  return (
    <>
      {cals.map((cal) => (
        <input type="text" value={cal} />
      ))}
    </>
  );
}
