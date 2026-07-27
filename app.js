const API_URL_KEY = "siddhi_script_url";
const STORE_KEY = "siddhi_hotel_data_v1";
const SETTINGS_KEY = "siddhi_hotel_settings_v1";

const seed = {
  rooms: [
    {roomId:"R101",roomNumber:"101",floor:"1",roomType:"Deluxe",bedType:"King",capacity:2,price:1800,status:"Available",cleaningStatus:"Completed"},
    {roomId:"R102",roomNumber:"102",floor:"1",roomType:"Standard",bedType:"Double",capacity:2,price:1300,status:"Occupied",cleaningStatus:"Completed"},
    {roomId:"R103",roomNumber:"103",floor:"1",roomType:"Family",bedType:"King",capacity:4,price:2400,status:"Reserved",cleaningStatus:"Completed"},
    {roomId:"R201",roomNumber:"201",floor:"2",roomType:"Super Deluxe",bedType:"King",capacity:2,price:2200,status:"Cleaning",cleaningStatus:"Pending"}
  ],
  bookings: [
    {bookingId:"SB1001",bookingDate:today(),guestName:"Rahul Sharma",mobile:"9876543210",roomNumber:"102",roomType:"Standard",checkInDate:today(),checkOutDate:addDays(2),adults:2,children:0,roomCharges:2600,advance:1000,totalAmount:2600,pendingAmount:1600,source:"Walk-in",status:"Checked-in",specialRequest:""},
    {bookingId:"SB1002",bookingDate:today(),guestName:"Priya Meena",mobile:"9898989898",roomNumber:"103",roomType:"Family",checkInDate:addDays(1),checkOutDate:addDays(3),adults:3,children:1,roomCharges:4800,advance:2000,totalAmount:4800,pendingAmount:2800,source:"Phone",status:"Confirmed",specialRequest:"Extra blanket"}
  ],
  payments: [{paymentId:"PAY1001",bookingId:"SB1001",guestName:"Rahul Sharma",date:today(),amount:1000,method:"UPI",type:"Advance"}],
  expenses: [{expenseId:"EXP1001",date:today(),category:"Cleaning Material",description:"Room cleaning supplies",vendor:"Local Store",amount:850,method:"Cash"}]
};

let db = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || structuredClone(seed);
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {scriptUrl:"",hotelWhatsApp:"",hotelAddress:""};

function today(){ return new Date().toISOString().slice(0,10); }
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function money(n){ return "₹"+Number(n||0).toLocaleString("en-IN"); }
function saveLocal(){ localStorage.setItem(STORE_KEY,JSON.stringify(db)); renderAll(); }
function showToast(msg){ const t=document.querySelector("#toast"); t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200); }
function badge(v){ return `<span class="badge ${String(v).replaceAll(" ","-")}">${v}</span>`; }

async function api(action,payload={}){
  const url=settings.scriptUrl;
  if(!url) return null;
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,payload})});
  const data=await res.json();
  if(!data.ok) throw new Error(data.error||"API error");
  return data.data;
}

document.querySelector("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const u=document.querySelector("#loginUsername").value;
  const p=document.querySelector("#loginPassword").value;
  if(u==="admin"&&p==="admin123"){
    document.querySelector("#loginScreen").classList.add("hidden");
    document.querySelector("#app").classList.remove("hidden");
    renderAll();
  } else showToast("Invalid username or password");
});
document.querySelector("#logoutBtn").onclick=()=>location.reload();
document.querySelector("#todayLabel").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view,b)));
document.querySelectorAll("[data-view-jump]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.viewJump)));
function switchView(id,btn){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));
  document.querySelector("#"+id).classList.add("active-view");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===id));
  document.querySelector("#pageTitle").textContent=id[0].toUpperCase()+id.slice(1);
}

document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>document.querySelector("#"+b.dataset.open).showModal()));
document.querySelector("#quickBookingBtn").onclick=()=>document.querySelector("#bookingModal").showModal();

