import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { useShopStore } from "../store/shop-store";

export default function Products() {
  const { shop } = useShopStore();
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

  const limit = 10;

  const fetchProducts = async () => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("shop_id", shop.id)
      .range(from, to);

    if (error) {
      toast.error("Error fetching products");
      return;
    }
    console.log(data);
    setProducts(data || []);
    setTotalPages(Math.ceil((count || 0) / limit));
  };

  useEffect(() => {
    fetchProducts();

  }, []);

  // const fetchDailySales = async () => {
  //   const today = new Date().toISOString().split("T")[0];
  //   const { data, error } = await supabase
  //     .from("sales")
  //     .select("amount")
  //     .eq("id", userId)
  //     .gte("created_at", `${today}T00:00:00`)
  //     .lte("created_at", `${today}T23:59:59`);

  //   if (!error) {
  //     const total = data.reduce((sum, sale) => sum + sale.amount, 0);
  //     setTotalDailySales(total);
  //   }
  // };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      category: form.category.toLowerCase(),
      name: form.name.toLowerCase(),
      quantity: Number(form.quantity),
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      low_stock_alert: Number(form.low_stock_alert),
      shop_id: shop.id,
    };
    console.log("Payload to save:", payload);

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id));
    } else {
      ({ error } = await supabase.from("products").insert([payload]));
    }

    setLoading(false);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(editingId ? "Product updated" : "Product added");
      resetForm();
      fetchProducts();
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
      await supabase
        .from("products")
        .update({ quantity: qty })
        .eq("id", userId);
      fetchProducts();
    }
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "shopstack_products.csv");
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-page">
      {/* Header */}
      <div
        className="shop-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* <img src={shopInfo.logo_url} alt="Shop Logo" style={{ width: 60, height: 60, borderRadius: "50%" }} /> */}
        <div>
          <h2 style={{ margin: 0 }}>{shop.name || "My Shop"}</h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
            Manage your inventory here
          </p>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="sales-summary">
        <strong>Today’s Sales:</strong> ₦{totalDailySales.toLocaleString()}
      </div>

      {/* Product Form */}
      <form className="product-form" onSubmit={handleSubmit}>
        {[
          "name",
          "category",
          "quantity",
          "cost_price",
          "selling_price",
          "low_stock_alert",
        ].map((field) => (
          <input
            key={field}
            type={
              field.includes("price") ||
              field === "quantity" ||
              field === "low_stock_alert"
                ? "number"
                : "text"
            }
            name={field}
            placeholder={field
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            value={form[field]}
            onChange={handleChange}
            required={field === "name"}
          />
        ))}
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="cancel-btn">
            Cancel
          </button>
        )}
      </form>

      {/* Search & Export */}
      <div className="search-export">
        <input
          type="text"
          placeholder="Search by name or category"
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={exportToCSV} className="export-btn">
          Export to CSV
        </button>
      </div>

      {/* Product Table */}
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
            {filteredProducts.map((prod) => (
              <tr
                key={prod.id}
                className={
                  prod.quantity <= prod.low_stock_alert ? "low-stock" : ""
                }
              >
                <td>{prod.name}</td>
                <td>
                  <input
                    type="number"
                    className="qty-input"
                    value={prod.quantity}
                    onChange={(e) =>
                      handleQuantityChange(prod.id, e.target.value)
                    }
                  />
                </td>
                <td>{prod.category}</td>
                <td>{prod.cost_price}</td>
                <td>{prod.selling_price}</td>
                <td>{prod.low_stock_alert}</td>
                <td>
                  <button onClick={() => handleEdit(prod)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
