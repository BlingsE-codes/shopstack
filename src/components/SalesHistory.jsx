import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
    } else {
      setSales(data);
    }

    setLoading(false);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="sales-history">
      <h2>Sales History</h2>
      {loading ? (
        <p>Loading sales...</p>
      ) : (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
                  <td>{sale.product}</td>
                  <td>{sale.quantity}</td>
                  <td>₦{Number(sale.price).toLocaleString()}</td>
                  <td>₦{Number(sale.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Total Revenue:</strong> ₦{totalRevenue.toLocaleString()}</p>
        </>
      )}
    </div>
  );
}