function renderAll(){
  renderDashboard();renderBookings();renderRooms();renderPayments();renderExpenses();renderHousekeeping();renderReports();renderSelects();
  document.querySelector("#scriptUrl").value=settings.scriptUrl||"";
  document.querySelector("#hotelWhatsApp").value=settings.hotelWhatsApp||"";
  document.querySelector("#hotelAddress").value=settings.hotelAddress||"";
}

function renderDashboard(){
  const total=db.rooms.length, available=db.rooms.filter(r=>r.status==="Available").length, occupied=db.rooms.filter(r=>r.status==="Occupied").length;
  const checkins=db.bookings.filter(b=>b.checkInDate===today()).length;
  const income=db.payments.filter(p=>p.date===today()&&p.type!=="Refund").reduce((s,p)=>s+Number(p.amount),0);
  const pending=db.bookings.reduce((s,b)=>s+Number(b.pendingAmount||0),0);
  ["TotalRooms","Available","Occupied","Checkins"].forEach((k,i)=>document.querySelector("#kpi"+k).textContent=[total,available,occupied,checkins][i]);
  document.querySelector("#kpiIncome").textContent=money(income); document.querySelector("#kpiPending").textContent=money(pending);
  const statuses=["Available","Occupied","Reserved","Cleaning","Maintenance"];
  document.querySelector("#roomStatusChart").innerHTML=statuses.map(s=>{
    const n=db.rooms.filter(r=>r.status===s).length,p=total?Math.round(n/total*100):0;
    return `<div class="bar-row"><span>${s}</span><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div><strong>${n}</strong></div>`;
  }).join("");
  document.querySelector("#recentBookingsBody").innerHTML=db.bookings.slice().reverse().slice(0,5).map(b=>`<tr><td>${b.bookingId}</td><td>${b.guestName}</td><td>${b.roomNumber}</td><td>${b.checkInDate}</td><td>${badge(b.status)}</td><td>${money(b.pendingAmount)}</td></tr>`).join("");
}

function renderBookings(filter=""){
  const f=filter.toLowerCase();
  document.querySelector("#bookingsBody").innerHTML=db.bookings.filter(b=>JSON.stringify(b).toLowerCase().includes(f)).map(b=>`<tr>
    <td>${b.bookingId}</td><td>${b.guestName}</td><td>${b.mobile}</td><td>${b.roomNumber}</td><td>${b.checkInDate}</td><td>${b.checkOutDate}</td>
    <td>${money(b.totalAmount)}</td><td>${money(b.pendingAmount)}</td><td>${badge(b.status)}</td>
    <td><button class="action-link" onclick="whatsappBooking('${b.bookingId}')">WhatsApp</button><button class="action-link" onclick="checkout('${b.bookingId}')">Checkout</button></td></tr>`).join("");
}
document.querySelector("#bookingSearch").addEventListener("input",e=>renderBookings(e.target.value));

function renderRooms(){
  document.querySelector("#roomsGrid").innerHTML=db.rooms.map(r=>`<article class="room-card">
    <div class="room-top"><div><div class="room-number">${r.roomNumber}</div><div class="room-meta">Floor ${r.floor} • ${r.roomType}</div></div>${badge(r.status)}</div>
    <div>Bed: ${r.bedType} • Capacity: ${r.capacity}</div><div class="room-price">${money(r.price)} / night</div>
    <div class="room-actions"><button onclick="setRoomStatus('${r.roomNumber}','Available')">Available</button><button onclick="setRoomStatus('${r.roomNumber}','Cleaning')">Cleaning</button></div>
  </article>`).join("");
}

