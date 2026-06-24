const firebaseConfig={apiKey:"AIzaSyBK-Iu_TKXq7-PjIDOxXvwp2MDYXikQV8Y",authDomain:"scheduled-ed.firebaseapp.com",databaseURL:"https://scheduled-ed-default-rtdb.europe-west1.firebasedatabase.app",projectId:"scheduled-ed",storageBucket:"scheduled-ed.firebasestorage.app",messagingSenderId:"1057147687553",appId:"1:1057147687553:web:2c76219c0b97e2e9b3f380",measurementId:"G-QF774WZ4ER"};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.database(),$=id=>document.getElementById(id),money=n=>"$"+Number(n||0).toFixed(Number.isInteger(Number(n))?0:2);
let currentUser=null,profile=null,DATA={users:{},availability:{},bookings:{},documents:{},courses:{},unavailable:{}};
setTimeout(()=>{$("splash").classList.add("hidden");$("app").classList.remove("hidden")},900);
function notice(m){$("notice").textContent=m;$("notice").classList.remove("hidden")} function toggleSetup(){$("setup").classList.toggle("hidden")}
async function loadData(){const s=await db.ref("/").once("value");const v=s.val()||{};DATA={users:v.users||{},availability:v.availability||{},bookings:v.bookings||{},documents:v.documents||{},courses:v.courses||{},unavailable:v.unavailable||{}}}
auth.onAuthStateChanged(async u=>{if(!u)return;currentUser=u;let s=await db.ref("users/"+u.uid).once("value");profile=s.val();if(!profile){notice("Account exists but no Scheduled profile was found.");await auth.signOut();return}await loadData();$("loginPage").classList.add("hidden");$("dashboard").classList.remove("hidden");$("roleLabel").textContent=`${profile.name} • ${profile.role.toUpperCase()}`;renderTabs()});
async function login(){try{await auth.signInWithEmailAndPassword($("loginEmail").value.trim(),$("loginPassword").value.trim())}catch(e){notice(e.message)}} async function logout(){await auth.signOut();location.reload()}
async function createFirstAdmin(){try{let c=await auth.createUserWithEmailAndPassword($("setupEmail").value.trim(),$("setupPassword").value.trim());await db.ref("users/"+c.user.uid).set({uid:c.user.uid,name:$("setupName").value.trim(),email:$("setupEmail").value.trim(),role:"admin",createdAt:Date.now()});notice("Admin created. You are logged in.")}catch(e){notice(e.message)}}
function list(o){return Object.entries(o||{}).map(([id,v])=>({id,...v}))} function user(id){return DATA.users[id]||{}} function tutors(){return list(DATA.users).filter(u=>u.role==="tutor")} function students(){return list(DATA.users).filter(u=>u.role==="student")} function safe(s){return s.replace(/[.#$/\[\]]/g,"_")}
function myBookings(){let b=list(DATA.bookings);if(profile.role==="admin")return b;if(profile.role==="tutor")return b.filter(x=>x.tutorId===currentUser.uid);return b.filter(x=>x.studentId===currentUser.uid)}
function total(b){return(b.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0)} function paid(bs){return bs.flatMap(b=>b.payments||[]).filter(p=>p.paid).reduce((s,p)=>s+Number(p.amount||0),0)} function unpaid(bs){return bs.flatMap(b=>b.payments||[]).filter(p=>!p.paid).reduce((s,p)=>s+Number(p.amount||0),0)} function badge(p){return`<span class="badge ${p?'paid':'unpaid'}">${p?'Paid':'Unpaid'}</span>`} function method(l){return(l||"").toLowerCase().includes("online")?"Whish":"Cash"}
function renderTabs(){let t=profile.role==="admin"?["Overview","Tutors","Students","Courses","Bookings","Documents"]:profile.role==="tutor"?["Schedule","Availability","Financial","Documents","Profile"]:["Book","My Sessions","Payments","Documents","Profile"];$("tabs").innerHTML=t.map((x,i)=>`<button class="${i==0?'active':''}" onclick="openTab('${x}',this)">${x}</button>`).join("");openTab(t[0],$("tabs button"))}
async function openTab(tab,btn){await loadData();document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));if(btn)btn.classList.add("active");({Overview:adminOverview,Tutors:adminTutors,Students:adminStudents,Courses:adminCourses,Bookings:()=>bookingsPage(true),Documents:docsPage,Schedule:schedulePage,Availability:availabilityPage,Financial:financialPage,Profile:profilePage,Book:bookingPage,"My Sessions":()=>bookingsPage(false),Payments:paymentsPage}[tab])()}

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

function adminOverview(){let b=list(DATA.bookings);$("content").innerHTML=`<div class="grid"><div class="card"><h3>Bookings</h3><h1>${b.length}</h1></div><div class="card"><h3>Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>Tutors</h3><h1>${tutors().length}</h1></div></div><div class="card"><h2>Scheduled Admin</h2><p class="muted">Firebase is connected. Smart slot blocking and 15-minute buffers are active.</p></div>`}
function usersTable(a){return a.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Role/Type</th><th>Details</th></tr>${a.map(u=>`<tr><td>${u.name||""}</td><td>${u.email||""}</td><td>${u.role}${u.type?"/"+u.type:""}</td><td>${u.rate?money(u.rate)+"/h/person<br>":""}${u.whatsapp||""}<br>${(u.locations||[]).join(", ")}<br>${(u.courses||[]).join(", ")}</td></tr>`).join("")}</table>`:`<p class="muted">No accounts yet.</p>`}
function adminTutors(){$("content").innerHTML=`<div class="card"><h2>Tutors</h2>${usersTable(tutors())}<hr><h3>Create Tutor</h3><div class="row"><input id="tn" placeholder="Full name"><input id="te" type="email" placeholder="Email"><input id="tp" placeholder="Temporary password"><input id="tw" placeholder="WhatsApp e.g. 96176174738"><input id="tr" type="number" placeholder="Hourly rate"></div><input id="tl" placeholder="Locations: Online, On Campus (Koura Campus)"><button onclick="createAccount('tutor')">Create Tutor</button></div>`}
function adminStudents(){$("content").innerHTML=`<div class="card"><h2>Students / Groups</h2>${usersTable(students())}<hr><h3>Create Student or Group</h3><div class="row"><input id="sn" placeholder="Name"><input id="se" type="email" placeholder="Email"><input id="sp" placeholder="Password"><input id="sphone" placeholder="Phone"><select id="stype"><option>individual</option><option>group</option></select></div><input id="smembers" placeholder="Group members comma separated"><button onclick="createAccount('student')">Create Student/Group</button></div>`}
async function createAccount(role){try{let name,email,password,extra={};if(role==="tutor"){name=$("tn").value;email=$("te").value;password=$("tp").value;extra={whatsapp:$("tw").value,rate:Number($("tr").value||15),locations:$("tl").value.split(",").map(x=>x.trim()).filter(Boolean),courses:[]}}else{name=$("sn").value;email=$("se").value;password=$("sp").value;extra={phone:$("sphone").value,type:$("stype").value,members:$("smembers").value.split(",").map(x=>x.trim()).filter(Boolean)}}let c=await auth.createUserWithEmailAndPassword(email,password);await db.ref("users/"+c.user.uid).set({uid:c.user.uid,name,email,role,createdAt:Date.now(),...extra});alert("Account created. Log back into admin if you were switched to the new account.");await loadData();role==="tutor"?adminTutors():adminStudents()}catch(e){alert(e.message)}}
function adminCourses(){$("content").innerHTML=`<div class="card"><h2>Course Management</h2><p class="muted">Only admin assigns courses to tutors.</p><table class="table"><tr><th>Tutor</th><th>Courses</th></tr>${tutors().map(t=>`<tr><td>${t.name}</td><td>${(t.courses||[]).join(", ")}</td></tr>`).join("")}</table><hr><div class="row"><select id="ct">${tutors().map(t=>`<option value="${t.id}">${t.name}</option>`)}</select><input id="cn" placeholder="Course name exactly: Physics 213"></div><button onclick="assignCourse()">Assign Course</button></div>`}
async function assignCourse(){let t=user($("ct").value),c=$("cn").value.trim(),cs=Array.from(new Set([...(t.courses||[]),c])).filter(Boolean);await db.ref("users/"+$("ct").value+"/courses").set(cs);await db.ref("courses/"+safe(c)).set({name:c});await loadData();adminCourses()}
function rows(bs,edit){return bs.length?`<table class="table"><tr><th>Date</th><th>Time</th><th>Course</th><th>Tutor</th><th>Student/Group</th><th>Details</th><th>Payments</th><th>Notes</th></tr>${bs.map(b=>`<tr><td>${b.date}</td><td>${b.start}</td><td>${b.course}</td><td>${user(b.tutorId).name||""}</td><td>${user(b.studentId).name||""}</td><td>${b.duration}h • ${b.format} ${b.groupSize||1}<br>${b.location}<br>${b.paymentMethod}<br>${(b.sessionTypes||[]).join(", ")}<br>Total: ${money(total(b))}</td><td>${(b.payments||[]).map((p,i)=>`${p.name}: ${money(p.amount)} ${badge(p.paid)} ${edit?`<button onclick="togglePayment('${b.id}',${i})">Toggle</button>`:""}`).join("<br>")}</td><td>${b.notes||""}${edit?`<br><button onclick="editNotes('${b.id}')">Edit Notes</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No sessions yet.</p>`}
function bookingsPage(edit){$("content").innerHTML=`<div class="card"><h2>Bookings</h2>${rows(myBookings(),edit&&profile.role!=="student")}</div>`} async function togglePayment(id,i){let b=DATA.bookings[id];b.payments[i].paid=!b.payments[i].paid;await db.ref(`bookings/${id}/payments`).set(b.payments);await loadData();profile.role==="admin"?bookingsPage(true):financialPage()}
async function editNotes(id){let b=DATA.bookings[id];let n=prompt("Session notes:",b.notes||"");if(n!==null){await db.ref(`bookings/${id}/notes`).set(n);await loadData();profile.role==="admin"?bookingsPage(true):schedulePage()}}
function schedulePage(){$("content").innerHTML=`<div class="card"><h2>Daily Schedule</h2>${rows(myBookings(),true)}</div>`}
function availabilityPage(){
  let a=list(DATA.availability).filter(x=>x.tutorId===currentUser.uid).sort((x,y)=>(x.date||"").localeCompare(y.date||"") || (x.start||"").localeCompare(y.start||""));
  let un=list(DATA.unavailable).filter(x=>x.tutorId===currentUser.uid).sort((x,y)=>(x.date||"").localeCompare(y.date||""));
  $("content").innerHTML=`<div class="card"><h2>Calendar Availability</h2><p class="muted">Add availability for specific dates. Students only see generated slots that do not overlap bookings. Different students get a 15-minute buffer automatically.</p>
  <table class="table"><tr><th>Date</th><th>Start</th><th>End</th><th>Location</th><th>Edit</th></tr>
  ${a.map(x=>`<tr><td>${x.date||""}</td><td>${x.start||""}</td><td>${x.end||""}</td><td>${x.location||""}</td><td><button onclick="editAvailability('${x.id}')">Edit</button><button class="danger" onclick="deleteAvailability('${x.id}')">Delete</button></td></tr>`).join("")}</table>
  <hr><h3>Add Availability for a Date</h3>
  <div class="row"><input id="adate" type="date"><input id="astart" type="time"><input id="aend" type="time"><input id="aloc" placeholder="Online / Campus"></div>
  <button onclick="addAvailability()">Add Date Availability</button></div>

  <div class="card"><h2>Unavailable Dates</h2>
  <table class="table"><tr><th>Date</th><th>Reason</th><th>Edit</th></tr>
  ${un.map(x=>`<tr><td>${x.date}</td><td>${x.reason||""}</td><td><button class="danger" onclick="deleteUnavailable('${x.id}')">Delete</button></td></tr>`).join("")}</table>
  <hr><div class="row"><input id="udate" type="date"><input id="ureason" placeholder="Reason e.g. exam week"></div>
  <button onclick="addUnavailable()">Add Unavailable Date</button></div>`
}

async function addAvailability(){
  if(!$("adate").value||!$("astart").value||!$("aend").value)return alert("Please choose date, start time, and end time.");
  if(toMin($("aend").value)<=toMin($("astart").value))return alert("End time must be after start time.");
  await db.ref("availability").push({tutorId:currentUser.uid,date:$("adate").value,start:$("astart").value,end:$("aend").value,location:$("aloc").value,createdAt:Date.now()});
  await loadData();availabilityPage()
}
async function addUnavailable(){await db.ref("unavailable").push({tutorId:currentUser.uid,date:$("udate").value,reason:$("ureason").value,createdAt:Date.now()});await loadData();availabilityPage()}

async function editAvailability(id){
  let a=DATA.availability[id];
  if(!a)return alert("Availability not found.");
  let date=prompt("Date (YYYY-MM-DD):",a.date||"");
  if(date===null)return;
  let start=prompt("Start time (HH:MM):",a.start||"");
  if(start===null)return;
  let end=prompt("End time (HH:MM):",a.end||"");
  if(end===null)return;
  let location=prompt("Location:",a.location||"");
  if(location===null)return;
  if(toMin(end)<=toMin(start))return alert("End time must be after start time.");
  await db.ref("availability/"+id).update({date,start,end,location});
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
function financialPage(){let b=myBookings();$("content").innerHTML=`<div class="grid"><div class="card"><h3>Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>Sessions</h3><h1>${b.length}</h1></div></div><div class="card"><h2>Financial Details</h2>${rows(b,true)}</div>`}
function bookingPage(){$("content").innerHTML=`<div class="card"><h2>Book a Session</h2><label>Search Course</label><input id="search" placeholder="Physics 213" oninput="courseResults()"><div id="results"></div><hr><label>Tutor</label><select id="bt" onchange="updateBooking()">${tutors().map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}</select><label>Course</label><select id="bc"></select><div class="row"><div><label>Date</label><input id="bd" type="date" onchange="updateSlots()"></div><div><label>Duration</label><select id="bdu" onchange="updateSlots()"><option value="1">1 hour</option><option value="1.5">1h 30min</option><option value="2">2 hours</option><option value="2.5">2h 30min</option><option value="3">3 hours</option></select></div><div><label>Available Time</label><select id="bs" onchange="updatePrice()"></select></div></div><label>Format</label><div class="row"><select id="bf" onchange="updatePrice()"><option>Individual</option><option>Group</option></select><select id="bg" onchange="updatePrice()"><option value="1">1 student</option><option value="2">2 students</option><option value="3">3 students</option><option value="4">4 students</option><option value="5">5 students</option></select></div><label>Session Type</label><div class="checkbox-grid">${["Course & Formulas","Book Exercises","Previous Exams","Other"].map(x=>`<label class="check"><input type="checkbox" class="stype" value="${x}">${x}</label>`).join("")}</div><label>Location</label><select id="bl" onchange="updatePrice()"></select><div id="price" class="card small"></div><button onclick="confirmBooking()">Confirm Booking + WhatsApp</button></div>`;updateBooking()}
function courseResults(){let q=$("search").value.toLowerCase(),f=tutors().filter(t=>(t.courses||[]).some(c=>c.toLowerCase().includes(q)));$("results").innerHTML=q?`<div class="grid">${f.map(t=>`<div class="card"><h3>${t.name}</h3><p>${money(t.rate)}/hour/person</p><p>${(t.courses||[]).join(", ")}</p><p>${(t.locations||[]).join(", ")}</p></div>`).join("")}</div>`:""}
function updateBooking(){let t=user($("bt").value);$("bc").innerHTML=(t.courses||[]).map(c=>`<option>${c}</option>`).join("");$("bl").innerHTML=(t.locations||[]).map(l=>`<option>${l}</option>`).join("");updateSlots();updatePrice()}
function updateSlots(){if(!$("bt"))return;let slots=generateSlots($("bt").value,$("bd").value,$("bdu").value);$("bs").innerHTML=slots.length?slots.map(s=>`<option>${s}</option>`).join(""):`<option value="">No available slots</option>`;updatePrice()}
function updatePrice(){if(!$("bt"))return;let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1;$("price").innerHTML=`<b>Rate:</b> ${money(t.rate)}/hour/person<br><b>Duration:</b> ${d}h<br><b>Students:</b> ${g}<br><b>Total:</b> ${money((t.rate||0)*d*g)}<br><b>Payment:</b> ${method($("bl").value)}<br><b>Slot rule:</b> booked times are hidden; 15-minute buffer applies between different students.`}
async function confirmBooking(){if(!$("bs").value)return alert("No available time selected.");let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1,loc=$("bl").value;if(!candidateWorks($("bt").value,currentUser.uid,$("bd").value,$("bs").value,d))return alert("This slot was just booked by someone else. Please choose another time.");let names=profile.type==="group"&&profile.members?.length?profile.members.slice(0,g):[profile.name];while(names.length<g)names.push("Student "+(names.length+1));let payments=names.map(n=>({name:n,amount:(t.rate||0)*d,paid:false}));let b={studentId:currentUser.uid,tutorId:$("bt").value,course:$("bc").value,date:$("bd").value,start:$("bs").value,duration:d,format:$("bf").value,groupSize:g,sessionTypes:[...document.querySelectorAll(".stype:checked")].map(x=>x.value),location:loc,paymentMethod:method(loc),payments,notes:"",attachments:[],createdAt:Date.now()};await db.ref("bookings").push(b);let msg=encodeURIComponent(`📚 New Tutoring Booking\n\nTutor: ${t.name}\nStudent/Group: ${profile.name}\nCourse: ${b.course}\nDate: ${b.date}\nTime: ${b.start}\nDuration: ${d}h\nFormat: ${b.format} (${g})\nType: ${b.sessionTypes.join(", ")}\nLocation: ${loc}\nPayment Method: ${b.paymentMethod}\nTotal: ${money(total(b))}`);window.open(`https://wa.me/${t.whatsapp||""}?text=${msg}`,"_blank");alert("Booking saved. The slot is now blocked for other students.");await loadData();bookingPage()}

function paymentsPage(){bookingsPage(false)}
function docsPage(){let docs=list(DATA.documents).filter(d=>profile.role!=="student"||d.ownerId===currentUser.uid);$("content").innerHTML=`<div class="card"><h2>Documents</h2><p class="muted">Free version stores Google Drive view-only links.</p><table class="table"><tr><th>Title</th><th>Owner</th><th>Link</th></tr>${docs.map(d=>`<tr><td>${d.title}</td><td>${user(d.ownerId).name||""}</td><td>${d.url?`<a href="${d.url}" target="_blank">Open</a>`:""}</td></tr>`).join("")}</table>${profile.role!=="student"?`<hr><h3>Add Document Link</h3><div class="row"><select id="do">${students().map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select><input id="dt" placeholder="Title"><input id="du" placeholder="Google Drive view-only link"></div><button onclick="addDoc()">Add Document</button>`:""}</div>`}
async function addDoc(){await db.ref("documents").push({ownerId:$("do").value,title:$("dt").value,url:$("du").value,createdAt:Date.now()});await loadData();docsPage()}
function profilePage(){$("content").innerHTML=`<div class="card"><h2>Profile</h2><p><b>Name:</b> ${profile.name}</p><p><b>Email:</b> ${profile.email}</p><p><b>Role:</b> ${profile.role}</p><label>New password</label><input id="np" type="password" placeholder="New password"><button onclick="changePassword()">Change Password</button>${profile.role==="tutor"?`<hr><p><b>WhatsApp:</b> ${profile.whatsapp||""}</p><a target="_blank" href="https://wa.me/${profile.whatsapp||""}"><button class="whatsapp">WhatsApp Button Preview</button></a>`:""}</div>`}
async function changePassword(){try{await auth.currentUser.updatePassword($("np").value);alert("Password changed")}catch(e){alert(e.message)}}