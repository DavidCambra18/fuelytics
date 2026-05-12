import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex justify-between p-4 bg-white shadow">
      <h1 className="font-bold">Fuelytics</h1>

      <div className="flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}