import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";

export default function Report() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyProfits, setMonthlyProfits] = useState([]);
  const [weeklyProfits, setWeeklyProfits] = useState([]);
  const [topProduct, setTopProduct] = useState(null);

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    if (!shopId || shopId === "null") {
      toast.error("Shop ID missing. Please log in again.");
      setLoading(false);
      return;
    }
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("shop_id", shopId);

    if (error) {
      toast.error("Failed to fetch report data");
    } else {
      setSalesData(data);
      calculateMonthlyProfits(data);
      calculateWeeklyProfits(data);
      findTopProduct(data);
    }

    setLoading(false);
  };

  const calculateMonthlyProfits = (data) => {
    const profitsMap = {};
    data.forEach((sale) => {
      const date = new Date(sale.created_at);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const profit = (sale.amount || 0) - (sale.cost_price || 0) * sale.quantity;

      if (!profitsMap[key]) profitsMap[key] = 0;
      profitsMap[key] += profit;
    });

    const chartArray = Object.entries(profitsMap).map(([month, profit]) => ({
      month,
      profit,
    }));
    setMonthlyProfits(chartArray);
  };

  const calculateWeeklyProfits = (data) => {
    const weekMap = {};
    data.forEach((sale) => {
      const date = new Date(sale.created_at);
      const week = `${date.getFullYear()}-W${Math.ceil(
        (date.getDate() - date.getDay() + 1) / 7
      )}`;
      const profit = (sale.amount || 0) - (sale.cost_price || 0) * sale.quantity;

      if (!weekMap[week]) weekMap[week] = 0;
      weekMap[week] += profit;
    });

    const chartArray = Object.entries(weekMap).map(([week, profit]) => ({
      week,
      profit,
    }));
    setWeeklyProfits(chartArray);
  };

  const findTopProduct = (data) => {
    const productMap = {};
    data.forEach((sale) => {
      if (!productMap[sale.product_name]) productMap[sale.product_name] = 0;
      productMap[sale.product_name] += sale.quantity;
    });
    const sorted = Object.entries(productMap).sort((a, b) => b[1] - a[1]);
    setTopProduct(sorted[0] ? { name: sorted[0][0], qty: sorted[0][1] } : null);
  };

  const exportToCSV = () => {
    const csvRows = [
      ["Product Name", "Quantity", "Amount", "Date"],
      ...salesData.map((sale) => [
        sale.product_name,
        sale.quantity,
        sale.amount,
        new Date(sale.created_at).toLocaleString("en-NG"),
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sales_report.csv";
    a.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Report", 20, 10);
    salesData.forEach((sale, i) => {
      doc.text(
        `${sale.product_name} - Qty: ${sale.quantity} - ₦${sale.amount} - ${new Date(
          sale.created_at
        ).toLocaleString("en-NG")}`,
        10,
        20 + i * 8
      );
    });
    doc.save("sales_report.pdf");
  };

  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + parseFloat(sale.amount || 0),
    0
  );

  const productSummary = {};
  salesData.forEach((sale) => {
    if (!productSummary[sale.product_name]) {
      productSummary[sale.product_name] = 0;
    }
    productSummary[sale.product_name] += sale.amount;
  });

  const chartData = Object.keys(productSummary).map((name) => ({
    name,
    revenue: productSummary[name],
  }));

  return (
    <div className="report-container">
      <h2>Business Report</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="report-actions">
            <button onClick={exportToPDF} className="btn">Export to PDF</button>
            <button onClick={exportToCSV} className="btn">Export to CSV</button>
          </div>

          <div className="report-summary">
            <h3>Total Revenue: ₦{totalRevenue.toLocaleString()}</h3>
            {topProduct && (
              <p>🔥 Top Product: <strong>{topProduct.name}</strong> (Qty: {topProduct.qty})</p>
            )}
          </div>

          <div className="chart-section">
            <h4>Revenue by Product</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h4>Monthly Profit Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProfits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h4>Weekly Profit Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyProfits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount (₦)</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.product_name}</td>
                    <td>{sale.quantity}</td>
                    <td>{sale.amount.toLocaleString()}</td>
                    <td>
                      {new Date(sale.created_at).toLocaleString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
