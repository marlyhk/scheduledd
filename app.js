
/* ScheduledSafeErrorV67 */
window.addEventListener("error", function(e){
  try{
    const splash=document.getElementById("splash");
    const app=document.getElementById("app");
    if(splash)splash.classList.add("hidden");
    if(app)app.classList.remove("hidden");
    const target=document.getElementById("content")||document.getElementById("loginPage")||app;
    if(target && !target.innerHTML.trim()){
      target.innerHTML=`<div class="card"><h2>Website error</h2><p class="muted">${String(e.message||"Unknown error")}</p><button onclick="location.reload()">Reload</button></div>`;
    }
  }catch(_){}
});

/* ScheduledSplashV63 drawn real logo */
window.addEventListener("load", function(){
  setTimeout(function(){
    try{
      const app=document.getElementById("app");
      const splash=document.getElementById("splash");
      if(app)app.classList.remove("hidden");
      if(splash)splash.classList.add("hidden");
    }catch(e){}
  }, 5100);
});


window.addEventListener("error", function(e){
  try{
    const splash=document.getElementById("splash");
    const app=document.getElementById("app");
    if(splash)splash.classList.add("hidden");
    if(app)app.classList.remove("hidden");
    const target=document.getElementById("content")||document.getElementById("loginPage")||app;
    if(target){
      target.innerHTML=`<div class="error-card"><h2>Website error</h2><p>The page hit an error instead of staying blank.</p><p class="muted">${String(e.message||"Unknown error")}</p><button onclick="location.reload()">Reload</button></div>`;
    }
  }catch(_){}
});
window.addEventListener("unhandledrejection", function(e){
  try{
    const target=document.getElementById("content")||document.getElementById("loginPage")||document.getElementById("app");
    if(target){
      const msg=String((e.reason&&e.reason.message)||e.reason||"Unknown error");
      target.innerHTML=`<div class="error-card"><h2>Website error</h2><p class="muted">${msg}</p><button onclick="location.reload()">Reload</button></div>`;
    }
  }catch(_){}
});

function openRequestAccessForm(prefillCourses=""){
  $("loginPage").innerHTML=`<div class="login-card">
    <button class="ghost" onclick="location.reload()">← Back to Login</button>
    <div class="brand">
      <img src="scheduled-icon.jpeg" alt="Scheduled" onerror="this.style.display='none'">
      <h1 class="brand-word">Request Access</h1>
      <p>Submit your details so admin can create your Scheduled account.</p>
    </div>
    <div id="notice" class="notice hidden"></div>
    <label>Full Name</label><input id="reqName" placeholder="Full name">
    <label>Email Address</label><input id="reqEmail" type="email" placeholder="Email address">
    <label>Phone Number</label><input id="reqPhone" placeholder="Phone number">
    <label>University</label><input id="reqUniversity" placeholder="University">
    <label>Course(s) Needed</label><input id="reqCourses" placeholder="Course(s) needed" value="${prefillCourses||""}">
    <label>Message</label><textarea id="reqMessage" placeholder="Message (optional)"></textarea>
    <button onclick="submitAccessRequest()">Submit Request</button>
  </div>`;
}
function showPublicRequestAccess(prefillCourses=""){openRequestAccessForm(prefillCourses)}
function toggleRequestAccess(){openRequestAccessForm()}


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
let currentUser=null,profile=null,DATA={users:{},availability:{},bookings:{},documents:{},courses:{},unavailable:{},accessRequests:{},pendingProfiles:{},publicTutors:{},profilesByEmail:{},tasks:{},chats:{},groups:{},semesters:{},achievements:{}};
let preselectTutorId=null;

setTimeout(()=>{$("splash").classList.add("hidden");$("app").classList.remove("hidden")}, 5100);
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

async function submitAccessRequest(){try{const name=($("reqName")?.value||"").trim();const email=($("reqEmail")?.value||"").trim();const phone=($("reqPhone")?.value||"").trim();const university=($("reqUniversity")?.value||"").trim();const courses=($("reqCourses")?.value||"").trim();const message=($("reqMessage")?.value||"").trim();if(!name||!email||!phone||!university||!courses){return notice("Please fill full name, email, phone number, university, and course(s) needed.")}await db.ref("accessRequests").push({name,email,phone,university,courses,message,status:"pending",createdAt:Date.now()});["reqName","reqEmail","reqPhone","reqUniversity","reqCourses","reqMessage"].forEach(id=>{if($(id))$(id).value=""});notice("Access request submitted. We will contact you after review.")}catch(e){notice(e.message||"Could not submit request. Please try again.")}}
function becomeTutorWhatsapp(){openWhatsApp(ADMIN_WHATSAPP,`Hi! I'd like to become a tutor on Scheduled.\n\nName:\nUniversity:\nDegree:\nCourses I teach:\nHourly Rate:\nTeaching Locations:\nPhone Number:\nEmail:\nYears of Tutoring Experience (optional):\n\nThank you!`)}

async function loadData(){const s=await db.ref("/").once("value");const v=s.val()||{};DATA={users:v.users||{},availability:v.availability||{},bookings:v.bookings||{},documents:v.documents||{},courses:v.courses||{},unavailable:v.unavailable||{},accessRequests:v.accessRequests||{},pendingProfiles:v.pendingProfiles||{},publicTutors:v.publicTutors||{},profilesByEmail:v.profilesByEmail||{},tasks:v.tasks||{},chats:v.chats||{},groups:v.groups||{},semesters:v.semesters||{},achievements:v.achievements||{}}}
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
function method(l){return String(l||"").toLowerCase().includes("online")?"Whish":"Cash"}
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


