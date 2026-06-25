const firebaseConfig={apiKey:"AIzaSyBK-Iu_TKXq7-PjIDOxXvwp2MDYXikQV8Y",authDomain:"scheduled-ed.firebaseapp.com",databaseURL:"https://scheduled-ed-default-rtdb.europe-west1.firebasedatabase.app",projectId:"scheduled-ed",storageBucket:"scheduled-ed.firebasestorage.app",messagingSenderId:"1057147687553",appId:"1:1057147687553:web:2c76219c0b97e2e9b3f380",measurementId:"G-QF774WZ4ER"};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.database(),$=id=>document.getElementById(id),money=n=>"$"+Number(n||0).toFixed(Number.isInteger(Number(n))?0:2);

const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = secondaryApp.auth();

let currentUser=null,profile=null,DATA={users:{},availability:{},bookings:{},documents:{},courses:{},unavailable:{},accessRequests:{}};
setTimeout(()=>{$("splash").classList.add("hidden");$("app").classList.remove("hidden")},900);
function notice(m){$("notice").textContent=m;$("notice").classList.remove("hidden")}
function toggleRequestAccess(){$("requestAccess").classList.toggle("hidden")}
async function submitAccessRequest(){
  const name=$("reqName").value.trim(),email=$("reqEmail").value.trim(),phone=$("reqPhone").value.trim(),courses=$("reqCourses").value.trim(),message=$("reqMessage").value.trim();
  if(!name||!email||!phone||!courses)return notice("Please fill full name, email, phone number, and course(s) needed.");
  try{
    await db.ref("accessRequests").push({name,email,phone,courses,message,status:"pending",createdAt:Date.now()});
    $("reqName").value="";$("reqEmail").value="";$("reqPhone").value="";$("reqCourses").value="";$("reqMessage").value="";
    notice("Access request submitted. We will contact you after review.");
    $("requestAccess").classList.add("hidden");
  }catch(e){notice(e.message)}
}
async function loadData(){const s=await db.ref("/").once("value");const v=s.val()||{};DATA={users:v.users||{},availability:v.availability||{},bookings:v.bookings||{},documents:v.documents||{},courses:v.courses||{},unavailable:v.unavailable||{},accessRequests:v.accessRequests||{}}}
auth.onAuthStateChanged(async u=>{if(!u)return;currentUser=u;let s=await db.ref("users/"+u.uid).once("value");profile=s.val();if(!profile){notice("Account exists but no Scheduled profile was found.");await auth.signOut();return}await loadData();$("loginPage").classList.add("hidden");$("dashboard").classList.remove("hidden");$("roleLabel").textContent=`${profile.name} • ${profile.role.toUpperCase()}`;renderTabs()});
async function login(){try{await auth.signInWithEmailAndPassword($("loginEmail").value.trim(),$("loginPassword").value.trim())}catch(e){notice(e.message)}} async function logout(){await auth.signOut();location.reload()}
async function createFirstAdmin(){try{let c=await auth.createUserWithEmailAndPassword($("setupEmail").value.trim(),$("setupPassword").value.trim());await db.ref("users/"+c.user.uid).set({uid:c.user.uid,name:$("setupName").value.trim(),email:$("setupEmail").value.trim(),role:"admin",createdAt:Date.now()});notice("Admin created. You are logged in.")}catch(e){notice(e.message)}}
function list(o){return Object.entries(o||{}).map(([id,v])=>({id,...v}))} function user(id){return DATA.users[id]||{}} function tutors(){return list(DATA.users).filter(u=>u.role==="tutor")} function students(){return list(DATA.users).filter(u=>u.role==="student")} function safe(s){return s.replace(/[.#$/\[\]]/g,"_")}
function myBookings(){let b=list(DATA.bookings);if(profile.role==="admin")return b;if(profile.role==="tutor")return b.filter(x=>x.tutorId===currentUser.uid);return b.filter(x=>x.studentId===currentUser.uid)}
function total(b){return(b.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0)} function paid(bs){return bs.flatMap(b=>b.payments||[]).filter(p=>p.paid).reduce((s,p)=>s+Number(p.amount||0),0)} function unpaid(bs){return bs.flatMap(b=>b.payments||[]).filter(p=>!p.paid).reduce((s,p)=>s+Number(p.amount||0),0)} function badge(p){return`<span class="badge ${p?'paid':'unpaid'}">${p?'Paid':'Unpaid'}</span>`} function method(l){return(l||"").toLowerCase().includes("online")?"Whish":"Cash"}
function renderTabs(){let t=profile.role==="admin"?["Overview","Tutors","Students","Courses","Access Requests","Calendar","Bookings","Documents","Export"]:profile.role==="tutor"?["Schedule","Calendar","Availability","Students","Financial","Documents","Profile"]:["Book","My Sessions","Payments","Documents","Profile"];$("tabs").innerHTML=t.map((x,i)=>`<button class="${i==0?'active':''}" onclick="openTab('${x}',this)">${x}</button>`).join("");openTab(t[0],$("tabs button"))}
async function openTab(tab,btn){await loadData();document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));if(btn)btn.classList.add("active");({Overview:adminOverview,Tutors:adminTutors,Students:adminStudents,Courses:adminCourses,"Access Requests":accessRequestsPage,Bookings:()=>bookingsPage(true),Calendar:calendarPage,Export:exportPage,Documents:docsPage,Schedule:schedulePage,Availability:availabilityPage,Financial:financialPage,Profile:profilePage,Book:bookingPage,"My Sessions":()=>bookingsPage(false),Payments:paymentsPage}[tab])()}

function toMin(t){let [h,m]=(t||"00:00").split(":").map(Number);return h*60+m}
function toTime(min){let h=Math.floor(min/60),m=min%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}
function dayName(dateStr){return new Date(dateStr+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"})}
function overlaps(a1,a2,b1,b2){return a1<b2&&b1<a2}
function isTutorUnavailable(tutorId,date){return list(DATA.unavailable).some(u=>u.tutorId===tutorId&&u.date===date)}
function candidateWorks(tutorId,studentId,date,start,duration){
  const s=toMin(start),e=s+Number(duration)*60;
  const bookings=list(DATA.bookings).filter(b=>b.tutorId===tutorId&&b.date===date);
  for(const b of bookings){
    const bs=toMin(b.start),be=bs+Number(b.duration||1)*60;
    const same=b.studentId===studentId;
    const buffer=same?0:15;
    if(overlaps(s,e,bs-buffer,be+buffer))return false;
  }
  return true;
}
function generateSlots(tutorId,date,duration){
  if(!date||!duration||isTutorUnavailable(tutorId,date))return [];
  const av=list(DATA.availability).filter(a=>a.tutorId===tutorId&&a.date===date);
  let slots=[];
  for(const a of av){
    let start=toMin(a.start),end=toMin(a.end);
    for(let t=start;t+Number(duration)*60<=end;t+=30){
      const time=toTime(t);
      if(candidateWorks(tutorId,currentUser?.uid||"",date,time,duration))slots.push(time);
    }
  }
  return [...new Set(slots)].sort();
}


function monthName(date){return date.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
function getMonthDays(year,month){
  const first=new Date(year,month,1);
  const last=new Date(year,month+1,0);
  let days=[];
  for(let d=1;d<=last.getDate();d++){
    const dt=new Date(year,month,d);
    const iso=dt.toISOString().slice(0,10);
    days.push({date:iso,day:d,weekday:dt.toLocaleDateString("en-US",{weekday:"short"})});
  }
  return days;
}
function calendarPage(){
  const now=new Date();
  const year=Number(localStorage.getItem("calYear")||now.getFullYear());
  const month=Number(localStorage.getItem("calMonth")||now.getMonth());
  const days=getMonthDays(year,month);
  const bs=myBookings();
  $("content").innerHTML=`<div class="card"><h2>Calendar View</h2>
  <div class="row"><button onclick="moveMonth(-1)">Previous Month</button><div class="card small"><b>${monthName(new Date(year,month,1))}</b></div><button onclick="moveMonth(1)">Next Month</button></div>
  <div class="grid">${days.map(d=>{
    const dayBookings=bs.filter(b=>b.date===d.date).sort((a,b)=>(a.start||"").localeCompare(b.start||""));
    return `<div class="card small"><b>${d.weekday} ${d.day}</b><br><span class="muted">${d.date}</span><hr>${dayBookings.length?dayBookings.map(b=>`<div><b>${b.start}</b> • ${b.course}<br>${user(b.studentId).name||""}<br>${Number(b.duration||1)}h • ${b.location||""}</div><hr>`).join(""):`<span class="muted">No sessions</span>`}</div>`
  }).join("")}</div></div>`;
}
function moveMonth(delta){
  let now=new Date();
  let y=Number(localStorage.getItem("calYear")||now.getFullYear());
  let m=Number(localStorage.getItem("calMonth")||now.getMonth());
  let d=new Date(y,m+delta,1);
  localStorage.setItem("calYear",d.getFullYear());
  localStorage.setItem("calMonth",d.getMonth());
  calendarPage();
}
async function deleteBooking(id){
  if(!confirm("Delete this booking?"))return;
  await db.ref("bookings/"+id).remove();
  await loadData();
  bookingsPage(profile.role!=="student");
}
async function editBooking(id){
  let b=DATA.bookings[id];
  if(!b)return alert("Booking not found.");
  let date=prompt("Date (YYYY-MM-DD):",b.date||""); if(date===null)return;
  let start=prompt("Start time (HH:MM):",b.start||""); if(start===null)return;
  let duration=prompt("Duration in hours:",b.duration||1); if(duration===null)return;
  let location=prompt("Location:",b.location||""); if(location===null)return;
  let course=prompt("Course:",b.course||""); if(course===null)return;
  await db.ref("bookings/"+id).update({date,start,duration:Number(duration),location,course,paymentMethod:method(location)});
  await loadData();
  bookingsPage(profile.role!=="student");
}
function exportCSV(){
  const rows=[["Date","Time","Course","Tutor","Student/Group","Duration","Location","Payment Method","Total","Payments"]];
  myBookings().forEach(b=>{
    rows.push([b.date,b.start,b.course,user(b.tutorId).name||"",user(b.studentId).name||"",b.duration,b.location,b.paymentMethod,total(b),(b.payments||[]).map(p=>`${p.name}: ${money(p.amount)} ${p.paid?"Paid":"Unpaid"}`).join(" | ")]);
  });
  const csv=rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="scheduled-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}
function exportPage(){
  $("content").innerHTML=`<div class="card"><h2>Export</h2><p class="muted">Download bookings and payments as a CSV file. You can open it in Excel or Google Sheets.</p><button onclick="exportCSV()">Export Bookings CSV</button></div>`;
}
async function generateAvailabilityRange(){
  const from=$("gfrom").value, to=$("gto").value, day=$("gday").value, start=$("gstart").value, end=$("gend").value;
  if(!from||!to||!start||!end)return alert("Fill all required fields.");
  if(toMin(end)<=toMin(start))return alert("End time must be after start time.");
  const online=$("glocOnline")?.checked;
  const campus=$("glocCampus")?.checked;
  const both=$("glocBoth")?.checked;
  const campusName=($("gcampusName")?.value||"").trim();
  let locations=[];
  if(online)locations.push("Online");
  if(campus){
    if(!campusName)return alert("Please specify the campus name.");
    locations.push(`On Campus (${campusName})`);
  }
  if(both){
    if(!campusName)return alert("Please specify the campus name.");
    locations.push("Online");
    locations.push(`On Campus (${campusName})`);
  }
  locations=[...new Set(locations)];
  if(!locations.length)return alert("Please choose Online, On Campus, or Both.");
  let count=0;
  let cur=new Date(from+"T12:00:00"), last=new Date(to+"T12:00:00");
  while(cur<=last){
    const iso=cur.toISOString().slice(0,10);
    const weekday=cur.toLocaleDateString("en-US",{weekday:"long"});
    if(weekday===day){
      await db.ref("availability").push({tutorId:currentUser.uid,date:iso,start,end,locations,campusName,createdAt:Date.now(),generated:true});
      count++;
    }
    cur.setDate(cur.getDate()+1);
  }
  await loadData();
  alert(`Generated ${count} availability blocks.`);
  availabilityPage();
}



function allUniversityNames(){
  let names=tutors().map(t=>t.university).filter(Boolean);
  return [...new Set(names)].sort((a,b)=>a.localeCompare(b));
}
function tutorsForCourseAndUniversity(course,university){
  return tutorsForCourse(course).filter(t=>!university || t.university===university).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
}

function allCourseNames(){
  let names=[];
  tutors().forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));
  return [...new Set(names.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function tutorsForCourse(course){
  return tutors().filter(t=>(t.courses||[]).includes(course)).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
}



function selectedAvailabilityLocations(){
  const online=$("locOnline")?.checked;
  const campus=$("locCampus")?.checked;
  const both=$("locBoth")?.checked;
  const campusName=($("campusName")?.value||"").trim();
  let locations=[];
  if(online)locations.push("Online");
  if(campus){
    if(!campusName)return {error:"Please specify the campus name."};
    locations.push(`On Campus (${campusName})`);
  }
  if(both){
    if(!campusName)return {error:"Please specify the campus name."};
    locations.push("Online");
    locations.push(`On Campus (${campusName})`);
  }
  locations=[...new Set(locations)];
  if(!locations.length)return {error:"Please choose Online, On Campus, or Both."};
  return {locations,campusName};
}
function formatLocationsFromAvailability(a){
  if(Array.isArray(a.locations)&&a.locations.length)return a.locations.join(", ");
  return a.location||"";
}
function slotLocationOptions(tutorId,date,time,duration){
  const av=list(DATA.availability).filter(a=>a.tutorId===tutorId&&a.date===date&&toMin(a.start)<=toMin(time)&&toMin(a.end)>=toMin(time)+Number(duration)*60);
  let locations=[];
  av.forEach(a=>{
    if(Array.isArray(a.locations))locations.push(...a.locations);
    else if(a.location)locations.push(a.location);
  });
  return [...new Set(locations)];
}

function accessRequestsPage(){
  const requests=list(DATA.accessRequests).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  $("content").innerHTML=`<div class="card"><h2>Access Requests</h2>
  <p class="muted">Review access requests. Approving creates a student account with a temporary password. Students can choose any tutor after login.</p>
  ${requests.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Courses</th><th>Message</th><th>Status</th><th>Actions</th></tr>
  ${requests.map(r=>`<tr><td>${r.name||""}</td><td>${r.email||""}</td><td>${r.phone||""}</td><td>${r.courses||""}</td><td>${r.message||""}</td><td>${r.status||"pending"}</td><td>${(r.status||"pending")==="pending"?`<button onclick="approveAccessRequest('${r.id}')">Approve</button><button class="danger" onclick="rejectAccessRequest('${r.id}')">Reject</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No access requests yet.</p>`}
  </div>`;
}
function generateTempPassword(){
  return "Scheduled-" + Math.floor(1000+Math.random()*9000);
}
async function approveAccessRequest(id){
  const r=DATA.accessRequests[id];
  if(!r)return alert("Request not found.");
  const password=generateTempPassword();
  try{
    let c=await secondaryAuth.createUserWithEmailAndPassword(r.email,password);
    await db.ref("users/"+c.user.uid).set({
      uid:c.user.uid,
      name:r.name,
      email:r.email,
      phone:r.phone,
      role:"student",
      type:"individual",
      requestedCourses:r.courses,
      createdBy:currentUser.uid,
      createdFromAccessRequest:id,
      createdAt:Date.now()
    });
    await db.ref("accessRequests/"+id).update({status:"approved",approvedAt:Date.now(),createdStudentUid:c.user.uid});
    await secondaryAuth.signOut();
    await loadData();
    alert(`Approved. Student account created.\n\nEmail: ${r.email}\nTemporary password: ${password}\n\nSend these credentials to the student.`);
    accessRequestsPage();
  }catch(e){alert(e.message)}
}
async function rejectAccessRequest(id){
  if(!confirm("Reject this access request?"))return;
  await db.ref("accessRequests/"+id).update({status:"rejected",rejectedAt:Date.now()});
  await loadData();
  accessRequestsPage();
}

function adminOverview(){let b=list(DATA.bookings);$("content").innerHTML=`<div class="grid"><div class="card"><h3>Bookings</h3><h1>${b.length}</h1></div><div class="card"><h3>Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>Tutors</h3><h1>${tutors().length}</h1></div></div><div class="card"><h2>Scheduled Admin</h2><p class="muted">Firebase is connected. Smart slot blocking and 15-minute buffers are active.</p></div>`}
function usersTable(a){return a.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Role/Type</th><th>Details</th></tr>${a.map(u=>`<tr><td>${u.name||""}</td><td>${u.email||""}</td><td>${u.role}${u.type?"/"+u.type:""}</td><td>${u.rate?money(u.rate)+"/h/person<br>":""}${u.university?`University: ${u.university}<br>`:""}${u.whatsapp||""}<br>${(u.locations||[]).join(", ")}<br>${(u.courses||[]).join(", ")}</td></tr>`).join("")}</table>`:`<p class="muted">No accounts yet.</p>`}
function adminTutors(){$("content").innerHTML=`<div class="card"><h2>Tutors</h2>${usersTable(tutors())}<hr><h3>Create Tutor</h3><div class="row"><input id="tn" placeholder="Full name"><input id="te" type="email" placeholder="Email"><input id="tp" placeholder="Temporary password"><input id="tw" placeholder="WhatsApp e.g. 96176174738"><input id="tr" type="number" placeholder="Hourly rate"><input id="tuiv" placeholder="University e.g. University of Balamand"></div><input id="tl" placeholder="Locations: Online, On Campus (Koura Campus)"><button onclick="createAccount('tutor')">Create Tutor</button></div>`}
function adminStudents(){
  const visibleStudents = profile.role==="admin" ? students() : students().filter(s=>s.assignedTutorId===currentUser.uid || s.createdBy===currentUser.uid);
  $("content").innerHTML=`<div class="card"><h2>${profile.role==="admin"?"Students / Groups":"My Students / Groups"}</h2>
  ${usersTable(visibleStudents)}
  <hr><h3>Create Student or Group Account</h3>
  <p class="muted">${profile.role==="admin"?"Admin can create students for the platform.":"Tutor-created students are automatically assigned to this tutor."}</p>
  <div class="row"><input id="sn" placeholder="Name"><input id="se" type="email" placeholder="Email"><input id="sp" placeholder="Password"><input id="sphone" placeholder="Phone"><select id="stype"><option>individual</option><option>group</option></select></div>
  <input id="smembers" placeholder="Group members comma separated">
  <button onclick="createAccount('student')">Create Student/Group</button></div>`
}

async function createAccount(role){
  try{
    let name,email,password,extra={};
    if(role==="tutor"){
      if(profile.role!=="admin") return alert("Only admin can create tutor accounts.");
      name=$("tn").value;email=$("te").value;password=$("tp").value;
      extra={whatsapp:$("tw").value,rate:Number($("tr").value||15),university:$("tuiv").value.trim(),locations:$("tl").value.split(",").map(x=>x.trim()).filter(Boolean),courses:[]}
    }else{
      name=$("sn").value;email=$("se").value;password=$("sp").value;
      extra={phone:$("sphone").value,type:$("stype").value,members:$("smembers").value.split(",").map(x=>x.trim()).filter(Boolean)};
      if(profile.role==="tutor"){
        extra.createdBy=currentUser.uid;
      }
      if(profile.role==="admin"){
        extra.createdBy=currentUser.uid;
      }
    }
    if(!name||!email||!password)return alert("Please fill name, email, and password.");
    let c=await secondaryAuth.createUserWithEmailAndPassword(email,password);
    await db.ref("users/"+c.user.uid).set({uid:c.user.uid,name,email,role,createdAt:Date.now(),...extra});
    await secondaryAuth.signOut();
    alert(`${role==="student"?"Student/group":"Tutor"} account created successfully.`);
    await loadData();
    role==="tutor"?adminTutors():adminStudents();
  }catch(e){alert(e.message)}
}

function adminCourses(){$("content").innerHTML=`<div class="card"><h2>Course Management</h2><p class="muted">Only admin assigns courses to tutors.</p><table class="table"><tr><th>Tutor</th><th>Courses</th></tr>${tutors().map(t=>`<tr><td>${t.name}</td><td>${(t.courses||[]).join(", ")}</td></tr>`).join("")}</table><hr><div class="row"><select id="ct">${tutors().map(t=>`<option value="${t.id}">${t.name}</option>`)}</select><input id="cn" placeholder="Course name exactly: Physics 213"></div><button onclick="assignCourse()">Assign Course</button></div>`}
async function assignCourse(){let t=user($("ct").value),c=$("cn").value.trim(),cs=Array.from(new Set([...(t.courses||[]),c])).filter(Boolean);await db.ref("users/"+$("ct").value+"/courses").set(cs);await db.ref("courses/"+safe(c)).set({name:c});await loadData();adminCourses()}
function rows(bs,edit){return bs.length?`<table class="table"><tr><th>Date</th><th>Time</th><th>Course</th><th>Tutor</th><th>Student/Group</th><th>Details</th><th>Payments</th><th>Notes</th><th>Actions</th></tr>${bs.map(b=>`<tr><td>${b.date}</td><td>${b.start}</td><td>${b.course}</td><td>${user(b.tutorId).name||""}</td><td>${user(b.studentId).name||""}</td><td>${b.duration}h • ${b.format} ${b.groupSize||1}<br>${b.location}<br>${b.paymentMethod}<br>${(b.sessionTypes||[]).join(", ")}<br>Total: ${money(total(b))}</td><td>${(b.payments||[]).map((p,i)=>`${p.name}: ${money(p.amount)} ${badge(p.paid)} ${edit?`<button onclick="togglePayment('${b.id}',${i})">Toggle</button>`:""}`).join("<br>")}</td><td>${b.notes||""}${edit?`<br><button onclick="editNotes('${b.id}')">Edit Notes</button>`:""}</td><td>${edit?`<button onclick="editBooking('${b.id}')">Edit</button><button class="danger" onclick="deleteBooking('${b.id}')">Delete</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No sessions yet.</p>`}
function bookingsPage(edit){$("content").innerHTML=`<div class="card"><h2>Bookings</h2>${rows(myBookings(),edit&&profile.role!=="student")}</div>`} async function togglePayment(id,i){let b=DATA.bookings[id];b.payments[i].paid=!b.payments[i].paid;await db.ref(`bookings/${id}/payments`).set(b.payments);await loadData();profile.role==="admin"?bookingsPage(true):financialPage()}
async function editNotes(id){let b=DATA.bookings[id];let n=prompt("Session notes:",b.notes||"");if(n!==null){await db.ref(`bookings/${id}/notes`).set(n);await loadData();profile.role==="admin"?bookingsPage(true):schedulePage()}}
function schedulePage(){$("content").innerHTML=`<div class="card"><h2>Daily Schedule</h2>${rows(myBookings(),true)}</div>`}
function availabilityPage(){
  let a=list(DATA.availability).filter(x=>x.tutorId===currentUser.uid).sort((x,y)=>(x.date||"").localeCompare(y.date||"") || (x.start||"").localeCompare(y.start||""));
  let un=list(DATA.unavailable).filter(x=>x.tutorId===currentUser.uid).sort((x,y)=>(x.date||"").localeCompare(y.date||""));
  $("content").innerHTML=`<div class="card"><h2>Calendar Availability</h2><p class="muted">Add availability for specific dates. Students only see generated slots that do not overlap bookings. Location options are linked to each availability block.</p>
  <table class="table"><tr><th>Date</th><th>Start</th><th>End</th><th>Location Options</th><th>Edit</th></tr>
  ${a.map(x=>`<tr><td>${x.date||""}</td><td>${x.start||""}</td><td>${x.end||""}</td><td>${formatLocationsFromAvailability(x)}</td><td><button onclick="editAvailability('${x.id}')">Edit</button><button class="danger" onclick="deleteAvailability('${x.id}')">Delete</button></td></tr>`).join("")}</table>
  <hr><h3>Add Availability for a Date</h3>
  <div class="row"><input id="adate" type="date"><input id="astart" type="time"><input id="aend" type="time"></div>
  <label>Location Options</label>
  <div class="checkbox-grid">
    <label class="check"><input type="checkbox" id="locOnline">Online</label>
    <label class="check"><input type="checkbox" id="locCampus">On Campus</label>
    <label class="check"><input type="checkbox" id="locBoth">Both</label>
  </div>
  <input id="campusName" placeholder="Campus name if on campus/both, e.g. Koura Campus">
  <button onclick="addAvailability()">Add Date Availability</button></div>

  <div class="card"><h2>Unavailable Dates</h2>
  <table class="table"><tr><th>Date</th><th>Reason</th><th>Edit</th></tr>
  ${un.map(x=>`<tr><td>${x.date}</td><td>${x.reason||""}</td><td><button class="danger" onclick="deleteUnavailable('${x.id}')">Delete</button></td></tr>`).join("")}</table>
  <hr><div class="row"><input id="udate" type="date"><input id="ureason" placeholder="Reason e.g. exam week"></div>
  <button onclick="addUnavailable()">Add Unavailable Date</button></div>

  <div class="card"><h2>Generate Repeated Availability</h2><p class="muted">Create date-by-date availability automatically. You can still edit/delete individual dates after.</p>
  <div class="row"><input id="gfrom" type="date"><input id="gto" type="date"><select id="gday"><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select><input id="gstart" type="time"><input id="gend" type="time"></div>
  <label>Generated Availability Location Options</label>
  <div class="checkbox-grid">
    <label class="check"><input type="checkbox" id="glocOnline">Online</label>
    <label class="check"><input type="checkbox" id="glocCampus">On Campus</label>
    <label class="check"><input type="checkbox" id="glocBoth">Both</label>
  </div>
  <input id="gcampusName" placeholder="Campus name if on campus/both, e.g. Koura Campus">
  <button onclick="generateAvailabilityRange()">Generate Availability</button></div>`
}

async function addAvailability(){
  if(!$("adate").value||!$("astart").value||!$("aend").value)return alert("Please choose date, start time, and end time.");
  if(toMin($("aend").value)<=toMin($("astart").value))return alert("End time must be after start time.");
  const loc=selectedAvailabilityLocations();
  if(loc.error)return alert(loc.error);
  await db.ref("availability").push({tutorId:currentUser.uid,date:$("adate").value,start:$("astart").value,end:$("aend").value,locations:loc.locations,campusName:loc.campusName||"",createdAt:Date.now()});
  await loadData();availabilityPage()
}

async function editAvailability(id){
  let a=DATA.availability[id];
  if(!a)return alert("Availability not found.");
  let date=prompt("Date (YYYY-MM-DD):",a.date||"");
  if(date===null)return;
  let start=prompt("Start time (HH:MM):",a.start||"");
  if(start===null)return;
  let end=prompt("End time (HH:MM):",a.end||"");
  if(end===null)return;
  let locationsText=prompt("Location options, comma separated. Example: Online, On Campus (Koura Campus)",formatLocationsFromAvailability(a));
  if(locationsText===null)return;
  if(toMin(end)<=toMin(start))return alert("End time must be after start time.");
  const locations=locationsText.split(",").map(x=>x.trim()).filter(Boolean);
  await db.ref("availability/"+id).update({date,start,end,locations,location:null});
  await loadData();availabilityPage();
}
async function deleteAvailability(id){
  if(!confirm("Delete this availability?"))return;
  await db.ref("availability/"+id).remove();
  await loadData();availabilityPage();
}
async function deleteUnavailable(id){
  if(!confirm("Delete this unavailable date?"))return;
  await db.ref("unavailable/"+id).remove();
  await loadData();availabilityPage();
}
function financialPage(){
  let b=myBookings();
  const now=new Date(), month=now.toISOString().slice(0,7);
  const monthBookings=b.filter(x=>(x.date||"").startsWith(month));
  $("content").innerHTML=`<div class="grid">
  <div class="card"><h3>Total Paid</h3><h1>${money(paid(b))}</h1></div>
  <div class="card"><h3>Total Unpaid</h3><h1>${money(unpaid(b))}</h1></div>
  <div class="card"><h3>This Month Paid</h3><h1>${money(paid(monthBookings))}</h1></div>
  <div class="card"><h3>This Month Unpaid</h3><h1>${money(unpaid(monthBookings))}</h1></div>
  </div><div class="card"><h2>Financial Details</h2>${rows(b,true)}</div>`;
}
function bookingPage(){
  const courses=allCourseNames();
  const universities=allUniversityNames();
  $("content").innerHTML=`<div class="card"><h2>Book a Session</h2>
  <p class="muted">Choose a course first. Then filter by university if needed. Tutors are shown equally and alphabetically.</p>

  <label>1. Choose Course</label>
  <select id="bcourseFirst" onchange="updateTutorListForCourse()">
    <option value="">Select a course</option>
    ${courses.map(c=>`<option value="${c}">${c}</option>`).join("")}
  </select>

  <label>2. Choose University</label>
  <select id="buniversity" onchange="updateTutorListForCourse()">
    <option value="">All universities</option>
    ${universities.map(u=>`<option value="${u}">${u}</option>`).join("")}
  </select>

  <div id="courseTutorList"></div>

  <div id="bookingDetails" class="hidden">
    <hr>
    <label>3. Selected Tutor</label>
    <select id="bt" onchange="updateBooking()"></select>

    <div class="row">
      <div><label>4. Date</label><input id="bd" type="date" onchange="updateSlots()"></div>
      <div><label>5. Duration</label><select id="bdu" onchange="updateSlots()"><option value="1">1 hour</option><option value="1.5">1h 30min</option><option value="2">2 hours</option><option value="2.5">2h 30min</option><option value="3">3 hours</option></select></div>
      <div><label>6. Available Time</label><select id="bs" onchange="updateBookingLocations();updatePrice()"></select></div>
    </div>

    <label>Session Format</label>
    <div class="row"><select id="bf" onchange="updatePrice()"><option>Individual</option><option>Group</option></select><select id="bg" onchange="updatePrice()"><option value="1">1 student</option><option value="2">2 students</option><option value="3">3 students</option><option value="4">4 students</option><option value="5">5 students</option></select></div>

    <label>Session Type</label>
    <div class="checkbox-grid">${["Course & Formulas","Book Exercises","Previous Exams","Other"].map(x=>`<label class="check"><input type="checkbox" class="stype" value="${x}">${x}</label>`).join("")}</div>

    <label>Location</label>
    <select id="bl" onchange="updatePrice()"></select>

    <div id="price" class="card small"></div>
    <button onclick="confirmBooking()">Confirm Booking + WhatsApp</button>
  </div>
  </div>`;
}
function updateTutorListForCourse(){
  const course=$("bcourseFirst").value;
  const university=$("buniversity").value;
  const listBox=$("courseTutorList");
  const details=$("bookingDetails");
  if(!course){
    listBox.innerHTML="";
    details.classList.add("hidden");
    return;
  }
  const availableTutors=tutorsForCourseAndUniversity(course,university);
  if(!availableTutors.length){
    listBox.innerHTML=`<div class="card"><p class="muted">No tutors available for this course${university?` at ${university}`:""} yet.</p></div>`;
    details.classList.add("hidden");
    return;
  }
  listBox.innerHTML=`<hr><h3>${university?`Tutors at ${university}`:"Available Tutors"}</h3><div class="grid">
    ${availableTutors.map(t=>`<div class="card">
      <h3>${t.name}</h3>
      <p><b>University:</b> ${t.university||"Not specified"}</p>
      <p><b>Rate:</b> ${money(t.rate)}/hour/person</p>
      <p><b>General Locations:</b> ${(t.locations||[]).join(", ")||"Set by availability"}</p>
      <button onclick="selectTutorForBooking('${t.id}')">Choose ${t.name}</button>
    </div>`).join("")}
  </div>`;
  $("bt").innerHTML=availableTutors.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
  details.classList.remove("hidden");
  updateBooking();
}
function selectTutorForBooking(tutorId){
  $("bt").value=tutorId;
  updateBooking();
  document.getElementById("bookingDetails").scrollIntoView({behavior:"smooth",block:"start"});
}
function updateBooking(){
  if(!$("bt")||!$("bt").value)return;
  if(typeof updateSlots==="function"){updateSlots();}
  updatePrice();
}
function updatePrice(){
  if(!$("bt")||!$("bt").value)return;
  let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1;
  $("price").innerHTML=`<b>Course:</b> ${$("bcourseFirst").value}<br><b>Tutor:</b> ${t.name}<br><b>University:</b> ${t.university||"Not specified"}<br><b>Rate:</b> ${money(t.rate)}/hour/person<br><b>Duration:</b> ${d}h<br><b>Students:</b> ${g}<br><b>Total:</b> ${money((t.rate||0)*d*g)}<br><b>Payment:</b> ${method($("bl").value)}<br><b>Slot rule:</b> booked times are hidden; 15-minute buffer applies between different students.`;
}
async function confirmBooking(){
  if(!$("bcourseFirst").value)return alert("Please choose a course.");
  if(!$("bt").value)return alert("Please choose a tutor.");
  if(!$("bs").value)return alert("No available time selected.");
  let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1,loc=$("bl").value;
  if(!candidateWorks($("bt").value,currentUser.uid,$("bd").value,$("bs").value,d))return alert("This slot was just booked by someone else. Please choose another time.");
  let names=profile.type==="group"&&profile.members?.length?profile.members.slice(0,g):[profile.name];
  while(names.length<g)names.push("Student "+(names.length+1));
  let payments=names.map(n=>({name:n,amount:(t.rate||0)*d,paid:false}));
  let b={studentId:currentUser.uid,tutorId:$("bt").value,course:$("bcourseFirst").value,date:$("bd").value,start:$("bs").value,duration:d,format:$("bf").value,groupSize:g,sessionTypes:[...document.querySelectorAll(".stype:checked")].map(x=>x.value),location:loc,paymentMethod:method(loc),payments,notes:"",attachments:[],createdAt:Date.now()};
  await db.ref("bookings").push(b);
  let msg=encodeURIComponent(`📚 New Tutoring Booking\n\nTutor: ${t.name}\nUniversity: ${t.university||"Not specified"}\nStudent/Group: ${profile.name}\nCourse: ${b.course}\nDate: ${b.date}\nTime: ${b.start}\nDuration: ${d}h\nFormat: ${b.format} (${g})\nType: ${b.sessionTypes.join(", ")}\nLocation: ${loc}\nPayment Method: ${b.paymentMethod}\nTotal: ${money(total(b))}`);
  window.open(`https://wa.me/${t.whatsapp||""}?text=${msg}`,"_blank");
  alert("Booking saved. The slot is now blocked for other students.");
  await loadData();
  bookingPage();
}

function paymentsPage(){bookingsPage(false)}
function docsPage(){let docs=list(DATA.documents).filter(d=>profile.role!=="student"||d.ownerId===currentUser.uid);$("content").innerHTML=`<div class="card"><h2>Documents</h2><p class="muted">Free version stores Google Drive view-only links.</p><table class="table"><tr><th>Title</th><th>Owner</th><th>Link</th></tr>${docs.map(d=>`<tr><td>${d.title}</td><td>${user(d.ownerId).name||""}</td><td>${d.url?`<a href="${d.url}" target="_blank">Open</a>`:""}</td></tr>`).join("")}</table>${profile.role!=="student"?`<hr><h3>Add Document Link</h3><div class="row"><select id="do">${students().map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select><input id="dt" placeholder="Title"><input id="du" placeholder="Google Drive view-only link"></div><button onclick="addDoc()">Add Document</button>`:""}</div>`}
async function addDoc(){await db.ref("documents").push({ownerId:$("do").value,title:$("dt").value,url:$("du").value,createdAt:Date.now()});await loadData();docsPage()}
function profilePage(){$("content").innerHTML=`<div class="card"><h2>Profile</h2><p><b>Name:</b> ${profile.name}</p><p><b>Email:</b> ${profile.email}</p><p><b>Role:</b> ${profile.role}</p><label>New password</label><input id="np" type="password" placeholder="New password"><button onclick="changePassword()">Change Password</button>${profile.role==="tutor"?`<hr><p><b>WhatsApp:</b> ${profile.whatsapp||""}</p><a target="_blank" href="https://wa.me/${profile.whatsapp||""}"><button class="whatsapp">WhatsApp Button Preview</button></a>`:""}</div>`}
async function changePassword(){try{await auth.currentUser.updatePassword($("np").value);alert("Password changed")}catch(e){alert(e.message)}}