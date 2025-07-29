import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function SalesChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("created_at, amount");

    if (error) {
      console.error("Error fetching sales:", error);
      return;
    }

    const grouped = {};

    data.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = 0;
      grouped[date] += Number(sale.amount);
    });

    const chart = Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount,
    }));

    setChartData(chart);
  };

  return (
    <div className="sales-chart">
      <h2>Daily Sales Report</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
          <Line type="monotone" dataKey="amount" stroke="#007acc" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
