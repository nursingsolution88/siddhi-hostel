const CONFIG = {
  SPREADSHEET_ID: "PASTE_GOOGLE_SHEET_ID_HERE",
  OWNER_EMAIL: "PASTE_OWNER_EMAIL_HERE",
  HOSTEL_NAME: "Siddhi Hostel"
};

const STUDENT_HEADERS = ["id","name","fatherName","phone","email","room","joiningDate","monthlyFee","securityDeposit","previousDue","nextDue","active","aadhaar","address","lastReminderDate"];
const PAYMENT_HEADERS = ["receiptId","studentId","studentName","room","amount","mode","date"];

function doGet() {
  return jsonResponse({ok:true,data:{message:"Siddhi Hostel API is running"}});
}
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    let data;
    switch(body.action) {
      case "getAll": data = getAll(); break;
      case "addStudent": data = addStudent(body.student); break;
      case "addPayment": data = addPayment(body); break;
      case "leaveStudent": data = leaveStudent(body.id); break;
      case "sendReminder": data = sendReminderById(body.id); break;
      default: throw new Error("Unknown action");
    }
    return jsonResponse({ok:true,data});
  } catch(err) {
    return jsonResponse({ok:false,error:String(err.message || err)});
  }
}
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function ss() { return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); }
function ensureSheets() {
  const book = ss();
  let st = book.getSheetByName("Students");
  if (!st) st = book.insertSheet("Students");
  if (st.getLastRow() === 0) st.appendRow(STUDENT_HEADERS);
  let pt = book.getSheetByName("Payments");
  if (!pt) pt = book.insertSheet("Payments");
  if (pt.getLastRow() === 0) pt.appendRow(PAYMENT_HEADERS);
}
function rowsToObjects(sheetName) {
  ensureSheets();
  const sh = ss().getSheetByName(sheetName);
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r=>r.some(v=>v!=="")).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}
function appendObject(sheetName, headers, obj) {
  const sh = ss().getSheetByName(sheetName);
  sh.appendRow(headers.map(h=>obj[h] ?? ""));
}
function updateObject(sheetName, idField, id, patch) {
  const sh = ss().getSheetByName(sheetName);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf(idField);
  for (let r=1;r<values.length;r++) {
    if (String(values[r][idCol]) === String(id)) {
      Object.entries(patch).forEach(([k,v])=>{
        const c=headers.indexOf(k);
        if(c>=0) sh.getRange(r+1,c+1).setValue(v);
      });
      return;
    }
  }
  throw new Error("Record not found");
}
function isoDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "Asia/Kolkata", "yyyy-MM-dd");
}
function addMonth(dateStr) {
  const parts=String(dateStr).split("-").map(Number);
  const d=new Date(parts[0],parts[1]-1,parts[2]);
  const day=d.getDate();
  d.setMonth(d.getMonth()+1,1);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(day,last));
  return isoDate(d);
}
function status(nextDue) {
  const today=new Date(); today.setHours(0,0,0,0);
  const p=String(nextDue).split("-").map(Number);
  const due=new Date(p[0],p[1]-1,p[2]);
  const diff=Math.round((due-today)/86400000);
  if(diff<0)return {statusKey:"overdue",statusText:`${Math.abs(diff)} day overdue`,days:diff};
  if(diff===0)return {statusKey:"due",statusText:"Due today",days:0};
  return {statusKey:"upcoming",statusText:`${diff} day remaining`,days:diff};
}
function getAll() {
  const students=rowsToObjects("Students").map(s=>Object.assign(s,status(s.nextDue)));
  const payments=rowsToObjects("Payments").reverse();
  return {students,payments};
}
function addStudent(s) {
  ensureSheets();
  if(!s.name||!s.email||!s.room||!s.joiningDate||!s.monthlyFee) throw new Error("Required fields missing");
  const active=rowsToObjects("Students").filter(x=>x.active!=="No"&&Number(x.room)===Number(s.room));
  if(active.length>=3) throw new Error("Selected room is full");
  const obj={
    id:String(Date.now()), name:s.name, fatherName:s.fatherName||"", phone:s.phone||"", email:s.email,
    room:Number(s.room), joiningDate:s.joiningDate, monthlyFee:Number(s.monthlyFee),
    securityDeposit:Number(s.securityDeposit||0), previousDue:Number(s.previousDue||0),
    nextDue:addMonth(s.joiningDate), active:"Yes", aadhaar:s.aadhaar||"", address:s.address||"", lastReminderDate:""
  };
  appendObject("Students",STUDENT_HEADERS,obj);
  return obj;
}
function addPayment(body) {
  const students=rowsToObjects("Students");
  const s=students.find(x=>String(x.id)===String(body.studentId));
  if(!s)throw new Error("Student not found");
  const amount=Number(body.amount||0);
  const total=Number(s.monthlyFee||0)+Number(s.previousDue||0);
  const patch={};
  if(amount>=total){patch.previousDue=Math.min(0,total-amount);patch.nextDue=addMonth(s.nextDue)}
  else patch.previousDue=total-amount;
  updateObject("Students","id",s.id,patch);
  const p={receiptId:"RCPT-"+Date.now(),studentId:s.id,studentName:s.name,room:s.room,amount,mode:body.mode||"Cash",date:isoDate(new Date())};
  appendObject("Payments",PAYMENT_HEADERS,p);
  return p;
}
function leaveStudent(id) {
  updateObject("Students","id",id,{active:"No"});
  return {id};
}
function reminderHtml(s, overdue) {
  const total=Number(s.monthlyFee||0)+Number(s.previousDue||0);
  return `<div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:12px;overflow:hidden">
  <div style="background:#4f46e5;color:white;padding:18px"><h2>${CONFIG.HOSTEL_NAME}</h2></div>
  <div style="padding:20px"><p>Dear <b>${s.name}</b>,</p>
  <p>Your hostel fee is ${overdue?"<b style='color:red'>overdue</b>":"<b>due today</b>"}.</p>
  <p>Room: <b>${s.room}</b><br>Due Date: <b>${s.nextDue}</b><br>Monthly Fee: <b>₹${s.monthlyFee}</b><br>Previous Due: <b>₹${s.previousDue||0}</b></p>
  <p style="font-size:18px">Total Payable: <b>₹${total}</b></p>
  <p>Please deposit the fee as soon as possible.</p><p>Regards,<br><b>${CONFIG.HOSTEL_NAME}</b></p></div></div>`;
}
function sendReminderById(id) {
  const s=rowsToObjects("Students").find(x=>String(x.id)===String(id));
  if(!s)throw new Error("Student not found");
  const st=status(s.nextDue);
  MailApp.sendEmail({to:s.email,subject:st.statusKey==="overdue"?"Hostel Fee Overdue - Siddhi Hostel":"Hostel Fee Reminder - Siddhi Hostel",body:"Your hostel fee is due.",htmlBody:reminderHtml(s,st.statusKey==="overdue"),name:CONFIG.HOSTEL_NAME});
  updateObject("Students","id",id,{lastReminderDate:isoDate(new Date())});
  return {sent:true};
}
function dailyAutomation() {
  const students=rowsToObjects("Students").filter(s=>s.active!=="No");
  const today=isoDate(new Date());
  const due=[];
  students.forEach(s=>{
    const st=status(s.nextDue);
    if((st.days===0||st.days===-3) && s.lastReminderDate!==today){
      try{sendReminderById(s.id)}catch(err){Logger.log(err)}
    }
    if(st.days<=0)due.push(s);
  });
  if(CONFIG.OWNER_EMAIL && due.length){
    const lines=due.map(s=>`${s.name} | Room ${s.room} | Due ${s.nextDue} | ₹${Number(s.monthlyFee)+Number(s.previousDue||0)}`).join("\n");
    MailApp.sendEmail(CONFIG.OWNER_EMAIL,`Siddhi Hostel Daily Due Summary (${due.length})`,`Total due students: ${due.length}\n\n${lines}`);
  }
}
function createDailyTrigger() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==="dailyAutomation").forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("dailyAutomation").timeBased().everyDays(1).atHour(8).create();
}
function setup() {
  ensureSheets();
  createDailyTrigger();
}
