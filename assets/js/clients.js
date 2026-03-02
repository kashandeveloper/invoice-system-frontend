let modal;
let form;
let alertArea;
let saveBtn;
let tbody;
let editId = null;

document.addEventListener("DOMContentLoaded", () => {
  modal = new bootstrap.Modal(document.getElementById("clientModal"));
  form = document.getElementById("clientForm");
  alertArea = document.getElementById("alertArea");
  saveBtn = document.getElementById("saveBtn");
  tbody = document.querySelector("#clientsTable tbody");

  loadClients();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim()
    };
    try {
      if (editId) {
        await jsonFetch("../api/clients/update.php", { method: "PUT", body: JSON.stringify({ id: Number(editId), ...payload }) });
      } else {
        await jsonFetch("../api/clients/create.php", { method: "POST", body: JSON.stringify(payload) });
      }
      modal.hide();
      editId = null;
      form.reset();
      loadClients();
      notify(alertArea, "Saved", "success");
    } catch (err) {
      notify(alertArea, err.message || "Failed", "danger");
    } finally {
      saveBtn.disabled = false;
    }
  });

  document.getElementById("clientModal").addEventListener("hidden.bs.modal", () => {
    editId = null;
    form.reset();
  });
});

async function loadClients() {
  tbody.innerHTML = "";
  try {
    const data = await jsonFetch("../api/clients/list.php");
    data.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.name}</td>
        <td>${c.email}</td>
        <td>${c.phone || ""}</td>
        <td>${c.address || ""}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-light me-2 border-soft" data-id="${c.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-del="${c.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("button[data-id]").forEach((b) =>
      b.addEventListener("click", () => onEdit(b.getAttribute("data-id")))
    );
    tbody.querySelectorAll("button[data-del]").forEach((b) =>
      b.addEventListener("click", () => onDelete(b.getAttribute("data-del")))
    );
  } catch (e) {
    // silent
  }
}

async function onEdit(id) {
  try {
    const list = await jsonFetch("../api/clients/list.php");
    const c = list.find((x) => String(x.id) === String(id));
    if (!c) return;
    editId = id;
    document.getElementById("name").value = c.name || "";
    document.getElementById("email").value = c.email || "";
    document.getElementById("phone").value = c.phone || "";
    document.getElementById("address").value = c.address || "";
    modal.show();
  } catch (e) {
    // silent
  }
}

async function onDelete(id) {
  if (!confirm("Delete this client?")) return;
  try {
    await jsonFetch(`../api/clients/delete.php?id=${encodeURIComponent(id)}`);
    loadClients();
  } catch (e) {
    notify(alertArea, e.message || "Delete failed", "danger");
  }
}
