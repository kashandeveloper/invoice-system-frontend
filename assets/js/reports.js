// const API_BASE = "https://kashan.42web.io/api";
document.addEventListener("DOMContentLoaded",async()=>{const tbody=document.querySelector("#reportTable tbody");
const data = await jsonFetch(`${API_BASE}/invoices/reports.php`);
tbody.innerHTML="";
data.forEach(m=>{const tr=document.createElement("tr");
tr.innerHTML=`<td>${m.month}</td><td class="text-end">$${Number(m.total).toFixed(2)}</td>`;
tbody.appendChild(tr)})})
