/* ======= In‑memory data (swap later with localStorage/API) ======= */
let admins = [];
let customers = [];
let categories = [];    // {id,name,desc,status:'Visible'|'Hidden'}
let products = [];      // {id,cat,name,desc,price,qty,img,status}
let orders = [];        // {id,tracking,name,phone,date,status,payment,total,time,items:[{id,name,price,qty}]}
let cart = [];

/* ======= Utilities ======= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showSection(id){
  $$(".page").forEach(p => p.classList.add("hidden"));
  $("#"+id).classList.remove("hidden");
  if(id === "dashboard") updateDashboard();
  if(id === "products")  refreshProductCategorySelect();
  if(id === "pos")       { loadPosCategories(); loadProducts(); }
  if(id === "orders")    renderOrders();
}

/* ======= DASHBOARD ======= */
function updateDashboard(){
  $("#totalAdmins").innerText    = admins.length;
  $("#totalCustomers").innerText = customers.length;
  $("#totalCategories").innerText= categories.length;
  $("#totalProducts").innerText  = products.length;
  $("#totalOrders").innerText    = orders.length;

  // count today's orders
  const todayISO = new Date().toISOString().slice(0,10);
  const todayCnt = orders.filter(o => o.date === todayISO).length;
  $("#todayOrders").innerText = todayCnt;
}

function countOrdersByDate(){
  const d = $("#dashDate").value; // 'yyyy-mm-dd'
  if(!d){ updateDashboard(); return; }
  const cnt = orders.filter(o => o.date === d).length;
  $("#todayOrders").innerText = cnt;
}

/* ======= ADMINS ======= */
function addAdmin(e){
  e.preventDefault();
  const name = $("#adminName").value.trim();
  const email= $("#adminEmail").value.trim();
  const phone= $("#adminPhone").value.trim();
  admins.push({ id: admins.length+1, name, email, phone, active: true });
  e.target.reset();
  renderAdmins();
  updateDashboard();
}
function renderAdmins(){
  const tb = $("#adminList"); tb.innerHTML = "";
  admins.forEach(a=>{
    tb.innerHTML += `
      <tr>
        <td>${a.id}</td>
        <td>${a.name}</td>
        <td>${a.email}</td>
        <td>${a.phone || "-"}</td>
        <td>${a.active ? "Yes" : "No"}</td>
        <td>
          <button title="Edit" onclick="editAdmin(${a.id})">✏️</button>
          <button title="Ban/Unban" onclick="toggleAdmin(${a.id})">${a.active ? "Ban" : "Unban"}</button>
          <button title="Delete" onclick="deleteAdmin(${a.id})">❌</button>
        </td>
      </tr>`;
  });
}
function editAdmin(id){
  const a = admins.find(x=>x.id===id); if(!a) return;
  const name = prompt("Admin name:", a.name); if(name===null) return;
  const email= prompt("Email:", a.email); if(email===null) return;
  const phone= prompt("Phone:", a.phone||""); if(phone===null) return;
  Object.assign(a, {name, email, phone});
  renderAdmins();
}
function toggleAdmin(id){
  const a = admins.find(x=>x.id===id); if(!a) return;
  a.active = !a.active;
  renderAdmins();
}
function deleteAdmin(id){
  admins = admins.filter(x=>x.id!==id);
  renderAdmins(); updateDashboard();
}

/* ======= CUSTOMERS ======= */
function addCustomer(e){
  e.preventDefault();
  const name = $("#custName").value.trim();
  const email= $("#custEmail").value.trim();
  const phone= $("#custPhone").value.trim();
  const active = $("#custActive").checked;
  customers.push({ id: customers.length+1, name, email, phone, active });
  e.target.reset();
  renderCustomers();
  updateDashboard();
}
function renderCustomers(){
  const tb = $("#customerList"); tb.innerHTML="";
  customers.forEach(c=>{
    tb.innerHTML += `
      <tr>
        <td>${c.id}</td><td>${c.name}</td><td>${c.email||"-"}</td>
        <td>${c.phone||"-"}</td><td>${c.active?"Yes":"No"}</td>
        <td>
          <button onclick="editCustomer(${c.id})">✏️</button>
          <button onclick="deleteCustomer(${c.id})">❌</button>
        </td>
      </tr>`;
  });
}
function editCustomer(id){
  const c = customers.find(x=>x.id===id); if(!c) return;
  const name = prompt("Customer name:", c.name); if(name===null) return;
  const email= prompt("Email:", c.email||""); if(email===null) return;
  const phone= prompt("Phone:", c.phone||""); if(phone===null) return;
  const active= confirm("Active? OK = Yes, Cancel = No");
  Object.assign(c, {name, email, phone, active});
  renderCustomers();
}
function deleteCustomer(id){
  customers = customers.filter(x=>x.id!==id);
  renderCustomers(); updateDashboard();
}