/* ===== v2.9 stable public tutor profiles: separate from real tutor accounts ===== */
function getPublicProfiles(){
  const publicList=list(DATA.publicTutors||{}).filter(p=>!p.hidden);

  // Fallback: if no public profiles were created yet, show tutor accounts that have public-style info.
  // This prevents Browse Tutors from appearing empty if data was added in the older Tutors system.
  if(publicList.length)return publicList.sort((a,b)=>(a.name||"").localeCompare(b.name||""));

  return tutors().filter(t=>!t.hiddenPublic).map(t=>({
    id:t.id,
    name:t.name,
    university:t.university,
    courses:t.courses||[],
    rate:t.rate,
    locations:t.locations||[],
    description:t.description||"",
    photoUrl:t.photoUrl||"",
    linkedTutorId:t.id
  })).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
}
function publicPhoto(p){return (p&&p.photoUrl)||"scheduled-icon.jpeg"}
function publicCourses(){
  let names=[]; getPublicProfiles().forEach(p=>(p.courses||[]).forEach(c=>names.push(c)));
  return [...new Set(names.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function publicUniversities(){
  return [...new Set(getPublicProfiles().map(p=>p.university).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function publicFilterHTML(renderFn){
  const courses=publicCourses(), universities=publicUniversities();
  return `<div class="row">
    <select id="publicCourseFilter" onchange="${renderFn}()"><option value="">All courses</option>${courses.map(c=>`<option value="${c}">${c}</option>`).join("")}</select>
    <select id="publicUniversityFilter" onchange="${renderFn}()"><option value="">All universities</option>${universities.map(u=>`<option value="${u}">${u}</option>`).join("")}</select>
  </div>`;
}
function filteredPublicProfiles(){
  const course=$("publicCourseFilter")?.value||"";
  const university=$("publicUniversityFilter")?.value||"";
  return getPublicProfiles().filter(p=>(!course||(p.courses||[]).includes(course))&&(!university||p.university===university));
}
function publicProfileCard(p,logged){
  return `<div class="card tutor-card" onclick="${logged?`showLoggedPublicProfile('${p.id}')`:`showPublicProfile('${p.id}')`}">
    <img class="tutor-avatar" src="${publicPhoto(p)}" onerror="this.src='scheduled-icon.jpeg'">
    <h3>${p.name||""}</h3>
    <div class="tutor-meta">${p.university||"University not specified"}<br>${(p.courses||[]).join(", ")||"Courses not specified"}</div>
  </div>`;
}

function showPublicRequestAccess(prefillCourses=""){openRequestAccessForm(prefillCourses)}
async function browsePublicTutors(){
  await loadData();
  $("loginPage").innerHTML=`<div class="login-card" style="width:min(1050px,100%);">
    <button class="ghost" onclick="location.reload()">← Back to Login</button>
    <div class="brand"><h1 class="brand-word">Scheduled Tutors</h1><p>Browse available tutors.</p></div>
    <div class="card">${publicFilterHTML("renderPublicProfiles")}<div id="publicProfilesGrid"></div></div>
  </div>`;
  renderPublicProfiles();
}
function renderPublicProfiles(){
  const box=$("publicProfilesGrid"); if(!box)return;
  const ps=filteredPublicProfiles();
  box.innerHTML=ps.length?`<div class="grid">${ps.map(p=>publicProfileCard(p,false)).join("")}</div>`:`<p class="muted">No public tutor profiles yet.</p>`;
}
function showPublicProfile(id){
  const p=(DATA.publicTutors||{})[id]; 
  if(!p)return;
  const prefill=(p.courses||[]).join(", ").replace(/'/g,"\\'");
  $("loginPage").innerHTML=`<div class="login-card" style="width:min(760px,100%);">
    <button class="ghost" onclick="browsePublicTutors()">← Back to Tutors</button>
    <div class="card">
      <img class="tutor-avatar-lg" src="${publicPhoto(p)}" onerror="this.src='scheduled-icon.jpeg'">
      <h2>${p.name||""}</h2>
      <p><b>University:</b> ${p.university||"Not specified"}</p>
      <p><b>Courses:</b> ${(p.courses||[]).join(", ")||"Not specified"}</p>
      <p><b>Hourly Rate:</b> ${money(p.rate)}/hour/person</p>
      <p><b>Locations:</b> ${(p.locations||[]).join(", ")||"Set by availability"}</p>
      <p>${p.description||"No description yet."}</p>
      <button onclick="showPublicRequestAccess('${prefill}')">Book Now / Request Access</button>
    </div>
  </div>`;
}
async function allTutorsPage(){
  await loadData();
  $("content").innerHTML=`<div class="card"><h2>All Tutors</h2><p class="muted">These are the public tutor profiles. Booking only works when a profile is linked to a real tutor account.</p>${publicFilterHTML("renderLoggedPublicProfiles")}<div id="loggedPublicProfilesGrid"></div></div>`;
  renderLoggedPublicProfiles();
}
function renderLoggedPublicProfiles(){
  const box=$("loggedPublicProfilesGrid"); if(!box)return;
  const ps=filteredPublicProfiles();
  box.innerHTML=ps.length?`<div class="grid">${ps.map(p=>publicProfileCard(p,true)).join("")}</div>`:`<p class="muted">No public tutor profiles yet.</p>`;
}
function showLoggedPublicProfile(id){
  const p=(DATA.publicTutors||{})[id]; 
  if(!p)return;
  const linked=p.linkedTutorId && DATA.users[p.linkedTutorId] && DATA.users[p.linkedTutorId].role==="tutor";
  const firstCourse=((p.courses||[])[0]||"").replace(/'/g,"\\'");
  $("content").innerHTML=`<div class="card">
    <button class="ghost" onclick="allTutorsPage()">← Back to All Tutors</button><hr>
    <img class="tutor-avatar-lg" src="${publicPhoto(p)}" onerror="this.src='scheduled-icon.jpeg'">
    <h2>${p.name||""}</h2>
    <p><b>University:</b> ${p.university||"Not specified"}</p>
    <p><b>Courses:</b> ${(p.courses||[]).join(", ")||"Not specified"}</p>
    <p><b>Hourly Rate:</b> ${money(p.rate)}/hour/person</p>
    <p><b>Locations:</b> ${(p.locations||[]).join(", ")||"Set by availability"}</p>
    <p>${p.description||"No description yet."}</p>
    ${linked?`<button onclick="bookWithTutor('${p.linkedTutorId}','${firstCourse}')">Book Now</button>`:`<p class="admin-note">This tutor profile is not linked to a booking account yet. Please use the Book tab or contact admin.</p><button onclick="openTab('Book')">Go to Booking</button>`}
  </div>`;
}
async function publicProfileImageData(inputId){
  return await imageFileToDataUrl(inputId);
}
function publicTutorProfilesPage(){
  const ps=list(DATA.publicTutors||{}).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  $("content").innerHTML=`<div class="card"><h2>Tutor Profiles</h2>
  <p class="admin-note"><b>Important:</b> This tab is only for the public Browse Tutors page. It does not create login accounts and it does not affect availability unless you link it to a real tutor account.</p>
  ${ps.length?`<table class="table"><tr><th>Photo</th><th>Name</th><th>University</th><th>Courses</th><th>Rate</th><th>Linked Booking Tutor</th><th>Actions</th></tr>${ps.map(p=>`<tr><td><img class="profile-preview" src="${publicPhoto(p)}" onerror="this.src='scheduled-icon.jpeg'"></td><td>${p.name||""}</td><td>${p.university||""}</td><td>${(p.courses||[]).join(", ")}</td><td>${money(p.rate)}/h</td><td>${p.linkedTutorId?(user(p.linkedTutorId).name||"Linked"):"Not linked"}</td><td><button onclick="editPublicTutorProfile('${p.id}')">Edit</button><button onclick="editPublicTutorPhoto('${p.id}')">Photo</button><button class="danger" onclick="deletePublicTutorProfile('${p.id}')">Delete</button></td></tr>`).join("")}</table>`:`<p class="muted">No public tutor profiles yet.</p>`}
  <hr><h3>Add Public Tutor Profile</h3>
  <div class="row">
    <input id="pname" placeholder="Tutor name">
    <input id="puniversity" placeholder="University">
    <input id="prate" type="number" placeholder="Hourly rate">
    <select id="plink"><option value="">No linked booking tutor account</option>${tutors().map(t=>`<option value="${t.id}">${t.name} — ${t.email}</option>`).join("")}</select>
  </div>
  <input id="pcourses" placeholder="Courses taught, comma separated">
  <input id="plocations" placeholder="Locations, comma separated">
  <label>Profile picture</label><input id="pphotoFile" type="file" accept="image/*">
  <textarea id="pdesc" placeholder="Description / teaching style"></textarea>
  <button onclick="addPublicTutorProfile()">Add Public Profile</button></div>`;
}
async function addPublicTutorProfile(){
  const name=$("pname").value.trim(), university=$("puniversity").value.trim(), rate=Number($("prate").value||0), linkedTutorId=$("plink").value;
  const courses=$("pcourses").value.split(",").map(x=>x.trim()).filter(Boolean);
  const locations=$("plocations").value.split(",").map(x=>x.trim()).filter(Boolean);
  const description=$("pdesc").value.trim();
  const photoUrl=await publicProfileImageData("pphotoFile");
  if(!name||!university||!courses.length)return alert("Please fill name, university, and courses.");
  await db.ref("publicTutors").push({name,university,rate,linkedTutorId,courses,locations,description,photoUrl,createdAt:Date.now(),hidden:false,visible:true});
  await loadData();
  alert("Public tutor profile added. It will now appear in Browse Tutors.");
  publicTutorProfilesPage();
}
async function editPublicTutorProfile(id){
  const p=(DATA.publicTutors||{})[id]; if(!p)return alert("Profile not found.");
  const name=prompt("Tutor name:",p.name||""); if(name===null)return;
  const university=prompt("University:",p.university||""); if(university===null)return;
  const rate=prompt("Hourly rate:",p.rate||0); if(rate===null)return;
  const coursesText=prompt("Courses, comma separated:",(p.courses||[]).join(", ")); if(coursesText===null)return;
  const locationsText=prompt("Locations, comma separated:",(p.locations||[]).join(", ")); if(locationsText===null)return;
  const description=prompt("Description:",p.description||""); if(description===null)return;
  const linkedTutorId=prompt("Linked real tutor account ID. Leave empty if none:",p.linkedTutorId||""); if(linkedTutorId===null)return;
  await db.ref("publicTutors/"+id).update({name,university,rate:Number(rate||0),courses:coursesText.split(",").map(x=>x.trim()).filter(Boolean),locations:locationsText.split(",").map(x=>x.trim()).filter(Boolean),description,linkedTutorId,updatedAt:Date.now()});
  await loadData();publicTutorProfilesPage();
}
async function editPublicTutorPhoto(id){
  const input=document.createElement("input"); input.type="file"; input.accept="image/*";
  input.onchange=async()=>{ if(!input.files||!input.files[0])return; const data=await imageFileToDataUrlFromInput(input); await db.ref("publicTutors/"+id+"/photoUrl").set(data); await loadData(); publicTutorProfilesPage(); };
  input.click();
}
function imageFileToDataUrlFromInput(input){
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{ const img=new Image(); img.onload=()=>{ const canvas=document.createElement("canvas"); const max=500; let w=img.width,h=img.height; if(w>h&&w>max){h=Math.round(h*max/w);w=max}else if(h>=w&&h>max){w=Math.round(w*max/h);h=max} canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h); resolve(canvas.toDataURL("image/jpeg",0.72)); }; img.onerror=()=>resolve(""); img.src=e.target.result; };
    reader.onerror=()=>resolve("");
    reader.readAsDataURL(input.files[0]);
  });
}
async function deletePublicTutorProfile(id){
  if(!confirm("Delete this public profile? This does not delete the real tutor login account."))return;
  await db.ref("publicTutors/"+id).remove();
  await loadData();publicTutorProfilesPage();
}


function assignedTutorIdsForStudent(studentId){
  const s=user(studentId);
  return Array.isArray(s.assignedTutorIds)?s.assignedTutorIds:[];
}
function assignedStudentsForTutor(tutorId){
  return students().filter(s=>assignedTutorIdsForStudent(s.id).includes(tutorId));
}
function tutorCheckboxes(className="assignedTutor"){
  const ts=tutors();
  if(!ts.length)return "<p class='muted'>No tutors available yet.</p>";
  return ts.map(t=>`<label class="check"><input type="checkbox" class="${className}" value="${t.id}">${t.name}</label>`).join("");
}
function selectedTutorIds(className="assignedTutor"){
  return [...document.querySelectorAll("."+className+":checked")].map(x=>x.value);
}
function assignedTutorNames(studentId){
  return assignedTutorIdsForStudent(studentId).map(id=>user(id).name).filter(Boolean).join(", ");
}


function allAssignableCourses(){
  let names=[];
  tutors().forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));
  list(DATA.courses||{}).forEach(c=>{if(c.name)names.push(c.name)});
  return [...new Set(names.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function assignedCoursesForStudent(studentId){
  const s=user(studentId);
  return Array.isArray(s.assignedCourses)?s.assignedCourses:[];
}
function courseCheckboxes(className="assignedCourse"){
  const cs=allAssignableCourses();
  if(!cs.length)return "<p class='muted'>No courses available yet. Add courses first.</p>";
  return cs.map(c=>`<label class="check"><input type="checkbox" class="${className}" value="${c}">${c}</label>`).join("");
}
function selectedCourses(className="assignedCourse"){
  return [...document.querySelectorAll("."+className+":checked")].map(x=>x.value);
}
function assignedCourseNames(studentId){
  return assignedCoursesForStudent(studentId).join(", ");
}


const MOTIVATION_QUOTES=["Small progress is still progress — show up today.","Your future self is built by what you do now.","One focused session can change your whole week.","Start, and motivation follows.","Study smart, ask questions, keep moving.","Consistency beats intensity.","You are closer than you think. Keep going."];
function todayISO(){return localISODate(new Date())}function currentMonth(){return new Date().toISOString().slice(0,7)}function isToday(date){return date===todayISO()}function thisMonthBookings(bs){const m=currentMonth();return bs.filter(b=>(b.date||"").startsWith(m))}function upcomingBookingsForUser(){const t=todayISO();return myBookings().filter(b=>!b.done&&(b.date||"")>=t).sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.start||"").localeCompare(b.start||""))}function totalHours(bs){return bs.reduce((s,b)=>s+Number(b.duration||0),0)}function nextBooking(){const u=upcomingBookingsForUser();return u.length?u[0]:null}function randomMotivation(){return (scheduledTodayBanner&&scheduledTodayBanner().text)||"Keep going — you are doing better than you think.";}
function getNotificationsForRole(){return list(DATA.notifications||{}).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).filter(n=>n.to==="everyone"||n.to===profile.role||n.userId===currentUser.uid)}async function createNotification(to,title,message,userId=""){await db.ref("notifications").push({to,title,message,userId,createdAt:Date.now(),read:false})}
function getAnnouncementsForRole(){return list(DATA.announcements||{}).filter(a=>a.audience==="everyone"||a.audience===profile.role||(a.university&&profile.university&&a.university===profile.university)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))}
function getReviewsForTutor(tutorId){return list(DATA.reviews||{}).filter(r=>r.tutorId===tutorId).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))}function avgRating(tutorId){const rs=getReviewsForTutor(tutorId);return rs.length?(rs.reduce((s,r)=>s+Number(r.rating||0),0)/rs.length).toFixed(1):"—"}
function isFavoriteTutor(tutorId){return Array.isArray(profile.favoriteTutorIds)&&profile.favoriteTutorIds.includes(tutorId)}async function toggleFavoriteTutor(tutorId){const current=Array.isArray(profile.favoriteTutorIds)?profile.favoriteTutorIds:[];const next=current.includes(tutorId)?current.filter(id=>id!==tutorId):[...current,tutorId];await db.ref("users/"+currentUser.uid+"/favoriteTutorIds").set(next);await loadData();profile={...profile,...(DATA.users[currentUser.uid]||{})};allTutorsPage()}
function assignedCourseBadges(studentId){const courses=typeof assignedCoursesForStudent==="function"?assignedCoursesForStudent(studentId):[];return courses.length?courses.join(", "):"None"}
function markBookingPayment(bookingId){const b=DATA.bookings[bookingId];if(!b)return alert("Booking not found.");const method=prompt("Payment method: Cash or Whish",(b.paymentMethod||"Cash"));if(method===null)return;const cleanMethod=(method.toLowerCase().includes("whish")||method.toLowerCase().includes("wish"))?"Whish":"Cash";const date=prompt("Payment date YYYY-MM-DD:",todayISO());if(date===null)return;const payments=(b.payments||[]).map(p=>({...p,paid:true,method:cleanMethod,paymentDate:date}));db.ref("bookings/"+bookingId).update({paymentMethod:cleanMethod,payments}).then(async()=>{await loadData();bookingsPage(profile.role!=="student")})}
function calendarLinkForBooking(b){const t=user(b.tutorId),s=user(b.studentId);const title=encodeURIComponent(`Scheduled: ${b.course||"Tutoring"}`);const details=encodeURIComponent(`Course: ${b.course||""}\nTutor: ${t.name||""}\nStudent: ${s.name||""}\nLocation: ${b.location||""}`);const date=(b.date||"").replaceAll("-","");const start=(b.start||"00:00").replace(":","");const dur=Math.round(Number(b.duration||1)*60), sh=Number((b.start||"00:00").split(":")[0]), sm=Number((b.start||"00:00").split(":")[1]||0);const end=sh*60+sm+dur,eh=String(Math.floor(end/60)).padStart(2,"0"),em=String(end%60).padStart(2,"0");return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}T${start}00/${date}T${eh}${em}00&details=${details}`}

function randomMotivation(){return (scheduledTodayBanner&&scheduledTodayBanner().text)||"Keep going — you are doing better than you think.";}
function motivationBannerSettingsPage(){
  if(!profile || profile.role!=="admin"){
    $("content").innerHTML=`<div class="card"><h2>Access denied</h2><p class="muted">Only admin can manage the motivation banner.</p></div>`;
    return;
  }
  const quotes=v56List(DATA.motivationQuotes||{}).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const settings=DATA.bannerSettings||{};
  $("content").innerHTML=`<div class="card"><h2>Motivation Banner Manager</h2>
    <p class="muted">Create aesthetic student inspiration cards that feel polished enough to screenshot and share.</p>
    <div class="banner-control-card">
      <label class="check"><input id="examMode" type="checkbox" ${settings.examMode?"checked":""}> Exam Week Mode</label>
      <button onclick="saveBannerSettings()">Save Banner Settings</button>
    </div>
    <div class="banner-manager-grid">
      <input id="motivationIcon" placeholder="Icon e.g. 🌱" value="✨" oninput="updateBannerPreview()">
      <select id="motivationTheme" onchange="updateBannerPreview()">
        <option value="focus">Focus Blue</option>
        <option value="minimal">Minimal White</option>
        <option value="night">Night Navy</option>
        <option value="energy">Energy</option>
        <option value="growth">Growth</option>
        <option value="exam">Exam</option>
        <option value="rainbow">Pastel Rainbow</option>
        <option value="achieve">Achievement</option>
      </select>
      <select id="motivationTime">
        <option value="anytime">Anytime</option>
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
        <option value="evening">Evening</option>
        <option value="exam">Exam Week</option>
      </select>
    </div>
    <textarea id="motivationText" placeholder="Main quote..." oninput="updateBannerPreview()">Progress, not perfection.</textarea>
    <input id="motivationSub" placeholder="Small subtitle..." value="Small steps still count." oninput="updateBannerPreview()">
    <button onclick="addMotivationQuote()">Add Banner Card</button>
    <div id="bannerPreview">${bannerPreviewCard()}</div>
    <hr><h3>Custom Banner Cards</h3>
    ${quotes.length?quotes.map(q=>`<div class="banner-table-row"><div><b>${q.icon||"✨"} ${q.text}</b><div class="banner-meta">${q.theme||"focus"} • ${q.time||"anytime"} • ${q.sub||""}</div></div><button class="ghost" onclick="deleteMotivationQuote('${q.id}')">Delete</button></div>`).join(""):"<p class='muted'>No custom cards yet. Default Scheduled cards are being used.</p>"}
  </div>`;
}
async function addMotivationQuote(){
  if(!profile || profile.role!=="admin")return alert("Only admin can change the motivation banner.");
  const text=($("motivationText")?.value||"").trim();
  if(!text)return alert("Write a motivation phrase first.");
  await db.ref("motivationQuotes").push({
    text,
    icon:$("motivationIcon")?.value||"✨",
    theme:$("motivationTheme")?.value||"focus",
    time:$("motivationTime")?.value||"anytime",
    sub:($("motivationSub")?.value||"").trim(),
    createdAt:Date.now(),
    createdBy:currentUser.uid
  });
  await loadData();
  motivationBannerSettingsPage();
}
async function deleteMotivationQuote(id){
  if(!profile || profile.role!=="admin")return alert("Only admin can change the motivation banner.");
  if(!confirm("Delete this motivation phrase?"))return;
  await db.ref("motivationQuotes/"+id).remove();
  await loadData();
  motivationBannerSettingsPage();
}

function v56AssignedStudentsForTutor(tutorId){
  if(typeof assignedStudentsForTutor==="function")return assignedStudentsForTutor(tutorId);
  return students().filter(s=>Array.isArray(s.assignedTutorIds)&&s.assignedTutorIds.includes(tutorId));
}
function v56StudentAnnouncements(){
  return v56List(DATA.announcements||{}).filter(a=>{
    if(a.audience==="everyone")return true;
    if(a.audience===profile.role)return true;
    if(a.audience==="assignedStudents"&&Array.isArray(a.recipientIds)&&a.recipientIds.includes(currentUser.uid))return true;
    if(a.userId===currentUser.uid)return true;
    if(a.university&&profile.university&&a.university===profile.university)return true;
    return false;
  }).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}
async function v56NotifyStudent(userId,title,message){
  await db.ref("notifications").push({to:"student",userId,title,message,createdAt:Date.now(),read:false});
}
function tutorAnnouncementsPage(){
  if(profile.role!=="tutor"){
    if(typeof announcementsPage==="function")return announcementsPage();
    return;
  }
  const assigned=v56AssignedStudentsForTutor(currentUser.uid);
  const own=v56List(DATA.announcements||{}).filter(a=>a.createdBy===currentUser.uid).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  $("content").innerHTML=`<div class="card"><h2>Announcements to My Students</h2>
    <p class="muted">Send announcements only to students assigned to you.</p>
    <input id="tutorAnnTitle" placeholder="Announcement title">
    <textarea id="tutorAnnMessage" placeholder="Message to your assigned students"></textarea>
    <h3>Recipients</h3>
    <div class="assigned-student-list">
      ${assigned.length?assigned.map(s=>`<label class="check"><input type="checkbox" class="annStudent" value="${s.id}" checked>${s.name||""} <span class="muted">(${s.email||""})</span></label>`).join(""):"<p class='muted'>No assigned students yet.</p>"}
    </div>
    <button onclick="sendTutorAnnouncement()">Send Announcement</button>
  </div>
  <div class="card"><h2>Sent Announcements</h2>
    ${own.length?own.map(a=>`<div class="announcement-card"><b>${a.title||""}</b><p>${a.message||""}</p><span class="muted">${new Date(a.createdAt||Date.now()).toLocaleString()}</span></div>`).join(""):"<p class='muted'>No announcements sent yet.</p>"}
  </div>`;
}
async function sendTutorAnnouncement(){
  const title=($("tutorAnnTitle")?.value||"").trim();
  const message=($("tutorAnnMessage")?.value||"").trim();
  const recipientIds=[...document.querySelectorAll(".annStudent:checked")].map(x=>x.value);
  if(!title||!message)return alert("Please fill title and message.");
  if(!recipientIds.length)return alert("Choose at least one assigned student.");
  await db.ref("announcements").push({title,message,audience:"assignedStudents",recipientIds,createdBy:currentUser.uid,creatorRole:"tutor",createdAt:Date.now()});
  for(const id of recipientIds){await v56NotifyStudent(id,title,message)}
  await loadData();
  tutorAnnouncementsPage();
}

function v56CoursesForTutorStudent(studentId){
  const s=user(studentId);
  const assigned=Array.isArray(s.assignedCourses)?s.assignedCourses:[];
  const tutorCourses=Array.isArray(profile.courses)?profile.courses:[];
  const overlap=assigned.filter(c=>tutorCourses.includes(c));
  const source=overlap.length?overlap:(assigned.length?assigned:tutorCourses);
  return [...new Set(source.filter(Boolean))];
}
function updateTutorScheduleCourses(){
  const studentId=$("tssStudent")?.value||"";
  const courses=v56CoursesForTutorStudent(studentId);
  if($("tssCourse"))$("tssCourse").innerHTML=courses.length?courses.map(c=>`<option value="${c}">${c}</option>`).join(""):`<option value="">No assigned courses</option>`;
  updateTutorSchedulePrice();
}
function updateTutorSchedulePrice(){
  if(!$("tssSummary"))return;
  const duration=Number($("tssDuration")?.value||1);
  const student=user($("tssStudent")?.value||"");
  const rate=Number(profile.rate||0);
  const members=student.type==="group"?(student.members||[]).filter(Boolean).length||1:1;
  const totalAmount=rate*duration*members;
  $("tssSummary").innerHTML=`<b>Rate:</b> ${money(rate)}/hour/person<br><b>Students counted:</b> ${members}<br><b>Total:</b> ${money(totalAmount)}`;
}
function tutorScheduleSessionPage(){
  if(profile.role!=="tutor")return;
  const ss=v56AssignedStudentsForTutor(currentUser.uid);
  const today=typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10);
  $("content").innerHTML=`<div class="card tutor-schedule-form"><h2>Schedule Session</h2>
    <p class="muted">Create a session yourself for an assigned student or group.</p>
    ${ss.length?`<div class="row">
      <label>Student / Group<select id="tssStudent" onchange="updateTutorScheduleCourses()">${ss.map(s=>`<option value="${s.id}">${s.name||""}${s.type==="group"?" (Group)":""}</option>`).join("")}</select></label>
      <label>Course<select id="tssCourse"></select></label>
      <label>Date<input id="tssDate" type="date" value="${today}"></label>
      <label>Time<input id="tssTime" type="time"></label>
      <label>Duration<select id="tssDuration" onchange="updateTutorSchedulePrice()"><option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="2.5">2.5 hours</option><option value="3">3 hours</option></select></label>
      <label>Location<select id="tssLocation"><option>Online</option><option>On Campus</option><option>Both / To Confirm</option></select></label>
      <label>Payment Status<select id="tssPayStatus"><option>Unpaid</option><option>Paid</option></select></label>
      <label>Payment Method<select id="tssPayMethod"><option>Cash</option><option>Whish</option></select></label>
    </div>
    <div id="tssSummary" class="contact-help"></div>
    <button onclick="createTutorScheduledSession()">Create Session</button>`:`<p class='muted'>No assigned students yet. Ask admin to assign students/groups to you first.</p>`}
  </div>`;
  updateTutorScheduleCourses();
}
async function createTutorScheduledSession(){
  const studentId=$("tssStudent")?.value, course=$("tssCourse")?.value, date=$("tssDate")?.value, start=$("tssTime")?.value;
  const duration=Number($("tssDuration")?.value||1), location=$("tssLocation")?.value||"Online";
  const paymentStatus=$("tssPayStatus")?.value||"Unpaid", paymentMethod=$("tssPayMethod")?.value||"Cash";
  if(!studentId||!course||!date||!start||!duration)return alert("Please fill student, course, date, time, and duration.");
  if(!v56AssignedStudentsForTutor(currentUser.uid).some(s=>s.id===studentId))return alert("You can only schedule sessions for students assigned to you.");
  if(typeof candidateWorks==="function"&&!candidateWorks(currentUser.uid,studentId,date,start,duration)){
    if(!confirm("This time seems to conflict with another session. Create it anyway?"))return;
  }
  const student=user(studentId);
  const members=student.type==="group"?(student.members||[]).filter(Boolean).length||1:1;
  const amount=Number(profile.rate||0)*duration*members;
  const paidNow=paymentStatus==="Paid";
  const payDate=paidNow?(typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10)):"";
  await db.ref("bookings").push({
    tutorId:currentUser.uid,studentId,course,date,start,duration,location,paymentMethod,
    payments:[{name:student.name||"Student",amount,paid:paidNow,method:paymentMethod,paymentDate:payDate}],
    status:"confirmed",done:false,createdAt:Date.now(),createdBy:currentUser.uid,createdByRole:"tutor",tutorScheduled:true
  });
  await v56NotifyStudent(studentId,"New Session Scheduled",`${profile.name||"Your tutor"} scheduled ${course} on ${date} at ${typeof formatTime12==="function"?formatTime12(start):start}.`);
  await loadData();
  showToast("✓ Session created successfully.","The student has been notified.");
  tutorScheduleSessionPage();
}


/* ===== v5.8 aesthetic student banner system ===== */
const SCHEDULED_DEFAULT_BANNERS=[
  {text:"Progress, not perfection.",icon:"🌱",theme:"growth",time:"anytime",sub:"Small steps still count."},
  {text:"One lesson closer.",icon:"📚",theme:"focus",time:"anytime",sub:"Keep building momentum."},
  {text:"Stay focused.",icon:"🎯",theme:"minimal",time:"anytime",sub:"Your goals are worth the effort."},
  {text:"Keep showing up.",icon:"💙",theme:"focus",time:"anytime",sub:"Consistency makes the difference."},
  {text:"Learn. Practice. Repeat.",icon:"✨",theme:"rainbow",time:"anytime",sub:"That is how confidence grows."},
  {text:"Start now.",icon:"🚀",theme:"achieve",time:"morning",sub:"Action beats overthinking."},
  {text:"Every minute counts.",icon:"🧠",theme:"focus",time:"anytime",sub:"Use this moment well."},
  {text:"Consistency wins.",icon:"💪",theme:"energy",time:"anytime",sub:"Results follow repetition."},
  {text:"Trust the process.",icon:"🌟",theme:"minimal",time:"anytime",sub:"You are becoming better."},
  {text:"Study now, celebrate later.",icon:"📖",theme:"night",time:"evening",sub:"Future you will thank you."},
  {text:"Future you is counting on you.",icon:"⏳",theme:"achieve",time:"anytime",sub:"Make one choice today that helps tomorrow."},
  {text:"Success is built daily.",icon:"🎓",theme:"focus",time:"morning",sub:"One page, one problem, one step."},
  {text:"You’ve got this.",icon:"🔥",theme:"energy",time:"anytime",sub:"Even when it feels hard."},
  {text:"Stay curious.",icon:"⭐",theme:"rainbow",time:"anytime",sub:"Questions mean your brain is working."},
  {text:"Keep moving forward.",icon:"🌈",theme:"rainbow",time:"anytime",sub:"Progress is still progress."},
  {text:"Feeling confused means you’re learning.",icon:"🧩",theme:"minimal",time:"anytime",sub:"Stay with it a little longer."},
  {text:"Mistakes are proof you’re trying.",icon:"✍️",theme:"growth",time:"anytime",sub:"Every correction teaches you something."},
  {text:"You don’t have to know everything today.",icon:"☁️",theme:"minimal",time:"anytime",sub:"Just learn the next thing."},
  {text:"Keep asking questions.",icon:"💡",theme:"focus",time:"anytime",sub:"That is how understanding starts."},
  {text:"Every expert was once a beginner.",icon:"🌱",theme:"growth",time:"anytime",sub:"You are allowed to start small."},
  {text:"A winner is a loser who tried one more time.",icon:"🏆",theme:"achieve",time:"anytime",sub:"Try one more time today."},
  {text:"One page at a time. One step closer.",icon:"📄",theme:"minimal",time:"anytime",sub:"Do not rush the process."},
  {text:"Stay consistent. Results will follow.",icon:"📈",theme:"achieve",time:"anytime",sub:"Quiet work becomes visible later."},
  {text:"Your future self is watching.",icon:"🔭",theme:"night",time:"evening",sub:"Give them something to be proud of."},
  {text:"Small efforts become big achievements.",icon:"✨",theme:"growth",time:"anytime",sub:"Do not underestimate today."},
  {text:"Show up, even when motivation doesn’t.",icon:"💪",theme:"energy",time:"anytime",sub:"Discipline carries you."},
  {text:"Discipline is remembering what you want most.",icon:"🎯",theme:"focus",time:"anytime",sub:"Choose your bigger goal."},
  {text:"Every study session counts.",icon:"⏱️",theme:"focus",time:"anytime",sub:"This one matters too."},
  {text:"Don’t quit because it’s difficult.",icon:"🔥",theme:"energy",time:"anytime",sub:"Difficult does not mean impossible."},
  {text:"Your only competition is who you were yesterday.",icon:"⭐",theme:"achieve",time:"anytime",sub:"Beat yesterday by one small step."},
  {text:"Every focused hour is an investment in your future.",icon:"⏳",theme:"night",time:"evening",sub:"Spend it wisely."},
  {text:"Success isn’t luck—it’s consistency repeated daily.",icon:"🏁",theme:"achieve",time:"anytime",sub:"Keep stacking the days."},
  {text:"One day, today’s hard work will be your success story.",icon:"🎓",theme:"rainbow",time:"anytime",sub:"You are writing it now."},
  {text:"Keep studying until confidence replaces doubt.",icon:"🧠",theme:"focus",time:"anytime",sub:"Confidence is earned."},
  {text:"The best investment you’ll ever make is in yourself.",icon:"💙",theme:"minimal",time:"anytime",sub:"Your education stays with you."},
  {text:"Success is built when no one is watching.",icon:"🌙",theme:"night",time:"evening",sub:"Quiet effort counts."},
  {text:"You don’t have to be perfect. Just keep going.",icon:"🌱",theme:"growth",time:"anytime",sub:"That is enough for today."},
  {text:"One productive day can change your entire week.",icon:"☀️",theme:"energy",time:"morning",sub:"Start with one focused task."},
  {text:"Difficult doesn’t mean impossible.",icon:"🧗",theme:"achieve",time:"anytime",sub:"It means you are growing."},
  {text:"Keep learning. Keep improving. Keep believing.",icon:"✨",theme:"rainbow",time:"anytime",sub:"You are not done yet."},
  {text:"Your potential is greater than today’s obstacles.",icon:"🌟",theme:"achieve",time:"anytime",sub:"Do not shrink your dream."},
  {text:"Good morning! Today’s effort becomes tomorrow’s success.",icon:"☀️",theme:"energy",time:"morning",sub:"Start with one small win."},
  {text:"Halfway through the day—keep the momentum going!",icon:"📚",theme:"focus",time:"afternoon",sub:"You are still in the game."},
  {text:"Finish today’s goals so tomorrow starts lighter.",icon:"🌙",theme:"night",time:"evening",sub:"Your future self will breathe easier."},
  {text:"Stay calm. Trust your preparation. One question at a time.",icon:"💙",theme:"exam",time:"exam",sub:"You can handle this."}
];

function scheduledBannerTimeSlot(){
  const h=new Date().getHours();
  if(h>=5&&h<12)return "morning";
  if(h>=12&&h<18)return "afternoon";
  return "evening";
}
function scheduledBannerMode(){
  const settings=DATA.bannerSettings||{};
  return settings.examMode?"exam":"normal";
}
function scheduledBannerPool(){
  const custom=v56List(DATA.motivationQuotes||{}).map(q=>({
    text:q.text,
    icon:q.icon||"✨",
    theme:q.theme||"focus",
    time:q.time||"anytime",
    sub:q.sub||q.subtitle||"Scheduled"
  })).filter(q=>q.text);
  const pool=custom.length?custom:SCHEDULED_DEFAULT_BANNERS;
  const mode=scheduledBannerMode();
  const slot=scheduledBannerTimeSlot();
  if(mode==="exam"){
    const exam=pool.filter(q=>q.time==="exam"||q.theme==="exam");
    if(exam.length)return exam;
  }
  const timed=pool.filter(q=>q.time==="anytime"||q.time===slot);
  return timed.length?timed:pool;
}
function scheduledTodayBanner(){
  const pool=scheduledBannerPool();
  const dayKey=new Date().toISOString().slice(0,10)+scheduledBannerTimeSlot()+scheduledBannerMode();
  let hash=0;
  for(let i=0;i<dayKey.length;i++)hash=(hash*31+dayKey.charCodeAt(i))>>>0;
  return pool[hash%pool.length]||SCHEDULED_DEFAULT_BANNERS[0];
}
function renderStudentInspoBanner(){
  const b=scheduledTodayBanner();
  return `<div class="inspo-card inspo-theme-${b.theme||"focus"}" onmousemove="this.style.setProperty('--mx',event.offsetX+'px')">
    <span class="floaty f1"></span><span class="floaty f2"></span><span class="floaty f3"></span>
    <span class="sparkle s1">✦</span><span class="sparkle s2">✧</span><span class="sparkle s3">✦</span>
    <div class="inspo-topline"><span></span><span></span></div>
    <div class="inspo-icon">${b.icon||"✨"}</div>
    <div class="inspo-quote">${b.text||""}</div>
    <div class="inspo-sub">${b.sub||"Keep going."}</div>
    <div class="inspo-brand">Scheduled</div>
  </div>`;
}
function bannerPreviewCard(){
  const text=($("motivationText")?.value||"Progress, not perfection.").trim();
  const icon=$("motivationIcon")?.value||"✨";
  const theme=$("motivationTheme")?.value||"focus";
  const sub=($("motivationSub")?.value||"Small steps still count.").trim();
  return `<div class="banner-preview-wrap"><div class="inspo-card inspo-theme-${theme}">
    <span class="floaty f1"></span><span class="floaty f2"></span><span class="floaty f3"></span>
    <span class="sparkle s1">✦</span><span class="sparkle s2">✧</span><span class="sparkle s3">✦</span>
    <div class="inspo-topline"><span></span><span></span></div>
    <div class="inspo-icon">${icon}</div>
    <div class="inspo-quote">${text}</div>
    <div class="inspo-sub">${sub}</div>
    <div class="inspo-brand">Scheduled</div>
  </div></div>`;
}
function updateBannerPreview(){
  if($("bannerPreview"))$("bannerPreview").innerHTML=bannerPreviewCard();
}
async function saveBannerSettings(){
  if(!profile||profile.role!=="admin")return alert("Only admin can change banner settings.");
  await db.ref("bannerSettings").set({examMode:$("examMode")?.checked||false,updatedAt:Date.now(),updatedBy:currentUser.uid});
  await loadData();
  motivationBannerSettingsPage();
}


/* ===== v6.0 premium motion helpers ===== */
function showToast(title,message=""){
  const old=document.querySelector(".toast");
  if(old)old.remove();
  const t=document.createElement("div");
  t.className="toast";
  t.innerHTML=`<b>${title}</b>${message?`<br><span class="muted">${message}</span>`:""}`;
  document.body.appendChild(t);
  setTimeout(()=>{try{t.remove()}catch(e){}},4200);
}
function scheduledDailyFocus(){
  const nb=typeof nextBooking==="function"?nextBooking():null;
  if(nb){
    return `Attend your ${nb.course||"session"} session at ${typeof formatTime12==="function"?formatTime12(nb.start):nb.start}.`;
  }
  return "Complete one focused study task today.";
}


/* ===== v6.4 student dashboard banner refinement ===== */
function scheduledSessionBannerKey(){
  if(!window.scheduledLoginBannerSeed){
    window.scheduledLoginBannerSeed = Date.now() + Math.floor(Math.random()*100000);
  }
  return String(window.scheduledLoginBannerSeed) + (currentUser?.uid||"") + scheduledBannerMode();
}
function scheduledTodayBanner(){
  const pool=scheduledBannerPool();
  const key=scheduledSessionBannerKey();
  let hash=0;
  for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;
  return pool[hash%pool.length]||SCHEDULED_DEFAULT_BANNERS[0];
}
function scheduledGreeting(){
  const h=new Date().getHours();
  if(h>=5 && h<12)return "Ready to make today count";
  if(h>=12 && h<18)return "Keep the momentum going";
  return "End the day one step ahead";
}
function scheduledGreetingSub(){
  const h=new Date().getHours();
  if(h>=5 && h<12)return "A focused start makes everything lighter.";
  if(h>=12 && h<18)return "One more productive step before the day ends.";
  return "Small progress tonight becomes confidence tomorrow.";
}
function renderDailyFocusOutside(){
  return `<div class="daily-focus-outside">
    <div class="focus-icon">🎯</div>
    <div><b>Today's Focus</b><span>${scheduledDailyFocus()}</span></div>
  </div>`;
}


/* v6.7 stable simple sidebar */
function toggleMenu(){
  const tabs=document.getElementById("tabs");
  if(!tabs)return;
  const open=!tabs.classList.contains("open");
  tabs.classList.toggle("open",open);
  document.body.classList.toggle("menu-open",open);
}
function closeMenu(){
  const tabs=document.getElementById("tabs");
  if(tabs)tabs.classList.remove("open");
  document.body.classList.remove("menu-open");
}
document.addEventListener("keydown",function(e){
  if(e.key==="Escape")closeMenu();
});


/* ===== v7.1 stable feature layer ===== */
function v71Empty(icon,title,body,button=""){return `<div class="empty-state"><div class="emoji">${icon}</div><h3>${title}</h3><p class="muted">${body}</p>${button}</div>`}
function v71List(obj){return Object.entries(obj||{}).map(([id,v])=>({id,...v}))}
function v71Arr(x){return Array.isArray(x)?x:[]}
function v71Uid(){return currentUser&&currentUser.uid}
function v71Today(){return typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10)}
function v71StudentUpcoming(id=v71Uid()){return v71List(DATA.bookings||{}).filter(b=>b.studentId===id&&!b.done&&(b.date||"")>=v71Today()).sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.start||"").localeCompare(b.start||""))}
function v71StudentCompleted(id=v71Uid()){return v71List(DATA.bookings||{}).filter(b=>b.studentId===id&&b.done).length}
function v71AllGroups(){return v71List(DATA.groups||{})}
function v71ActiveGroups(){return v71AllGroups().filter(g=>!g.archived)}
function v71ActiveSemesters(){return v71List(DATA.semesters||{}).filter(s=>!s.archived)}
function v71Money(x){return typeof money==="function"?money(x):"$"+Number(x||0).toFixed(2)}

/* visibility */
function tutorVisibleInApp(t){return t&&t.role==="tutor"&&!t.removed&&!t.hiddenFromBookings}
function publicProfileVisible(p){return p&&!p.hiddenPublicProfile&&!p.hidden}
async function toggleTutorBookingVisibility(tutorId){
  if(profile.role!=="admin")return alert("Admin only.");
  const t=user(tutorId);
  await db.ref("users/"+tutorId+"/hiddenFromBookings").set(!t.hiddenFromBookings);
  await loadData(); adminTutors();
}
async function togglePublicProfileVisibility(profileId){
  if(profile.role!=="admin")return alert("Admin only.");
  const p=(DATA.publicTutors||{})[profileId]||{};
  await db.ref("publicTutors/"+profileId+"/hiddenPublicProfile").set(!p.hiddenPublicProfile);
  await loadData();
  if(typeof publicTutorProfilesPage==="function") publicTutorProfilesPage();
}

/* chat */
function chatPeople(){
  if(profile.role==="student") return studentTutors(v71Uid()).map(t=>({id:t.id,name:t.name||"Tutor",role:"Tutor"}));
  if(profile.role==="tutor"){
    const assigned=typeof assignedStudentsForTutor==="function"?assignedStudentsForTutor(v71Uid()):students().filter(s=>v71Arr(s.assignedTutorIds).includes(v71Uid()));
    return assigned.map(s=>({id:s.id,name:s.name||"Student",role:"Student"}));
  }
  return [];
}
function chatId(a,b){return [a,b].sort().join("_")}
function openChatPanel(){
  const old=document.getElementById("chatPanel"); if(old){old.remove();return}
  const panel=document.createElement("div"); panel.id="chatPanel"; panel.className="chat-panel";
  const people=chatPeople();
  panel.innerHTML=`<div class="section-title-row"><h2>Messages</h2><button class="ghost" onclick="openChatPanel()">Close</button></div>${people.length?people.map(p=>`<div class="chat-thread"><b>${p.name}</b><br><span class="muted">${p.role}</span><br><button onclick="openChatWith('${p.id}')">Open Chat</button></div>`).join(""):v71Empty("💬","No chats yet","Chats appear when students and tutors are assigned.")}`;
  document.body.appendChild(panel);
}
function openChatWith(otherId){
  const panel=document.getElementById("chatPanel"); if(!panel)return;
  const cid=chatId(v71Uid(),otherId), other=user(otherId);
  const msgs=v71List((DATA.chats||{})[cid]?.messages||{}).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  panel.innerHTML=`<div class="section-title-row"><h2>${other.name||"Chat"}</h2><button class="ghost" onclick="openChatPanel()">Back</button></div>
  <div>${msgs.length?msgs.map(m=>`<div class="message-bubble ${m.from===v71Uid()?"me":"them"}">${m.text||""}<br><span class="muted small">${new Date(m.createdAt||Date.now()).toLocaleString()}</span></div>`).join(""):v71Empty("💬","Start the conversation","Send your first message inside Scheduled.")}</div>
  <div class="row"><input id="chatInput" placeholder="Write a message..."><button onclick="sendChatMessage('${otherId}')">Send</button></div>`;
}
async function sendChatMessage(otherId){
  const text=($("chatInput")?.value||"").trim(); if(!text)return;
  const cid=chatId(v71Uid(),otherId);
  await db.ref("chats/"+cid+"/participants").set({[v71Uid()]:true,[otherId]:true});
  await db.ref("chats/"+cid+"/messages").push({from:v71Uid(),to:otherId,text,createdAt:Date.now()});
  await loadData(); openChatWith(otherId);
}
function injectChatButton(){
  const old=document.getElementById("globalChatButton");
  if(!profile||profile.role==="admin"){if(old)old.remove();return}
  if(old)return;
  const b=document.createElement("button"); b.id="globalChatButton"; b.className="chat-button"; b.type="button"; b.innerHTML="💬"; b.onclick=openChatPanel;
  document.body.appendChild(b);
}

/* My Scheduled */
function myTasks(){return v71List(DATA.tasks||{}).filter(t=>t.studentId===v71Uid()).sort((a,b)=>(a.done?1:0)-(b.done?1:0)||(a.dueDate||"9999").localeCompare(b.dueDate||"9999"))}
async function addTask(){
  const title=($("taskTitle")?.value||"").trim(); if(!title)return alert("Write a task first.");
  await db.ref("tasks").push({studentId:v71Uid(),title,course:$("taskCourse")?.value||"",dueDate:$("taskDue")?.value||"",done:false,createdAt:Date.now()});
  await loadData(); myScheduledPage();
}
async function toggleTask(id){const t=(DATA.tasks||{})[id]; if(!t)return; await db.ref("tasks/"+id+"/done").set(!t.done); await loadData(); myScheduledPage();}
async function deleteTask(id){if(!confirm("Delete this task?"))return; await db.ref("tasks/"+id).remove(); await loadData(); myScheduledPage();}
function myScheduledPage(){
  const today=v71Today(), sessions=v71StudentUpcoming(), tasks=myTasks();
  const todaySessions=sessions.filter(s=>s.date===today), todayTasks=tasks.filter(t=>!t.done&&(!t.dueDate||t.dueDate<=today));
  $("content").innerHTML=`<div class="dashboard-hero"><h2 class="student-welcome-line">My Scheduled</h2><p class="student-welcome-sub">Your sessions and study tasks in one place.</p></div>
  <div class="card"><h2>Add a Task</h2><div class="row"><input id="taskTitle" placeholder="Review PHYS213 formulas"><input id="taskCourse" placeholder="Course"><input id="taskDue" type="date"><button onclick="addTask()">Add Task</button></div></div>
  <div class="my-scheduled-grid">
    <div class="card"><h2>Today</h2>${todaySessions.map(b=>`<div class="planner-session"><b>${b.course}</b><br>${typeof formatTime12==="function"?formatTime12(b.start):b.start} • ${user(b.tutorId).name||""}</div>`).join("")}${todayTasks.map(t=>`<div class="task-item"><label class="check"><input type="checkbox" onchange="toggleTask('${t.id}')"> ${t.title}</label><br><span class="muted">${t.course||""} ${t.dueDate||""}</span></div>`).join("")||(!todaySessions.length?v71Empty("✨","Nothing urgent today","Perfect day to revise or plan ahead."): "")}</div>
    <div class="card"><h2>Upcoming Sessions</h2>${sessions.length?sessions.map(b=>`<div class="planner-session"><b>${b.course}</b><br>${b.date} • ${typeof formatTime12==="function"?formatTime12(b.start):b.start}<br>${user(b.tutorId).name||""}</div>`).join(""):v71Empty("📅","No upcoming sessions","Book your next session when you're ready.")}</div>
    <div class="card"><h2>Tasks</h2>${tasks.length?tasks.map(t=>`<div class="task-item ${t.done?"done":""}"><label class="check"><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask('${t.id}')"> ${t.title}</label><br><span class="muted">${t.course||""} ${t.dueDate||""}</span><br><button class="ghost" onclick="deleteTask('${t.id}')">Delete</button></div>`).join(""):v71Empty("📝","No tasks yet","Add your first task to use Scheduled every day.")}</div>
  </div>`;
}

/* Achievements */
function achievementDefs(){return [{id:"first_booking",icon:"🥇",title:"First Booking",target:1,metric:"bookings"},{id:"first_session",icon:"🎉",title:"First Completed Session",target:1,metric:"completed"},{id:"study_starter",icon:"📚",title:"Study Starter",target:10,metric:"completed"},{id:"semester_momentum",icon:"🎓",title:"Semester Momentum",target:20,metric:"completed"}]}
function achievementMetric(d,id=v71Uid()){const b=v71List(DATA.bookings||{}).filter(x=>x.studentId===id); return d.metric==="bookings"?b.length:b.filter(x=>x.done).length}
function nextAchievement(){for(const d of achievementDefs()){const val=achievementMetric(d); if(val<d.target)return {...d,value:val}} const d=achievementDefs().slice(-1)[0]; return {...d,value:d.target}}
function achievementProgressCard(){const a=nextAchievement(), pct=Math.min(100,Math.round((a.value/a.target)*100)), left=Math.max(0,a.target-a.value); return `<div class="progress-card"><div class="section-title-row"><b>${a.icon} Next Achievement: ${a.title}</b><span>${a.value}/${a.target}</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><span class="muted">${left?`${left} more to unlock this badge.`:"Badge unlocked."}</span></div>`}
function weeklyMonthlyGoals(){const c=v71StudentCompleted(), w=Math.min(2,c%3), m=Math.min(8,c%9); return `<div class="my-scheduled-grid"><div class="progress-card"><b>📅 Weekly Goal</b><div class="progress-track"><div class="progress-fill" style="width:${w/2*100}%"></div></div><span>${w}/2 sessions this week</span></div><div class="progress-card"><b>🗓 Monthly Goal</b><div class="progress-track"><div class="progress-fill" style="width:${m/8*100}%"></div></div><span>${m}/8 sessions this month</span></div></div>`}
function runConfetti(){const colors=["#69B1DC","#B7DDFC","#22C55E","#F59E0B","#F472B6"];for(let i=0;i<70;i++){const p=document.createElement("div");p.className="confetti-piece";p.style.left=Math.random()*100+"vw";p.style.top="-20px";p.style.background=colors[Math.floor(Math.random()*colors.length)];p.style.animationDelay=(Math.random()*.35)+"s";document.body.appendChild(p);setTimeout(()=>p.remove(),2300)}}
function showBadgeUnlock(icon="🏅",title="Badge Unlocked",text="You reached a new milestone."){runConfetti();const w=document.createElement("div");w.className="badge-unlock";w.innerHTML=`<div class="badge-unlock-card"><div class="badge-medal">${icon}</div><h2>${title}</h2><p>${text}</p></div>`;document.body.appendChild(w);setTimeout(()=>w.remove(),2600)}
async function checkMilestonesAfterBooking(){if(profile.role!=="student")return;const earned=(DATA.achievements||{})[v71Uid()]||{};for(const d of achievementDefs()){const v=achievementMetric(d);if(v>=d.target&&!earned[d.id]){await db.ref("achievements/"+v71Uid()+"/"+d.id).set({earnedAt:Date.now(),title:d.title,icon:d.icon});showBadgeUnlock(d.icon,d.title,`You unlocked ${d.title}.`);await loadData();break}}}
function achievementsPage(){const earned=(DATA.achievements||{})[v71Uid()]||{};$("content").innerHTML=`<div class="card"><h2>Achievements</h2>${achievementProgressCard()}<div class="my-scheduled-grid">${achievementDefs().map(d=>{const ok=earned[d.id]||achievementMetric(d)>=d.target;return `<div class="kpi-card" style="${ok?"":"opacity:.45"}"><div class="kpi-value">${d.icon}</div><b>${d.title}</b><br><span class="muted">${Math.min(achievementMetric(d),d.target)}/${d.target}</span></div>`}).join("")}</div></div>`}
function semesterInNumbersPage(){const b=v71List(DATA.bookings||{}).filter(x=>x.studentId===v71Uid());$("content").innerHTML=`<div class="card"><h2>✨ This Semester in Numbers</h2><div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">Sessions Completed</div><div class="kpi-value">${b.filter(x=>x.done).length}</div></div><div class="kpi-card"><div class="kpi-label">Hours Studied</div><div class="kpi-value">${typeof totalHours==="function"?totalHours(b):b.reduce((s,x)=>s+Number(x.duration||0),0)}</div></div><div class="kpi-card"><div class="kpi-label">Tutors</div><div class="kpi-value">${studentTutors(v71Uid()).length}</div></div><div class="kpi-card"><div class="kpi-label">Badges</div><div class="kpi-value">${Object.keys((DATA.achievements||{})[v71Uid()]||{}).length}</div></div></div></div>`}

