export default function Rvo({ rvo, onDelete }) {
  const handleClick = () => onDelete(rvo);

  return (
    <li className="card">
      {rvo}
      <button onClick={handleClick}>x</button>
    </li>
  );
}