function renderPayments(){
  document.querySelector("#paymentsBody").innerHTML=db.payments.slice().reverse().map(p=>`<tr><td>${p.paymentId}</td><td>${p.bookingId}</td><td>${p.guestName}</td><td>${p.date}</td><td>${money(p.amount)}</td><td>${p.method}</td><td>${p.type}</td></tr>`).join("");
}
function renderExpenses(){
  document.querySelector("#expensesBody").innerHTML=db.expenses.slice().reverse().map(x=>`<tr><td>${x.expenseId}</td><td>${x.date}</td><td>${x.category}</td><td>${x.description}</td><td>${x.vendor||"-"}</td><td>${money(x.amount)}</td><td>${x.method}</td></tr>`).join("");
}
function renderHousekeeping(){
  document.querySelector("#housekeepingGrid").innerHTML=db.rooms.map(r=>`<article class="room-card"><div class="room-top"><div class="room-number">${r.roomNumber}</div>${badge(r.cleaningStatus)}</div><div class="room-meta">${r.roomType} • ${r.status}</div><div class="room-actions"><button onclick="cleanRoom('${r.roomNumber}')">Mark Clean</button></div></article>`).join("");
}
function renderReports(){
  const rev=db.payments.filter(p=>p.type!=="Refund").reduce((s,p)=>s+Number(p.amount),0);
  const exp=db.expenses.reduce((s,x)=>s+Number(x.amount),0);
  const occ=db.rooms.length?Math.round(db.rooms.filter(r=>r.status==="Occupied").length/db.rooms.length*100):0;
  document.querySelector("#reportRevenue").textContent=money(rev);document.querySelector("#reportExpense").textContent=money(exp);document.querySelector("#reportNet").textContent=money(rev-exp);document.querySelector("#reportOccupancy").textContent=occ+"%";
}
function renderSelects(){
  document.querySelector("#bookingRoomSelect").innerHTML='<option value="">Select room</option>'+db.rooms.filter(r=>["Available","Reserved"].includes(r.status)).map(r=>`<option value="${r.roomNumber}">${r.roomNumber} - ${r.roomType}</option>`).join("");
  document.querySelector("#paymentBookingSelect").innerHTML='<option value="">Select booking</option>'+db.bookings.map(b=>`<option value="${b.bookingId}">${b.bookingId} - ${b.guestName}</option>`).join("");
}
document.querySelector("#bookingRoomSelect").addEventListener("change",e=>{
  const r=db.rooms.find(x=>x.roomNumber===e.target.value);
  document.querySelector("#bookingRoomType").value=r?.roomType||"";
  document.querySelector("#bookingRoomCharges").value=r?.price||0;
});

