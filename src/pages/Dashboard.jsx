import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import "../styles/Dashboard.css";

Chart.register(...registerables);

export default function Dashboard() {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [filter, setFilter] = useState("daily");
  const [expenses, setExpenses] = useState(0);
  const [profits, setProfits] = useState(0);
  const [shopName, setShopName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const shopId = localStorage.getItem("shop_id"); // ✅ Get current shop

  useEffect(() => {
    if (shopId) {
      fetchDashboardStats();
      fetchShopDetails();
    }
  }, [filter, shopId]);

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

    const { data: sales } = await supabase
      .from("sales")
      .select("amount, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

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

    const { data: expenseData } = await supabase
      .from("expenses")
      .select("amount")
      .eq("shop_id", shopId)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

    const totalExpense = expenseData?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const totalSales = values.reduce((sum, val) => sum + val, 0);

    setExpenses(totalExpense);
    setProfits(totalSales - totalExpense);
  };

  return (
    <div className="dashboard" style={{ width: "100%", height: "100%" }}>
      {/* === SHOP HEADER === */}
      <div className="shop-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Shop Logo"
            style={{ height: "50px", width: "50px", borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <div>
          <h2>{shopName || "Shop"}</h2>
          <p style={{ margin: 0, color: "#555" }}>Welcome to your dashboard!</p>
        </div>
      </div>

      {/* === FILTER BUTTONS === */}
      <div className="filters">
        <button onClick={() => setFilter("daily")} className={filter === "daily" ? "active" : ""}>
          Daily
        </button>
        <button onClick={() => setFilter("weekly")} className={filter === "weekly" ? "active" : ""}>
          Weekly
        </button>
        <button onClick={() => setFilter("monthly")} className={filter === "monthly" ? "active" : ""}>
          Monthly
        </button>
      </div>

      {/* === CHART === */}
      <div className="chart-wrapper">
        <Line
          data={{
            labels: chartLabels,
            datasets: [
              {
                label: "Sales (₦)",
                data: chartValues,
                fill: true,
                backgroundColor: "rgba(52,152,219,0.1)",
                borderColor: "#3498db",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "top" },
            },
            scales: {
              y: { beginAtZero: true },
            },
          }}
        />
      </div>

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
      </div>
    </div>
  );
}
