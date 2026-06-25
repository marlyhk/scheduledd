
window.addEventListener("error", function(e){
  try{
    const app=document.getElementById("app");
    const splash=document.getElementById("splash");
    if(splash)splash.classList.add("hidden");
    if(app)app.classList.remove("hidden");
    const dash=document.getElementById("dashboard");
    const login=document.getElementById("loginPage");
    const target=document.getElementById("content")||login||app;
    if(target){
      target.innerHTML=`<div class="error-card"><h2>Something broke</h2><p>The website hit an error instead of staying blank.</p><p class="muted">${String(e.message||"Unknown error")}</p><button onclick="location.reload()">Reload</button></div>`;
    }
  }catch(err){}
});
window.addEventListener("unhandledrejection", function(e){
  try{
    const target=document.getElementById("content")||document.getElementById("loginPage")||document.getElementById("app");
    if(target){
      target.innerHTML=`<div class="error-card"><h2>Something broke</h2><p class="muted">${String((e.reason&&e.reason.message)||e.reason||"Unknown error")}</p><button onclick="location.reload()">Reload</button></div>`;
    }
  }catch(err){}
});
function toggleMenu(){
  const tabs=$("tabs");
  if(!tabs)return;
  tabs.classList.toggle("open");
  let backdrop=document.getElementById("menuBackdrop");
  if(tabs.classList.contains("open")){
    if(!backdrop){
      backdrop=document.createElement("div");
      backdrop.id="menuBackdrop";
      backdrop.className="menu-backdrop";
      backdrop.onclick=toggleMenu;
      document.body.appendChild(backdrop);
    }
  }else if(backdrop){
    backdrop.remove();
  }
}
function closeMenu(){
  const tabs=$("tabs");
  if(tabs)tabs.classList.remove("open");
  const backdrop=document.getElementById("menuBackdrop");
  if(backdrop)backdrop.remove();
}


function emailKey(email){
  return String(email||"").trim().toLowerCase().replace(/\./g,",");
}
function pendingKey(email){return emailKey(email)}
async function savePreparedProfileByEmail(email, profileData){
  const key=emailKey(email);
  await db.ref("pendingProfiles/"+key).set(profileData);
  await db.ref("profilesByEmail/"+key).set(profileData);
}
async function applyPendingProfileIfAny(u){
  const key=emailKey(u.email);
  let snap=await db.ref("pendingProfiles/"+key).once("value");
  let prepared=snap.val();
  if(!prepared){
    snap=await db.ref("profilesByEmail/"+key).once("value");
    prepared=snap.val();
  }
  if(!prepared)return null;
  const linked={...prepared,uid:u.uid,email:u.email,removed:false,linkedAt:Date.now()};
  await db.ref("users/"+u.uid).set(linked);
  await db.ref("pendingProfiles/"+key).remove();
  return linked;
}

const firebaseConfig={apiKey:"AIzaSyBK-Iu_TKXq7-PjIDOxXvwp2MDYXikQV8Y",authDomain:"scheduled-ed.firebaseapp.com",databaseURL:"https://scheduled-ed-default-rtdb.europe-west1.firebasedatabase.app",projectId:"scheduled-ed",storageBucket:"scheduled-ed.firebasestorage.app",messagingSenderId:"1057147687553",appId:"1:1057147687553:web:2c76219c0b97e2e9b3f380",measurementId:"G-QF774WZ4ER"};
firebase.initializeApp(firebaseConfig);
const secondaryApp=firebase.initializeApp(firebaseConfig,"Secondary");
const secondaryAuth=secondaryApp.auth();
const auth=firebase.auth(),db=firebase.database();
const ADMIN_WHATSAPP="96176174738";
const SITE_URL="https://scheduledeu.vercel.app/";
const $=id=>document.getElementById(id);
const money=n=>"$"+Number(n||0).toFixed(Number.isInteger(Number(n))?0:2);
let currentUser=null,profile=null,DATA={users:{},availability:{},bookings:{},documents:{},courses:{},unavailable:{},accessRequests:{},pendingProfiles:{},publicTutors:{},profilesByEmail:{}};
let preselectTutorId=null;

