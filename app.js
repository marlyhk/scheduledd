const firebaseConfig={apiKey:"AIzaSyBK-Iu_TKXq7-PjIDOxXvwp2MDYXikQV8Y",authDomain:"scheduled-ed.firebaseapp.com",databaseURL:"https://scheduled-ed-default-rtdb.europe-west1.firebasedatabase.app",projectId:"scheduled-ed",storageBucket:"scheduled-ed.firebasestorage.app",messagingSenderId:"1057147687553",appId:"1:1057147687553:web:2c76219c0b97e2e9b3f380",measurementId:"G-QF774WZ4ER"};
firebase.initializeApp(firebaseConfig);
const secondaryApp=firebase.initializeApp(firebaseConfig,"Secondary");
const secondaryAuth=secondaryApp.auth();
const auth=firebase.auth(),db=firebase.database();
const ADMIN_WHATSAPP="96176174738";
const SITE_URL="https://scheduledeu.vercel.app/";
const $=id=>document.getElementById(id);
const money=n=>"$"+Number(n||0).toFixed(Number.isInteger(Number(n))?0:2);
let currentUser=null,profile=null,DATA={users:{},availability:{},bookings:{},documents:{},courses:{},unavailable:{},accessRequests:{},pendingProfiles:{},publicTutors:{}};
let preselectTutorId=null;

