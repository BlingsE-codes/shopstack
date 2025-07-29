import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { toast } from "sonner";

 

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    cost_price: "",
    selling_price: "",
    low_stock_alert: 5,
  });
 
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDailySales, setTotalDailySales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shopInfo, setShopInfo] = useState({ name: "", logo: null });

  const limit = 10;
  const shopid = localStorage.getItem("id");

  useEffect(() => {
    if (shopid) {
      fetchShopInfo();
      fetchProducts();
      fetchDailySales();
    }
  }, [page]);

  const fetchShopInfo = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopid)
      .single();
     

  if (!error && data?.length > 0) {
  // const shop = data[0]; // pick the first one if multiple exist
//    console.log(localStorage.getItem("shop_id"));
//   setShopInfo({
//     name: shop.name,
//     logo_url: shop.logo_url || "fallback-url",
//   });
// } else {
//   console.warn("Unable to fetch shop info:", error?.message || "Shop not found");
 
}
  };

 const fetchProducts = async () => {
  if (!shopid) return;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("products")
     .select("*", { count: "exact" })
    .eq("id", shopid)
    .range(from, to);
   // console.log("Inserting product with shop_id:", shopid);

  if (error) {
    console.error("Error fetching products:", error.message);
    return;
  }

  setProducts(data || []);
  setTotalPages(Math.ceil((count || 0) / limit));
};

  const fetchDailySales = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("sales")
      .select("amount")
      .eq("id", shopid)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (!error) {
      const total = data.reduce((sum, sale) => sum + sale.amount, 0);
      setTotalDailySales(total);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      low_stock_alert: Number(form.low_stock_alert),
    };

    let error;

    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      payload.id = shopid;
      ({ error } = await supabase.from("products").insert([payload]));
    }

    setLoading(false);

    if (!error) {
      toast.success(editingId ? "Product updated" : "Product added");
      resetForm();
      setEditingId(null);
      fetchProducts();
    } else {
      toast.error("Failed to save: " + error.message);
      console.error("Supabase Error:", error);
    }
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Delete failed: " + error.message);
      }
    }
  };

  const handleQuantityChange = async (id, newQty) => {
    const qty = parseInt(newQty);
    if (!isNaN(qty)) {
      await supabase.from("products").update({ quantity: qty }).eq("id", id);
      fetchProducts();
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      quantity: 0,
      cost_price: 0,
      selling_price: 0,
      low_stock_alert: 5,
    });
    setEditingId(null);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "shopstack_products.csv");
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-page">
      {/* 🛍 Shop Info Header */}
      <div className="shop-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <img src={shopInfo.logo_url} alt="Shop Logo" style={{ width: 60, height: 60, borderRadius: "50%" }} />
        <div>
          <h2 style={{ margin: 0 }}>{shopInfo.name || "My Shop"}</h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>Manage your inventory here</p>
        </div>
      </div>

      <div className="sales-summary">
        <strong>Today’s Sales:</strong> ₦{totalDailySales.toLocaleString()}
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Product name" value={form.name} onChange={handleChange} required />
        <input type="text" name="category" placeholder="Category" value={form.category} onChange={handleChange} />
        <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
        <input type="number" name="cost_price" placeholder="Cost Price" value={form.cost_price} onChange={handleChange} />
        <input type="number" name="selling_price" placeholder="Selling Price" value={form.selling_price} onChange={handleChange} />
        <input type="number" name="low_stock_alert" placeholder="Low Stock Alert" value={form.low_stock_alert} onChange={handleChange} />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
        </button>
        {editingId && <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>}
      </form>

      <div className="search-export">
        <input
          type="text"
          placeholder="Search by name or category"
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={exportToCSV} className="export-btn">Export to CSV</button>
      </div>

      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Category</th>
              <th>Cost ₦</th>
              <th>Sell ₦</th>
              <th>Low Alert</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(prod => (
              <tr key={prod.id} className={prod.quantity <= prod.low_stock_alert ? "low-stock" : ""}>
                <td>{prod.name}</td>
                <td>
                  <input type="number" className="qty-input" value={prod.quantity} onChange={(e) => handleQuantityChange(prod.id, e.target.value)} />
                </td>
                <td>{prod.category}</td>
                <td>{prod.cost_price}</td>
                <td>{prod.selling_price}</td>
                <td>{prod.low_stock_alert}</td>
                <td>
                  <button onClick={() => handleEdit(prod)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(prod.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
}