setTimeout(()=>{$("splash").classList.add("hidden");$("app").classList.remove("hidden")},800);
function notice(m){$("notice").textContent=m;$("notice").classList.remove("hidden")}
function cleanPhone(p){return String(p||"").replace(/[^\d]/g,"")}
function openWhatsApp(phone,msg){const p=cleanPhone(phone);if(!p)return alert("No WhatsApp number saved.");window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`,"_blank")}

function openRequestAccessForm(prefillCourses=""){
  $("loginPage").innerHTML=`<div class="login-card">
    <button class="ghost" onclick="location.reload()">← Back to Login</button>
    <div class="brand">
      <img src="scheduled-icon.jpeg" alt="Scheduled" onerror="this.style.display='none'">
      <h1 class="brand-word">Request Access</h1>
      <p>Submit your details so admin can create your Scheduled account.</p>
    </div>
    <div id="notice" class="notice hidden"></div>
    <label>Full Name</label>
    <input id="reqName" placeholder="Full name">
    <label>Email Address</label>
    <input id="reqEmail" type="email" placeholder="Email address">
    <label>Phone Number</label>
    <input id="reqPhone" placeholder="Phone number">
    <label>University</label>
    <input id="reqUniversity" placeholder="University">
    <label>Course(s) Needed</label>
    <input id="reqCourses" placeholder="Course(s) needed" value="${prefillCourses||""}">
    <label>Message</label>
    <textarea id="reqMessage" placeholder="Message (optional)"></textarea>
    <button onclick="submitAccessRequest()">Submit Request</button>
  </div>`;
}
function toggleRequestAccess(){
  if($("requestAccess")){
    $("requestAccess").classList.toggle("hidden");
  }else{
    openRequestAccessForm();
  }
}

async function submitAccessRequest(){
  try{
    const name=($("reqName")?.value||"").trim();
    const email=($("reqEmail")?.value||"").trim();
    const phone=($("reqPhone")?.value||"").trim();
    const university=($("reqUniversity")?.value||"").trim();
    const courses=($("reqCourses")?.value||"").trim();
    const message=($("reqMessage")?.value||"").trim();

    if(!name||!email||!phone||!university||!courses){
      return notice("Please fill full name, email, phone number, university, and course(s) needed.");
    }

    await db.ref("accessRequests").push({name,email,phone,university,courses,message,status:"pending",createdAt:Date.now()});
    ["reqName","reqEmail","reqPhone","reqUniversity","reqCourses","reqMessage"].forEach(id=>{if($(id))$(id).value=""});
    notice("Access request submitted. We will contact you after review.");
  }catch(e){
    notice(e.message || "Could not submit request. Please try again.");
  }
}
function becomeTutorWhatsapp(){openWhatsApp(ADMIN_WHATSAPP,`Hi! I'd like to become a tutor on Scheduled.\n\nName:\nUniversity:\nDegree:\nCourses I teach:\nHourly Rate:\nTeaching Locations:\nPhone Number:\nEmail:\nYears of Tutoring Experience (optional):\n\nThank you!`)}

async function loadData(){const s=await db.ref("/").once("value");const v=s.val()||{};DATA={users:v.users||{},availability:v.availability||{},bookings:v.bookings||{},documents:v.documents||{},courses:v.courses||{},unavailable:v.unavailable||{},accessRequests:v.accessRequests||{},pendingProfiles:v.pendingProfiles||{},publicTutors:v.publicTutors||{},profilesByEmail:v.profilesByEmail||{}}}
auth.onAuthStateChanged(async u=>{
  if(!u)return;
  currentUser=u;

  let s=await db.ref("users/"+u.uid).once("value");
  profile=s.val();

  if(!profile){
    profile=await applyPendingProfileIfAny(u);
  }

  if(!profile||profile.removed){
    notice("This email is not linked to any Scheduled account yet. Ask admin to add this email in Tutors or Students first.");
    await auth.signOut();
    return;
  }

  await loadData();
  profile={...profile,...(DATA.users[u.uid]||{})};
  $("loginPage").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  $("roleLabel").textContent=`${profile.name} • ${profile.role.toUpperCase()}`;
  renderTabs();
});
async function login(){try{await auth.signInWithEmailAndPassword($("loginEmail").value.trim(),$("loginPassword").value.trim())}catch(e){notice(e.message)}}
async function logout(){await auth.signOut();location.reload()}

function list(o){return Object.entries(o||{}).map(([id,v])=>({id,...v}))}
function user(id){return DATA.users[id]||{}}
function tutors(){return list(DATA.users).filter(u=>u.role==="tutor"&&!u.removed).sort((a,b)=>(a.name||"").localeCompare(b.name||""))}
function students(){return list(DATA.users).filter(u=>u.role==="student"&&!u.removed).sort((a,b)=>(a.name||"").localeCompare(b.name||""))}
function safe(s){return String(s||"").replace(/[.#$/\[\]]/g,"_")}
function total(b){return(b.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0)}
function paid(bs){return bs.flatMap(b=>b.payments||[]).filter(p=>p.paid).reduce((s,p)=>s+Number(p.amount||0),0)}
function unpaid(bs){return bs.flatMap(b=>b.payments||[]).filter(p=>!p.paid).reduce((s,p)=>s+Number(p.amount||0),0)}
function badge(p){return`<span class="badge ${p?'paid':'unpaid'}">${p?'Paid':'Unpaid'}</span>`}
function method(l){return(l||"").toLowerCase().includes("online")?"Whish":"Cash"}
function allCourseNames(){let names=[];tutors().forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));return[...new Set(names.filter(Boolean))].sort((a,b)=>a.localeCompare(b))}
function allUniversityNames(){let names=tutors().map(t=>t.university).filter(Boolean);return[...new Set(names)].sort((a,b)=>a.localeCompare(b))}
function tutorsForCourse(course){return tutors().filter(t=>(t.courses||[]).includes(course))}
function tutorsForCourseAndUniversity(course,university){return tutorsForCourse(course).filter(t=>!university||t.university===university).sort((a,b)=>(a.name||"").localeCompare(b.name||""))}
function myBookings(){let b=list(DATA.bookings);if(profile.role==="admin")return b;if(profile.role==="tutor")return b.filter(x=>x.tutorId===currentUser.uid);return b.filter(x=>x.studentId===currentUser.uid)}
function toMin(t){let [h,m]=(t||"00:00").split(":").map(Number);return h*60+m}
function toTime(min){let h=Math.floor(min/60),m=min%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}

function formatTime12(t){
  if(!t)return "";
  let [h,m]=String(t).split(":").map(Number);
  const ap=h>=12?"PM":"AM";
  h=h%12;if(h===0)h=12;
  return `${h}:${String(m||0).padStart(2,"0")} ${ap}`;
}
function localISODate(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function tutorPhoto(t){return t.photoUrl||t.photo||"scheduled-icon.jpeg"}
function overlaps(a1,a2,b1,b2){return a1<b2&&b1<a2}
function isTutorUnavailable(tutorId,date){return list(DATA.unavailable).some(u=>u.tutorId===tutorId&&u.date===date)}
function candidateWorks(tutorId,studentId,date,start,duration){const s=toMin(start),e=s+Number(duration)*60;const bookings=list(DATA.bookings).filter(b=>b.tutorId===tutorId&&b.date===date&&!b.deleted&&!b.done);for(const b of bookings){const bs=toMin(b.start),be=bs+Number(b.duration||1)*60,same=b.studentId===studentId,buffer=same?0:15;if(overlaps(s,e,bs-buffer,be+buffer))return false}return true}
function normText(x){return String(x||"").trim().toLowerCase().replace(/\s+/g," ")}
function localISODate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function availabilityFor(tutorId,date,course){
  const wanted=normText(course);
  return list(DATA.availability).filter(a=>{
    if(a.tutorId!==tutorId||a.date!==date)return false;

    // New format: courses array.
    if(Array.isArray(a.courses)&&a.courses.length){
      return a.courses.some(c=>normText(c)===wanted);
    }

    // Older formats / fallback:
    // If no course field exists, treat this availability as general availability for this tutor.
    if(!a.course && !a.courses)return true;

    // If single course field exists, compare normalized text.
    if(a.course)return normText(a.course)===wanted;

    return true;
  });
}
function generateSlots(tutorId,date,duration,course){
  if(!date||!duration||!course||isTutorUnavailable(tutorId,date))return[];
  const av=availabilityFor(tutorId,date,course);
  let slots=[];
  for(const a of av){
    let start=toMin(a.start),end=toMin(a.end)+15;
    for(let t=start;t+Number(duration)*60<=end;t+=30){
      const time=toTime(t);
      if(candidateWorks(tutorId,currentUser?.uid||"",date,time,duration))slots.push(time);
    }
  }
  return[...new Set(slots)].sort();
}
function slotLocationOptions(tutorId,date,time,duration,course){
  const av=availabilityFor(tutorId,date,course).filter(a=>toMin(a.start)<=toMin(time)&&toMin(a.end)+15>=toMin(time)+Number(duration)*60);
  let locations=[];
  av.forEach(a=>{
    if(Array.isArray(a.locations)&&a.locations.length)locations.push(...a.locations);
    else if(a.location)locations.push(a.location);
    else locations.push("Online");
  });
  return[...new Set(locations)];
}
function dayHasAvailable(tutorId,date,course){return generateSlots(tutorId,date,1,course).length>0}
function selectedLocations(prefix=""){const online=$(prefix+"locOnline")?.checked,campus=$(prefix+"locCampus")?.checked,both=$(prefix+"locBoth")?.checked,campusName=($(prefix+"campusName")?.value||"").trim();let locations=[];if(online)locations.push("Online");if(campus){if(!campusName)return{error:"Please specify campus name."};locations.push(`On Campus (${campusName})`)}if(both){if(!campusName)return{error:"Please specify campus name."};locations.push("Online",`On Campus (${campusName})`)}locations=[...new Set(locations)];if(!locations.length)return{error:"Please choose Online, On Campus, or Both."};return{locations,campusName}}
function paymentSummary(b){return(b.payments||[]).map((p,i)=>`${p.name}: ${money(p.amount)} ${badge(p.paid)}`).join("<br>")}
function studentTutors(studentId){
  const bookingIds=list(DATA.bookings).filter(b=>b.studentId===studentId).map(b=>b.tutorId);
  const assignedIds=assignedTutorIdsForStudent(studentId);
  const ids=[...new Set([...bookingIds,...assignedIds])];
  return ids.map(id=>({id,...user(id)})).filter(t=>t.role==="tutor"&&!t.removed);
}
function myTutorsPage(){let ts=studentTutors(currentUser.uid);$("content").innerHTML=`<div class="card"><h2>My Tutors</h2>${ts.length?`<div class="grid">${ts.map(t=>{let bs=list(DATA.bookings).filter(b=>b.studentId===currentUser.uid&&b.tutorId===t.id);return`<div class="card"><h3>${t.name}</h3><p>${t.university||""}</p><p>${(t.courses||[]).join(", ")}</p><button class="whatsapp" onclick="openWhatsApp('${t.whatsapp||""}','Hi, I have a question about my tutoring session on Scheduled.')">Contact Tutor on WhatsApp</button><button onclick="bookWithTutor('${t.id}')">Book a New Session</button><hr><b>Upcoming</b><br>${bs.filter(b=>!b.done).map(b=>`${b.date} • ${b.course} • ${formatTime12(b.start)}`).join("<br>")||"<span class='muted'>None</span>"}<hr><b>Past</b><br>${bs.filter(b=>b.done).map(b=>`${b.date} • ${b.course} • ${formatTime12(b.start)}`).join("<br>")||"<span class='muted'>None</span>"}</div>`}).join("")}</div>`:`<p class="muted">No tutors yet. Book a session first.</p>`}</div>`}
function bookWithTutor(id, course=""){
  preselectTutorId=id;
  window.preselectCourse=course||"";
  openTab("Book");
}
function myStudentsPage(){
  const bookedIds=list(DATA.bookings).filter(b=>b.tutorId===currentUser.uid).map(b=>b.studentId);
  const assignedIds=assignedStudentsForTutor(currentUser.uid).map(s=>s.id);
  const ids=[...new Set([...bookedIds,...assignedIds])];
  const ss=ids.map(id=>({id,...user(id)})).filter(s=>s.role==="student");

  $("content").innerHTML=`<div class="card"><h2>My Students</h2>${ss.length?`<div class="grid">${ss.map(s=>{
    let bs=list(DATA.bookings).filter(b=>b.tutorId===currentUser.uid&&b.studentId===s.id);
    return `<div class="card"><h3>${s.name}</h3>
      <p>${s.email||""}<br>${s.phone||""}</p>
      <p class="assigned-list">${assignedTutorIdsForStudent(s.id).includes(currentUser.uid)?"Assigned student":"Booked student"}</p>
      <b>Upcoming</b><br>${bs.filter(b=>!b.done).map(b=>`${b.date} • ${b.course} • ${typeof formatTime12==="function"?formatTime12(b.start):b.start}`).join("<br>")||"<span class='muted'>None</span>"}
      <hr><b>Past</b><br>${bs.filter(b=>b.done).map(b=>`${b.date} • ${b.course} • ${typeof formatTime12==="function"?formatTime12(b.start):b.start}`).join("<br>")||"<span class='muted'>None</span>"}
      <hr><b>Unpaid:</b> ${money(unpaid(bs))}</div>`;
  }).join("")}</div>`:`<p class="muted">No students yet. Students appear here after booking with you or when admin assigns them to you.</p>`}</div>`;
}
function financialPage(){
  let b=myBookings(),month=new Date().toISOString().slice(0,7),mb=b.filter(x=>(x.date||"").startsWith(month));
  $("content").innerHTML=`<div class="grid"><div class="card"><h3>Total Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Total Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>This Month Paid</h3><h1>${money(paid(mb))}</h1></div><div class="card"><h3>This Month Unpaid</h3><h1>${money(unpaid(mb))}</h1></div></div>
  ${profile.role==="tutor"?`<div class="card"><h2>Excel / CSV Export</h2><p class="muted">Download your bookings and payments by student, date, and payment status.</p><div class="row"><input id="tutorExportMonth" type="month" value="${month}"><button onclick="exportTutorBookingsCSV(currentUser.uid,$('tutorExportMonth').value)">Export Selected Month</button><button onclick="exportTutorBookingsCSV(currentUser.uid,'')">Export All</button></div></div>`:""}
  <div class="card"><h2>Financial Details</h2>${bookingRows(b,true)}</div>`;
}

function adminTutorReportsPage(){
  const currentMonth=new Date().toISOString().slice(0,7);
  $("content").innerHTML=`<div class="card"><h2>Tutor Monthly Reports</h2><p class="muted">See how many hours each tutor did per month and how much they earned.</p><div class="row"><input id="reportMonth" type="month" value="${currentMonth}" onchange="renderTutorReportTable()"><button onclick="exportAdminTutorMonthlyCSV()">Export Monthly Report CSV</button></div><div id="tutorReportTable"></div></div>`;
  renderTutorReportTable();
}
function renderTutorReportTable(){
  const month=$("reportMonth")?.value||new Date().toISOString().slice(0,7);
  const rows=tutors().map(t=>({t,...tutorMonthlyStats(t.id,month)}));
  const totalHours=rows.reduce((s,r)=>s+r.hours,0),totalEarned=rows.reduce((s,r)=>s+r.earned,0),totalPaid=rows.reduce((s,r)=>s+r.paidAmount,0),totalUnpaid=rows.reduce((s,r)=>s+r.unpaidAmount,0);
  $("tutorReportTable").innerHTML=`<div class="grid"><div class="card"><div class="report-sub">Total Hours</div><div class="report-total">${totalHours}</div></div><div class="card"><div class="report-sub">Total Earned</div><div class="report-total">${money(totalEarned)}</div></div><div class="card"><div class="report-sub">Paid</div><div class="report-total">${money(totalPaid)}</div></div><div class="card"><div class="report-sub">Unpaid</div><div class="report-total">${money(totalUnpaid)}</div></div></div>
  ${rows.length?`<table class="table"><tr><th>Tutor</th><th>University</th><th>Month</th><th>Sessions</th><th>Hours</th><th>Earned</th><th>Paid</th><th>Unpaid</th><th>Export</th></tr>${rows.map(r=>`<tr><td>${r.t.name||""}</td><td>${r.t.university||""}</td><td>${month}</td><td>${r.bs.length}</td><td>${r.hours}</td><td>${money(r.earned)}</td><td>${money(r.paidAmount)}</td><td>${money(r.unpaidAmount)}</td><td><button onclick="exportTutorBookingsCSV('${r.t.id}','${month}')">Export Tutor</button></td></tr>`).join("")}</table>`:`<p class="muted">No tutors found.</p>`}`;
}
function exportAdminTutorMonthlyCSV(){
  const month=$("reportMonth")?.value||new Date().toISOString().slice(0,7);
  const rows=[["Tutor","University","Month","Sessions","Hours","Earned","Paid","Unpaid"]];
  tutors().forEach(t=>{const s=tutorMonthlyStats(t.id,month);rows.push([t.name||"",t.university||"",month,s.bs.length,s.hours,s.earned,s.paidAmount,s.unpaidAmount])});
  downloadCSV(`Scheduled_Admin_Tutor_Report_${month}.csv`,rows);
}

function docsPage(){let docs=list(DATA.documents).filter(d=>profile.role!=="student"||d.ownerId===currentUser.uid);$("content").innerHTML=`<div class="card"><h2>Documents</h2><p class="muted">Free version stores Google Drive view-only links.</p><table class="table"><tr><th>Title</th><th>Owner</th><th>Link</th></tr>${docs.map(d=>`<tr><td>${d.title}</td><td>${user(d.ownerId).name||""}</td><td>${d.url?`<a href="${d.url}" target="_blank">Open</a>`:""}</td></tr>`).join("")}</table>${profile.role!=="student"?`<hr><h3>Add Document Link</h3><div class="row"><select id="do">${students().map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select><input id="dt" placeholder="Title"><input id="du" placeholder="Google Drive view-only link"></div><button onclick="addDoc()">Add Document</button>`:""}</div>`}
async function addDoc(){await db.ref("documents").push({ownerId:$("do").value,title:$("dt").value,url:$("du").value,createdAt:Date.now()});await loadData();docsPage()}
function exportPage(){
  $("content").innerHTML=`<div class="card"><h2>Export</h2><p class="muted">Download bookings and payments as CSV.</p><button onclick="exportCSV()">Export All Bookings CSV</button>${profile.role==="admin"?`<hr><h3>Admin Tutor Monthly Report</h3><div class="row"><input id="exportMonth" type="month" value="${new Date().toISOString().slice(0,7)}"><button onclick="exportAdminTutorMonthlyFromExport()">Export Tutor Monthly Report</button></div>`:""}</div>`;
}
function exportAdminTutorMonthlyFromExport(){
  const month=$("exportMonth")?.value||new Date().toISOString().slice(0,7);
  const rows=[["Tutor","University","Month","Sessions","Hours","Earned","Paid","Unpaid"]];
  tutors().forEach(t=>{const s=tutorMonthlyStats(t.id,month);rows.push([t.name||"",t.university||"",month,s.bs.length,s.hours,s.earned,s.paidAmount,s.unpaidAmount])});
  downloadCSV(`Scheduled_Admin_Tutor_Report_${month}.csv`,rows);
}
function exportCSV(){const rows=[["Date","Time","Course","Tutor","Student/Group","Duration","Location","Payment Method","Total","Payments"]];myBookings().forEach(b=>rows.push([b.date,b.start,b.course,user(b.tutorId).name||"",user(b.studentId).name||"",b.duration,b.location,b.paymentMethod,total(b),(b.payments||[]).map(p=>`${p.name}: ${money(p.amount)} ${p.paid?"Paid":"Unpaid"}`).join(" | ")]));const csv=rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="scheduled-export.csv";a.click();URL.revokeObjectURL(url)}
function profilePage(){$("content").innerHTML=`<div class="card"><h2>Profile</h2><p><b>Name:</b> ${profile.name}</p><p><b>Email:</b> ${profile.email}</p><p><b>Role:</b> ${profile.role}</p><label>New password</label><input id="np" type="password" placeholder="New password"><button onclick="changePassword()">Change Password</button>${profile.role==="tutor"?`<hr><p><b>WhatsApp:</b> ${profile.whatsapp||""}</p><button class="whatsapp" onclick="openWhatsApp('${profile.whatsapp||""}','Hi, I have a question about tutoring on Scheduled.')">WhatsApp Button Preview</button>`:""}</div>`}
async function changePassword(){try{await auth.currentUser.updatePassword($("np").value);alert("Password changed")}catch(e){alert(e.message)}}