setTimeout(()=>{$("splash").classList.add("hidden");$("app").classList.remove("hidden")},800);
function notice(m){$("notice").textContent=m;$("notice").classList.remove("hidden")}
function cleanPhone(p){return String(p||"").replace(/[^\d]/g,"")}
function openWhatsApp(phone,msg){const p=cleanPhone(phone);if(!p)return alert("No WhatsApp number saved.");window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`,"_blank")}
function toggleRequestAccess(){$("requestAccess").classList.toggle("hidden")}
async function submitAccessRequest(){
  const name=$("reqName").value.trim(),email=$("reqEmail").value.trim(),phone=$("reqPhone").value.trim(),university=($("reqUniversity")?.value||"").trim(),courses=$("reqCourses").value.trim(),message=$("reqMessage").value.trim();
  if(!name||!email||!phone||!university||!courses)return notice("Please fill full name, email, phone number, university, and course(s) needed.");
  try{
    await db.ref("accessRequests").push({name,email,phone,university,courses,message,status:"pending",createdAt:Date.now()});
    ["reqName","reqEmail","reqPhone","reqUniversity","reqCourses","reqMessage"].forEach(id=>{if($(id))$(id).value=""});
    notice("Access request submitted. We will contact you after review.");
    $("requestAccess").classList.add("hidden");
  }catch(e){notice(e.message)}
}
function becomeTutorWhatsapp(){openWhatsApp(ADMIN_WHATSAPP,`Hi! I'd like to become a tutor on Scheduled.\n\nName:\nUniversity:\nDegree:\nCourses I teach:\nHourly Rate:\nTeaching Locations:\nPhone Number:\nEmail:\nYears of Tutoring Experience (optional):\n\nThank you!`)}

async function loadData(){const s=await db.ref("/").once("value");const v=s.val()||{};DATA={users:v.users||{},availability:v.availability||{},bookings:v.bookings||{},documents:v.documents||{},courses:v.courses||{},unavailable:v.unavailable||{},accessRequests:v.accessRequests||{},pendingProfiles:v.pendingProfiles||{},publicTutors:v.publicTutors||{}}}
auth.onAuthStateChanged(async u=>{
  if(!u)return;
  currentUser=u;
  let s=await db.ref("users/"+u.uid).once("value");
  profile=s.val();
  if(!profile){profile=await applyPendingProfileIfAny(u)}
  if(!profile||profile.removed){
    notice("This account does not have access to Scheduled.");
    await auth.signOut();
    return;
  }
  await loadData();
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
function studentTutors(studentId){let ids=[...new Set(list(DATA.bookings).filter(b=>b.studentId===studentId).map(b=>b.tutorId))];return ids.map(id=>({id,...user(id)})).filter(t=>t.role==="tutor"&&!t.removed)}



function imageFileToDataUrl(fileInputId){
  return new Promise(resolve=>{
    const input=$(fileInputId);
    if(!input||!input.files||!input.files[0])return resolve("");
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement("canvas");
        const max=500;let w=img.width,h=img.height;
        if(w>h&&w>max){h=Math.round(h*max/w);w=max}
        else if(h>=w&&h>max){w=Math.round(w*max/h);h=max}
        canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",0.72));
      };
      img.onerror=()=>resolve("");
      img.src=e.target.result;
    };
    reader.onerror=()=>resolve("");
    reader.readAsDataURL(input.files[0]);
  });
}
function pendingKey(email){return safe(String(email||"").toLowerCase().trim())}
async function applyPendingProfileIfAny(u){
  const key=pendingKey(u.email);
  const snap=await db.ref("pendingProfiles/"+key).once("value");
  const pending=snap.val();
  if(!pending)return null;
  await db.ref("users/"+u.uid).set({...pending,uid:u.uid,email:u.email,linkedAt:Date.now()});
  await db.ref("pendingProfiles/"+key).remove();
  return {...pending,uid:u.uid,email:u.email};
}


function publicTutorProfiles(){
  return list(DATA.publicTutors).filter(t=>!t.hidden).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
}
function allPublicCourseNames(){
  let names=[];
  publicTutorProfiles().forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));
  return [...new Set(names.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function allPublicUniversityNames(){
  return [...new Set(publicTutorProfiles().map(t=>t.university).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function publicTutorPhoto(t){return t.photoUrl||"scheduled-icon.jpeg"}
function filteredPublicTutors(){
  const course=$("browseCourse")?.value||"";
  const university=$("browseUniversity")?.value||"";
  return publicTutorProfiles().filter(t=>(!course||(t.courses||[]).includes(course))&&(!university||t.university===university));
}
function browseFiltersHTML(publicMode=true){
  const courses=allPublicCourseNames(),universities=allPublicUniversityNames();
  return `<div class="row">
    <select id="browseCourse" onchange="${publicMode?'renderPublicTutorGrid()':'renderLoggedTutorGrid()'}"><option value="">All courses</option>${courses.map(c=>`<option value="${c}">${c}</option>`).join("")}</select>
    <select id="browseUniversity" onchange="${publicMode?'renderPublicTutorGrid()':'renderLoggedTutorGrid()'}"><option value="">All universities</option>${universities.map(u=>`<option value="${u}">${u}</option>`).join("")}</select>
  </div>`;
}
function tutorCard(t,inside=false){
  return `<div class="card tutor-card" onclick="${inside?`showLoggedTutorDetails('${t.id}')`:`showPublicTutorDetails('${t.id}')`}">
    <img class="tutor-avatar" src="${publicTutorPhoto(t)}" onerror="this.src='scheduled-icon.jpeg'">
    <h3>${t.name||""}</h3>
    <div class="tutor-meta">${t.university||"University not specified"}<br>${(t.courses||[]).join(", ")||"Courses not specified"}</div>
  </div>`;
}
function browsePublicTutors(){
  $("loginPage").innerHTML=`<div class="public-tutor-shell"><div class="backline"><button class="ghost" onclick="location.reload()">← Back to Login</button><h1 class="brand-word small-brand">Scheduled Tutors</h1></div><div class="card"><h2>Browse Tutors</h2>${browseFiltersHTML(true)}<div id="publicTutorGrid"></div></div></div>`;
  renderPublicTutorGrid();
}
function renderPublicTutorGrid(){
  const box=$("publicTutorGrid");
  if(!box)return;
  const ts=filteredPublicTutors();
  box.innerHTML=ts.length?`<div class="grid">${ts.map(t=>tutorCard(t,false)).join("")}</div>`:`<p class="muted">No tutors found.</p>`;
}
function showPublicTutorDetails(id){
  const t=DATA.publicTutors[id];
  $("loginPage").innerHTML=`<div class="public-tutor-shell"><button class="ghost" onclick="browsePublicTutors()">← Back to Tutors</button><div class="card"><img class="tutor-avatar-lg" src="${publicTutorPhoto(t)}" onerror="this.src='scheduled-icon.jpeg'"><h2>${t.name||""}</h2><p><b>University:</b> ${t.university||"Not specified"}</p><p><b>Courses:</b> ${(t.courses||[]).join(", ")||"Not specified"}</p><p><b>Hourly Rate:</b> ${money(t.rate)}/hour/person</p><p><b>Locations:</b> ${(t.locations||[]).join(", ")||"Set by availability"}</p><p>${t.description||"No description yet."}</p><button onclick="location.reload();setTimeout(()=>toggleRequestAccess(),500)">Book Now / Request Access</button></div></div>`;
}
function allTutorsPage(){
  $("content").innerHTML=`<div class="card"><h2>All Tutors</h2>${browseFiltersHTML(false)}<div id="loggedTutorGrid"></div></div>`;
  renderLoggedTutorGrid();
}
function renderLoggedTutorGrid(){
  const box=$("loggedTutorGrid");
  if(!box)return;
  const ts=filteredPublicTutors();
  box.innerHTML=ts.length?`<div class="grid">${ts.map(t=>tutorCard(t,true)).join("")}</div>`:`<p class="muted">No tutors found.</p>`;
}
function showLoggedTutorDetails(id){
  const t=DATA.publicTutors[id];
  $("content").innerHTML=`<div class="card"><button class="ghost" onclick="allTutorsPage()">← Back to All Tutors</button><hr><img class="tutor-avatar-lg" src="${publicTutorPhoto(t)}" onerror="this.src='scheduled-icon.jpeg'"><h2>${t.name||""}</h2><p><b>University:</b> ${t.university||"Not specified"}</p><p><b>Courses:</b> ${(t.courses||[]).join(", ")||"Not specified"}</p><p><b>Hourly Rate:</b> ${money(t.rate)}/hour/person</p><p><b>Locations:</b> ${(t.locations||[]).join(", ")||"Set by availability"}</p><p>${t.description||"No description yet."}</p><button onclick="${t.linkedTutorId?`bookWithTutor('${t.linkedTutorId}')`:`openTab('Book')`}">Book Now</button></div>`;
}
function bookWithTutor(id){preselectTutorId=id;openTab("Book")}
function myStudentsPage(){let ids=[...new Set(list(DATA.bookings).filter(b=>b.tutorId===currentUser.uid).map(b=>b.studentId))];let ss=ids.map(id=>({id,...user(id)})).filter(s=>s.role==="student");$("content").innerHTML=`<div class="card"><h2>My Students</h2>${ss.length?`<div class="grid">${ss.map(s=>{let bs=list(DATA.bookings).filter(b=>b.tutorId===currentUser.uid&&b.studentId===s.id);return`<div class="card"><h3>${s.name}</h3><p>${s.email||""}<br>${s.phone||""}</p><b>Upcoming</b><br>${bs.filter(b=>!b.done).map(b=>`${b.date} • ${b.course} • ${formatTime12(b.start)}`).join("<br>")||"<span class='muted'>None</span>"}<hr><b>Past</b><br>${bs.filter(b=>b.done).map(b=>`${b.date} • ${b.course} • ${formatTime12(b.start)}`).join("<br>")||"<span class='muted'>None</span>"}<hr><b>Unpaid:</b> ${money(unpaid(bs))}</div>`}).join("")}</div>`:`<p class="muted">No students yet. Students appear here after booking with you.</p>`}</div>`}

function financialPage(){let b=myBookings(),month=new Date().toISOString().slice(0,7),mb=b.filter(x=>(x.date||"").startsWith(month));$("content").innerHTML=`<div class="grid"><div class="card"><h3>Total Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Total Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>This Month Paid</h3><h1>${money(paid(mb))}</h1></div><div class="card"><h3>This Month Unpaid</h3><h1>${money(unpaid(mb))}</h1></div></div><div class="card"><h2>Financial Details</h2>${bookingRows(b,true)}</div>`}
function docsPage(){let docs=list(DATA.documents).filter(d=>profile.role!=="student"||d.ownerId===currentUser.uid);$("content").innerHTML=`<div class="card"><h2>Documents</h2><p class="muted">Free version stores Google Drive view-only links.</p><table class="table"><tr><th>Title</th><th>Owner</th><th>Link</th></tr>${docs.map(d=>`<tr><td>${d.title}</td><td>${user(d.ownerId).name||""}</td><td>${d.url?`<a href="${d.url}" target="_blank">Open</a>`:""}</td></tr>`).join("")}</table>${profile.role!=="student"?`<hr><h3>Add Document Link</h3><div class="row"><select id="do">${students().map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select><input id="dt" placeholder="Title"><input id="du" placeholder="Google Drive view-only link"></div><button onclick="addDoc()">Add Document</button>`:""}</div>`}
async function addDoc(){await db.ref("documents").push({ownerId:$("do").value,title:$("dt").value,url:$("du").value,createdAt:Date.now()});await loadData();docsPage()}
function exportPage(){$("content").innerHTML=`<div class="card"><h2>Export</h2><p class="muted">Download bookings and payments as CSV.</p><button onclick="exportCSV()">Export Bookings CSV</button></div>`}
function exportCSV(){const rows=[["Date","Time","Course","Tutor","Student/Group","Duration","Location","Payment Method","Total","Payments"]];myBookings().forEach(b=>rows.push([b.date,b.start,b.course,user(b.tutorId).name||"",user(b.studentId).name||"",b.duration,b.location,b.paymentMethod,total(b),(b.payments||[]).map(p=>`${p.name}: ${money(p.amount)} ${p.paid?"Paid":"Unpaid"}`).join(" | ")]));const csv=rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="scheduled-export.csv";a.click();URL.revokeObjectURL(url)}
function profilePage(){$("content").innerHTML=`<div class="card"><h2>Profile</h2><p><b>Name:</b> ${profile.name}</p><p><b>Email:</b> ${profile.email}</p><p><b>Role:</b> ${profile.role}</p><label>New password</label><input id="np" type="password" placeholder="New password"><button onclick="changePassword()">Change Password</button>${profile.role==="tutor"?`<hr><p><b>WhatsApp:</b> ${profile.whatsapp||""}</p><button class="whatsapp" onclick="openWhatsApp('${profile.whatsapp||""}','Hi, I have a question about tutoring on Scheduled.')">WhatsApp Button Preview</button>`:""}</div>`}
async function changePassword(){try{await auth.currentUser.updatePassword($("np").value);alert("Password changed")}catch(e){alert(e.message)}
function publicTutorProfilesPage(){
  const ps=list(DATA.publicTutors).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  $("content").innerHTML=`<div class="card"><h2>Public Tutor Profiles</h2><p class="muted">These profiles control the public Browse Tutors page. They are separate from tutor login accounts.</p>
  ${ps.length?`<table class="table"><tr><th>Photo</th><th>Name</th><th>University</th><th>Courses</th><th>Rate</th><th>Linked Account</th><th>Actions</th></tr>${ps.map(p=>`<tr><td><img class="profile-preview" src="${publicTutorPhoto(p)}" onerror="this.src='scheduled-icon.jpeg'"></td><td>${p.name||""}</td><td>${p.university||""}</td><td>${(p.courses||[]).join(", ")}</td><td>${money(p.rate)}/h</td><td>${p.linkedTutorId?(user(p.linkedTutorId).name||"Linked"):"Not linked"}</td><td><button onclick="editPublicTutorProfile('${p.id}')">Edit</button><button onclick="editPublicTutorPhoto('${p.id}')">Photo</button><button class="danger" onclick="deletePublicTutorProfile('${p.id}')">Delete</button></td></tr>`).join("")}</table>`:`<p class="muted">No public tutor profiles yet.</p>`}
  <hr><h3>Add Public Tutor Profile</h3>
  <div class="row">
    <input id="pname" placeholder="Tutor name">
    <input id="puniversity" placeholder="University">
    <input id="prate" type="number" placeholder="Hourly rate">
    <select id="plink"><option value="">No linked account yet</option>${tutors().map(t=>`<option value="${t.id}">${t.name} — ${t.email}</option>`).join("")}</select>
  </div>
  <input id="pcourses" placeholder="Courses taught, comma separated">
  <input id="plocations" placeholder="Locations, comma separated">
  <label>Profile picture</label><input id="pphotoFile" type="file" accept="image/*">
  <textarea id="pdesc" placeholder="Description / teaching style"></textarea>
  <button onclick="addPublicTutorProfile()">Add Public Profile</button></div>`;
}
async function addPublicTutorProfile(){
  const name=$("pname").value.trim(),university=$("puniversity").value.trim(),rate=Number($("prate").value||0),linkedTutorId=$("plink").value;
  const courses=$("pcourses").value.split(",").map(x=>x.trim()).filter(Boolean);
  const locations=$("plocations").value.split(",").map(x=>x.trim()).filter(Boolean);
  const description=$("pdesc").value.trim();
  const photoUrl=await imageFileToDataUrl("pphotoFile");
  if(!name||!university||!courses.length)return alert("Please fill name, university, and courses.");
  await db.ref("publicTutors").push({name,university,rate,linkedTutorId,courses,locations,description,photoUrl,createdAt:Date.now(),hidden:false});
  await loadData();publicTutorProfilesPage();
}
async function editPublicTutorProfile(id){
  const p=DATA.publicTutors[id];if(!p)return alert("Profile not found.");
  const name=prompt("Tutor name:",p.name||"");if(name===null)return;
  const university=prompt("University:",p.university||"");if(university===null)return;
  const rate=prompt("Hourly rate:",p.rate||0);if(rate===null)return;
  const coursesText=prompt("Courses, comma separated:",(p.courses||[]).join(", "));if(coursesText===null)return;
  const locationsText=prompt("Locations, comma separated:",(p.locations||[]).join(", "));if(locationsText===null)return;
  const description=prompt("Description:",p.description||"");if(description===null)return;
  const linkedTutorId=prompt("Linked tutor account ID. Leave empty if none:",p.linkedTutorId||"");if(linkedTutorId===null)return;
  await db.ref("publicTutors/"+id).update({name,university,rate:Number(rate||0),courses:coursesText.split(",").map(x=>x.trim()).filter(Boolean),locations:locationsText.split(",").map(x=>x.trim()).filter(Boolean),description,linkedTutorId,updatedAt:Date.now()});
  await loadData();publicTutorProfilesPage();
}
async function editPublicTutorPhoto(id){
  const input=document.createElement("input");input.type="file";input.accept="image/*";
  input.onchange=async()=>{
    if(!input.files||!input.files[0])return;
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=async()=>{
        const canvas=document.createElement("canvas");const max=500;let w=img.width,h=img.height;
        if(w>h&&w>max){h=Math.round(h*max/w);w=max}else if(h>=w&&h>max){w=Math.round(w*max/h);h=max}
        canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);
        await db.ref("publicTutors/"+id+"/photoUrl").set(canvas.toDataURL("image/jpeg",0.72));
        await loadData();publicTutorProfilesPage();
      };img.src=e.target.result;
    };reader.readAsDataURL(input.files[0]);
  };input.click();
}
async function deletePublicTutorProfile(id){
  if(!confirm("Delete this public tutor profile? This does not delete the tutor login account."))return;
  await db.ref("publicTutors/"+id).remove();
  await loadData();publicTutorProfilesPage();
}

}