document.querySelector("#bookingForm").addEventListener("submit",async e=>{
  e.preventDefault(); const f=Object.fromEntries(new FormData(e.target));
  const nights=Math.max(1,Math.ceil((new Date(f.checkOutDate)-new Date(f.checkInDate))/86400000));
  const total=Number(f.roomCharges)*nights, advance=Number(f.advance||0);
  const row={bookingId:"SB"+Date.now().toString().slice(-7),bookingDate:today(),guestName:f.guestName,mobile:f.mobile,roomNumber:f.roomNumber,roomType:f.roomType,checkInDate:f.checkInDate,checkOutDate:f.checkOutDate,adults:Number(f.adults),children:Number(f.children),roomCharges:total,advance,totalAmount:total,pendingAmount:Math.max(0,total-advance),source:f.source,status:f.status,specialRequest:f.specialRequest};
  db.bookings.push(row); const room=db.rooms.find(r=>r.roomNumber===row.roomNumber); if(room) room.status=row.status==="Checked-in"?"Occupied":"Reserved";
  if(advance>0) db.payments.push({paymentId:"PAY"+Date.now().toString().slice(-7),bookingId:row.bookingId,guestName:row.guestName,date:today(),amount:advance,method:"Cash",type:"Advance"});
  saveLocal();e.target.reset();document.querySelector("#bookingModal").close();showToast("Booking saved");
  try{await api("createBooking",row)}catch(err){showToast("Saved locally; Sheet sync failed")}
});
document.querySelector("#roomForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
  const row={roomId:"R"+f.roomNumber,roomNumber:f.roomNumber,floor:f.floor,roomType:f.roomType,bedType:f.bedType,capacity:Number(f.capacity),price:Number(f.price),status:f.status,cleaningStatus:f.cleaningStatus};
  db.rooms.push(row);saveLocal();e.target.reset();document.querySelector("#roomModal").close();showToast("Room added");
  try{await api("createRoom",row)}catch(err){}
});
document.querySelector("#paymentForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const b=db.bookings.find(x=>x.bookingId===f.bookingId);
  const row={paymentId:"PAY"+Date.now().toString().slice(-7),bookingId:f.bookingId,guestName:b?.guestName||"",date:today(),amount:Number(f.amount),method:f.method,type:f.type};
  db.payments.push(row);if(b&&f.type!=="Refund") b.pendingAmount=Math.max(0,Number(b.pendingAmount)-Number(f.amount));saveLocal();e.target.reset();document.querySelector("#paymentModal").close();showToast("Payment saved");
  try{await api("createPayment",row)}catch(err){}
});
document.querySelector("#expenseForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const row={expenseId:"EXP"+Date.now().toString().slice(-7),date:today(),category:f.category,description:f.description,vendor:f.vendor,amount:Number(f.amount),method:f.method};
  db.expenses.push(row);saveLocal();e.target.reset();document.querySelector("#expenseModal").close();showToast("Expense saved");
  try{await api("createExpense",row)}catch(err){}
});
document.querySelector("#saveSettingsBtn").onclick=()=>{
  settings={scriptUrl:document.querySelector("#scriptUrl").value.trim(),hotelWhatsApp:document.querySelector("#hotelWhatsApp").value.trim(),hotelAddress:document.querySelector("#hotelAddress").value.trim()};
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));showToast("Settings saved");
};
document.querySelector("#syncBtn").onclick=async()=>{
  if(!settings.scriptUrl){switchView("settings");showToast("Add Apps Script URL first");return}
  try{const data=await api("getAll");if(data){db=data;saveLocal();showToast("Google Sheet synced")}}catch(err){showToast("Sync failed: "+err.message)}
};

window.setRoomStatus=async(num,status)=>{const r=db.rooms.find(x=>x.roomNumber===num);if(!r)return;r.status=status;if(status==="Available")r.cleaningStatus="Completed";saveLocal();try{await api("updateRoom",r)}catch(e){}};
window.cleanRoom=async num=>{const r=db.rooms.find(x=>x.roomNumber===num);if(!r)return;r.cleaningStatus="Completed";r.status="Available";saveLocal();showToast("Room marked available");try{await api("updateRoom",r)}catch(e){}};
window.checkout=async id=>{const b=db.bookings.find(x=>x.bookingId===id);if(!b)return;b.status="Checked-out";const r=db.rooms.find(x=>x.roomNumber===b.roomNumber);if(r){r.status="Cleaning";r.cleaningStatus="Pending"}saveLocal();showToast("Guest checked out");try{await api("updateBooking",b)}catch(e){}};
window.whatsappBooking=id=>{const b=db.bookings.find(x=>x.bookingId===id);if(!b)return;const msg=`Namaste ${b.guestName},\n\nSiddhi Hotel me aapki booking confirm hai.\nBooking ID: ${b.bookingId}\nRoom: ${b.roomNumber}\nCheck-in: ${b.checkInDate}\nCheck-out: ${b.checkOutDate}\nTotal: ${money(b.totalAmount)}\nPending: ${money(b.pendingAmount)}\n\nThank you,\nSiddhi Hotel`;window.open(`https://wa.me/91${String(b.mobile).replace(/\D/g,"").slice(-10)}?text=${encodeURIComponent(msg)}`,"_blank")};

document.querySelector("#exportBookingsBtn").onclick=()=>{
  if(!db.bookings.length)return;const keys=Object.keys(db.bookings[0]);const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;const csv=[keys.join(","),...db.bookings.map(r=>keys.map(k=>esc(r[k])).join(","))].join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="siddhi_hotel_bookings.csv";a.click();
};
renderAll();
