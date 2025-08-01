// Modern Sales Component
// Supports: Multi-shop, Timestamp, Product Quantity Deduction, Receipt Printing

import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useShopStore } from "../store/shop-store";
import { toast } from "sonner";
import dayjs from "dayjs";
import "../styles/Sales.css";

export default function Sales() {
  const { shop } = useShopStore();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: "", quantity: 1 });
  const [loading, setLoading] = useState(false);
   const [totalDailySales, setTotalDailySales] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [shop.id]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, selling_price, quantity")
      .eq("shop_id", shop.id);

    if (error) toast.error("Failed to load products");
    else setProducts(data);
  };

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*, products(name)")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load sales");
    else setSales(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const product = products.find((p) => p.id === form.product_id);
    if (!product || product.quantity < form.quantity) {
      toast.error("Insufficient stock");
      setLoading(false);
      return;
    }

    const amount = form.quantity * product.selling_price;

    const { error: saleError } = await supabase.from("sales").insert([
      {
        product_id: form.product_id,
        quantity: form.quantity,
        amount,
        shop_id: shop.id,
      },
    ]);

    if (!saleError) {
      const newQty = product.quantity - form.quantity;
      await supabase.from("products").update({ quantity: newQty }).eq("id", product.id);
      toast.success("Sale recorded");
      fetchSales();
      fetchProducts();
      setForm({ product_id: "", quantity: 1 });
      setTotalDailySales((prev) => prev + amount);
    } else {
      toast.error("Failed to record sale");
    }

    setLoading(false);
  };

  return (
    <div className="sales-container">

        <div className="sales-header">
          <h2 style={{ margin: 0 }}>{shop.name || "My Shop"}</h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
            Manage your inventory here
          </p>
        </div>

        
      {/* Sales Summary */}
      <div className="sales-summary">
        <strong>Today’s Sales:</strong> ₦{totalDailySales.toLocaleString()}
      </div>
    
    <div className="sales-page">
      <h2>Record a Sale</h2>
      <form onSubmit={handleSubmit} className="sale-form">
        <select
          name="product_id"
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (₦{p.selling_price}) - Stock: {p.quantity}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
          placeholder="Quantity"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Recording..." : "Add Sale"}
        </button>
      </form>

      <h3>Sales History</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{s.products?.name}</td>
              <td>{s.quantity}</td>
              <td>₦{s.amount}</td>
              <td>{dayjs(s.created_at).format("DD MMM, HH:mm")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
