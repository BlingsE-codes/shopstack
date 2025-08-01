// src/components/SalesChart.jsx
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function SalesChart({ labels, values }) {
  return (
    <div className="chart-container">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Sales (₦)",
              data: values,
              fill: true,
              backgroundColor: "rgba(52,152,219,0.1)",
              borderColor: "#3498db",
              tension: 0.4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: "#333",
                font: { size: 14, weight: "bold" },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#555" },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { color: "#555" },
              grid: { borderDash: [5, 5] },
            },
          },
        }}
      />
    </div>
  );
}

