import Col from "./Col";
import "./App.css";

export default function App() {
  return (
    <div className="container">
      <Col name="Calibraciones" defaults={["Na", "K", "Cl"]} />
      <Col name="Excepciones" />
    </div>
  );
}
