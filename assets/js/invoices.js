let itemsEl;
let clientSel;
let subtotalEl;
let taxEl;
let taxAmtEl;
let totalEl;
let saveBtn;
let alertArea;
let listTbody;

document.addEventListener("DOMContentLoaded", () => {
  itemsEl = document.getElementById("items");
  clientSel = document.getElementById("clientSelect");
  subtotalEl = document.getElementById("subtotal");
  taxEl = document.getElementById("tax");
  taxAmtEl = document.getElementById("taxAmount");
  totalEl = document.getElementById("total");
  saveBtn = document.getElementById("saveBtn");
  alertArea = document.getElementById("alertArea");
  listTbody = document.querySelector("#listTable tbody");

  document.getElementById("addRow").addEventListener("click", addRow);
  taxEl.addEventListener("input", recalc);
  saveBtn.addEventListener("click", save);

  loadClients();
  addRow();
  loadList();
});

function addRow() {
  const row = document.createElement("div");
  row.className = "item-row mb-2";
  row.innerHTML = `
    <input class="form-control" placeholder="Description">
    <input class="form-control" type="number" placeholder="Qty" value="1" min="0" step="0.01">
    <input class="form-control" type="number" placeholder="Price" value="0" min="0" step="0.01">
    <button class="btn btn-outline-light border-soft" type="button">✕</button>
  `;
  const inputs = row.querySelectorAll("input");
  inputs.forEach((i) => i.addEventListener("input", recalc));
  row.querySelector("button").addEventListener("click", () => {
    row.style.animation = "fadeUp .2s reverse both";
    setTimeout(()=>{ row.remove(); recalc(); }, 180);
  });
  itemsEl.appendChild(row);
  recalc();
}

function getItems() {
  const rows = [...itemsEl.querySelectorAll(".item-row")];
  return rows.map((r) => {
    const [d, q, p] = r.querySelectorAll("input");
    return {
      description: d.value.trim(),
      quantity: Number(q.value || 0),
      price: Number(p.value || 0)
    };
  }).filter((x) => x.description && x.quantity > 0);
}

function recalc() {
  const items = getItems();
  const subtotal = items.reduce((s, i) => s + (i.quantity * i.price), 0);
  const taxPct = Number(taxEl.value || 0);
  const tax = subtotal * taxPct / 100;
  const total = subtotal + tax;
  subtotalEl.textContent = subtotal.toFixed(2);
  taxAmtEl.textContent = tax.toFixed(2);
  totalEl.textContent = total.toFixed(2);
}

async function loadClients() {
  try {
    const list = await jsonFetch("../api/clients/list.php");
    clientSel.innerHTML = list.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  } catch (e) {
    clientSel.innerHTML = "";
  }
}

async function save() {
  saveBtn.disabled = true;
  try {
    const items = getItems();
    const client_id = Number(clientSel.value || 0);
    const tax_percent = Number(taxEl.value || 0);
    if (!client_id || items.length === 0) {
      notify(alertArea, "Select a client and add at least one item.", "danger");
      return;
    }
    const res = await jsonFetch("../api/invoices/create.php", {
      method: "POST",
      body: JSON.stringify({ client_id, tax_percent, items })
    });
    notify(alertArea, "Invoice saved", "success");
    itemsEl.innerHTML = "";
    addRow();
    taxEl.value = "0";
    recalc();
    loadList();
    if (res && res.id) {
      const a = document.createElement("a");
      a.href = `invoice_view.html?id=${encodeURIComponent(res.id)}`;
      a.className = "btn btn-outline-light border-soft ms-2";
      a.textContent = "View";
      alertArea.querySelector(".alert")?.appendChild(a);
    }
  } catch (err) {
    notify(alertArea, err.message || "Save failed", "danger");
  } finally {
    saveBtn.disabled = false;
  }
}

async function loadList() {
  listTbody.innerHTML = "";
  try {
    const data = await jsonFetch("../api/invoices/list.php");
    data.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><a class="link-light" href="invoice_view.html?id=${r.id}">#${r.id}</a></td>
        <td>${r.client_name}</td>
        <td>${r.created_at}</td>
        <td class="text-end">$${Number(r.total).toFixed(2)}</td>
        <td class="text-end">
          <a class="btn btn-sm btn-outline-light border-soft me-2" href="invoice_view.html?id=${r.id}">View</a>
          <a class="btn btn-sm btn-primary" href="../api/invoices/pdf.php?id=${r.id}" target="_blank">PDF</a>
        </td>
      `;
      listTbody.appendChild(tr);
    });
  } catch (e) {
    // silent
  }
}
