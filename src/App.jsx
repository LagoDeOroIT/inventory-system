import { useState } from "react";

function App() {
  const [showAdd, setShowAdd] = useState(true);

  const [transactions] = useState([
    { date: "2026-01-22", item: "Petrol", type: "IN", qty: 25, brand: "Petron" },
    { date: "2026-01-21", item: "Steel", type: "OUT", qty: 19, brand: "" },
    { date: "2026-01-21", item: "Cement", type: "IN", qty: 8, brand: "" },
    { date: "2026-01-20", item: "Cement", type: "IN", qty: 10, brand: "Alaska" }
  ]);

  return (
    <div className="app-container">

      {/* Hide / Show Add Transaction */}
      <div style={{ textAlign: "right", marginBottom: "12px" }}>
        <button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Hide Add Transaction" : "Show Add Transaction"}
        </button>
      </div>

      {/* Add Transaction Section */}
      {showAdd && (
        <div className="card">
          <h2>Add Transaction</h2>
          <input placeholder="Search item" />
          <select>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
          <input placeholder="Qty" />
          <input type="date" />
          <button>Save</button>
        </div>
      )}

      {/* Stock IN Table */}
      <h3>Stock IN</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Brand</th>
          </tr>
        </thead>
        <tbody>
          {transactions
            .filter(t => t.type === "IN")
            .map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.item}</td>
                <td>{t.qty}</td>
                <td>{t.brand}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Stock OUT Table */}
      <h3>Stock OUT</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {transactions
            .filter(t => t.type === "OUT")
            .map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.item}</td>
                <td>{t.qty}</td>
              </tr>
            ))}
        </tbody>
      </table>

    </div>
  );
}

export default App;