/* ======= CATEGORIES ======= */
function addCategory(e){
  e.preventDefault();
  const name = $("#catName").value.trim();
  const desc = $("#catDesc").value.trim();
  const hidden = $("#catHidden").checked;
  categories.push({ id: categories.length+1, name, desc, status: hidden ? "Hidden" : "Visible" });
  e.target.reset();
  renderCategories(); refreshProductCategorySelect(); loadPosCategories();
  updateDashboard();
}
function renderCategories(){
  const tb = $("#categoryList"); tb.innerHTML="";
  categories.forEach(c=>{
    tb.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.status}</td>
        <td>
          <button onclick="editCategory(${c.id})">✏️</button>
          <button onclick="deleteCategory(${c.id})">❌</button>
        </td>
      </tr>`;
  });
}
function editCategory(id){
  const c = categories.find(x=>x.id===id); if(!c) return;
  const name = prompt("Category name:", c.name); if(name===null) return;
  const status= confirm("Hide category? OK=Hidden, Cancel=Visible");
  c.name = name; c.status = status ? "Hidden" : "Visible";
  renderCategories(); refreshProductCategorySelect(); loadPosCategories();
}
function deleteCategory(id){
  categories = categories.filter(x=>x.id!==id);
  renderCategories(); refreshProductCategorySelect(); loadPosCategories(); updateDashboard();
}
function refreshProductCategorySelect(){
  const sel = $("#prodCat"); if(!sel) return;
  sel.innerHTML = categories.map(c=>`<option value="${c.name}">${c.name}</option>`).join("");
}

/* ======= PRODUCTS ======= */
function addProduct(e){
  e.preventDefault();
  const cat  = $("#prodCat").value;
  const name = $("#prodName").value.trim();
  const desc = $("#prodDesc").value.trim();
  const price= parseFloat($("#prodPrice").value);
  const qty  = parseInt($("#prodQty").value);
  const hidden = $("#prodHidden").checked;

  // image -> convert to dataURL for preview
  const file = $("#prodImg").files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = () => {
      products.push({ id: products.length+1, cat, name, desc, price, qty, img: reader.result, status: hidden?"Hidden":"Visible" });
      afterProductAdded(e);
    };
    reader.readAsDataURL(file);
  } else {
    products.push({ id: products.length+1, cat, name, desc, price, qty, img: "https://via.placeholder.com/160x110?text=Item", status: hidden?"Hidden":"Visible" });
    afterProductAdded(e);
  }
}
function afterProductAdded(e){
  e.target.reset();
  renderProducts(); loadProducts(); updateDashboard();
}
function renderProducts(){
  const tb = $("#productList"); tb.innerHTML="";
  products.forEach(p=>{
    tb.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td><img src="${p.img}" alt="${p.name}" width="50" height="40" style="object-fit:cover;border-radius:6px"/></td>
        <td>${p.name}</td>
        <td>${p.cat}</td>
        <td>${(+p.price).toFixed(2)}</td>
        <td>${p.qty}</td>
        <td>${p.status}</td>
        <td>
          <button onclick="editProduct(${p.id})">✏️</button>
          <button onclick="deleteProduct(${p.id})">❌</button>
        </td>
      </tr>`;
  });
}
function editProduct(id){
  const p = products.find(x=>x.id===id); if(!p) return;
  const name = prompt("Product name:", p.name); if(name===null) return;
  const price= prompt("Price:", p.price); if(price===null) return;
  const qty  = prompt("Quantity:", p.qty); if(qty===null) return;
  const visible = confirm("Visible? OK=Visible, Cancel=Hidden");
  Object.assign(p, {name, price:parseFloat(price), qty:parseInt(qty), status: visible?"Visible":"Hidden"});
  renderProducts(); loadProducts();
}
function deleteProduct(id){
  products = products.filter(x=>x.id!==id);
  renderProducts(); loadProducts(); updateDashboard();
}

