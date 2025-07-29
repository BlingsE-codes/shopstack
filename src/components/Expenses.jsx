import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [totalToday, setTotalToday] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    const savedShopId = localStorage.getItem("shop_id");
    if (!savedShopId) {
      toast.error("Shop ID not found. Please log in again.");
      return;
    }
    setShopId(savedShopId);
    fetchUser();
  }, []);

  useEffect(() => {
    if (shopId) fetchExpensesToday();
  }, [shopId]);

 const fetchUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  setUser(user);

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle(); // make sure only 1 profile is expected per user

  if (error) {
    console.error("Error fetching admin status:", error.message);
    toast.error("Could not fetch admin status");
  } else {
    setIsAdmin(data?.is_admin);
    // localStorage.setItem("shop_id", data.shop_id); // Optional: persist shop_id
  }
};


  const getTodayBounds = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const fetchExpensesToday = async () => {
    const { start, end } = getTodayBounds();
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("shop_id", shopId)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load today's expenses");
    } else {
      setExpenses(data);
      const total = data.reduce(
        (sum, e) => sum + parseFloat(e.amount || 0),
        0
      );
      setTotalToday(total);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount) {
      toast.error("Name and amount required");
      return;
    }

    if (!shopId) {
      toast.error("Missing shop ID");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("expenses").insert([
      {
        name,
        amount: parseFloat(amount),
        note,
        created_at: new Date().toISOString(),
        shop_id: shopId,
      },
    ]);

    if (error) {
      console.error("Error saving expense:", error.message);
      toast.error("Error saving expense");
    } else {
      toast.success("Expense recorded");
      setName("");
      setAmount("");
      setNote("");
      fetchExpensesToday();
    }

    setLoading(false);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
      fetchExpensesToday();
      fetchFilteredExpenses();
    }
  };

  const fetchFilteredExpenses = async () => {
    if (!fromDate || !toDate) {
      toast.error("Select both dates");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("is_admin, name, amount, note, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`);

    if (error) {
      toast.error("Error fetching filtered expenses");
    } else {
      setExpenses(data);
      const total = data.reduce(
        (sum, e) => sum + parseFloat(e.amount || 0),
        0
      );
      setTotalToday(total);
      toast.success("Expenses filtered");
    }

    setLoading(false);
  };

  return (
    <div className="expenses-page">
      <h2>Record Expense</h2>
      <form onSubmit={handleSubmit} className="expenses-form">
        <input
          type="text"
          placeholder="Expense name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Reason (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Submit Expense"}
        </button>
      </form>

      <div className="expenses-summary">
        <strong>Today’s Expenses:</strong> ₦{totalToday.toLocaleString()}
      </div>

      <div className="filter-controls">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <button onClick={fetchFilteredExpenses}>Filter</button>
      </div>

      <h3>Expense History</h3>
      <table className="expenses-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Amount (₦)</th>
            <th>Note</th>
            <th>Time</th>
            {isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.name}</td>
              <td>{expense.amount}</td>
              <td>{expense.note || "-"}</td>
              <td>{new Date(expense.created_at).toLocaleTimeString()}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleDeleteExpense(expense.id)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
