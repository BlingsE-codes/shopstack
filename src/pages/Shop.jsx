import { Link, Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
import "../styles/shop.css";
import { useShopStore } from "../store/shop-store";
import { useEffect } from "react";

export default function Shop() {
  const { id } = useParams();
  const { shop } = useShopStore();
  useEffect(() => {
    console.log(shop);
  }, []);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "20px",
          padding: "20px",
        }}
      >
        <Link to={`/shops/${id}`}>Overview</Link>
        <Link to={`/shops/${id}/products`}>Products</Link>
        <Link to={`/shops/${id}/sales`}>Sales</Link>
        <Link to={`shops/${id}/expenses`}>Expenses</Link>
        <Link to="/shops/:id/settings">Settings</Link>
        <Link to="/shops/:id/profiles">Profile</Link>
      </div>
      <Outlet />
    </div>
  );
}