/* ======= POS: Sidebar + Grid + Cart ======= */
function loadPosCategories(){
  const ul = $("#posCategories");
  if(!ul) return;
  ul.innerHTML = `<li onclick="filterCategory('All')"><b>All</b></li>`;
  categories.filter(c=>c.status==="Visible").forEach(c=>{
    ul.innerHTML += `<li onclick="filterCategory('${c.name}')">${c.name}</li>`;
  });
}
function loadProducts(list = products){
  const grid = $("#productGrid"); if(!grid) return;
  grid.innerHTML = "";
  list.filter(p=>p.status==="Visible").forEach(p=>{
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}"/>
      <h4><b>${p.name}</b></h4>
      <p><b>${(+p.price).toFixed(2)} Birr</b></p>
    `;
    card.onclick = () => addToCart(p);
    grid.appendChild(card);
  });
}
function filterCategory(cat){
  if(cat==="All"){ loadProducts(); return; }
  loadProducts(products.filter(p=>p.cat===cat));
}
function searchProducts(q){
  q = (q||"").toLowerCase();
  loadProducts(products.filter(p=>p.name.toLowerCase().includes(q)));
}

/* Cart operations */
function addToCart(p){
  let item = cart.find(i=>i.id===p.id);
  if(item){ if(item.qty < p.qty) item.qty++; } // limit to stock
  else { cart.push({ id:p.id, name:p.name, price:+p.price, qty:1 }); }
  renderCart();
}
function renderCart(){
  const tb = $("#cartTable tbody"); tb.innerHTML = "";
  let total = 0;
  cart.forEach((it, idx)=>{
    const sub = it.price * it.qty; total += sub;
    tb.innerHTML += `
      <tr>
        <td>${it.name}</td>
        <td><input type="number" min="1" value="${it.qty}" onchange="updateQty(${idx}, this.value)"></td>
        <td>${it.price.toFixed(2)}</td>
        <td>${sub.toFixed(2)}</td>
        <td>
          <button title="Edit quantity" onclick="promptQty(${idx})">✏️</button>
          <button title="Delete" onclick="removeItem(${idx})">❌</button>
        </td>
      </tr>`;
  });
  $("#cartTotal").innerText = total.toFixed(2);
}
function updateQty(idx, val){
  val = parseInt(val||1);
  if(val<1) val=1;
  cart[idx].qty = val;
  renderCart();
}
function promptQty(idx){
  const v = prompt("Quantity:", cart[idx].qty);
  if(v===null) return;
  updateQty(idx, parseInt(v));
}
function removeItem(idx){ cart.splice(idx,1); renderCart(); }
function clearCart(){ cart = []; renderCart(); }

/* ======= Checkout / Orders ======= */
function checkout(){
  if(cart.length===0){ alert("Cart is empty."); return; }
  const payment = $("#paymentMode").value;
  const phone   = $("#orderPhone").value.trim();
  const time    = $("#orderTime").value ? $("#orderTime").value : "";
  const name    = getCustomerNameByPhone(phone) || "Walk-in";

  // date in ISO yyyy-mm-dd
  const dateISO = new Date().toISOString().slice(0,10);
  const total   = cart.reduce((a,b)=>a+b.price*b.qty,0);
  const id      = orders.length + 1;
  const tracking= "TRK-" + Date.now();

  const order = {
    id, tracking, name, phone: phone||"-", date: dateISO, status: "Paid",
    payment, total: +total.toFixed(2), time, items: cart.map(c=>({...c}))
  };
  orders.push(order);
  reduceInventory(order.items);
  renderOrders();
  updateDashboard();
  // Build invoice and show
  buildInvoice(order);
  clearCart();
  showSection('invoice');
}

function getCustomerNameByPhone(phone){
  if(!phone) return null;
  const c = customers.find(x=>x.phone === phone);
  return c ? c.name : null;
}
function reduceInventory(items){
  items.forEach(it=>{
    const p = products.find(x=>x.id===it.id);
    if(p) p.qty = Math.max(0, p.qty - it.qty);
  });
  renderProducts(); loadProducts();
}

/* Orders table + filters */
function renderOrders(){
  const dateF = $("#orderFilterDate").value;       // yyyy-mm-dd or ""
  const statF = $("#orderFilterStatus").value;     // "", Paid, Pending, Cancelled
  const payF  = $("#orderFilterPayment").value;    // "", Cash, Card, Tele Birr, E-birr, Online

  const tb = $("#orderList"); tb.innerHTML = "";
  let list = orders.slice().sort((a,b)=>b.id-a.id);
  if(dateF) list = list.filter(o=>o.date===dateF);
  if(statF) list = list.filter(o=>o.status===statF);
  if(payF)  list = list.filter(o=>o.payment===payF);

  list.forEach(o=>{
    tb.innerHTML += `
      <tr>
        <td>${o.id}</td>
        <td>${o.tracking}</td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${formatDMY(o.date)}</td>
        <td>${o.status}</td>
        <td>${o.payment}</td>
        <td>
          <button onclick="viewOrder(${o.id})">View</button>
          <button onclick="viewOrder(${o.id}, true)">Print</button>
        </td>
      </tr>`;
  });
}
function resetOrderFilters(){
  $("#orderFilterDate").value="";
  $("#orderFilterStatus").value="";
  $("#orderFilterPayment").value="";
  renderOrders();
}
function viewOrder(id, goPrint=false){
  const o = orders.find(x=>x.id===id); if(!o) return;
  buildInvoice(o);
  showSection('invoice');
  if(goPrint) setTimeout(()=>printReceipt('58'), 50);
}
function formatDMY(iso){ // 'yyyy-mm-dd' -> 'dd-mm-yyyy'
  if(!iso) return "-";
  const [y,m,d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/* ======= Invoice / Receipt ======= */
function buildInvoice(order){
  // Human readable invoice shown on screen (not the narrow receipt)
  const host = $("#invoiceContent");
  const itemsHtml = order.items.map(it => `
    <tr><td>${it.name}</td><td>${it.qty}</td><td>${it.price.toFixed(2)}</td><td>${(it.qty*it.price).toFixed(2)}</td></tr>
  `).join("");

  host.innerHTML = `
    <div class="card">
      <h3><b>Golden Eats</b></h3>
      <div><b>Tracking:</b> ${order.tracking}</div>
      <div><b>Customer:</b> ${order.name} | <b>Phone:</b> ${order.phone}</div>
      <div><b>Date:</b> ${formatDMY(order.date)} ${order.time ? `| <b>⏰</b> ${order.time}` : ""}</div>
      <div><b>Payment:</b> ${order.payment} | <b>Status:</b> ${order.status}</div>
      <hr/>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <h3 style="text-align:right">Total: <b>${order.total.toFixed(2)} Birr</b></h3>
    </div>
  `;

  // Build 58mm receipt
  const r58 = $("#receipt58");
  r58.innerHTML = receiptHTML(order, "58");

  // Build 80mm receipt
  const r80 = $("#receipt80");
  r80.innerHTML = receiptHTML(order, "80");
}

function receiptHTML(order, size){
  const items = order.items.map(it=>`
    <div class="row"><span>${it.name} x${it.qty}</span><span>${(it.qty*it.price).toFixed(2)}</span></div>
  `).join("");
  return `
    <div class="center"><b>Golden Eats</b></div>
    <div class="center">Addis Ababa, Oromia</div>
    <div class="center">Phone: +251-907453590</div>
    <hr/>
    <div><b>Invoice:</b> ${order.tracking}</div>
    <div><b>Date:</b> ${formatDMY(order.date)} ${order.time? `⏰ ${order.time}`:""}</div>
    <div><b>Customer:</b> ${order.name}</div>
    <div><b>Pay:</b> ${order.payment}</div>
    <hr/>
    ${items}
    <hr/>
    <div class="row"><b>Total</b><b>${order.total.toFixed(2)} Birr</b></div>
    <hr/>
    <div class="center">Thank you!</div>
  `;
}

/* Printing in 58mm or 80mm */
function printReceipt(kind){
  // Open a print window with only the wanted receipt
  const receiptNode = (kind==='58') ? $("#receipt58") : $("#receipt80");
  const w = window.open("", "_blank", "width=400,height=600");
  w.document.write(`
    <html>
    <head>
      <title>Receipt ${kind}mm</title>
      <style>
        body { margin:0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        .receipt { font-size:12px; color:#000; background:#fff; padding:6px; line-height:1.35; }
        .receipt-58 { width:48mm; }
        .receipt-80 { width:72mm; }
        .center { text-align:center; }
        .row { display:flex; justify-content:space-between; }
        hr { border:none; border-top:1px dashed #999; margin:6px 0; }
        @page { margin: 4mm; }
      </style>
    </head>
    <body>
      <div class="receipt ${kind==='58'?'receipt-58':'receipt-80'}">
        ${receiptNode.innerHTML}
      </div>
      <script>window.onload = () => window.print();<\/script>
    </body>
    </html>
  `);
  w.document.close();
}

/* ======= Seed some sample data for quick testing ======= */
function seed(){
  admins = [{id:1,name:"Owner",email:"owner@goldeneats.et",phone:"+251-900000000",active:true}];

  categories = [
    {id:1,name:"Breakfast",desc:"Morning meals",status:"Visible"},
    {id:2,name:"Lunch",desc:"Afternoon meals",status:"Visible"},
    {id:3,name:"Drinks",desc:"Beverages",status:"Visible"}
  ];

  products = [
    {id:1,cat:"Breakfast",name:"Egg Sandwich",desc:"",price:50,qty:20,img:"https://via.placeholder.com/160x110?text=Egg+Sandwich",status:"Visible"},
    {id:2,cat:"Lunch",name:"Pasta",desc:"",price:120,qty:15,img:"https://via.placeholder.com/160x110?text=Pasta",status:"Visible"},
    {id:3,cat:"Drinks",name:"Juice",desc:"",price:40,qty:30,img:"https://via.placeholder.com/160x110?text=Juice",status:"Visible"},
    {id:4,cat:"Lunch",name:"Burger",desc:"",price:80,qty:10,img:"https://via.placeholder.com/160x110?text=Burger",status:"Visible"}
  ];

  renderAdmins();
  renderCustomers();
  renderCategories();
  renderProducts();
  updateDashboard();
}

/* ==== Boot ==== */
window.onload = () => {
  seed();
  showSection('pos'); // start on POS screen
};