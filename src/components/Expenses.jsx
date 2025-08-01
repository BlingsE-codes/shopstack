import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";
import "../styles/expenses.css";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [total, setTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    if (!shopId) {
      toast.error("Shop ID not found");
      return;
    }

    const init = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("User not found");
        return;
      }

      setUser(user);
      await fetchAdminStatus(user);
      await fetchExpensesToday();
    };

    init();
  }, [shopId]);

  const fetchAdminStatus = async (user) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .eq("auth_id", shopId)
      .maybeSingle();

    if (error) {
      console.error("Admin fetch error:", error.message);
      return;
    }
    setIsAdmin(data?.is_admin || false);
  };

  const fetchExpensesToday = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("shop_id", shopId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching expenses");
    } else {
      setExpenses(data);
      calculateTotal(data);
    }
    setLoading(false);
  };

  const calculateTotal = (data) => {
    const totalAmount = data.reduce(
      (acc, e) => acc + parseFloat(e.amount || 0),
      0
    );
    setTotal(totalAmount.toFixed(2));
  };

  const handleInputChange = (e) => {
    setNewExpense({ ...newExpense, [e.target.name]: e.target.value });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    const { title, amount } = newExpense;
    if (!title || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const insertData = {
      title,
      amount: Number(amount),
      shop_id: shopId,
      user_id: user.id,
      is_admin: isAdmin,
    };

    const { error } = await supabase.from("expenses").insert([insertData]);

    console.log("Expense payload:", insertData);

    if (error) {
      toast.error("Failed to add expense");
    } else {
      toast.success("Expense added!");
      setNewExpense({ title: "", amount: "" });
      fetchExpensesToday();
    }
  };

  const handleDeleteExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
      fetchExpensesToday();
    }
  };

  const handleFilter = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("shop_id", shopId)
      .gte("created_at", `${fromDate}T00:00:00`)
      .lte("created_at", `${toDate}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error filtering expenses");
    } else {
      setExpenses(data);
      calculateTotal(data);
    }
    setLoading(false);
  };

  return (
    <div className="expenses">
      <h2 className="expenses-title">Shop Expenses</h2>

      <form onSubmit={handleAddExpense} className="expense-form">
        <input
          type="text"
          name="title"
          placeholder="Expense title"
          value={newExpense.title}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount (₦)"
          value={newExpense.amount}
          onChange={handleInputChange}
        />
        <button type="submit">Add</button>
      </form>

      <div className="filter-section">
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
        <button onClick={handleFilter}>Filter</button>
      </div>

      <h3 className="total-expense">Total: ₦{total}</h3>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="table-wrapper">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount (₦)</th>
                <th>Date</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{parseFloat(e.amount).toFixed(2)}</td>
                  <td>{new Date(e.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td>
                      <button onClick={() => handleDeleteExpense(e.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
