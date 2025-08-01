// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/Dashboard.css";
import { useShopStore } from "../store/shop-store";
import SalesChart from "../components/SalesChart"; // ⬅️ NEW
import { useAuthStore } from "../store/auth-store";

export default function Dashboard() {
  const { shop } = useShopStore();
  const { user } = useAuthStore();
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [expenses, setExpenses] = useState(0);
  const [profits, setProfits] = useState(0);
  const [shopName, setShopName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    if (shopId) {
      fetchShopDetails();
      fetchDashboardStats();
      fetchLowStockItems();
      fetchTopProducts();
    }
  }, [filter, shopId]);

  console.log("Shop ID from localStorage:", shopId);

  const fetchShopDetails = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("name, logo_url")
      .eq("shop_id", shopId)
      .single();

    if (data) {
      setShopName(data.name || "");
      setLogoUrl(data.logo_url || "");
    } else {
      console.error("Failed to fetch shop details:", error);
    }
  };

 const fetchDashboardStats = async () => {
  console.log("Fetching stats for shopId:", shopId);

  let fromDate, toDate;
  const today = new Date();

  if (filter === "daily") {
    fromDate = new Date().toISOString().split("T")[0];
    toDate = fromDate;
  } else if (filter === "weekly") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    fromDate = start.toISOString().split("T")[0];
    toDate = new Date().toISOString().split("T")[0];
  } else {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    fromDate = start.toISOString().split("T")[0];
    toDate = new Date().toISOString().split("T")[0];
  }

  const { data: sales, error } = await supabase
    .from("sales")
    .select("amount, created_at")
    .eq("shop_id", shopId)
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`);

  if (error) {
    console.error("Error fetching sales:", error.message);
  } else {
    console.log("Fetched sales:", sales);
  }

  const grouped = {};
  sales?.forEach((sale) => {
    const dateKey = new Date(sale.created_at).toLocaleDateString();
    if (!grouped[dateKey]) grouped[dateKey] = 0;
    grouped[dateKey] += sale.amount;
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map((label) => grouped[label]);

  setChartLabels(labels);
  setChartValues(values);
};

  const fetchLowStockItems = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("name, quantity")
      .eq("shop_id", shopId)
      .lt("quantity", 5);

    if (data) {
      setLowStock(data);
    } else {
      console.error("Failed to fetch low stock items:", error);
    }
  };

  const fetchTopProducts = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("sales")
      .select("product_name, quantity")
      .eq("shop_id", shopId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (data) {
      const grouped = {};
      data.forEach(({ product_name, quantity }) => {
        if (!grouped[product_name]) grouped[product_name] = 0;
        grouped[product_name] += quantity;
      });

      const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
      setTopProducts(sorted.slice(0, 5));
    } else {
      console.error("Failed to fetch top products:", error);
    }
  };

  return (
    <div className="dashboard">
      {/* === SHOP HEADER === */}
      <div className="shop-header">
        {logoUrl && (
          <img src={logoUrl} alt="Shop Logo" className="shop-logo" />
        )}
        <div>
          <h2>{shop?.name || shopName || "Shop"}</h2>
          <p>Welcome to your dashboard!</p>
        </div>
      </div>

      {/* === FILTER BUTTONS === */}
      <div className="filters">
        {["daily", "weekly", "monthly"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={filter === key ? "active" : ""}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* === SALES CHART === */}
      <SalesChart labels={chartLabels} values={chartValues} />

      {/* === SUMMARY CARDS === */}
      <div className="summary-cards">
        <div className="card profits">
          <h4>Profit</h4>
          <p>₦{profits.toLocaleString()}</p>
        </div>
        <div className="card expenses">
          <h4>Expenses</h4>
          <p>₦{expenses.toLocaleString()}</p>
        </div>
        <div className="card sales">
          <h4>Total Sales</h4>
          <p>₦{chartValues.reduce((a, b) => a + b, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* === LOW STOCK === */}
      {lowStock.length > 0 && (
        <div className="low-stock-section">
          <h4>⚠️ Low Stock Items</h4>
          <ul>
            {lowStock.map((item) => (
              <li key={item.name}>
                {item.name} — {item.quantity} left
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* === TOP PRODUCTS === */}
      {topProducts.length > 0 && (
        <div className="top-products-section">
          <h4>🔥 Top Selling Products Today</h4>
          <ul>
            {topProducts.map(([name, qty]) => (
              <li key={name}>
                {name}: {qty} sold
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
