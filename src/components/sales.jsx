import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
//import "../style/sales.css";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalToday, setTotalToday] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shopId, setShopId] = useState(localStorage.getItem("shop_id"));

  useEffect(() => {
    fetchUserAndShop();
  }, []);

  useEffect(() => {
    if (shopId) {
      fetchProducts();
      fetchSalesToday();
    }
  }, [shopId]);

  const fetchUserAndShop = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("shop_id, is_admin")
      .eq("user_id", user.id)
      .MaybeSingle();

    if (error) {
      toast.error("Failed to fetch user profile");
      return;
    }

    if (!data?.shop_id) {
      const newShopId = uuidv4();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ shop_id: newShopId })
        .eq("user_id", user.id);

      if (updateError) {
        toast.error("Failed to assign shop ID");
        return;
      }

      await supabase.from("shops").insert([
        {
          shop_id: newShopId,
          email: user.email,
        },
      ]);

      localStorage.setItem("shop_id", newShopId);
      setShopId(newShopId);
    } else {
      localStorage.setItem("shop_id", data.shop_id);
      setShopId(data.shop_id);
    }

    setIsAdmin(data?.is_admin || false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId);

    if (!error) {
      setProducts(data);
    } else {
      toast.error("Failed to fetch products");
    }
  };

  const getTodayBounds = () => {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    return { start, end };
  };

  const fetchSalesToday = async () => {
    const { start, end } = getTodayBounds();
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end);

    if (!error) {
      setSales(data);
      const total = data.reduce((sum, sale) => sum + parseFloat(sale.amount || 0), 0);
      setTotalToday(total);
    } else {
      toast.error("Failed to fetch today’s sales");
    }
  };

  const fetchFilteredSales = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both dates");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("shop_id", shopId)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

    if (!error) {
      setSales(data);
      const total = data.reduce((sum, sale) => sum + parseFloat(sale.amount || 0), 0);
      setTotalToday(total);
      toast.success("Sales filtered");
    } else {
      toast.error("Error fetching filtered sales");
    }

    setLoading(false);
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm("Delete this sale?")) return;

    const { error } = await supabase.from("sales").delete().eq("id", id).eq("shop_id", shopId);
    if (error) {
      toast.error("Failed to delete sale");
    } else {
      toast.success("Sale deleted");
      fetchSalesToday();
      if (fromDate && toDate) fetchFilteredSales();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProduct);
    const qty = parseInt(quantity);

    if (!product || !qty || qty <= 0) {
      toast.error("Invalid product or quantity");
      return;
    }

    if (qty > product.quantity) {
      toast.error("Not enough stock");
      return;
    }

    const amount = qty * product.selling_price;

    setLoading(true);

    toast.promise(
      (async () => {
        const { error: saleError } = await supabase.from("sales").insert([{
          shop_id: shopId,
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          amount,
        }]);

        if (saleError) throw new Error(saleError.message);

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: product.quantity - qty })
          .eq("id", product.id)
          .eq("shop_id", shopId);

        if (updateError) throw new Error("Error updating product quantity");

        setSelectedProduct("");
        setQuantity("");
        fetchSalesToday();
        fetchProducts();
      })(),
      {
        loading: "Saving sale...",
        success: "Sale recorded!",
        error: (err) => err.message,
      }
    );

    setLoading(false);
  };

  return (
    <div className="sales-page">
      <h2>Record Sale</h2>

      <form onSubmit={handleSubmit} className="sales-form">
        <label>Product</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (₦{product.selling_price}) - {product.quantity} left
            </option>
          ))}
        </select>

        <label>Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Submit Sale"}
        </button>
      </form>

      <div className="sales-summary">
        <strong>Today’s Sales:</strong> ₦{totalToday.toLocaleString()}
      </div>

      <div className="filter-controls">
        <label>From</label>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <label>To</label>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button onClick={fetchFilteredSales} disabled={loading}>
          {loading ? "Filtering..." : "Filter"}
        </button>
      </div>

      <h3>Sales History</h3>
      {sales.length === 0 ? (
        <p>No sales found for the selected period.</p>
      ) : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Amount (₦)</th>
              <th>Time</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.product_name}</td>
                <td>{sale.quantity}</td>
                <td>{sale.amount.toLocaleString()}</td>
                <td>{new Date(sale.created_at).toLocaleString("en-NG", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}</td>
                {isAdmin && (
                  <td>
                    <button onClick={() => handleDeleteSale(sale.id)} className="btn delete">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