/* Groups/Semesters */
async function createSemester(){if(profile.role!=="admin")return alert("Admin only.");const name=($("semName")?.value||"").trim();if(!name)return alert("Semester name required.");await db.ref("semesters").push({name,archived:false,createdAt:Date.now()});await loadData();groupsPage()}
async function createGroup(){if(profile.role!=="admin"&&profile.role!=="tutor")return alert("Admin/tutor only.");const name=($("groupName")?.value||"").trim(),course=($("groupCourse")?.value||"").trim(),capacity=Number($("groupCapacity")?.value||0),tutorId=profile.role==="tutor"?v71Uid():($("groupTutor")?.value||""),semesterId=$("groupSemester")?.value||"",members=($("groupMembers")?.value||"").split(",").map(x=>x.trim()).filter(Boolean);if(!name||!course||!capacity||!tutorId)return alert("Fill group name, course, tutor, and capacity.");if(members.length>capacity)return alert("Number of students exceeds capacity.");await db.ref("groups").push({name,course,capacity,tutorId,semesterId,members,archived:false,createdAt:Date.now(),createdBy:v71Uid()});await loadData();groupsPage()}
async function archiveGroup(id){if(!confirm("Archive this group?"))return;await db.ref("groups/"+id+"/archived").set(true);await loadData();groupsPage()}
function groupsPage(){const canEdit=profile.role==="admin"||profile.role==="tutor", semesters=v71ActiveSemesters(), groups=v71ActiveGroups().filter(g=>profile.role==="admin"||g.tutorId===v71Uid());$("content").innerHTML=`<div class="card"><h2>Groups & Semesters</h2>${profile.role==="admin"?`<h3>Create Semester</h3><div class="row"><input id="semName" placeholder="Fall 2026"><button onclick="createSemester()">Create Semester</button></div>`:""}${canEdit?`<hr><h3>Create Group</h3><div class="row"><input id="groupName" placeholder="Group name"><input id="groupCourse" placeholder="Course">${profile.role==="admin"?`<select id="groupTutor">${tutors().map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}</select>`:""}<select id="groupSemester"><option value="">No semester</option>${semesters.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select><input id="groupCapacity" type="number" placeholder="Capacity"></div><textarea id="groupMembers" placeholder="Student names, separated by commas"></textarea><button onclick="createGroup()">Create Group</button>`:""}</div><div class="card"><h2>Active Groups</h2>${groups.length?groups.map(g=>`<div class="group-card"><div class="section-title-row"><h3>${g.name}</h3><span class="status-badge ${v71Arr(g.members).length>=Number(g.capacity)?"red":"green"}">${v71Arr(g.members).length}/${g.capacity} seats</span></div><p><b>Course:</b> ${g.course}<br><b>Tutor:</b> ${user(g.tutorId).name||""}<br><b>Semester:</b> ${(DATA.semesters||{})[g.semesterId]?.name||"None"}</p><b>Members</b>${v71Arr(g.members).map(m=>`<div class="group-member-row">${m}</div>`).join("")||"<p class='muted'>No members listed.</p>"}${canEdit?`<button class="danger" onclick="archiveGroup('${g.id}')">Archive Group</button>`:""}</div>`).join(""):v71Empty("👥","No groups yet","Create your first group to organize semester sessions and payments.")}</div>`}

/* Tutor direct schedule */
function tutorScheduleGroupOrStudentPage(){if(profile.role!=="tutor")return;const assigned=typeof assignedStudentsForTutor==="function"?assignedStudentsForTutor(v71Uid()):students().filter(s=>v71Arr(s.assignedTutorIds).includes(v71Uid())),groups=v71ActiveGroups().filter(g=>g.tutorId===v71Uid());window.__schedAssigned=assigned;window.__schedGroups=groups;$("content").innerHTML=`<div class="card"><h2>Schedule Session</h2><p class="muted">Schedule an individual or group session directly inside Scheduled.</p><label>Session Type</label><select id="schedType" onchange="renderScheduleTargetFields()"><option value="individual">Individual Student</option><option value="group">Group Session</option></select><div id="scheduleTargetFields"></div><div class="row"><input id="schedCourse" placeholder="Course"><input id="schedDate" type="date" value="${v71Today()}"><input id="schedTime" type="time"><select id="schedDuration"><option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="3">3 hours</option></select><select id="schedPayStatus"><option>Unpaid</option><option>Paid</option></select><select id="schedPayMethod"><option>Cash</option><option>Whish</option></select></div><button onclick="createTutorDirectSession()">Create Session</button></div>`;renderScheduleTargetFields()}
function renderScheduleTargetFields(){const type=$("schedType")?.value||"individual",box=$("scheduleTargetFields");if(!box)return;if(type==="group"){const groups=window.__schedGroups||[];box.innerHTML=`<label>Group</label><select id="schedGroup">${groups.map(g=>`<option value="${g.id}">${g.name} (${v71Arr(g.members).length}/${g.capacity})</option>`).join("")}</select><div class="row"><input id="schedGroupCount" type="number" placeholder="Number of students"><input id="schedGroupNames" placeholder="Student names, comma separated"></div>`}else{const ss=window.__schedAssigned||[];box.innerHTML=`<label>Student</label><select id="schedStudent">${ss.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select>`}}
async function createTutorDirectSession(){const type=$("schedType")?.value||"individual",course=($("schedCourse")?.value||"").trim(),date=$("schedDate")?.value,start=$("schedTime")?.value,duration=Number($("schedDuration")?.value||1),payStatus=$("schedPayStatus")?.value||"Unpaid",payMethod=$("schedPayMethod")?.value||"Cash";if(!course||!date||!start)return alert("Fill course, date, and time.");let booking={tutorId:v71Uid(),course,date,start,duration,paymentMethod:payMethod,status:"confirmed",done:false,createdAt:Date.now(),createdBy:v71Uid(),createdByRole:"tutor",tutorScheduled:true};if(type==="group"){const group=(DATA.groups||{})[$("schedGroup")?.value];if(!group)return alert("Choose a group.");const count=Number($("schedGroupCount")?.value||0),names=($("schedGroupNames")?.value||"").split(",").map(x=>x.trim()).filter(Boolean);if(!count||!names.length)return alert("Add number of students and names.");if(count>Number(group.capacity||0))return alert("This exceeds the group capacity.");booking.groupId=group.id;booking.groupName=group.name;booking.groupStudentCount=count;booking.groupStudentNames=names;booking.studentId="";booking.payments=names.map(n=>({name:n,amount:Number(profile.rate||0)*duration,paid:payStatus==="Paid",method:payMethod,paymentDate:payStatus==="Paid"?v71Today():""}))}else{const studentId=$("schedStudent")?.value;if(!studentId)return alert("Choose a student.");booking.studentId=studentId;booking.payments=[{name:user(studentId).name||"Student",amount:Number(profile.rate||0)*duration,paid:payStatus==="Paid",method:payMethod,paymentDate:payStatus==="Paid"?v71Today():""}]}await db.ref("bookings").push(booking);if(typeof showToast==="function")showToast("✓ Session created","Saved inside Scheduled.");else alert("Session created.");await loadData();tutorScheduleGroupOrStudentPage()}

/* Command center + exports */
function commandCenterPage(){if(profile.role!=="admin")return dashboardPage();const today=v71Today(),bs=v71List(DATA.bookings||{}),req=v71List(DATA.accessRequests||{}).filter(r=>(r.status||"pending")==="pending"),unpaidAmt=typeof unpaid==="function"?unpaid(bs):0;$("content").innerHTML=`<div class="dashboard-hero"><h2>Command Center</h2><p class="student-welcome-sub">Your daily operations hub.</p></div><div class="command-grid"><div class="kpi-card"><div class="kpi-label">Today's Sessions</div><div class="kpi-value">${bs.filter(b=>b.date===today).length}</div></div><div class="kpi-card"><div class="kpi-label">Pending Requests</div><div class="kpi-value">${req.length}</div></div><div class="kpi-card"><div class="kpi-label">Active Groups</div><div class="kpi-value">${v71ActiveGroups().length}</div></div><div class="kpi-card"><div class="kpi-label">Unpaid Amount</div><div class="kpi-value">${v71Money(unpaidAmt)}</div></div></div><div class="card"><h2>Needs Attention</h2>${req.length?req.slice(0,5).map(r=>`<div class="timeline-item"><b>Access Request</b><br>${r.name||""} • ${r.email||""}</div>`).join(""):v71Empty("✅","All clear","No urgent admin items right now.")}</div>`}
function printCurrentPage(){window.print()}
function exportFinancialExcel(){if(typeof exportTutorBookingsCSV==="function")return exportTutorBookingsCSV(profile.role==="tutor"?v71Uid():undefined,"");alert("CSV export is available from financial reports.")}
function exportFinancialPDF(){alert("Use Print, then choose Save as PDF.");window.print()}



/* ===== v7.2 hotfix: safe dashboard router and page fallbacks ===== */
function safePageFallback(title, message){
  const target=document.getElementById("content");
  if(target){
    target.innerHTML=`<div class="card"><h2>${title}</h2><p class="muted">${message}</p></div>`;
  }
}
function dashboardPage(){
  try{
    if(profile && profile.role==="admin"){
      if(typeof adminDashboardPage==="function")return adminDashboardPage();
      if(typeof adminOverview==="function")return adminOverview();
      return safePageFallback("Admin Dashboard","Welcome back. Use the sidebar to manage Scheduled.");
    }
    if(profile && profile.role==="tutor"){
      if(typeof tutorDashboardPage==="function")return tutorDashboardPage();
      if(typeof schedulePage==="function")return schedulePage();
      return safePageFallback("Tutor Dashboard","Welcome back. Your schedule and students are available from the sidebar.");
    }
    if(typeof studentDashboardPage==="function")return studentDashboardPage();
    return safePageFallback("Student Dashboard","Welcome back. Your sessions and planner are available from the sidebar.");
  }catch(e){
    console.error("dashboardPage fallback error", e);
    safePageFallback("Dashboard","Welcome back. Use the sidebar to continue.");
  }
}
function safeRunPage(fnName, fallbackTitle){
  try{
    const fn=window[fnName];
    if(typeof fn==="function")return fn();
    return safePageFallback(fallbackTitle||"Page","This section is available soon.");
  }catch(e){
    console.error(fnName,e);
    return safePageFallback("Website error", String(e.message||e));
  }
}

function renderTabs(){
  let tabs=[];
  if(profile.role==="admin")tabs=["Dashboard","Command Center","Tutors","Tutor Profiles","Students","Groups","Courses","Access Requests","Calendar","Bookings","Payments","Tutor Reports","Announcements","Motivation Banner","Documents","Export"];
  else if(profile.role==="tutor")tabs=["Dashboard","Calendar","Schedule Session","Groups","Availability","Schedule","My Students","Payments","Statistics","Reviews","Announcements","Documents","Profile"];
  else tabs=["Dashboard","My Scheduled","Book","Emergency","All Tutors","My Tutors","Favorites","My Sessions","Payments","Statistics","Achievements","Semester Recap","Reviews","Announcements","Documents","Student Profile","Profile"];
  const box=$("tabs");
  if(!box)return;
  box.innerHTML=tabs.map((t,i)=>`<button type="button" class="${i===0?'active':''}" onclick="openTab('${t}',this)">${t}</button>`).join("");
  openTab(tabs[0],box.querySelector("button"));
}



async function openTab(tab,btn){
  try{
    await loadData();
    if(typeof injectChatButton==="function")injectChatButton();
    if(typeof closeMenu==="function")setTimeout(closeMenu,0);
    document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
    if(btn)btn.classList.add("active");
    const routes={
      Dashboard:dashboardPage,
      "Command Center":commandCenterPage,
      Tutors:adminTutors,
      "Tutor Profiles":publicTutorProfilesPage,
      Students:adminStudents,
      Groups:groupsPage,
      Courses:adminCourses,
      "Access Requests":accessRequestsPage,
      Calendar:calendarPage,
      Bookings:()=>bookingsPage(true),
      Payments:financialPage,
      "Tutor Reports":adminTutorReportsPage,
      Announcements: profile.role==="tutor" ? tutorAnnouncementsPage : announcementsPage,
      "Motivation Banner":motivationBannerSettingsPage,
      Documents:docsPage,
      Export:exportPage,
      "Schedule Session":tutorScheduleGroupOrStudentPage,
      Availability:availabilityPage,
      Schedule:schedulePage,
      "My Students":myStudentsPage,
      Statistics:statsPage,
      Reviews:reviewsPage,
      Profile:profilePage,
      "My Scheduled":myScheduledPage,
      Book:bookingPage,
      Emergency:emergencySessionsPage,
      "All Tutors":allTutorsPage,
      "My Tutors":myTutorsPage,
      Favorites:favoritesPage,
      "My Sessions":()=>bookingsPage(false),
      Achievements:achievementsPage,
      "Semester Recap":semesterInNumbersPage,
      "Student Profile":studentProfilePage
    };
    const fn=routes[tab];
    if(typeof fn==="function") return fn();
    $("content").innerHTML=v71Empty("🧭","Page coming soon",`${tab} is not available yet.`);
  }catch(e){
    console.error(e);
    const c=$("content");
    if(c)c.innerHTML=`<div class="card"><h2>Website error</h2><p class="muted">${String(e.message||e)}</p><button onclick="location.reload()">Reload</button></div>`;
  }
}


function adminOverview(){let b=list(DATA.bookings);$("content").innerHTML=`<div class="grid"><div class="card"><h3>Bookings</h3><h1>${b.length}</h1></div><div class="card"><h3>Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>Tutors</h3><h1>${tutors().length}</h1></div></div><div class="card"><h2>Scheduled Admin</h2><p class="muted">Final fixed version active.</p></div>`}

function adminTutors(){
  const ts=tutors();
  $("content").innerHTML=`<div class="card"><h2>Booking Tutor Accounts</h2>
  <p class="admin-note"><b>This tab creates real booking tutor accounts.</b> If the email already exists in Firebase, Scheduled prepares the tutor profile by email and links it automatically when they log in with that same email/password. Public profile photos/descriptions are separate in Tutor Profiles.</p>
  ${ts.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>University</th><th>Rate</th><th>WhatsApp</th><th>Courses</th><th>Actions</th></tr>${ts.map(t=>`<tr><td>${t.name||""}</td><td>${t.email||""}</td><td>${t.university||""}</td><td>${money(t.rate)}/h/person</td><td>${t.whatsapp||""}</td><td>${(t.courses||[]).join(", ")}</td><td><button onclick="editTutor('${t.id}')">Edit</button><button onclick="toggleTutorBookingVisibility('${t.id}')">${t.hiddenFromBookings?"Show in Booking":"Hide from Booking"}</button><button class="danger" onclick="deleteTutor('${t.id}')">Remove Access</button></td></tr>`).join("")}</table>`:`<p class="muted">No booking tutor accounts yet.</p>`}
  <hr><h3>Create Booking Tutor Account</h3>
  <div class="row">
    <input id="tn" placeholder="Full name">
    <input id="te" type="email" placeholder="Email">
    <input id="tp" placeholder="Temporary password">
    <input id="tw" placeholder="WhatsApp e.g. 96176174738">
    <input id="tr" type="number" placeholder="Hourly rate">
    <input id="tuiv" placeholder="University e.g. University of Balamand">
  </div>
  <input id="tl" placeholder="General locations: Online, On Campus (Koura Campus)">
  <button onclick="createAccount('tutor')">Create / Link Booking Tutor</button></div>`;
}
async function editTutor(id){
  const t=DATA.users[id];if(!t)return alert("Tutor not found.");
  const name=prompt("Tutor full name:",t.name||"");if(name===null)return;
  const university=prompt("University:",t.university||"");if(university===null)return;
  const rate=prompt("Hourly rate:",t.rate||15);if(rate===null)return;
  const whatsapp=prompt("WhatsApp number:",t.whatsapp||"");if(whatsapp===null)return;
  const coursesText=prompt("Courses, comma separated:",(t.courses||[]).join(", "));if(coursesText===null)return;
  const locationsText=prompt("General locations, comma separated:",(t.locations||[]).join(", "));if(locationsText===null)return;
  const photoUrl=prompt("Profile picture URL:",t.photoUrl||"");if(photoUrl===null)return;
  const description=prompt("Description / teaching style:",t.description||"");if(description===null)return;
  const courses=coursesText.split(",").map(x=>x.trim()).filter(Boolean),locations=locationsText.split(",").map(x=>x.trim()).filter(Boolean);
  await db.ref("users/"+id).update({name,university,rate:Number(rate||0),whatsapp,courses,locations,photoUrl,description,updatedAt:Date.now()});
  for(const c of courses){await db.ref("courses/"+safe(c)).set({name:c})}
  await loadData();adminTutors();
}

async function editTutorPhoto(id){
  const input=document.createElement("input");
  input.type="file";input.accept="image/*";
  input.onchange=async()=>{
    if(!input.files||!input.files[0])return;
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=async()=>{
        const canvas=document.createElement("canvas");
        const max=500;let w=img.width,h=img.height;
        if(w>h&&w>max){h=Math.round(h*max/w);w=max}
        else if(h>=w&&h>max){w=Math.round(w*max/h);h=max}
        canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        await db.ref("users/"+id+"/photoUrl").set(canvas.toDataURL("image/jpeg",0.72));
        await loadData();adminTutors();
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  };
  input.click();
}
async function deleteTutor(id){
  const t=DATA.users[id];if(!t)return alert("Tutor not found.");
  if(!confirm(`Delete tutor ${t.name} from Scheduled? They will no longer be able to access the website. To delete the Firebase Auth email too, also remove it in Firebase Authentication > Users.`))return;
  await db.ref("users/"+id).remove();
  const av=list(DATA.availability).filter(a=>a.tutorId===id);
  for(const a of av){await db.ref("availability/"+a.id).remove()}
  await loadData();adminTutors();
}
function usersTable(a){return a.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Role/Type</th><th>Details</th></tr>${a.map(u=>`<tr><td>${u.name||""}</td><td>${u.email||""}</td><td>${u.role}${u.type?"/"+u.type:""}</td><td>${u.rate?money(u.rate)+"/h/person<br>":""}${u.university?`University: ${u.university}<br>`:""}${u.whatsapp||u.phone||""}<br>${(u.courses||[]).join(", ")}</td></tr>`).join("")}</table>`:`<p class="muted">No accounts yet.</p>`}
function adminStudents(){
  const visible=profile.role==="admin"
    ? students()
    : students().filter(s=>studentTutors(s.id).some(t=>t.id===currentUser.uid)||assignedTutorIdsForStudent(s.id).includes(currentUser.uid));

  $("content").innerHTML=`<div class="card"><h2>${profile.role==="admin"?"Students / Groups":"My Students / Groups"}</h2>
  ${visible.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Phone</th><th>University</th><th>Type</th><th>Assigned Tutors</th><th>Assigned Courses</th><th>Actions</th></tr>${visible.map(s=>`<tr><td>${s.name||""}</td><td>${s.email||""}</td><td>${s.phone||""}</td><td>${s.university||""}</td><td>${s.type||"individual"}</td><td class="assigned-list">${assignedTutorNames(s.id)||"None"}</td><td class="course-list">${assignedCourseNames(s.id)||"None"}</td><td>${profile.role==="admin"?`<button onclick="editStudent('${s.id}')">Edit</button><button onclick="editStudentTutors('${s.id}')">Assign Tutors</button><button onclick="editStudentCourses('${s.id}')">Assign Courses</button><button class="danger" onclick="deleteStudent('${s.id}')">Delete</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No accounts yet.</p>`}

  <hr><h3>Create Student or Group Account</h3>
  <div class="row">
    <input id="sn" placeholder="Name">
    <input id="se" type="email" placeholder="Email">
    <input id="sp" placeholder="Password">
    <input id="sphone" placeholder="Phone">
    <input id="suniversity" placeholder="University">
    <select id="stype"><option>individual</option><option>group</option></select>
  </div>
  <input id="smembers" placeholder="Group members comma separated">
  <label>Assign Tutor(s)</label>
  <p class="muted small">New tutors automatically appear here after you create them.</p>
  <div class="checkbox-grid">${tutorCheckboxes("assignedTutor")}</div><label>Assign Course(s)</label><p class="muted small">New courses automatically appear here after you add them.</p><div class="checkbox-grid">${courseCheckboxes("assignedCourse")}</div>
  <button onclick="createAccount('student')">Create Student/Group</button></div>`;
}
async function editStudent(id){
  const s=DATA.users[id];if(!s)return alert("Student not found.");
  const name=prompt("Student name:",s.name||"");if(name===null)return;
  const phone=prompt("Phone number:",s.phone||"");if(phone===null)return;
  const university=prompt("University:",s.university||"");if(university===null)return;
  const type=prompt("Type: individual or group",s.type||"individual");if(type===null)return;
  const membersText=prompt("Group members comma separated:",(s.members||[]).join(", "));if(membersText===null)return;
  await db.ref("users/"+id).update({name,phone,university,type,members:membersText.split(",").map(x=>x.trim()).filter(Boolean),updatedAt:Date.now()});
  await loadData();adminStudents();
}


function editStudentTutors(id){
  const s=DATA.users[id];
  if(!s)return alert("Student not found.");
  const current=assignedTutorIdsForStudent(id);
  const modal=document.createElement("div");
  modal.className="assign-modal";
  modal.id="assignTutorModal";
  modal.innerHTML=`<div class="assign-modal-box">
    <div class="assign-modal-head">
      <h2>Assign Tutors</h2>
      <button class="ghost" onclick="document.getElementById('assignTutorModal').remove()">Close</button>
    </div>
    <p class="muted">${s.name||"Student"} — choose one or more tutors.</p>
    <div class="checkbox-grid">
      ${tutors().length?tutors().map(t=>`<label class="check"><input type="checkbox" class="editAssignedTutor" value="${t.id}" ${current.includes(t.id)?"checked":""}>${t.name}</label>`).join(""):"<p class='muted'>No tutors available yet.</p>"}
    </div>
    <button onclick="saveStudentTutorAssignments('${id}')">Save Assigned Tutors</button>
  </div>`;
  document.body.appendChild(modal);
}
async function saveStudentTutorAssignments(id){
  const assignedTutorIds=[...document.querySelectorAll(".editAssignedTutor:checked")].map(x=>x.value);
  await db.ref("users/"+id+"/assignedTutorIds").set(assignedTutorIds);
  const modal=document.getElementById("assignTutorModal");
  if(modal)modal.remove();
  await loadData();
  adminStudents();
}


function editStudentCourses(id){
  const s=DATA.users[id];
  if(!s)return alert("Student not found.");
  const current=assignedCoursesForStudent(id);
  const modal=document.createElement("div");
  modal.className="assign-modal";
  modal.id="assignCourseModal";
  modal.innerHTML=`<div class="assign-modal-box">
    <div class="assign-modal-head">
      <h2>Assign Courses</h2>
      <button class="ghost" onclick="document.getElementById('assignCourseModal').remove()">Close</button>
    </div>
    <p class="muted">${s.name||"Student"} — choose one or more courses.</p>
    <div class="checkbox-grid">
      ${allAssignableCourses().length?allAssignableCourses().map(c=>`<label class="check"><input type="checkbox" class="editAssignedCourse" value="${c}" ${current.includes(c)?"checked":""}>${c}</label>`).join(""):"<p class='muted'>No courses available yet. Add courses first.</p>"}
    </div>
    <button onclick="saveStudentCourseAssignments('${id}')">Save Assigned Courses</button>
  </div>`;
  document.body.appendChild(modal);
}
async function saveStudentCourseAssignments(id){
  const assignedCourses=[...document.querySelectorAll(".editAssignedCourse:checked")].map(x=>x.value);
  await db.ref("users/"+id+"/assignedCourses").set(assignedCourses);
  const modal=document.getElementById("assignCourseModal");
  if(modal)modal.remove();
  await loadData();
  adminStudents();
}

async function deleteStudent(id){
  const s=DATA.users[id];if(!s)return alert("Student not found.");
  if(!confirm(`Delete student ${s.name} from Scheduled? They will no longer be able to access the website. To delete the Firebase Auth email too, also remove it in Firebase Authentication > Users.`))return;
  await db.ref("users/"+id).remove();
  await loadData();adminStudents();
}
async function createAccount(role){
  try{
    let name,email,password,extra={},phoneForWa="",profileData={};

    if(role==="tutor"){
      if(profile.role!=="admin")return alert("Only admin can create tutor accounts.");
      name=$("tn").value.trim();
      email=$("te").value.trim();
      password=$("tp").value;
      phoneForWa=$("tw").value;
      extra={
        whatsapp:$("tw").value,
        rate:Number($("tr").value||15),
        university:$("tuiv").value.trim(),
        locations:$("tl").value.split(",").map(x=>x.trim()).filter(Boolean),
        courses:[]
      };
    }else{
      name=$("sn").value.trim();
      email=$("se").value.trim();
      password=$("sp").value;
      phoneForWa=$("sphone").value;
      extra={
        phone:$("sphone").value,
        university:($("suniversity")?.value||"").trim(),
        type:$("stype").value,
        members:$("smembers").value.split(",").map(x=>x.trim()).filter(Boolean),
        createdBy:currentUser.uid
      };
    }

    if(!name||!email||!password)return alert("Please fill name, email, and password.");

    profileData={name,email,role,createdAt:Date.now(),removed:false,...extra};

    try{
      let c=await secondaryAuth.createUserWithEmailAndPassword(email,password);
      await db.ref("users/"+c.user.uid).set({uid:c.user.uid,...profileData});
      await db.ref("profilesByEmail/"+emailKey(email)).set(profileData);
      await secondaryAuth.signOut();

      openWhatsApp(phoneForWa,`Hi ${name}, your Scheduled account has been created.\n\nLogin link: ${SITE_URL}\nEmail: ${email}\nTemporary password: ${password}\n\nPlease change your password after logging in.`);
      alert(`${role==="tutor"?"Booking tutor":"Student"} account created successfully.`);
    }catch(e){
      if(String(e.code||"").includes("email-already-in-use")){
        await savePreparedProfileByEmail(email, profileData);
        openWhatsApp(phoneForWa,`Hi ${name}, your Scheduled ${role==="tutor"?"tutor":"student"} profile has been prepared using your existing email.\n\nLogin link: ${SITE_URL}\nEmail: ${email}\nPlease log in using your existing password. Your Scheduled profile will link automatically.\n\nIf you forgot your password, ask admin to send a Firebase password reset.`);
        alert("This Firebase email already exists. Scheduled prepared the profile by email. When they log in with the same email, access will link automatically.");
      }else{
        throw e;
      }
    }

    await loadData();
    role==="tutor"?adminTutors():adminStudents();
  }catch(e){alert(e.message)}
}
function adminCourses(){$("content").innerHTML=`<div class="card"><h2>Course Management</h2><table class="table"><tr><th>Tutor</th><th>Courses</th></tr>${tutors().map(t=>`<tr><td>${t.name}</td><td>${(t.courses||[]).join(", ")}</td></tr>`).join("")}</table><hr><div class="row"><select id="ct">${tutors().map(t=>`<option value="${t.id}">${t.name}</option>`)}</select><input id="cn" placeholder="Course name exactly: Physics 213"></div><button onclick="assignCourse()">Assign Course</button></div>`}
async function assignCourse(){let t=user($("ct").value),c=$("cn").value.trim(),cs=Array.from(new Set([...(t.courses||[]),c])).filter(Boolean);await db.ref("users/"+$("ct").value+"/courses").set(cs);await db.ref("courses/"+safe(c)).set({name:c});await loadData();adminCourses()}

function accessRequestsPage(){
  const requests=list(DATA.accessRequests).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  $("content").innerHTML=`<div class="card"><h2>Access Requests</h2>${requests.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Phone</th><th>University</th><th>Courses</th><th>Message</th><th>Status</th><th>Actions</th></tr>${requests.map(r=>`<tr><td>${r.name||""}</td><td>${r.email||""}</td><td>${r.phone||""}</td><td>${r.university||""}</td><td>${r.courses||""}</td><td>${r.message||""}</td><td>${r.status||"pending"}</td><td>${(r.status||"pending")==="pending"?`<button onclick="approveAccessRequest('${r.id}')">Approve</button><button class="danger" onclick="rejectAccessRequest('${r.id}')">Reject</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No access requests yet.</p>`}</div>`;
}
function tempPass(){return"Scheduled-"+Math.floor(1000+Math.random()*9000)}
async function approveAccessRequest(id){const r=DATA.accessRequests[id];if(!r)return alert("Request not found.");const password=tempPass();try{let c=await secondaryAuth.createUserWithEmailAndPassword(r.email,password);await db.ref("users/"+c.user.uid).set({uid:c.user.uid,name:r.name,email:r.email,phone:r.phone,university:r.university||"",role:"student",type:"individual",requestedCourses:r.courses,createdBy:currentUser.uid,createdFromAccessRequest:id,createdAt:Date.now()});await db.ref("accessRequests/"+id).update({status:"approved",approvedAt:Date.now(),createdStudentUid:c.user.uid});await secondaryAuth.signOut();await loadData();openWhatsApp(r.phone,`Hi ${r.name}, your Scheduled access request has been approved.\n\nLogin link: ${SITE_URL}\nEmail: ${r.email}\nTemporary password: ${password}\n\nYou can now log in and book your tutoring sessions.`);accessRequestsPage()}catch(e){alert(e.message)}}
async function rejectAccessRequest(id){if(!confirm("Reject this access request?"))return;await db.ref("accessRequests/"+id).update({status:"rejected",rejectedAt:Date.now()});await loadData();accessRequestsPage()}

function bookingRows(bs,edit){return bs.length?`<table class="table"><tr><th>Date</th><th>Time</th><th>Course</th><th>Tutor</th><th>Student/Group</th><th>Details</th><th>Payments</th><th>Notes</th><th>Actions</th></tr>${bs.map(b=>`<tr><td>${b.date}</td><td>${formatTime12(b.start)}</td><td>${b.course}</td><td>${user(b.tutorId).name||""}</td><td>${user(b.studentId).name||""}</td><td>${b.duration}h • ${b.format||"Individual"} ${b.groupSize||1}<br>${b.location}<br>${b.paymentMethod}<br>${(b.sessionTypes||[]).join(", ")}<br>Total: ${money(total(b))}</td><td>${(b.payments||[]).map((p,i)=>`${p.name}: ${money(p.amount)} ${badge(p.paid)} ${edit?`<button onclick="togglePayment('${b.id}',${i})">Toggle</button>`:""}`).join("<br>")}</td><td>${b.notes||""}${edit?`<br><button onclick="editNotes('${b.id}')">Edit Notes</button>`:""}</td><td>${edit?`<button onclick="editBooking('${b.id}')">Edit</button><button onclick="markBookingPayment('${b.id}')">Mark Paid</button><button onclick="markDone('${b.id}')">Mark Done</button><button class="danger" onclick="deleteBooking('${b.id}')">Delete</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No sessions yet.</p>`}
function bookingsPage(edit){let bs=myBookings();$("content").innerHTML=`<div class="card"><h2>Upcoming Sessions</h2>${bookingRows(bs.filter(b=>!b.done),edit&&profile.role!=="student")}</div><div class="card"><h2>Past Sessions</h2>${bookingRows(bs.filter(b=>b.done),edit&&profile.role!=="student")}</div>`}
async function togglePayment(id,i){let b=DATA.bookings[id];b.payments[i].paid=!b.payments[i].paid;await db.ref(`bookings/${id}/payments`).set(b.payments);await loadData();bookingsPage(true)}
async function editNotes(id){let b=DATA.bookings[id];let n=prompt("Session notes:",b.notes||"");if(n!==null){await db.ref(`bookings/${id}/notes`).set(n);await loadData();bookingsPage(true)}}
async function editBooking(id){let b=DATA.bookings[id];let date=prompt("Date:",b.date);if(date===null)return;let start=prompt("Start time:",b.start);if(start===null)return;let duration=prompt("Duration:",b.duration);if(duration===null)return;let location=prompt("Location:",b.location);if(location===null)return;await db.ref("bookings/"+id).update({date,start,duration:Number(duration),location,paymentMethod:method(location)});await loadData();bookingsPage(true)}
async function deleteBooking(id){if(!confirm("Delete this booking?"))return;await db.ref("bookings/"+id).remove();await loadData();bookingsPage(true)}
async function markDone(id){await db.ref("bookings/"+id).update({done:true,doneAt:Date.now()});await loadData();bookingsPage(true)}
function schedulePage(){bookingsPage(true)}
function paymentsPage(){bookingsPage(false)}

function availabilityPage(){let a=list(DATA.availability).filter(x=>x.tutorId===currentUser.uid).sort((x,y)=>(x.date||"").localeCompare(y.date||"")||(x.start||"").localeCompare(y.start||""));let un=list(DATA.unavailable).filter(x=>x.tutorId===currentUser.uid).sort((x,y)=>(x.date||"").localeCompare(y.date||""));$("content").innerHTML=`<div class="card"><h2>Calendar Availability</h2><p class="muted">Add exact date availability for each course. Booking any course blocks the tutor globally at that time.</p><table class="table"><tr><th>Date</th><th>Start</th><th>End</th><th>Courses</th><th>Locations</th><th>Edit</th></tr>${a.map(x=>`<tr><td>${x.date||""}</td><td>${x.start||""}</td><td>${x.end||""}</td><td>${(x.courses||[]).join(", ")}</td><td>${Array.isArray(x.locations)?x.locations.join(", "):x.location||""}</td><td><button onclick="editAvailability('${x.id}')">Edit</button><button class="danger" onclick="deleteAvailability('${x.id}')">Delete</button></td></tr>`).join("")}</table><hr><h3>Add Availability for a Date</h3><div class="row"><input id="adate" type="date"><input id="astart" type="time"><input id="aend" type="time"></div><label>Courses</label><div class="checkbox-grid">${((user(currentUser.uid).courses||profile.courses||[])).map(c=>`<label class="check"><input type="checkbox" class="acourse" value="${c}">${c}</label>`).join("")||"<p class='muted'>No courses assigned yet.</p>"}</div><label>Location Options</label><div class="checkbox-grid"><label class="check"><input type="checkbox" id="locOnline">Online</label><label class="check"><input type="checkbox" id="locCampus">On Campus</label><label class="check"><input type="checkbox" id="locBoth">Both</label></div><input id="campusName" placeholder="Campus name if on campus/both"><button onclick="addAvailability()">Add Date Availability</button></div><div class="card"><h2>Unavailable Dates</h2><table class="table"><tr><th>Date</th><th>Edit</th></tr>${un.map(x=>`<tr><td>${x.date}</td><td><button class="danger" onclick="deleteUnavailable('${x.id}')">Delete</button></td></tr>`).join("")}</table><hr><input id="udate" type="date"><button onclick="addUnavailable()">Add Unavailable Date</button></div><div class="card"><h2>Generate Repeated Availability</h2><div class="row"><input id="gfrom" type="date"><input id="gto" type="date"><select id="gday"><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select><input id="gstart" type="time"><input id="gend" type="time"></div><label>Courses</label><div class="checkbox-grid">${((user(currentUser.uid).courses||profile.courses||[])).map(c=>`<label class="check"><input type="checkbox" class="gcourse" value="${c}">${c}</label>`).join("")}</div><label>Location Options</label><div class="checkbox-grid"><label class="check"><input type="checkbox" id="glocOnline">Online</label><label class="check"><input type="checkbox" id="glocCampus">On Campus</label><label class="check"><input type="checkbox" id="glocBoth">Both</label></div><input id="gcampusName" placeholder="Campus name if on campus/both"><button onclick="generateAvailabilityRange()">Generate Availability</button></div>`}
async function addAvailability(){if(!$("adate").value||!$("astart").value||!$("aend").value)return alert("Choose date, start, end.");if(toMin($("aend").value)<=toMin($("astart").value))return alert("End time must be after start.");let courses=[...document.querySelectorAll(".acourse:checked")].map(x=>x.value);if(!courses.length)return alert("Choose at least one course.");let loc=selectedLocations("");if(loc.error)return alert(loc.error);await db.ref("availability").push({tutorId:currentUser.uid,date:$("adate").value,start:$("astart").value,end:$("aend").value,courses,locations:loc.locations,campusName:loc.campusName||"",createdAt:Date.now()});await loadData();availabilityPage()}
async function editAvailability(id){let a=DATA.availability[id];let date=prompt("Date:",a.date);if(date===null)return;let start=prompt("Start:",a.start);if(start===null)return;let end=prompt("End:",a.end);if(end===null)return;let courses=prompt("Courses comma separated:",(a.courses||[]).join(", "));if(courses===null)return;let loc=prompt("Locations comma separated:",(a.locations||[]).join(", "));if(loc===null)return;await db.ref("availability/"+id).update({date,start,end,courses:courses.split(",").map(x=>x.trim()).filter(Boolean),locations:loc.split(",").map(x=>x.trim()).filter(Boolean)});await loadData();availabilityPage()}
async function deleteAvailability(id){if(!confirm("Delete this availability?"))return;await db.ref("availability/"+id).remove();await loadData();availabilityPage()}
async function addUnavailable(){if(!$("udate").value)return;await db.ref("unavailable").push({tutorId:currentUser.uid,date:$("udate").value,createdAt:Date.now()});await loadData();availabilityPage()}
async function deleteUnavailable(id){if(!confirm("Delete unavailable date?"))return;await db.ref("unavailable/"+id).remove();await loadData();availabilityPage()}
async function generateAvailabilityRange(){const from=$("gfrom").value,to=$("gto").value,day=$("gday").value,start=$("gstart").value,end=$("gend").value;if(!from||!to||!start||!end)return alert("Fill all fields.");let courses=[...document.querySelectorAll(".gcourse:checked")].map(x=>x.value);if(!courses.length)return alert("Choose at least one course.");let online=$("glocOnline").checked,campus=$("glocCampus").checked,both=$("glocBoth").checked,campusName=$("gcampusName").value.trim(),locations=[];if(online)locations.push("Online");if(campus){if(!campusName)return alert("Specify campus.");locations.push(`On Campus (${campusName})`)}if(both){if(!campusName)return alert("Specify campus.");locations.push("Online",`On Campus (${campusName})`)}locations=[...new Set(locations)];if(!locations.length)return alert("Choose location.");let count=0,cur=new Date(from+"T12:00:00"),last=new Date(to+"T12:00:00");while(cur<=last){let iso=cur.toISOString().slice(0,10),wd=cur.toLocaleDateString("en-US",{weekday:"long"});if(wd===day){await db.ref("availability").push({tutorId:currentUser.uid,date:iso,start,end,courses,locations,campusName,createdAt:Date.now(),generated:true});count++}cur.setDate(cur.getDate()+1)}await loadData();alert(`Generated ${count} availability blocks.`);availabilityPage()}

function monthDays(year,month){let last=new Date(year,month+1,0),days=[];for(let d=1;d<=last.getDate();d++){let dt=new Date(year,month,d),iso=localISODate(dt);days.push({date:iso,day:d,weekday:dt.toLocaleDateString("en-US",{weekday:"short"})})}return days}
function calendarPage(){let now=new Date(),year=Number(localStorage.getItem("calYear")||now.getFullYear()),month=Number(localStorage.getItem("calMonth")||now.getMonth()),days=monthDays(year,month),bs=myBookings();$("content").innerHTML=`<div class="card"><h2>Calendar</h2><div class="row"><button onclick="moveMonth(-1)">Previous</button><div class="card small"><b>${new Date(year,month,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</b></div><button onclick="moveMonth(1)">Next</button></div><div class="calendar-grid">${days.map(d=>{let dayBookings=bs.filter(b=>b.date===d.date).sort((a,b)=>(a.start||"").localeCompare(b.start||""));return`<div class="day-card ${dayBookings.length?'':'not-available'}" onclick="${dayBookings.length?`dailyView('${d.date}')`:''}"><h4>${d.weekday} ${d.day}</h4>${dayBookings.slice(0,3).map(b=>`<div class="event">${formatTime12(b.start)} • ${profile.role==="student"?user(b.tutorId).name:user(b.studentId).name}<br>${b.course}</div>`).join("")}</div>`}).join("")}</div></div>`}
function moveMonth(delta){let now=new Date(),y=Number(localStorage.getItem("calYear")||now.getFullYear()),m=Number(localStorage.getItem("calMonth")||now.getMonth()),d=new Date(y,m+delta,1);localStorage.setItem("calYear",d.getFullYear());localStorage.setItem("calMonth",d.getMonth());calendarPage()}
function dailyView(date){let bs=myBookings().filter(b=>b.date===date).sort((a,b)=>(a.start||"").localeCompare(b.start||""));$("content").innerHTML=`<div class="card"><button class="ghost" onclick="calendarPage()">Back to Calendar</button><h2>Daily Schedule — ${date}</h2>${bs.map(b=>`<div class="schedule-item"><b>${formatTime12(b.start)}</b> • ${b.course}<br>${profile.role==="student"?user(b.tutorId).name:user(b.studentId).name}<br>${b.duration}h • ${b.location}<br>${paymentSummary(b)}</div>`).join("")}</div>`}

function bookingPage(){const courses=allCourseNames(),universities=allUniversityNames();$("content").innerHTML=`<div class="card"><h2>Book a Session</h2><label>1. Choose Course</label><select id="bcourseFirst" onchange="updateTutorListForCourse()"><option value="">Select a course</option>${courses.map(c=>`<option value="${c}">${c}</option>`).join("")}</select><label>2. Choose University</label><select id="buniversity" onchange="updateTutorListForCourse()"><option value="">All universities</option>${universities.map(u=>`<option value="${u}">${u}</option>`).join("")}</select><div id="courseTutorList"></div><div id="bookingDetails" class="hidden"><hr><label>3. Selected Tutor</label><select id="bt" onchange="updateBooking()"></select><div id="bookingCalendar"></div><div class="row"><div><label>4. Date</label><input id="bd" type="date" onchange="updateSlots()"></div><div><label>5. Duration</label><select id="bdu" onchange="updateSlots()"><option value="1">1 hour</option><option value="1.5">1h 30min</option><option value="2">2 hours</option><option value="2.5">2h 30min</option><option value="3">3 hours</option></select></div><div><label>6. Available Time</label><select id="bs" onchange="updateBookingLocations();updatePrice()"></select></div></div><label>Session Format</label><div class="row"><select id="bf" onchange="updatePrice()"><option>Individual</option><option>Group</option></select><select id="bg" onchange="updatePrice()"><option value="1">1 student</option><option value="2">2 students</option><option value="3">3 students</option><option value="4">4 students</option><option value="5">5 students</option></select></div><label>Session Type</label><div class="checkbox-grid">${["Course & Formulas","Book Exercises","Previous Exams","Other"].map(x=>`<label class="check"><input type="checkbox" class="stype" value="${x}">${x}</label>`).join("")}</div><label>Location</label><select id="bl" onchange="updatePrice()"></select><div id="price" class="card small"></div><button onclick="confirmBooking()">Confirm Booking + WhatsApp</button></div></div>`

  if(preselectTutorId){
    const pt=user(preselectTutorId);
    const wantedCourse=window.preselectCourse||"";
    const courseToUse=(pt.courses||[]).includes(wantedCourse)?wantedCourse:((pt.courses||[])[0]||"");
    if(courseToUse){$("bcourseFirst").value=courseToUse;}
    if(pt.university){$("buniversity").value=pt.university;}
    updateTutorListForCourse();
  }
}function updateTutorListForCourse(){
  const course=$("bcourseFirst").value,university=$("buniversity").value,listBox=$("courseTutorList"),details=$("bookingDetails");
  if(!course){listBox.innerHTML="";details.classList.add("hidden");return}
  let ts=tutorsForCourseAndUniversity(course,university);
  if(!ts.length){listBox.innerHTML=`<div class="card"><p class="muted">No tutors available.</p></div>`;details.classList.add("hidden");return}
  listBox.innerHTML=`<hr><h3>Available Tutors</h3><div class="grid">${ts.map(t=>`<div class="card"><h3>${t.name}</h3><p><b>University:</b> ${t.university||"Not specified"}</p><p><b>Rate:</b> ${money(t.rate)}/hour/person</p><button onclick="selectTutorForBooking('${t.id}')">Choose ${t.name}</button></div>`).join("")}</div>`;
  $("bt").innerHTML=ts.map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
  details.classList.remove("hidden");
  if(preselectTutorId && ts.some(t=>t.id===preselectTutorId)){
    $("bt").value=preselectTutorId;
    preselectTutorId=null;
    window.preselectCourse="";
  }
  updateBooking();
}
function selectTutorForBooking(id){$("bt").value=id;updateBooking();$("bookingDetails").scrollIntoView({behavior:"smooth",block:"start"})}
function renderBookingCalendar(){
  if(!$("bt")||!$("bt").value||!$("bcourseFirst").value)return;
  let now=new Date();
  let year=Number(localStorage.getItem("bookYear")||now.getFullYear());
  let month=Number(localStorage.getItem("bookMonth")||now.getMonth());
  let first=new Date(year,month,1);
  let last=new Date(year,month+1,0);
  let startPad=first.getDay();
  let cells=[];
  for(let i=0;i<startPad;i++)cells.push({empty:true});
  for(let d=1;d<=last.getDate();d++){
    let dt=new Date(year,month,d);
    let iso=localISODate(dt);
    let available=dayHasAvailable($("bt").value,iso,$("bcourseFirst").value);
    cells.push({date:iso,day:d,available});
  }
  while(cells.length%7!==0)cells.push({empty:true});
  const title=first.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  $("bookingCalendar").innerHTML=`<div class="booking-calendar-wrap">
    <div class="booking-calendar-head">
      <button class="ghost" onclick="moveBookingMonth(-1)">‹</button>
      <div class="booking-calendar-title">${title}</div>
      <button class="ghost" onclick="moveBookingMonth(1)">›</button>
    </div>
    <div class="booking-calendar-weekdays"><div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div></div>
    <div class="booking-calendar-grid">${cells.map(c=>{
      if(c.empty)return `<div class="booking-date empty"></div>`;
      const selected=$("bd").value===c.date;
      return `<div class="booking-date ${c.available?'available':'not-available'} ${selected?'selected':''}" onclick="${c.available?`chooseBookingDate('${c.date}')`:''}">${c.day}</div>`;
    }).join("")}</div>
  </div>`;
}
function moveBookingMonth(delta){
  let now=new Date();
  let y=Number(localStorage.getItem("bookYear")||now.getFullYear());
  let m=Number(localStorage.getItem("bookMonth")||now.getMonth());
  let d=new Date(y,m+delta,1);
  localStorage.setItem("bookYear",d.getFullYear());
  localStorage.setItem("bookMonth",d.getMonth());
  renderBookingCalendar();
}

function chooseBookingDate(date){$("bd").value=date;renderBookingCalendar();updateSlots()}
function updateBooking(){if(!$("bt")||!$("bt").value)return;renderBookingCalendar();updateSlots();updatePrice()}



function updateSlots(){
  if(!$("bt")||!$("bt").value)return;
  let slots=generateSlots($("bt").value,$("bd").value,$("bdu").value,$("bcourseFirst").value);
  $("bs").innerHTML=slots.length?slots.map(s=>`<option value="${s}">${formatTime12(s)}</option>`).join(""):`<option value="">No available slots</option>`;
  updateBookingLocations();updatePrice();
}
function updateBookingLocations(){if(!$("bt")||!$("bt").value||!$("bs"))return;let locs=slotLocationOptions($("bt").value,$("bd").value,$("bs").value,$("bdu").value,$("bcourseFirst").value);$("bl").innerHTML=locs.length?locs.map(l=>`<option>${l}</option>`).join(""):`<option value="">No location available</option>`}
function updatePrice(){if(!$("bt")||!$("bt").value)return;let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1;$("price").innerHTML=`<b>Course:</b> ${$("bcourseFirst").value||"-"}<br><b>Tutor:</b> ${t.name||"-"}<br><b>University:</b> ${t.university||"Not specified"}<br><b>Rate:</b> ${money(t.rate)}/hour/person<br><b>Duration:</b> ${d}h<br><b>Students:</b> ${g}<br><b>Total:</b> ${money((t.rate||0)*d*g)}<br><b>Payment:</b> ${method($("bl").value)}`}
async function confirmBooking(){if(!$("bcourseFirst").value)return alert("Choose a course.");if(!$("bt").value)return alert("Choose a tutor.");if(!$("bs").value)return alert("No available time selected.");let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1,loc=$("bl").value;if(!candidateWorks($("bt").value,currentUser.uid,$("bd").value,$("bs").value,d))return alert("This slot was just booked. Choose another time.");let names=profile.type==="group"&&profile.members?.length?profile.members.slice(0,g):[profile.name];while(names.length<g)names.push("Student "+(names.length+1));let payments=names.map(n=>({name:n,amount:(t.rate||0)*d,paid:false}));let b={studentId:currentUser.uid,tutorId:$("bt").value,course:$("bcourseFirst").value,date:$("bd").value,start:$("bs").value,duration:d,format:$("bf").value,groupSize:g,sessionTypes:[...document.querySelectorAll(".stype:checked")].map(x=>x.value),location:loc,paymentMethod:method(loc),payments,notes:"",attachments:[],createdAt:Date.now(),done:false};await db.ref("bookings").push(b);
  const existingAssigned=assignedTutorIdsForStudent(currentUser.uid);
  if(!existingAssigned.includes($("bt").value)){
    await db.ref("users/"+currentUser.uid+"/assignedTutorIds").set([...existingAssigned,$("bt").value]);
  }let msg=`📚 New Tutoring Booking\n\nTutor: ${t.name}\nUniversity: ${t.university||"Not specified"}\nStudent/Group: ${profile.name}\nCourse: ${b.course}\nDate: ${b.date}\nTime: ${formatTime12(b.start)}\nDuration: ${d}h\nFormat: ${b.format} (${g})\nType: ${b.sessionTypes.join(", ")}\nLocation: ${loc}\nPayment Method: ${b.paymentMethod}\nTotal: ${money(total(b))}`;openWhatsApp(t.whatsapp,msg);await loadData();showBookingModal(t)}
function showBookingModal(t){const div=document.createElement("div");div.className="modal";div.innerHTML=`<div class="modal-box"><h2>🎉 Booking Confirmed!</h2><p>Your tutoring session has been successfully booked.</p><p><b>Important:</b> If you need to reschedule, cancel, or have any questions, please contact your tutor directly via WhatsApp.</p><p><b>Tutor:</b> ${t.name}<br><b>WhatsApp:</b> ${t.whatsapp||""}</p><button class="whatsapp" onclick="openWhatsApp('${t.whatsapp||""}','Hi, I have a question about my tutoring session on Scheduled.')">Contact Tutor on WhatsApp</button><button onclick="document.body.removeChild(this.closest('.modal'));openTab('My Sessions')">Go to My Sessions</button></div>`;document.body.appendChild(div)}

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
function csvEscape(x){return `"${String(x??"").replaceAll('"','""')}"`}
function downloadCSV(filename, rows){
  const csv=rows.map(r=>r.map(csvEscape).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function bookingMonth(b){return String(b.date||"").slice(0,7)}
function tutorBookingsFor(tutorId){return list(DATA.bookings).filter(b=>b.tutorId===tutorId)}
function tutorMonthlyStats(tutorId, month){
  const bs=tutorBookingsFor(tutorId).filter(b=>!month||bookingMonth(b)===month);
  return {bs,hours:bs.reduce((s,b)=>s+Number(b.duration||0),0),earned:bs.reduce((s,b)=>s+total(b),0),paidAmount:paid(bs),unpaidAmount:unpaid(bs)};
}
function exportTutorBookingsCSV(tutorId=currentUser.uid, month=""){
  const t=user(tutorId);
  const bs=tutorBookingsFor(tutorId).filter(b=>!month||bookingMonth(b)===month).sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.start||"").localeCompare(b.start||""));
  const rows=[["Tutor","Student/Group","Date","Time","Month","Course","Duration Hours","Location","Payment Method","Total","Paid Amount","Unpaid Amount","Payment Details","Status"]];
  bs.forEach(b=>rows.push([t.name||"",user(b.studentId).name||"",b.date||"",typeof formatTime12==="function"?formatTime12(b.start):b.start,bookingMonth(b),b.course||"",b.duration||"",b.location||"",b.paymentMethod||"",total(b),paid([b]),unpaid([b]),(b.payments||[]).map(p=>`${p.name}: ${money(p.amount)} ${p.paid?"Paid":"Unpaid"}`).join(" | "),b.done?"Past/Done":"Upcoming"]));
  downloadCSV(`Scheduled_${(t.name||"Tutor").replace(/\s+/g,"_")}_${month||"all"}_bookings_payments.csv`,rows);
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