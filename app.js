
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
    <label>Phone Number</label><div class="phone-prefix-field"><span>+961</span><input id="reqPhone" inputmode="numeric" autocomplete="tel" placeholder="71 123 456" oninput="cleanRequestPhoneInput()"></div><p class="field-hint">Enter your Lebanese number without the country code. Example: 71 123 456 or 03 123 456.</p>
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
let currentUser=null,profile=null,DATA={users:{},availability:{},bookings:{},documents:{},courses:{},unavailable:{},accessRequests:{},pendingProfiles:{},publicTutors:{},profilesByEmail:{}};
let preselectTutorId=null;

setTimeout(()=>{$("splash").classList.add("hidden");$("app").classList.remove("hidden")}, 5100);
function notice(m){$("notice").textContent=m;$("notice").classList.remove("hidden")}
function cleanPhone(p){return String(p||"").replace(/[^\d]/g,"")}
function normalizeLebanonPhone(p){
  let d=cleanPhone(p);
  if(d.startsWith("00"))d=d.slice(2);
  let local=d.startsWith("961")?d.slice(3):d;
  local=local.replace(/^0+/,"");
  if(!/^\d{7,8}$/.test(local))return "";
  return "961"+local;
}
function phoneForWhatsApp(p){return normalizeLebanonPhone(p)||cleanPhone(p)}
function cleanRequestPhoneInput(){
  const el=$("reqPhone");
  if(!el)return;
  let d=cleanPhone(el.value);
  if(d.startsWith("00"))d=d.slice(2);
  if(d.startsWith("961"))d=d.slice(3);
  d=d.replace(/^0+/,"");
  el.value=d;
}
function openWhatsApp(phone,msg){const p=phoneForWhatsApp(phone);if(!p)return alert("No WhatsApp number saved.");window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`,"_blank")}

function safeOptionText(v){return String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function optionKey(v){return String(v||"").trim().replace(/\s+/g," ").toLocaleLowerCase()}
function prettyOptionLabel(v){
  let raw=String(v||"").trim().replace(/\s+/g," ");
  if(!raw)return "";
  const allCaps=raw===raw.toUpperCase();
  const allLower=raw===raw.toLowerCase();
  if(allCaps||allLower){
    raw=raw.toLowerCase().replace(/\b\w/g,ch=>ch.toUpperCase()).replace(/\b(Of|And|The|De|Du|La|Le)\b/g,m=>m.toLowerCase());
  }
  raw=raw.replace(/^University of balamand$/i,"University of Balamand");
  return raw;
}
function uniqueSorted(arr){
  const map=new Map();
  (arr||[]).forEach(x=>{
    const label=prettyOptionLabel(x), key=optionKey(label);
    if(label&&!map.has(key))map.set(key,label);
  });
  return [...map.values()].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}));
}
function mergeTextArrayCaseInsensitive(current, additions){
  const out=[]; const seen=new Set();
  [...(Array.isArray(current)?current:[]), ...(Array.isArray(additions)?additions:[additions])].forEach(x=>{
    const label=prettyOptionLabel(x), key=optionKey(label);
    if(label&&!seen.has(key)){seen.add(key); out.push(label)}
  });
  return out;
}
async function getRequestAccessChoices(){
  let source=DATA||{};
  try{
    const snap=await db.ref("/").once("value");
    source=snap.val()||source||{};
  }catch(_){source=DATA||{}}
  const users=Object.values(source.users||{});
  const publicTutors=Object.values(source.publicTutors||{});
  const coursesObj=Object.values(source.courses||{});
  const universities=[];
  const courses=[];
  users.forEach(u=>{
    if(u&&u.university)universities.push(u.university);
    if(u&&Array.isArray(u.courses))courses.push(...u.courses);
    if(u&&Array.isArray(u.assignedCourses))courses.push(...u.assignedCourses);
  });
  publicTutors.forEach(t=>{
    if(t&&t.university)universities.push(t.university);
    if(t&&Array.isArray(t.courses))courses.push(...t.courses);
  });
  coursesObj.forEach(c=>{
    if(!c)return;
    if(c.name)courses.push(c.name);
    if(c.university)universities.push(c.university);
  });
  return {universities:uniqueSorted(universities),courses:uniqueSorted(courses)};
}
async function populateRequestAccessChoices(prefillCourses=""){
  const uniSelect=$("reqUniversity"), courseSelect=$("reqCourses");
  if(!uniSelect||!courseSelect)return;
  const {universities,courses}=await getRequestAccessChoices();
  uniSelect.innerHTML=`<option value="">Select your university</option>${universities.map(u=>`<option value="${safeOptionText(u)}">${safeOptionText(u)}</option>`).join("")}`;
  courseSelect.innerHTML=courses.length?courses.map(c=>`<option value="${safeOptionText(c)}">${safeOptionText(c)}</option>`).join(""):`<option value="" disabled>No courses available yet</option>`;
  const prefilled=String(prefillCourses||"").split(",").map(x=>x.trim()).filter(Boolean);
  [...courseSelect.options].forEach(o=>{if(prefilled.includes(o.value))o.selected=true});
  if(!universities.length){uniSelect.innerHTML=`<option value="">No universities available yet</option>`;}
}
function selectedRequestCourses(){return Array.from($("reqCourses")?.selectedOptions||[]).map(o=>o.value).filter(Boolean)}

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
    <div class="phone-prefix-field"><span>+961</span><input id="reqPhone" inputmode="numeric" autocomplete="tel" placeholder="71 123 456" oninput="cleanRequestPhoneInput()"></div>
    <p class="field-hint">Enter your Lebanese number without the country code. Example: 71 123 456 or 03 123 456.</p>
    <label>University</label>
    <select id="reqUniversity" class="scroll-select"><option value="">Loading universities...</option></select>
    <label>Course(s) Needed</label>
    <select id="reqCourses" class="scroll-select" multiple size="6"><option value="">Loading courses...</option></select>
    <p class="field-hint">Pick from the courses already available on Scheduled. Hold Ctrl/Command to choose more than one.</p>
    <label>Message</label>
    <textarea id="reqMessage" placeholder="Message (optional)"></textarea>
    <button onclick="submitAccessRequest()">Submit Request</button>
  </div>`;
  populateRequestAccessChoices(prefillCourses);
}
function toggleRequestAccess(){
  if($("requestAccess")){
    $("requestAccess").classList.toggle("hidden");
  }else{
    openRequestAccessForm();
  }
}

async function submitAccessRequest(){try{const name=($("reqName")?.value||"").trim();const email=($("reqEmail")?.value||"").trim();const rawPhone=($("reqPhone")?.value||"").trim();const phone=normalizeLebanonPhone(rawPhone);const university=($("reqUniversity")?.value||"").trim();const chosenCourses=selectedRequestCourses();const courses=chosenCourses.join(", ");const message=($("reqMessage")?.value||"").trim();if(!name||!email||!rawPhone||!university||!chosenCourses.length){return notice("Please fill full name, email, phone number, university, and course(s) needed.")}if(!phone){return notice("Please enter a valid Lebanese phone number.")}await db.ref("accessRequests").push({name,email,phone,whatsapp:phone,university,courses,courseList:chosenCourses,message,status:"pending",createdAt:Date.now()});["reqName","reqEmail","reqPhone","reqMessage"].forEach(id=>{if($(id))$(id).value=""});if($("reqUniversity"))$("reqUniversity").selectedIndex=0;if($("reqCourses"))[...$("reqCourses").options].forEach(o=>o.selected=false);notice("Access request submitted. We will contact you after review.")}catch(e){notice(e.message||"Could not submit request. Please try again.")}}
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

  await loadData(); if(typeof injectChatButton==="function")injectChatButton();
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
function allCourseNames(){let names=[];tutors().forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));return uniqueSorted(names)}
function allUniversityNames(){let names=tutors().map(t=>t.university).filter(Boolean);return uniqueSorted(names)}
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
  return uniqueSorted(names);
}
function publicUniversities(){
  return uniqueSorted(getPublicProfiles().map(p=>p.university).filter(Boolean));
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
  return uniqueSorted(names);
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
async function autoAssignStudentFromBooking(studentId,tutorId,course){
  if(!studentId||!tutorId)return;
  const s=(DATA.users||{})[studentId]||{};
  const assignedTutorIds=Array.from(new Set([...(Array.isArray(s.assignedTutorIds)?s.assignedTutorIds:[]), tutorId].filter(Boolean)));
  const assignedCourses=mergeTextArrayCaseInsensitive(Array.isArray(s.assignedCourses)?s.assignedCourses:[], course?[course]:[]);
  await db.ref("users/"+studentId).update({assignedTutorIds,assignedCourses,autoAssignedUpdatedAt:Date.now()});
}
function markBookingPayment(bookingId){const b=DATA.bookings[bookingId];if(!b)return alert("Booking not found.");const method=prompt("Payment method: Cash or Whish",(b.paymentMethod||"Cash"));if(method===null)return;const cleanMethod=(method.toLowerCase().includes("whish")||method.toLowerCase().includes("wish"))?"Whish":"Cash";const date=prompt("Payment date YYYY-MM-DD:",todayISO());if(date===null)return;const payments=(b.payments||[]).map(p=>({...p,paid:true,method:cleanMethod,paymentDate:date}));db.ref("bookings/"+bookingId).update({paymentMethod:cleanMethod,payments}).then(async()=>{await loadData();bookingsPage(profile.role!=="student")})}
function calendarLinkForBooking(b){const t=user(b.tutorId),s=user(b.studentId);const title=encodeURIComponent(`Scheduled: ${b.course||"Tutoring"}`);const details=encodeURIComponent(`Course: ${b.course||""}\nTutor: ${t.name||""}\nStudent: ${s.name||""}\nLocation: ${b.location||""}`);const date=(b.date||"").replaceAll("-","");const start=(b.start||"00:00").replace(":","");const dur=Math.round(Number(b.duration||1)*60), sh=Number((b.start||"00:00").split(":")[0]), sm=Number((b.start||"00:00").split(":")[1]||0);const end=sh*60+sm+dur,eh=String(Math.floor(end/60)).padStart(2,"0"),em=String(end%60).padStart(2,"0");return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}T${start}00/${date}T${eh}${em}00&details=${details}`}
function contactSelectedTutorForTime(){const t=user($("bt")?.value);openWhatsApp(t.whatsapp||"","Hi, I couldn't find a time that suits me on Scheduled. Can we arrange a session time?")}


function dashboardPage(){if(profile.role==="admin")return adminDashboardPage();if(profile.role==="tutor")return tutorDashboardPage();return studentDashboardPage()}
function studentDashboardPage(){const nb=nextBooking(),my=myBookings(),month=thisMonthBookings(my),quote=randomMotivation();$("content").innerHTML=`<div class="dashboard-hero"><h2 class="student-welcome-line">${scheduledGreeting()}, ${profile.name||"student"} ✨</h2><p class="student-welcome-sub">${scheduledGreetingSub()}</p>${renderStudentInspoBanner()}<div class="quick-actions"><button onclick="openTab('Book')">Book New Session</button><button class="ghost" onclick="emergencySessionsPage()">⚡ Need Help Today?</button></div></div><div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">Next Session</div><div class="kpi-value">${nb?`${nb.date}<br><span class="small">${formatTime12(nb.start)}</span>`:"None"}</div></div><div class="kpi-card"><div class="kpi-label">Hours This Month</div><div class="kpi-value">${totalHours(month)}</div></div><div class="kpi-card"><div class="kpi-label">Upcoming Sessions</div><div class="kpi-value">${my.filter(b=>!b.done).length}</div></div><div class="kpi-card"><div class="kpi-label">My Tutors</div><div class="kpi-value">${studentTutors(currentUser.uid).length}</div></div></div><div class="grid"><div class="card"><h2>Upcoming Sessions</h2>${upcomingBookingsForUser().slice(0,5).map(b=>`<div class="timeline-item"><b>${b.course}</b><br>${b.date} • ${formatTime12(b.start)}<br>${user(b.tutorId).name||""}<br><a href="${calendarLinkForBooking(b)}" target="_blank">Add to Google Calendar</a></div>`).join("")||"<p class='muted'>No upcoming sessions.</p>"}</div><div class="card"><h2>Assigned Courses</h2><p>${assignedCourseBadges(currentUser.uid)}</p><hr><h2>Announcements</h2>${getAnnouncementsForRole().slice(0,3).map(a=>`<div class="announcement-card"><b>${a.title||""}</b><p>${a.message||""}</p></div>`).join("")||"<p class='muted'>No announcements yet.</p>"}</div></div>`}
function tutorDashboardPage(){const b=myBookings(),today=b.filter(x=>isToday(x.date)&&!x.done),month=thisMonthBookings(b);$("content").innerHTML=`<div class="dashboard-hero"><h2>Welcome back, ${profile.name||"Tutor"} 👋</h2><p class="muted">Your tutoring business overview.</p><div class="quick-actions"><button onclick="openTab('Availability')">Add Availability</button><button class="ghost" onclick="openTab('Calendar')">Open Calendar</button></div></div><div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">Today's Sessions</div><div class="kpi-value">${today.length}</div></div><div class="kpi-card"><div class="kpi-label">Hours This Month</div><div class="kpi-value">${totalHours(month)}</div></div><div class="kpi-card"><div class="kpi-label">This Month Earnings</div><div class="kpi-value">${money(month.reduce((s,b)=>s+total(b),0))}</div></div><div class="kpi-card"><div class="kpi-label">Average Rating</div><div class="kpi-value">${avgRating(currentUser.uid)}</div></div></div><div class="grid"><div class="card"><h2>Today</h2>${today.map(b=>`<div class="timeline-item"><b>${formatTime12(b.start)} • ${b.course}</b><br>${user(b.studentId).name||""}<br>${b.location||""}</div>`).join("")||"<p class='muted'>No sessions today.</p>"}</div><div class="card"><h2>Pending Payments</h2>${b.filter(x=>unpaid([x])>0).slice(0,6).map(x=>`<div class="timeline-item">${x.date} • ${user(x.studentId).name||""}<br>${money(unpaid([x]))} unpaid<br><button onclick="markBookingPayment('${x.id}')">Mark as Paid</button></div>`).join("")||"<p class='muted'>No pending payments.</p>"}</div></div>`}
function adminRequestDashboardSection(req){
  const pending=(req||[]).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  return `<div class="card admin-request-access-home"><div class="section-head"><div><h2>Request Access</h2><p class="muted">Pending student access requests appear here immediately when you open the admin dashboard.</p></div><button onclick="openTab('Access Requests')">View All Requests</button></div>${pending.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>Phone</th><th>University</th><th>Courses</th><th>Message</th><th>Actions</th></tr>${pending.slice(0,6).map(r=>`<tr><td>${r.name||""}</td><td>${r.email||""}</td><td>${r.phone||""}</td><td>${r.university||""}</td><td>${r.courses||""}</td><td>${r.message||""}</td><td><button onclick="approveAccessRequest('${r.id}')">Approve + WhatsApp Password</button><button class="danger" onclick="rejectAccessRequest('${r.id}')">Reject</button></td></tr>`).join("")}</table>${pending.length>6?`<p class="muted">Showing 6 of ${pending.length} pending requests. Open Access Requests to see all.</p>`:""}`:`<p class="muted">No pending access requests right now.</p>`}</div>`;
}
function adminDashboardPage(){const bs=list(DATA.bookings),today=bs.filter(b=>isToday(b.date)),month=thisMonthBookings(bs),req=list(DATA.accessRequests).filter(r=>(r.status||"pending")==="pending");$("content").innerHTML=`<div class="dashboard-hero"><h2>Scheduled Admin Dashboard</h2><p class="muted">Everything important in one place.</p><div class="quick-actions"><button onclick="openTab('Students')">Add Student</button><button onclick="openTab('Tutors')">Add Tutor</button><button class="ghost" onclick="openTab('Announcements')">Send Announcement</button><button class="ghost" onclick="openTab('Access Requests')">Request Access</button></div></div><div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">Students</div><div class="kpi-value">${students().length}</div></div><div class="kpi-card"><div class="kpi-label">Tutors</div><div class="kpi-value">${tutors().length}</div></div><div class="kpi-card"><div class="kpi-label">Sessions Today</div><div class="kpi-value">${today.length}</div></div><div class="kpi-card"><div class="kpi-label">Revenue This Month</div><div class="kpi-value">${money(month.reduce((s,b)=>s+total(b),0))}</div></div><div class="kpi-card"><div class="kpi-label">Pending Requests</div><div class="kpi-value">${req.length}</div></div><div class="kpi-card"><div class="kpi-label">Unpaid</div><div class="kpi-value">${money(unpaid(bs))}</div></div></div>${adminRequestDashboardSection(req)}`}

function announcementsPage(){if(profile.role==="admin"){$("content").innerHTML=`<div class="card"><h2>Announcements</h2><div class="row"><input id="annTitle" placeholder="Title"><select id="annAudience"><option value="everyone">Everyone</option><option value="student">Students</option><option value="tutor">Tutors</option></select></div><textarea id="annMessage" placeholder="Announcement message"></textarea><button onclick="sendAnnouncement()">Send Announcement</button></div><div class="card"><h2>Previous Announcements</h2>${list(DATA.announcements||{}).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(a=>`<div class="announcement-card"><b>${a.title}</b><p>${a.message}</p><span class="muted">${a.audience}</span></div>`).join("")||"<p class='muted'>None yet.</p>"}</div>`}else{$("content").innerHTML=`<div class="card"><h2>Announcements</h2>${getAnnouncementsForRole().map(a=>`<div class="announcement-card"><b>${a.title}</b><p>${a.message}</p></div>`).join("")||"<p class='muted'>No announcements yet.</p>"}</div>`}}
async function sendAnnouncement(){const title=$("annTitle").value.trim(),message=$("annMessage").value.trim(),audience=$("annAudience").value;if(!title||!message)return alert("Fill title and message.");await db.ref("announcements").push({title,message,audience,createdAt:Date.now(),createdBy:currentUser.uid});await createNotification(audience,title,message);await loadData();announcementsPage()}
function statsPage(){const b=myBookings();if(profile.role==="student"){$("content").innerHTML=`<div class="card"><h2>My Statistics</h2><div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">Total Hours Studied</div><div class="kpi-value">${totalHours(b)}</div></div><div class="kpi-card"><div class="kpi-label">Sessions Completed</div><div class="kpi-value">${b.filter(x=>x.done).length}</div></div><div class="kpi-card"><div class="kpi-label">Upcoming Sessions</div><div class="kpi-value">${b.filter(x=>!x.done).length}</div></div><div class="kpi-card"><div class="kpi-label">Number of Tutors</div><div class="kpi-value">${studentTutors(currentUser.uid).length}</div></div></div></div>`}else{$("content").innerHTML=`<div class="card"><h2>Tutor Statistics</h2><div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">Total Students</div><div class="kpi-value">${[...new Set(b.map(x=>x.studentId))].length}</div></div><div class="kpi-card"><div class="kpi-label">Total Sessions</div><div class="kpi-value">${b.length}</div></div><div class="kpi-card"><div class="kpi-label">Hours Taught</div><div class="kpi-value">${totalHours(b)}</div></div><div class="kpi-card"><div class="kpi-label">Average Rating</div><div class="kpi-value">${avgRating(currentUser.uid)}</div></div></div></div>`}}
function reviewsPage(){if(profile.role==="tutor"){const rs=getReviewsForTutor(currentUser.uid);$("content").innerHTML=`<div class="card"><h2>My Reviews</h2><div class="kpi-card"><div class="kpi-label">Average Rating</div><div class="kpi-value">${avgRating(currentUser.uid)}</div></div>${rs.map(r=>`<div class="timeline-item"><b>${"★".repeat(Number(r.rating||0))}${"☆".repeat(5-Number(r.rating||0))}</b><p>${r.text||""}</p></div>`).join("")||"<p class='muted'>No reviews yet.</p>"}</div>`}else{const completed=myBookings().filter(b=>b.done);$("content").innerHTML=`<div class="card"><h2>Leave a Review</h2>${completed.map(b=>`<div class="timeline-item"><b>${user(b.tutorId).name||""} • ${b.course}</b><br>${b.date}<br><button onclick="reviewBooking('${b.id}')">Review</button></div>`).join("")||"<p class='muted'>No completed sessions yet.</p>"}</div>`}}
async function reviewBooking(id){const b=DATA.bookings[id];if(!b)return;const rating=Number(prompt("Rating from 1 to 5:","5")||0);if(!rating||rating<1||rating>5)return alert("Rating must be 1 to 5.");const text=prompt("Written review:","")||"";await db.ref("reviews").push({bookingId:id,tutorId:b.tutorId,studentId:currentUser.uid,course:b.course,rating,text,createdAt:Date.now()});await createNotification("tutor","New Review",`You received a ${rating}-star review.`,b.tutorId);await loadData();reviewsPage()}
function favoritesPage(){const ids=Array.isArray(profile.favoriteTutorIds)?profile.favoriteTutorIds:[],favs=ids.map(id=>({id,...user(id)})).filter(t=>t.role==="tutor");$("content").innerHTML=`<div class="card"><h2>Favorite Tutors</h2>${favs.length?`<div class="grid">${favs.map(t=>`<div class="card"><h3>${t.name}</h3><p>${t.university||""}<br>${(t.courses||[]).join(", ")}</p><button onclick="bookWithTutor('${t.id}')">Book Now</button><button class="ghost" onclick="toggleFavoriteTutor('${t.id}')">Remove Favorite</button></div>`).join("")}</div>`:"<p class='muted'>No favorite tutors yet.</p>"}</div>`}
function emergencySessionsPage(){const today=todayISO();const available=tutors().filter(t=>(t.courses||[]).some(c=>dayHasAvailable(t.id,today,c)));$("content").innerHTML=`<div class="card"><h2>⚡ Emergency Sessions Today</h2><p class="muted">Tutors with availability today.</p>${available.length?`<div class="grid">${available.map(t=>`<div class="card"><span class="emergency-badge">Available today</span><h3>${t.name}</h3><p>${t.university||""}<br>${(t.courses||[]).join(", ")}</p><button onclick="bookWithTutor('${t.id}')">Book Now</button></div>`).join("")}</div>`:"<p class='muted'>No emergency slots available today.</p>"}</div>`}
function studentProfilePage(){$("content").innerHTML=`<div class="profile-section"><h2>Student Profile</h2><p><b>Name:</b> ${profile.name||""}</p><p><b>Email:</b> ${profile.email||""}</p><p><b>Phone:</b> ${profile.phone||""}</p><p><b>University:</b> ${profile.university||""}</p><p><b>Major:</b> ${profile.major||"Not specified"}</p><p><b>Year:</b> ${profile.year||"Not specified"}</p><p><b>Assigned Courses:</b> ${assignedCourseBadges(currentUser.uid)}</p><p><b>Assigned Tutors:</b> ${assignedTutorNames(currentUser.uid)||"None"}</p></div>`}


/* ===== v5.6 stable post-v5.0 additions ===== */
function v56List(obj){return Object.entries(obj||{}).map(([id,v])=>({id,...v}))}

function v56MotivationQuotes(){
  const custom=v56List(DATA.motivationQuotes||{}).map(q=>q.text).filter(Boolean);
  if(custom.length)return custom;
  if(typeof MOTIVATION_QUOTES!=="undefined")return MOTIVATION_QUOTES;
  return [
    "Small progress is still progress — show up today.",
    "Your future self is built by what you do now.",
    "One focused session can change your whole week.",
    "Consistency beats intensity when exams get close."
  ];
}
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



/* =========================================================
   Scheduled v9.2: Booking / Availability / Payments / Chat
   Built from v6.7 base only
========================================================= */
const S92_BOOKING = {
  tutorId:"",
  course:"",
  sessionType:"Online",
  duration:1,
  monthOffset:0,
  date:"",
  time:"",
  paymentMethod:"Whish"
};
let S92_CHAT_ACTIVE = "";

function s92List(obj){ return Object.entries(obj||{}).map(([id,v])=>({id,...v})); }
function s92Empty(icon,title,body){ return typeof v74Empty==="function" ? v74Empty(icon,title,body) : `<div class="empty-state"><div class="emoji">${icon}</div><h3>${title}</h3><p class="muted">${body}</p></div>`; }
function s92Money(x){ return typeof money==="function" ? money(x) : "$"+Number(x||0).toFixed(2); }
function s92Today(){ const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; }
function s92NowMinutes(){ const n=new Date(); return n.getHours()*60+n.getMinutes(); }
function s92ISODate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function s92MonthDate(offset=0){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+offset); return d; }
function s92MonthTitle(offset=0){ return s92MonthDate(offset).toLocaleDateString(undefined,{month:"long",year:"numeric"}); }
function s92TimeToMin(t){
  if(!t)return null;
  let s=String(t).trim();
  const ap=s.match(/\b(AM|PM)\b/i);
  s=s.replace(/\b(AM|PM)\b/i,"").trim();
  let h=0,m=0;
  if(s.includes(":")){
    const p=s.split(":");
    h=parseInt(p[0]||"0",10);
    m=parseInt(p[1]||"0",10);
  }else{
    h=parseInt(s||"0",10);
  }
  if(isNaN(h))return null;
  if(isNaN(m))m=0;
  if(ap){
    const tag=ap[1].toUpperCase();
    if(tag==="PM"&&h<12)h+=12;
    if(tag==="AM"&&h===12)h=0;
  }
  return h*60+m;
}
function s92MinToTime(min){ return `${String(Math.floor(min/60)).padStart(2,"0")}:${String(min%60).padStart(2,"0")}`; }
function s92FormatTime(t){
  if(typeof formatTime12==="function")return formatTime12(t);
  const mins=s92TimeToMin(t);
  if(mins===null)return t||"";
  let h=Math.floor(mins/60), m=mins%60;
  const ap=h>=12?"PM":"AM";
  h=h%12||12;
  return `${h}:${String(m).padStart(2,"0")} ${ap}`;
}
function s92DatePast(date){ return String(date||"") < s92Today(); }
function s92SlotExpired(date,time){
  if(!date)return false;
  if(s92DatePast(date))return true;
  if(String(date)>s92Today())return false;
  const mins=s92TimeToMin(time);
  return mins!==null && mins<=s92NowMinutes();
}
function s92EndTime(start,duration){
  const s=s92TimeToMin(start);
  if(s===null)return "";
  return s92MinToTime(s + Number(duration||1)*60);
}
function s92RangesOverlap(aStart,aEnd,bStart,bEnd){ return aStart < bEnd && bStart < aEnd; }
function s92TypeText(type){ return String(type||"").toLowerCase().includes("campus") ? "On Campus" : "Online"; }
function s92OppositeType(type){ return s92TypeText(type)==="Online" ? "On Campus" : "Online"; }

function s92Tutors(){
  if(typeof tutors==="function")return tutors().filter(t=>!t.removed&&!t.hiddenFromBookings);
  return s92List(DATA.users||{}).filter(u=>u.role==="tutor"&&!u.removed&&!u.hiddenFromBookings);
}
function s92Courses(){
  if(typeof courses==="function")return courses();
  return s92List(DATA.courses||{});
}
function s92TutorCourses(tutor){
  const ids=Array.isArray(tutor?.courses)?tutor.courses:[];
  const all=s92Courses();
  const out=ids.map(id=>{
    const c=all.find(x=>x.id===id||x.code===id||x.name===id);
    return c?.name||c?.code||id;
  }).filter(Boolean);
  return out.length?out:["General Tutoring"];
}
function s92SelectedTutor(){ return user(S92_BOOKING.tutorId)||s92Tutors()[0]||{}; }
function s92SelectedCourse(){
  const tutor=s92SelectedTutor();
  return S92_BOOKING.course || s92TutorCourses(tutor)[0] || "General Tutoring";
}
function s92Total(){ return Number(s92SelectedTutor().rate||0)*Number(S92_BOOKING.duration||1); }

function s92AvailabilityRows(tutorId){
  return s92List(DATA.availability||{}).filter(a=>a.tutorId===tutorId || a.uid===tutorId || a.userId===tutorId);
}

function s92RowTypeMatches(row,type){
  return s93RowMatchesExactType(row,type);
}


function s92RowDateMatches(row,date){
  const d=row.date||row.day||row.availableDate||row.slotDate||"";
  if(!d)return true;
  return d===date;
}

function s92BaseSlotsFromRows(tutorId,date,type){
  return s93BaseSlotsFromRows(tutorId,date,type).map(s=>s.time);
}


function s92BookedRanges(tutorId,date){
  return s92List(DATA.bookings||{}).filter(b=>b.tutorId===tutorId && b.date===date).map(b=>{
    const s=s92TimeToMin(b.start||b.time);
    return {start:s,end:s+Number(b.duration||1)*60,id:b.id};
  }).filter(r=>r.start!==null && !isNaN(r.end));
}

function s92SlotAvailableForDuration(tutorId,date,start,duration,type){
  return s93SlotAvailableForDuration(tutorId,date,start,duration,type);
}



function s92AvailableStarts(tutorId,date,type,duration){
  return s93AvailableStarts(tutorId,date,type,duration);
}



function s92DateHasSlots(tutorId,date,type,duration){
  return s93DateHasSlots(tutorId,date,type,duration);
}



function s92AvailabilityMessage(){
  return s93OppositeAvailabilityMessage();
}



function s92RenderBookingPanel(){
  const tutorList=s92Tutors();
  if(!S92_BOOKING.tutorId && tutorList[0])S92_BOOKING.tutorId=tutorList[0].id;
  const tutor=s92SelectedTutor();
  const courseList=s92TutorCourses(tutor);
  if(!S92_BOOKING.course)S92_BOOKING.course=courseList[0]||"General Tutoring";
  return `<div class="s92-card">
    <h2>Book a Session</h2>
    <label>Tutor</label>
    <select onchange="s92SelectTutor(this.value)">${tutorList.map(t=>`<option value="${t.id}" ${S92_BOOKING.tutorId===t.id?"selected":""}>${t.name||t.email}</option>`).join("")}</select>
    <label>Course</label>
    <select onchange="S92_BOOKING.course=this.value;s92RenderBookingPage();">${courseList.map(c=>`<option value="${c}" ${s92SelectedCourse()===c?"selected":""}>${c}</option>`).join("")}</select>
    <label>Session Type</label>
    <div class="s92-segment">
      <button type="button" class="${S92_BOOKING.sessionType==="Online"?"active":""}" onclick="S92_BOOKING.sessionType='Online';S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage()">💻 Online</button>
      <button type="button" class="${S92_BOOKING.sessionType==="On Campus"?"active":""}" onclick="S92_BOOKING.sessionType='On Campus';S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage()">🏫 On Campus</button>
    </div>
    <label>Duration</label>
    <select onchange="S92_BOOKING.duration=Number(this.value);S92_BOOKING.time='';s92RenderBookingPage();"><option value="1" ${S92_BOOKING.duration==1?"selected":""}>1 hour</option><option value="1.5" ${S92_BOOKING.duration==1.5?"selected":""}>1.5 hours</option><option value="2" ${S92_BOOKING.duration==2?"selected":""}>2 hours</option><option value="3" ${S92_BOOKING.duration==3?"selected":""}>3 hours</option></select>
    <label>Payment</label>
    <select disabled><option>Whish</option></select>
  </div>`;
}
function s92RenderCalendar(){
  const d=s92MonthDate(S92_BOOKING.monthOffset);
  const year=d.getFullYear(), month=d.getMonth();
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const cells=[];
  for(let i=0;i<first.getDay();i++)cells.push(`<div class="s92-day blank"></div>`);
  for(let day=1;day<=last.getDate();day++){
    const iso=s92ISODate(new Date(year,month,day));
    const expired=s92DatePast(iso);
    const has=s92DateHasSlots(S92_BOOKING.tutorId,iso,S92_BOOKING.sessionType,S92_BOOKING.duration);
    const cls=expired?"expired":(has?"available":"unavailable");
    cells.push(`<button type="button" class="s92-day ${cls} ${S92_BOOKING.date===iso?"selected":""}" ${(!has||expired)?"disabled":""} onclick="s92SelectDate('${iso}')">${day}</button>`);
  }
  return `<div class="s92-card">
    <div class="s92-calendar-head"><button onclick="S92_BOOKING.monthOffset--;S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage()">‹</button><h2>${s92MonthTitle(S92_BOOKING.monthOffset)}</h2><button onclick="S92_BOOKING.monthOffset++;S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage()">›</button></div>
    <div class="s92-calendar-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<div class="s92-weekday">${x}</div>`).join("")}${cells.join("")}</div>
    <div class="s92-legend"><span><i class="s92-dot green"></i>Available</span><span><i class="s92-dot red"></i>Unavailable</span><span><i class="s92-dot gray"></i>Expired</span></div>
  </div>`;
}
function s92RenderTimes(){
  if(!S92_BOOKING.date)return `<div class="s92-card">${s92Empty("⏰","Choose a date","Available times will appear here.")}</div>`;
  const times=s92AvailableStarts(S92_BOOKING.tutorId,S92_BOOKING.date,S92_BOOKING.sessionType,S92_BOOKING.duration);
  return `<div class="s92-card">
    <div class="section-title-row"><h2>Available Times</h2><span class="muted">All compatible slots are shown.</span></div>
    ${s92AvailabilityMessage()}
    <div class="s92-time-grid">${times.length?times.map(t=>`<button class="s92-time ${S92_BOOKING.time===t?"selected":""}" onclick="s92SelectTime('${t}')">${s92FormatTime(t)}</button>`).join(""):s92Empty("⏰","No available times","Try another date, duration, or session type.")}</div>
  </div>`;
}
function s92RenderSummary(){
  const tutor=s92SelectedTutor();
  const start=S92_BOOKING.time;
  const end=start?s92EndTime(start,S92_BOOKING.duration):"";
  return `<div class="s92-card"><h2>Booking Summary</h2><div class="s92-summary">
    <div class="s92-summary-row"><b>Tutor</b><span>${tutor.name||""}</span></div>
    <div class="s92-summary-row"><b>Course</b><span>${s92SelectedCourse()}</span></div>
    <div class="s92-summary-row"><b>Type</b><span>${S92_BOOKING.sessionType}</span></div>
    <div class="s92-summary-row"><b>Date</b><span>${S92_BOOKING.date||"Select date"}</span></div>
    <div class="s92-summary-row"><b>Time</b><span>${start?`${s92FormatTime(start)} → ${s92FormatTime(end)}`:"Select time"}</span></div>
    <div class="s92-summary-row"><b>Duration</b><span>${S92_BOOKING.duration} hour(s)</span></div>
    <div class="s92-summary-row"><b>Rate</b><span>${s92Money(tutor.rate||0)}/hour</span></div>
    <div class="s92-summary-row"><b>Total</b><span>${s92Money(s92Total())}</span></div>
    <div class="s92-summary-row"><b>Payment</b><span>Whish</span></div>
    </div><button style="margin-top:14px;width:100%" onclick="confirmBooking()">Confirm Booking</button></div>`;
}
function s92RenderBookingPage(){
  const c=document.getElementById("content"); if(!c)return;
  c.innerHTML=`<div class="s92-booking-shell"><div>${s92RenderBookingPanel()}${s92RenderSummary()}</div><div>${s92RenderCalendar()}</div><div>${s92RenderTimes()}</div></div>`;
}
function s92SelectTutor(id){ S92_BOOKING.tutorId=id; S92_BOOKING.course=""; S92_BOOKING.date=""; S92_BOOKING.time=""; s92RenderBookingPage(); }
function s92SelectDate(date){ if(s92DatePast(date))return alert("This date has already passed."); S92_BOOKING.date=date; S92_BOOKING.time=""; s92RenderBookingPage(); }
function s92SelectTime(t){ if(!s92SlotAvailableForDuration(S92_BOOKING.tutorId,S92_BOOKING.date,t,S92_BOOKING.duration,S92_BOOKING.sessionType))return alert("This time is no longer available."); S92_BOOKING.time=t; s92RenderBookingPage(); }
function bookingPage(){ s92RenderBookingPage(); }
function s92WhatsappUrl(b){
  const tutor=user(b.tutorId)||{}, student=user(b.studentId)||profile;
  const phone=String(tutor.whatsapp||tutor.phone||"").replace(/[^\d+]/g,"");
  const total=Number(tutor.rate||0)*Number(b.duration||1);
  const text=["Hello, I booked a tutoring session on Scheduled.","",`Student: ${student?.name||""}`,`Tutor: ${tutor.name||""}`,`Course: ${b.course||""}`,`University: ${student?.university||profile?.university||""}`,`Date: ${b.date||""}`,`Time: ${s92FormatTime(b.start||"")}`,`Duration: ${b.duration||""} hour(s)`,`Session type: ${b.sessionType||""}`,`Rate: ${s92Money(tutor.rate||0)}`,`Total: ${s92Money(total)}`,"Payment method: Whish","","Please confirm this session."].join("\n");
  return phone?`https://wa.me/${phone}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`;
}
function s92Confirmation(id){
  const b=(DATA.bookings||{})[id]||{}, tutor=user(b.tutorId)||{}, student=user(b.studentId)||profile;
  return `<div class="s92-card"><h2>Booking Confirmed ✅</h2><p>Your tutoring session has been successfully booked.<br>Please send the following information via WhatsApp for your tutor to confirm.</p><div class="s92-summary"><b>${b.course||"Session"}</b><br>Student: ${student?.name||""}<br>Tutor: ${tutor.name||""}<br>University: ${student?.university||profile?.university||""}<br>Date: ${b.date||""}<br>Time: ${s92FormatTime(b.start||"")} → ${s92FormatTime(s92EndTime(b.start,b.duration))}<br>Duration: ${b.duration||""} hour(s)<br>Session type: ${b.sessionType||""}<br>Rate: ${s92Money(tutor.rate||0)}<br>Total: ${s92Money(Number(tutor.rate||0)*Number(b.duration||1))}<br>Payment method: Whish</div><div class="s92-confirm-actions"><a class="button" target="_blank" href="${s92WhatsappUrl(b)}">Final Confirmation with Tutor on WhatsApp</a></div></div>`;
}
async function confirmBooking(){
  try{
    await loadData();
    if(!S92_BOOKING.tutorId)return alert("Please choose a tutor.");
    if(!S92_BOOKING.date)return alert("Please choose a date.");
    if(!S92_BOOKING.time)return alert("Please choose a time.");
    if(!s92SlotAvailableForDuration(S92_BOOKING.tutorId,S92_BOOKING.date,S92_BOOKING.time,S92_BOOKING.duration,S92_BOOKING.sessionType))return alert("This time is no longer available.");
    const booking={studentId:currentUser.uid,tutorId:S92_BOOKING.tutorId,availabilityId:s93AvailabilityIdForBooking(S92_BOOKING.tutorId,S92_BOOKING.date,S92_BOOKING.time,S92_BOOKING.duration,S92_BOOKING.sessionType),course:s92SelectedCourse(),date:S92_BOOKING.date,start:S92_BOOKING.time,duration:Number(S92_BOOKING.duration||1),sessionType:S92_BOOKING.sessionType,paymentMethod:"Whish",paid:false,status:"confirmed",done:false,createdAt:Date.now(),autoAssigned:true};
    const ref=await db.ref("bookings").push(booking);
    await autoAssignStudentFromBooking(currentUser.uid,S92_BOOKING.tutorId,booking.course);
    await loadData();
    if(typeof checkMilestonesAfterBooking==="function")await checkMilestonesAfterBooking();
    document.getElementById("content").innerHTML=s92Confirmation(ref.key);
  }catch(e){console.error(e);alert("Booking could not be confirmed. Please try again.");}
}

setInterval(()=>{ if(document.getElementById("content")?.querySelector(".s92-booking-shell"))s92RenderBookingPage(); },60000);

/* Payments */
function s92CanEditPayment(b){ if(!profile)return false; if(profile.role==="admin")return true; return profile.role==="tutor" && b.tutorId===currentUser.uid; }
function s92PaymentBadge(b){ return `<span class="status-badge ${b.paid?"s92-paid":"s92-unpaid"}">${b.paid?"Paid":"Unpaid"}</span>`; }
function s92StudentPaymentsPage(){
  const rows=s92List(DATA.bookings||{}).filter(b=>b.studentId===currentUser.uid).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  document.getElementById("content").innerHTML=`<div class="s92-card"><h2>Payments</h2><div class="s92-payment-note">You can view payment status here. Only your assigned tutor or admin can update it.</div>${rows.length?rows.map(b=>`<div class="s92-payment-card"><b>${b.course||"Session"}</b><br>${b.date||""} • ${s92FormatTime(b.start||b.time||"")}<br>Tutor: ${(user(b.tutorId)||{}).name||""}<br>Payment method: Whish<br>Status: ${s92PaymentBadge(b)}</div>`).join(""):s92Empty("💵","No payments yet","Your booked sessions will appear here.")}</div>`;
}
async function markPayment(id,paid){ const b=(DATA.bookings||{})[id]||{}; if(!s92CanEditPayment(b))return alert("Only the assigned tutor or admin can update payment status."); await db.ref("bookings/"+id+"/paid").set(!!paid); await loadData(); if(profile.role==="student")return s92StudentPaymentsPage(); if(typeof financialPage==="function")financialPage(); }
async function togglePayment(id){ const b=(DATA.bookings||{})[id]||{}; if(!s92CanEditPayment(b))return alert("Only the assigned tutor or admin can update payment status."); await db.ref("bookings/"+id+"/paid").set(!b.paid); await loadData(); if(profile.role==="student")return s92StudentPaymentsPage(); if(typeof financialPage==="function")financialPage(); }
setInterval(()=>{ if(profile?.role==="student" && document.getElementById("content")?.textContent?.includes("Payments"))loadData().then(()=>s92StudentPaymentsPage()).catch(()=>{}); },60000);

/* Internal Chat */
function s92ChatTargets(){
  const users=s92List(DATA.users||{}).filter(u=>!u.removed);
  if(profile.role==="student"){
    const ids=Array.isArray(profile.assignedTutorIds)?profile.assignedTutorIds:(Array.isArray(profile.tutorIds)?profile.tutorIds:[]);
    return users.filter(u=>u.role==="tutor"&&ids.includes(u.id));
  }
  if(profile.role==="tutor"){
    return users.filter(u=>u.role==="student"&&((Array.isArray(u.assignedTutorIds)&&u.assignedTutorIds.includes(currentUser.uid))||(Array.isArray(u.tutorIds)&&u.tutorIds.includes(currentUser.uid))));
  }
  if(profile.role==="admin")return users.filter(u=>u.role==="student"||u.role==="tutor");
  return [];
}
function s92ChatId(a,b){ return [a,b].sort().join("_"); }
function s92UnreadCount(){
  const uid=currentUser?.uid; if(!uid)return 0; let n=0;
  s92List(DATA.chats||{}).forEach(c=>{ if(c.participants?.[uid])s92List(c.messages||{}).forEach(m=>{ if(m.to===uid&&!m.read)n++; }); });
  return n;
}
function injectChatButton(){
  const old=document.getElementById("s92ChatButton"); if(old)old.remove();
  if(!profile||!currentUser)return;
  const b=document.createElement("button"); b.id="s92ChatButton"; b.className="s92-chat-button"; b.innerHTML=`💬${s92UnreadCount()?`<span class="s92-chat-badge">${s92UnreadCount()}</span>`:""}`; b.onclick=openChatPanel; document.body.appendChild(b);
}
function openChatPanel(){
  const old=document.getElementById("s92ChatPanel"); if(old){old.remove();return;}
  const panel=document.createElement("div"); panel.id="s92ChatPanel"; panel.className="s92-chat-panel";
  const targets=s92ChatTargets();
  panel.innerHTML=`<div class="s92-chat-list"><div class="section-title-row"><h3>Chat</h3><button class="ghost" onclick="openChatPanel()">Close</button></div><input placeholder="Search..." oninput="s92FilterChatTargets(this.value)">${profile.role==="tutor"?`<button class="ghost s92-chat-target" onclick="s92BroadcastComposer()">Message All Students</button>`:""}<div id="s92TargetList">${targets.map(t=>`<button class="s92-chat-target" data-name="${(t.name||t.email||"").toLowerCase()}" onclick="openChatWith('${t.id}')"><b>${t.name||t.email}</b><br><span class="muted">${t.role}</span></button>`).join("")||"<p class='muted'>No conversations available.</p>"}</div></div><div class="s92-chat-main" id="s92ChatMain">${s92Empty("💬","Choose a conversation","Select a person from the list.")}</div>`;
  document.body.appendChild(panel);
}
function s92FilterChatTargets(q){ document.querySelectorAll("#s92TargetList .s92-chat-target").forEach(b=>{b.style.display=(b.dataset.name||"").includes(String(q||"").toLowerCase())?"block":"none";}); }
function openChatWith(otherId){
  S92_CHAT_ACTIVE=otherId;
  const main=document.getElementById("s92ChatMain"); if(!main)return;
  const other=user(otherId)||{}, cid=s92ChatId(currentUser.uid,otherId);
  const msgs=s92List((DATA.chats||{})[cid]?.messages||{}).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  main.innerHTML=`<h3>${other.name||other.email||"Chat"}</h3><div class="s92-message-list" id="s92MsgList">${msgs.map(m=>`<div class="s92-msg ${m.from===currentUser.uid?"me":"them"}">${m.text||""}<br><span class="muted small">${new Date(m.createdAt||Date.now()).toLocaleString()} ${m.read?"✓✓":"✓"}</span></div>`).join("")||s92Empty("💬","No messages yet","Start the conversation.")}</div><div class="s92-chat-composer"><input id="s92ChatInput" placeholder="Write a message... 😊"><button onclick="sendChatMessage('${otherId}')">Send</button></div>`;
  const box=document.getElementById("s92MsgList"); if(box)box.scrollTop=box.scrollHeight;
  s92MarkChatRead(cid);
}
async function s92MarkChatRead(cid){
  const msgs=(DATA.chats||{})[cid]?.messages||{};
  for(const [id,m] of Object.entries(msgs)){ if(m.to===currentUser.uid&&!m.read)await db.ref("chats/"+cid+"/messages/"+id+"/read").set(true); }
  await loadData(); injectChatButton();
}
async function sendChatMessage(otherId){
  const input=document.getElementById("s92ChatInput"); const text=(input?.value||"").trim(); if(!text)return;
  const cid=s92ChatId(currentUser.uid,otherId);
  await db.ref("chats/"+cid+"/participants").set({[currentUser.uid]:true,[otherId]:true});
  await db.ref("chats/"+cid+"/messages").push({from:currentUser.uid,to:otherId,text,read:false,createdAt:Date.now()});
  await loadData(); openChatWith(otherId); injectChatButton();
}
function s92BroadcastComposer(){
  const main=document.getElementById("s92ChatMain"); if(!main)return;
  main.innerHTML=`<h3>Message All Assigned Students</h3><textarea id="s92BroadcastText" placeholder="Write announcement..."></textarea><button onclick="s92SendBroadcast()">Send to All</button>`;
}
async function s92SendBroadcast(){
  const text=(document.getElementById("s92BroadcastText")?.value||"").trim(); if(!text)return;
  const targets=s92ChatTargets().filter(t=>t.role==="student");
  for(const t of targets){
    const cid=s92ChatId(currentUser.uid,t.id);
    await db.ref("chats/"+cid+"/participants").set({[currentUser.uid]:true,[t.id]:true});
    await db.ref("chats/"+cid+"/messages").push({from:currentUser.uid,to:t.id,text,read:false,createdAt:Date.now(),broadcast:true});
  }
  await loadData(); alert("Message sent."); injectChatButton();
}
setInterval(()=>{ if(currentUser&&profile)loadData().then(()=>{injectChatButton(); if(S92_CHAT_ACTIVE&&document.getElementById("s92ChatMain"))openChatWith(S92_CHAT_ACTIVE);}).catch(()=>{}); },10000);



/* ===== Scheduled v9.3: exact availability-block engine ===== */
function s93NormalizeTypeLabel(type){
  const s=String(type||"").toLowerCase().trim();
  if(s.includes("campus") || s.includes("on campus") || s.includes("in person") || s.includes("in-person") || s.includes("offline")) return "On Campus";
  if(s.includes("online") || s.includes("zoom") || s.includes("teams") || s.includes("remote")) return "Online";
  return "";
}

function s93AvailabilityType(row){
  return s94AvailabilityTypes(row);
}



function s93RowMatchesExactType(row,type){
  return s94RowMatchesExactType(row,type);
}


function s93AvailabilityBlockId(row){
  return row.id || row.availabilityId || row.blockId || row.key || "";
}
function s93RowsForType(tutorId,date,type){
  return s92AvailabilityRows(tutorId).filter(row=>s92RowDateMatches(row,date) && s93RowMatchesExactType(row,type));
}

function s93BaseSlotsFromRows(tutorId,date,type){
  return s94BaseSlotsFromRows(tutorId,date,type);
}


function s93BookedRanges(tutorId,date){
  return s92List(DATA.bookings||{}).filter(b=>b.tutorId===tutorId && b.date===date).map(b=>{
    const s=s92TimeToMin(b.start||b.time);
    return {
      start:s,
      end:s + Number(b.duration||1)*60,
      id:b.id,
      availabilityId:b.availabilityId||"",
      sessionType:s93NormalizeTypeLabel(b.sessionType||"")
    };
  }).filter(r=>r.start!==null && !isNaN(r.end));
}
function s93SlotAvailableForDuration(tutorId,date,start,duration,type){
  if(s92SlotExpired(date,start)) return false;
  const wantedType=s93NormalizeTypeLabel(type);
  const startMin=s92TimeToMin(start);
  if(startMin===null) return false;
  const endMin=startMin + Number(duration||1)*60;
  const base=s93BaseSlotsFromRows(tutorId,date,wantedType);
  const baseMinutes=base.map(s=>s92TimeToMin(s.time)).filter(x=>x!==null);
  const step=60;
  for(let m=startMin; m<endMin; m+=step){
    if(!baseMinutes.includes(m)) return false;
  }
  const booked=s93BookedRanges(tutorId,date);
  if(booked.some(r=>s92RangesOverlap(startMin,endMin,r.start,r.end))) return false;
  return true;
}
function s93AvailableStarts(tutorId,date,type,duration){
  const seen=new Set();
  return s93BaseSlotsFromRows(tutorId,date,type)
    .filter(s=>!seen.has(s.time) && seen.add(s.time))
    .filter(s=>s93SlotAvailableForDuration(tutorId,date,s.time,duration,type))
    .map(s=>s.time);
}
function s93AvailabilityIdForBooking(tutorId,date,start,duration,type){
  const base=s93BaseSlotsFromRows(tutorId,date,type);
  const row=base.find(s=>s.time===start);
  return row?.availabilityId || "";
}
function s93DateHasSlots(tutorId,date,type,duration){
  if(s92DatePast(date)) return false;
  return s93AvailableStarts(tutorId,date,type,duration).length>0;
}
function s93OppositeAvailabilityMessage(){
  if(!S92_BOOKING.date) return "";
  const chosen=s93AvailableStarts(S92_BOOKING.tutorId,S92_BOOKING.date,S92_BOOKING.sessionType,S92_BOOKING.duration);
  if(chosen.length) return "";
  const opposite=s92OppositeType(S92_BOOKING.sessionType);
  const oppositeSlots=s93AvailableStarts(S92_BOOKING.tutorId,S92_BOOKING.date,opposite,S92_BOOKING.duration);
  if(oppositeSlots.length){
    const icon=opposite==="Online" ? "💻" : "🏫";
    return `<div class="s93-type-warning"><b>${icon} Availability note:</b><br>This tutor is available ${opposite.toLowerCase()} on this day, not ${S92_BOOKING.sessionType.toLowerCase()}.<br><button onclick="S92_BOOKING.sessionType='${opposite}';S92_BOOKING.time='';s92RenderBookingPage()">Switch to ${opposite}</button></div>`;
  }
  return `<div class="s93-type-warning"><b>No matching availability:</b><br>This day has no remaining ${S92_BOOKING.sessionType.toLowerCase()} availability for the selected duration.</div>`;
}



/* ===== Scheduled v9.4: availability type compatibility fix ===== */
function s94TruthValue(v){
  if(v===true || v==="true" || v==="yes" || v==="1" || v===1) return true;
  return false;
}
function s94AvailabilityTypes(row){
  const types = [];

  // Explicit string fields used by newer blocks
  const explicit = row.sessionType ?? row.type ?? row.mode ?? row.availabilityType ?? row.locationType ?? row.format ?? row.sessionMode ?? row.teachingMode ?? "";
  if(Array.isArray(explicit)){
    explicit.forEach(x=>{
      const n=s93NormalizeTypeLabel(x);
      if(n)types.push(n);
    });
  }else{
    const text=String(explicit||"").toLowerCase();
    if(text.includes("online") || text.includes("zoom") || text.includes("teams") || text.includes("remote")) types.push("Online");
    if(text.includes("campus") || text.includes("on campus") || text.includes("in person") || text.includes("in-person") || text.includes("offline")) types.push("On Campus");
  }

  // Boolean fields often used in simple Firebase forms
  if(s94TruthValue(row.online) || s94TruthValue(row.isOnline) || s94TruthValue(row.availableOnline) || s94TruthValue(row.onlineAvailable)) types.push("Online");
  if(s94TruthValue(row.campus) || s94TruthValue(row.onCampus) || s94TruthValue(row.isCampus) || s94TruthValue(row.availableCampus) || s94TruthValue(row.campusAvailable)) types.push("On Campus");

  // Array fields
  const arrays = [row.types, row.sessionTypes, row.modes, row.locations, row.formats].filter(Array.isArray);
  arrays.forEach(arr=>arr.forEach(x=>{
    const n=s93NormalizeTypeLabel(x);
    if(n)types.push(n);
  }));

  // Slot-level type support: if any slot mentions a type, the row supports that type for those slots.
  if(Array.isArray(row.slots)){
    row.slots.forEach(s=>{
      if(s && typeof s==="object"){
        const n=s93NormalizeTypeLabel(s.sessionType||s.type||s.mode||s.location||s.format||"");
        if(n)types.push(n);
        if(s94TruthValue(s.online))types.push("Online");
        if(s94TruthValue(s.campus)||s94TruthValue(s.onCampus))types.push("On Campus");
      }
    });
  }

  // Compatibility fallback:
  // If an old availability block has NO type information at all, treat it as Online only.
  // This prevents all existing dates from disappearing while still avoiding Online showing as Campus.
  if(!types.length) types.push("Online");

  return [...new Set(types)];
}
function s94RowMatchesExactType(row,type){
  return s94AvailabilityTypes(row).includes(s93NormalizeTypeLabel(type));
}
function s94SlotMatchesType(slot,row,type){
  if(slot && typeof slot==="object"){
    const slotTypes=s94AvailabilityTypes(slot);
    const hasSlotSpecific = !!(slot.sessionType||slot.type||slot.mode||slot.location||slot.format||slot.online||slot.campus||slot.onCampus);
    if(hasSlotSpecific) return slotTypes.includes(s93NormalizeTypeLabel(type));
  }
  return s94RowMatchesExactType(row,type);
}
function s94BaseSlotsFromRows(tutorId,date,type){
  const rows=s92AvailabilityRows(tutorId).filter(row=>s92RowDateMatches(row,date) && s94RowMatchesExactType(row,type));
  let starts=[];
  rows.forEach(r=>{
    const step=Number(r.step||r.interval||60);
    const blockId=s93AvailabilityBlockId(r);
    const addSlot=(raw)=>{
      if(raw && typeof raw==="object"){
        if(!s94SlotMatchesType(raw,r,type)) return;
        const value=raw.start||raw.time||raw.from||raw.value;
        if(value) starts.push({time:value, availabilityId:blockId, row:r});
      }else if(raw){
        starts.push({time:raw, availabilityId:blockId, row:r});
      }
    };
    if(Array.isArray(r.slots)) r.slots.forEach(addSlot);
    else if(Array.isArray(r.times)) r.times.forEach(addSlot);
    else if(r.start && (r.end||r.to)){
      const a=s92TimeToMin(r.start), b=s92TimeToMin(r.end||r.to);
      if(a!==null && b!==null && b>a){
        for(let x=a; x<b; x+=step) starts.push({time:s92MinToTime(x), availabilityId:blockId, row:r});
      }
    }else if(r.start) addSlot(r.start);
    else if(r.time) addSlot(r.time);
    else if(r.from) addSlot(r.from);
  });
  const seen=new Map();
  starts.forEach(s=>{ if(!seen.has(s.time)) seen.set(s.time,s); });
  return [...seen.values()].sort((a,b)=>(s92TimeToMin(a.time)??0)-(s92TimeToMin(b.time)??0));
}

function renderTabs(){let t=profile.role==="admin"?["Dashboard","Tutors","Tutor Profiles","Students","Courses","Access Requests","Calendar","Bookings","Payments","Tutor Reports","Announcements","Motivation Banner","Documents","Export"]:profile.role==="tutor"?["Dashboard","Calendar","Schedule Session","Availability","Schedule","My Students","Payments","Statistics","Reviews","Announcements","Documents","Profile"]:["Dashboard","Book","Emergency","All Tutors","My Tutors","Favorites","My Sessions","Payments","Statistics","Reviews","Announcements","Documents","Student Profile","Profile"];$("tabs").innerHTML=t.map((x,i)=>`<button class="${i===0?'active':''}" onclick="openTab('${x}',this)">${x}</button>`).join("");openTab(t[0],$("tabs button"))}
async function openTab(tab,btn){await loadData(); if(typeof closeMenu==="function")setTimeout(closeMenu,0);document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));if(btn)btn.classList.add("active");const routes={Dashboard:dashboardPage,Overview:adminOverview,Tutors:adminTutors,"Tutor Profiles":publicTutorProfilesPage,Students:adminStudents,Courses:adminCourses,"Access Requests":accessRequestsPage,Calendar:calendarPage,Bookings:()=>bookingsPage(true),Payments:financialPage,"Tutor Reports":adminTutorReportsPage,Announcements:announcementsPage,"Motivation Banner":motivationBannerSettingsPage,Documents:docsPage,Export:exportPage,Schedule:schedulePage,Availability:availabilityPage,"My Students":myStudentsPage,Financial:financialPage,Payments:financialPage,Statistics:statsPage,Reviews:reviewsPage,Announcements:tutorAnnouncementsPage,Profile:profilePage,Book:bookingPage,Emergency:emergencySessionsPage,Favorites:favoritesPage,"Student Profile":studentProfilePage,"All Tutors":allTutorsPage,"My Tutors":myTutorsPage,"My Sessions":()=>bookingsPage(false),Payments:paymentsPage};routes[tab]()}

function adminOverview(){let b=list(DATA.bookings);$("content").innerHTML=`<div class="grid"><div class="card"><h3>Bookings</h3><h1>${b.length}</h1></div><div class="card"><h3>Paid</h3><h1>${money(paid(b))}</h1></div><div class="card"><h3>Unpaid</h3><h1>${money(unpaid(b))}</h1></div><div class="card"><h3>Tutors</h3><h1>${tutors().length}</h1></div></div><div class="card"><h2>Scheduled Admin</h2><p class="muted">Final fixed version active.</p></div>`}

function adminTutors(){
  const ts=tutors();
  $("content").innerHTML=`<div class="card"><h2>Booking Tutor Accounts</h2>
  <p class="admin-note"><b>This tab creates real booking tutor accounts.</b> If the email already exists in Firebase, Scheduled prepares the tutor profile by email and links it automatically when they log in with that same email/password. Public profile photos/descriptions are separate in Tutor Profiles.</p>
  ${ts.length?`<table class="table"><tr><th>Name</th><th>Email</th><th>University</th><th>Rate</th><th>WhatsApp</th><th>Courses</th><th>Actions</th></tr>${ts.map(t=>`<tr><td>${t.name||""}</td><td>${t.email||""}</td><td>${t.university||""}</td><td>${money(t.rate)}/h/person</td><td>${t.whatsapp||""}</td><td>${(t.courses||[]).join(", ")}</td><td><button onclick="editTutor('${t.id}')">Edit</button><button class="danger" onclick="deleteTutor('${t.id}')">Remove Access</button></td></tr>`).join("")}</table>`:`<p class="muted">No booking tutor accounts yet.</p>`}
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
function tempPass(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out="Scheduled-";
  for(let i=0;i<8;i++)out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}
function accessApprovalMessage(r,password){
  return `Hi ${r.name||""}, your Scheduled access request has been approved.

Login link: ${SITE_URL}
Email: ${r.email||""}
Temporary password: ${password}

You can now log in and book your tutoring sessions.`;
}
function showAccessApprovalResult(r,password,msg){
  const phone=phoneForWhatsApp(r.phone||r.whatsapp||"");
  const waUrl=phone?`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`:"";
  const div=document.createElement("div");
  div.className="modal";
  div.innerHTML=`<div class="modal-box"><h2>Student Approved ✅</h2><p>The student account was created and a temporary password was generated.</p><div class="s92-summary"><b>Student:</b> ${r.name||""}<br><b>Email:</b> ${r.email||""}<br><b>Phone:</b> ${r.phone||""}<br><b>Temporary password:</b> ${password}</div><p class="muted">Send this message to the student on WhatsApp:</p><textarea readonly style="width:100%;min-height:150px">${msg}</textarea><div class="row">${waUrl?`<a class="button whatsapp" target="_blank" href="${waUrl}">Send Login Details on WhatsApp</a>`:`<button disabled>No WhatsApp number saved</button>`}<button onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify('${msg}')}).then(()=>alert('Copied')).catch(()=>alert('Copy manually from the box above'))">Copy Message</button><button class="ghost" onclick="document.body.removeChild(this.closest('.modal'))">Close</button></div></div>`;
  const copyBtn=div.querySelector('button:not([disabled])');
  if(copyBtn && copyBtn.textContent.includes('Copy'))copyBtn.onclick=()=>navigator.clipboard&&navigator.clipboard.writeText(msg).then(()=>alert('Copied')).catch(()=>alert('Copy manually from the box above'));
  document.body.appendChild(div);
}
async function approveAccessRequest(id){
  const r=DATA.accessRequests[id];
  if(!r)return alert("Request not found.");
  if((r.status||"pending")!=="pending")return alert("This request is already processed.");
  const password=tempPass();
  const msg=accessApprovalMessage(r,password);
  const phone=phoneForWhatsApp(r.phone||r.whatsapp||"");
  const waWin=phone?window.open("about:blank","_blank"):null;
  try{
    const c=await secondaryAuth.createUserWithEmailAndPassword(String(r.email||"").trim(),password);
    await db.ref("users/"+c.user.uid).set({uid:c.user.uid,name:r.name||"",email:r.email||"",phone:phone,whatsapp:phone,university:r.university||"",role:"student",type:"individual",requestedCourses:r.courses||"",createdBy:currentUser.uid,createdFromAccessRequest:id,createdAt:Date.now()});
    await db.ref("accessRequests/"+id).update({status:"approved",approvedAt:Date.now(),createdStudentUid:c.user.uid,generatedPassword:password,phone,whatsapp:phone,whatsappPrepared:true});
    await secondaryAuth.signOut();
    await loadData();
    accessRequestsPage();
    const waUrl=phone?`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`:"";
    if(waWin&&waUrl){waWin.location.href=waUrl;}else if(phone){window.open(waUrl,"_blank");}
    showAccessApprovalResult(r,password,msg);
  }catch(e){
    if(waWin)waWin.close();
    if(String(e.code||"").includes("email-already-in-use")){
      alert("This email already exists in Firebase Authentication, so the website cannot generate a new password for it from here. Delete/reset that Firebase Auth user first, then approve the request again.");
    }else{
      alert(e.message||"Could not approve request.");
    }
  }
}
async function rejectAccessRequest(id){if(!confirm("Reject this access request?"))return;await db.ref("accessRequests/"+id).update({status:"rejected",rejectedAt:Date.now()});await loadData();accessRequestsPage()}

function bookingRows(bs,edit){return bs.length?`<table class="table"><tr><th>Date</th><th>Time</th><th>Course</th><th>Tutor</th><th>Student/Group</th><th>Details</th><th>Payments</th><th>Notes</th><th>Actions</th></tr>${bs.map(b=>`<tr><td>${b.date}</td><td>${formatTime12(b.start)}</td><td>${b.course}</td><td>${user(b.tutorId).name||""}</td><td>${user(b.studentId).name||""}</td><td>${b.duration}h • ${b.format||"Individual"} ${b.groupSize||1}<br>${b.location}<br>${b.paymentMethod}<br>${(b.sessionTypes||[]).join(", ")}<br>Total: ${money(total(b))}</td><td>${(b.payments||[]).map((p,i)=>`${p.name}: ${money(p.amount)} ${badge(p.paid)} ${edit?`<button onclick="togglePayment('${b.id}',${i})">Toggle</button>`:""}`).join("<br>")}</td><td>${b.notes||""}${edit?`<br><button onclick="editNotes('${b.id}')">Edit Notes</button>`:""}</td><td>${edit?`<button onclick="editBooking('${b.id}')">Edit</button><button onclick="markBookingPayment('${b.id}')">Mark Paid</button><button onclick="markDone('${b.id}')">Mark Done</button><button class="danger" onclick="deleteBooking('${b.id}')">Delete</button>`:""}</td></tr>`).join("")}</table>`:`<p class="muted">No sessions yet.</p>`}
function bookingsPage(edit){let bs=myBookings();$("content").innerHTML=`<div class="card"><h2>Upcoming Sessions</h2>${bookingRows(bs.filter(b=>!b.done),edit&&profile.role!=="student")}</div><div class="card"><h2>Past Sessions</h2>${bookingRows(bs.filter(b=>b.done),edit&&profile.role!=="student")}</div>`}


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


function updateTutorListForCourse(){
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

function contactSelectedTutorForTime(){
  const tutorId=$("bt")?.value;
  const t=user(tutorId);
  openWhatsApp(t.whatsapp||"", "Hi, I couldn't find a time that suits me on Scheduled. Can we arrange a session time?");
}

function updateSlots(){
  if(!$("bt")||!$("bt").value)return;
  let slots=generateSlots($("bt").value,$("bd").value,$("bdu").value,$("bcourseFirst").value);
  $("bs").innerHTML=slots.length?slots.map(s=>`<option value="${s}">${formatTime12(s)}</option>`).join(""):`<option value="">No available slots</option>`;
  updateBookingLocations();updatePrice();
}
function updateBookingLocations(){if(!$("bt")||!$("bt").value||!$("bs"))return;let locs=slotLocationOptions($("bt").value,$("bd").value,$("bs").value,$("bdu").value,$("bcourseFirst").value);$("bl").innerHTML=locs.length?locs.map(l=>`<option>${l}</option>`).join(""):`<option value="">No location available</option>`}
function updatePrice(){if(!$("bt")||!$("bt").value)return;let t=user($("bt").value),d=Number($("bdu").value),g=$("bf").value==="Group"?Number($("bg").value):1;$("price").innerHTML=`<b>Course:</b> ${$("bcourseFirst").value||"-"}<br><b>Tutor:</b> ${t.name||"-"}<br><b>University:</b> ${t.university||"Not specified"}<br><b>Rate:</b> ${money(t.rate)}/hour/person<br><b>Duration:</b> ${d}h<br><b>Students:</b> ${g}<br><b>Total:</b> ${money((t.rate||0)*d*g)}<br><b>Payment:</b> ${method($("bl").value)}`}


function showBookingModal(t){const div=document.createElement("div");div.className="modal";div.innerHTML=`<div class="modal-box"><h2>🎉 Booking Confirmed!</h2><p>Your tutoring session has been successfully booked.</p><p><b>Important:</b> If you need to reschedule, cancel, or have any questions, please contact your tutor directly via WhatsApp.</p><p><b>Tutor:</b> ${t.name}<br><b>WhatsApp:</b> ${t.whatsapp||""}</p><button onclick="document.body.removeChild(this.closest('.modal'));openTab('My Sessions')">Go to My Sessions</button></div>`;document.body.appendChild(div)}

function myTutorsPage(){let ts=studentTutors(currentUser.uid);$("content").innerHTML=`<div class="card"><h2>My Tutors</h2>${ts.length?`<div class="grid">${ts.map(t=>{let bs=list(DATA.bookings).filter(b=>b.studentId===currentUser.uid&&b.tutorId===t.id);return`<div class="card"><h3>${t.name}</h3><p>${t.university||""}</p><p>${(t.courses||[]).join(", ")}</p><button onclick="bookWithTutor('${t.id}')">Book a New Session</button><hr><b>Upcoming</b><br>${bs.filter(b=>!b.done).map(b=>`${b.date} • ${b.course} • ${formatTime12(b.start)}`).join("<br>")||"<span class='muted'>None</span>"}<hr><b>Past</b><br>${bs.filter(b=>b.done).map(b=>`${b.date} • ${b.course} • ${formatTime12(b.start)}`).join("<br>")||"<span class='muted'>None</span>"}</div>`}).join("")}</div>`:`<p class="muted">No tutors yet. Book a session first.</p>`}</div>`}
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
/* ===== Scheduled v9.6: Tutor Schedule Session + Global Time Lock + Cancel/Reschedule Notifications ===== */
function s96BookingStatus(b){return String(b?.status||"").toLowerCase().trim();}
function s96IsActiveBooking(b){
  const st=s96BookingStatus(b);
  return !!b && !b.deleted && !b.done && !b.cancelledAt && !b.canceledAt && st!=="cancelled" && st!=="canceled" && st!=="rescheduled";
}
function s96BookingEnd(start,duration){
  if(typeof s92EndTime==="function")return s92EndTime(start,duration);
  return toTime(toMin(start)+Number(duration||1)*60);
}
function s96Money(v){return typeof money==="function"?money(v):`$${Number(v||0).toFixed(2)}`;}
function s96Time(t){return typeof formatTime12==="function"?formatTime12(t):(typeof s92FormatTime==="function"?s92FormatTime(t):t);}
function s96TotalForBooking(b){
  if(Array.isArray(b.payments)&&b.payments.length)return total(b);
  const tutor=user(b.tutorId)||{};
  const student=user(b.studentId)||{};
  const members=student.type==="group"?(student.members||[]).filter(Boolean).length||1:1;
  return Number(tutor.rate||profile?.rate||0)*Number(b.duration||1)*members;
}
function s96StudentPhone(student){return student?.phone||student?.whatsapp||student?.mobile||student?.parentPhone||"";}
function s96DetailsMessage(b,kind="scheduled",oldB=null){
  const tutor=user(b.tutorId)||profile||{};
  const student=user(b.studentId)||{};
  const totalAmount=s96TotalForBooking(b);
  const label=kind==="cancelled"?"Session Cancelled":(kind==="rescheduled"?"Session Rescheduled":"Session Scheduled");
  const lines=[`Scheduled - ${label}`,"",`Tutor: ${tutor.name||""}`,`Student/Group: ${student.name||""}`,`Course: ${b.course||""}`];
  if(oldB){
    lines.push("", "Previous time:", `Date: ${oldB.date||""}`, `Time: ${s96Time(oldB.start||oldB.time||"")} → ${s96Time(s96BookingEnd(oldB.start||oldB.time,oldB.duration))}`, `Duration: ${oldB.duration||""} hour(s)`);
    lines.push("", "New time:");
  }
  lines.push(`Date: ${b.date||""}`);
  lines.push(`Time: ${s96Time(b.start||b.time||"")} → ${s96Time(s96BookingEnd(b.start||b.time,b.duration))}`);
  lines.push(`Duration: ${b.duration||""} hour(s)`);
  lines.push(`Location: ${b.location||b.sessionType||""}`);
  lines.push(`Payment method: ${b.paymentMethod||""}`);
  lines.push(`Total expenses: ${s96Money(totalAmount)}`);
  if(kind==="cancelled")lines.push("", "This session has been cancelled by the tutor. The original time is now available again for booking.");
  if(kind==="rescheduled")lines.push("", "The previous time is now available again, and the new time is blocked for this tutor.");
  return lines.join("\n");
}
async function s96SendInternalChat(fromId,toId,text,meta={}){
  if(!fromId||!toId||!text)return;
  const cid=typeof s92ChatId==="function"?s92ChatId(fromId,toId):[fromId,toId].sort().join("_");
  await db.ref("chats/"+cid+"/participants").set({[fromId]:true,[toId]:true});
  await db.ref("chats/"+cid+"/messages").push({from:fromId,to:toId,text,read:false,createdAt:Date.now(),system:true,...meta});
}
async function s96NotifyStudentForBooking(b,kind="scheduled",oldB=null,openWa=true){
  const tutor=user(b.tutorId)||profile||{};
  const student=user(b.studentId)||{};
  const text=s96DetailsMessage(b,kind,oldB);
  const title=kind==="cancelled"?"Session Cancelled":(kind==="rescheduled"?"Session Rescheduled":"New Session Scheduled");
  if(typeof v56NotifyStudent==="function")await v56NotifyStudent(b.studentId,title,text);
  await s96SendInternalChat(b.tutorId||currentUser?.uid,b.studentId,text,{bookingId:b.id||"",eventType:kind});
  if(openWa){
    const phone=s96StudentPhone(student);
    if(phone)openWhatsApp(phone,text);
    else alert("Student was notified in the website chat, but no WhatsApp/phone number is saved for this student.");
  }
}
function candidateWorks(tutorId,studentId,date,start,duration,ignoreBookingId=""){
  const s=toMin(start),e=s+Number(duration)*60;
  const bookings=list(DATA.bookings).filter(b=>b.id!==ignoreBookingId&&b.tutorId===tutorId&&b.date===date&&s96IsActiveBooking(b));
  for(const b of bookings){
    const bs=toMin(b.start||b.time),be=bs+Number(b.duration||1)*60;
    if(overlaps(s,e,bs,be))return false;
  }
  return true;
}
function s92BookedRanges(tutorId,date){
  return s92List(DATA.bookings||{}).filter(b=>b.tutorId===tutorId&&b.date===date&&s96IsActiveBooking(b)).map(b=>{
    const s=s92TimeToMin(b.start||b.time);
    return {start:s,end:s+Number(b.duration||1)*60,id:b.id};
  }).filter(r=>r.start!==null&&!isNaN(r.end));
}
function s93BookedRanges(tutorId,date){
  return s92List(DATA.bookings||{}).filter(b=>b.tutorId===tutorId&&b.date===date&&s96IsActiveBooking(b)).map(b=>{
    const s=s92TimeToMin(b.start||b.time);
    return {start:s,end:s+Number(b.duration||1)*60,id:b.id,availabilityId:b.availabilityId||"",sessionType:s93NormalizeTypeLabel(b.sessionType||"")};
  }).filter(r=>r.start!==null&&!isNaN(r.end));
}
function tutorScheduleSessionPage(){
  if(profile.role!=="tutor")return;
  const ss=v56AssignedStudentsForTutor(currentUser.uid);
  const today=typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10);
  $("content").innerHTML=`<div class="card tutor-schedule-form"><h2>Schedule Session</h2>
    <p class="muted">Create a session for one of your assigned students or groups. Once confirmed, this time is blocked across every course you teach.</p>
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
    <button onclick="createTutorScheduledSession()">Confirm Session & Notify Student</button>`:`<p class='muted'>No assigned students yet. Ask admin to assign students/groups to you first.</p>`}
  </div>`;
  updateTutorScheduleCourses();
}
async function createTutorScheduledSession(){
  const studentId=$("tssStudent")?.value,course=$("tssCourse")?.value,date=$("tssDate")?.value,start=$("tssTime")?.value;
  const duration=Number($("tssDuration")?.value||1),location=$("tssLocation")?.value||"Online";
  const paymentStatus=$("tssPayStatus")?.value||"Unpaid",paymentMethod=$("tssPayMethod")?.value||"Cash";
  if(!studentId||!course||!date||!start||!duration)return alert("Please fill student, course, date, time, and duration.");
  if(!v56AssignedStudentsForTutor(currentUser.uid).some(s=>s.id===studentId))return alert("You can only schedule sessions for students assigned to you.");
  if(!candidateWorks(currentUser.uid,studentId,date,start,duration))return alert("This tutor is already booked at this time. Choose another time.");
  const student=user(studentId);
  const members=student.type==="group"?(student.members||[]).filter(Boolean).length||1:1;
  const amount=Number(profile.rate||0)*duration*members;
  const paidNow=paymentStatus==="Paid";
  const payDate=paidNow?(typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10)):"";
  const booking={tutorId:currentUser.uid,studentId,course,date,start,duration,location,paymentMethod,payments:[{name:student.name||"Student",amount,paid:paidNow,method:paymentMethod,paymentDate:payDate}],status:"confirmed",done:false,createdAt:Date.now(),createdBy:currentUser.uid,createdByRole:"tutor",tutorScheduled:true};
  const ref=await db.ref("bookings").push(booking);
  booking.id=ref.key;
  await autoAssignStudentFromBooking(studentId,currentUser.uid,course);
  await s96NotifyStudentForBooking(booking,"scheduled",null,true);
  await loadData();
  showToast("✓ Session created successfully.","The student was notified in website chat and WhatsApp.");
  tutorScheduleSessionPage();
}
function bookingRows(bs,edit){
  return bs.length?`<table class="table"><tr><th>Date</th><th>Time</th><th>Course</th><th>Tutor</th><th>Student/Group</th><th>Status</th><th>Details</th><th>Payments</th><th>Notes</th><th>Actions</th></tr>${bs.map(b=>{
    const canTutorControl=profile.role==="tutor"&&b.tutorId===currentUser.uid&&s96IsActiveBooking(b);
    const status=s96BookingStatus(b)||"confirmed";
    const actions=edit?`${canTutorControl?`<button onclick="rescheduleTutorBooking('${b.id}')">Reschedule</button><button class="danger" onclick="cancelTutorBooking('${b.id}')">Cancel</button>`:""}<button onclick="editBooking('${b.id}')">Edit</button><button onclick="markBookingPayment('${b.id}')">Mark Paid</button><button onclick="markDone('${b.id}')">Mark Done</button><button class="danger" onclick="deleteBooking('${b.id}')">Delete</button>`:"";
    return `<tr><td>${b.date||""}</td><td>${s96Time(b.start||b.time||"")}</td><td>${b.course||""}</td><td>${user(b.tutorId).name||""}</td><td>${user(b.studentId).name||""}</td><td>${status}</td><td>${b.duration||""}h • ${b.format||"Individual"} ${b.groupSize||1}<br>${b.location||b.sessionType||""}<br>${b.paymentMethod||""}<br>${(b.sessionTypes||[]).join(", ")}<br>Total: ${s96Money(s96TotalForBooking(b))}</td><td>${(b.payments||[]).map((p,i)=>`${p.name}: ${s96Money(p.amount)} ${badge(p.paid)} ${edit?`<button onclick="togglePayment('${b.id}',${i})">Toggle</button>`:""}`).join("<br>")}</td><td>${b.notes||""}${edit?`<br><button onclick="editNotes('${b.id}')">Edit Notes</button>`:""}</td><td>${actions}</td></tr>`;
  }).join("")}</table>`:`<p class="muted">No sessions yet.</p>`;
}
async function cancelTutorBooking(id){
  const b=DATA.bookings[id];
  if(!b)return alert("Booking not found.");
  if(profile.role!=="tutor"||b.tutorId!==currentUser.uid)return alert("Only the assigned tutor can cancel this session.");
  if(!s96IsActiveBooking(b))return alert("This session is already cancelled, rescheduled, deleted, or completed.");
  const reason=prompt("Cancellation reason/message to student:","The tutor cancelled this session.");
  if(reason===null)return;
  const cancelled={...b,id,status:"cancelled",cancelledAt:Date.now(),cancelledBy:currentUser.uid,cancelReason:reason};
  await db.ref("bookings/"+id).update({status:"cancelled",cancelledAt:Date.now(),cancelledBy:currentUser.uid,cancelReason:reason});
  await s96NotifyStudentForBooking(cancelled,"cancelled",null,true);
  await loadData();
  bookingsPage(true);
}
async function rescheduleTutorBooking(id){
  const b=DATA.bookings[id];
  if(!b)return alert("Booking not found.");
  if(profile.role!=="tutor"||b.tutorId!==currentUser.uid)return alert("Only the assigned tutor can reschedule this session.");
  if(!s96IsActiveBooking(b))return alert("This session is already cancelled, rescheduled, deleted, or completed.");
  const date=prompt("New date YYYY-MM-DD:",b.date||""); if(date===null)return;
  const start=prompt("New start time HH:MM:",b.start||b.time||""); if(start===null)return;
  const duration=Number(prompt("New duration in hours:",b.duration||1)); if(!duration)return alert("Duration must be a number.");
  const location=prompt("New location:",b.location||b.sessionType||"Online"); if(location===null)return;
  if(!candidateWorks(b.tutorId,b.studentId,date,start,duration,id))return alert("This tutor is already booked at the new time. Choose another time.");
  const oldB={...b,id};
  const history=Array.isArray(b.rescheduleHistory)?b.rescheduleHistory:[];
  const updates={date,start,duration,location,paymentMethod:b.paymentMethod||method(location),status:"confirmed",rescheduledAt:Date.now(),rescheduledBy:currentUser.uid,rescheduleHistory:[...history,{date:b.date,start:b.start||b.time,duration:b.duration,location:b.location||b.sessionType,changedAt:Date.now(),changedBy:currentUser.uid}]};
  await db.ref("bookings/"+id).update(updates);
  const newB={...b,...updates,id};
  await s96NotifyStudentForBooking(newB,"rescheduled",oldB,true);
  await loadData();
  bookingsPage(true);
}
async function editBooking(id){
  let b=DATA.bookings[id];
  let date=prompt("Date:",b.date);if(date===null)return;
  let start=prompt("Start time:",b.start);if(start===null)return;
  let duration=Number(prompt("Duration:",b.duration));if(!duration)return alert("Duration must be a number.");
  let location=prompt("Location:",b.location);if(location===null)return;
  if(profile.role==="tutor"&&b.tutorId===currentUser.uid&&!candidateWorks(b.tutorId,b.studentId,date,start,duration,id))return alert("This tutor is already booked at this time. Choose another time.");
  await db.ref("bookings/"+id).update({date,start,duration,location,paymentMethod:b.paymentMethod||method(location)});
  await loadData();bookingsPage(true);
}
async function openTab(tab,btn){
  await loadData();
  if(typeof closeMenu==="function")setTimeout(closeMenu,0);
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  if(btn)btn.classList.add("active");
  const routes={Dashboard:dashboardPage,Overview:adminOverview,Tutors:adminTutors,"Tutor Profiles":publicTutorProfilesPage,Students:adminStudents,Courses:adminCourses,"Access Requests":accessRequestsPage,Calendar:calendarPage,Bookings:()=>bookingsPage(true),Payments:profile?.role==="student"?paymentsPage:financialPage,"Tutor Reports":adminTutorReportsPage,Announcements:profile?.role==="tutor"?tutorAnnouncementsPage:announcementsPage,"Motivation Banner":motivationBannerSettingsPage,Documents:docsPage,Export:exportPage,Schedule:schedulePage,Availability:availabilityPage,"Schedule Session":tutorScheduleSessionPage,"My Students":myStudentsPage,Financial:financialPage,Statistics:statsPage,Reviews:reviewsPage,Profile:profilePage,Book:bookingPage,Emergency:emergencySessionsPage,Favorites:favoritesPage,"Student Profile":studentProfilePage,"All Tutors":allTutorsPage,"My Tutors":myTutorsPage,"My Sessions":()=>bookingsPage(false)};
  if(routes[tab])return routes[tab]();
  dashboardPage();
}

/* ===== Scheduled v9.7 REAL FIX: tutor global booking lock + tutor cancel/reschedule + student notifications ===== */
function s97Status(b){return String(b?.status||"").toLowerCase().trim();}
function s97IsActiveBooking(b){
  const st=s97Status(b);
  return !!b && !b.deleted && !b.done && !b.cancelledAt && !b.canceledAt && !b.cancelledBy && !b.canceledBy && st!=="cancelled" && st!=="canceled" && st!=="deleted";
}
function s97TimeToMin(t){return typeof s92TimeToMin==="function"?s92TimeToMin(t):toMin(t);}
function s97MinToTime(m){return typeof s92MinToTime==="function"?s92MinToTime(m):toTime(m);}
function s97EndTime(start,duration){return s97MinToTime(s97TimeToMin(start)+Number(duration||1)*60);}
function s97FmtTime(t){return typeof s92FormatTime==="function"?s92FormatTime(t):(typeof formatTime12==="function"?formatTime12(t):t);}
function s97Money(v){return typeof money==="function"?money(v):`$${Number(v||0).toFixed(2)}`;}
function s97BookingRanges(tutorId,date,ignoreBookingId=""){
  return list(DATA.bookings||{}).filter(b=>{
    const bid=b.id||b.key||"";
    return bid!==ignoreBookingId && b.tutorId===tutorId && b.date===date && s97IsActiveBooking(b);
  }).map(b=>{
    const start=s97TimeToMin(b.start||b.time);
    return {start,end:start+Number(b.duration||1)*60,id:b.id||b.key||"",availabilityId:b.availabilityId||"",sessionType:(typeof s93NormalizeTypeLabel==="function"?s93NormalizeTypeLabel(b.sessionType||b.location||""):(b.sessionType||b.location||""))};
  }).filter(r=>r.start!==null&&!isNaN(r.start)&&!isNaN(r.end));
}
function candidateWorks(tutorId,studentId,date,start,duration,ignoreBookingId=""){
  const s=s97TimeToMin(start), e=s+Number(duration||1)*60;
  if(s===null||isNaN(s)||isNaN(e))return false;
  return !s97BookingRanges(tutorId,date,ignoreBookingId).some(r=>overlaps(s,e,r.start,r.end));
}
function s92BookedRanges(tutorId,date){return s97BookingRanges(tutorId,date).map(r=>({start:r.start,end:r.end,id:r.id}));}
function s93BookedRanges(tutorId,date){return s97BookingRanges(tutorId,date);}
function s92SlotAvailableForDuration(tutorId,date,start,duration,type){return s93SlotAvailableForDuration(tutorId,date,start,duration,type);}
function s92AvailableStarts(tutorId,date,type,duration){return s93AvailableStarts(tutorId,date,type,duration);}
function s92DateHasSlots(tutorId,date,type,duration){return s93DateHasSlots(tutorId,date,type,duration);}
function s97StudentPhone(student){return student?.phone||student?.whatsapp||student?.mobile||student?.parentPhone||"";}
function s97Total(b){
  if(Array.isArray(b.payments)&&b.payments.length)return total(b);
  const tutor=user(b.tutorId)||{};
  const student=user(b.studentId)||{};
  const count=student.type==="group"?(student.members||[]).filter(Boolean).length||Number(b.groupSize||1):Number(b.groupSize||1);
  return Number(tutor.rate||profile?.rate||0)*Number(b.duration||1)*count;
}
function s97Message(b,kind="scheduled",oldB=null,reason=""){
  const tutor=user(b.tutorId)||profile||{};
  const student=user(b.studentId)||{};
  const title=kind==="cancelled"?"Session Cancelled":kind==="rescheduled"?"Session Rescheduled":"Session Scheduled";
  const lines=[`Scheduled - ${title}`,"",`Tutor: ${tutor.name||""}`,`Student/Group: ${student.name||""}`,`Course: ${b.course||""}`];
  if(oldB){lines.push("","Previous time:",`Date: ${oldB.date||""}`,`Time: ${s97FmtTime(oldB.start||oldB.time||"")} → ${s97FmtTime(s97EndTime(oldB.start||oldB.time,oldB.duration))}`,`Duration: ${oldB.duration||""} hour(s)`,"","New time:");}
  lines.push(`Date: ${b.date||""}`,`Time: ${s97FmtTime(b.start||b.time||"")} → ${s97FmtTime(s97EndTime(b.start||b.time,b.duration))}`,`Duration: ${b.duration||""} hour(s)`,`Location: ${b.location||b.sessionType||""}`,`Payment method: ${b.paymentMethod||""}`,`Total expenses: ${s97Money(s97Total(b))}`);
  if(reason)lines.push("",`Message: ${reason}`);
  if(kind==="cancelled")lines.push("","This session has been cancelled by the tutor. The original time is now available again for booking.");
  if(kind==="rescheduled")lines.push("","The previous time is now available again. The new time is now unavailable across every course this tutor teaches.");
  if(kind==="scheduled")lines.push("","This time is now unavailable across every course this tutor teaches.");
  return lines.join("\n");
}
async function s97InternalChat(fromId,toId,text,meta={}){
  if(!fromId||!toId||!text)return;
  const cid=typeof s92ChatId==="function"?s92ChatId(fromId,toId):[fromId,toId].sort().join("_");
  await db.ref("chats/"+cid+"/participants").set({[fromId]:true,[toId]:true});
  await db.ref("chats/"+cid+"/messages").push({from:fromId,to:toId,text,read:false,createdAt:Date.now(),system:true,...meta});
}
async function s97NotifyStudent(b,kind="scheduled",oldB=null,reason="",openWa=true){
  const text=s97Message(b,kind,oldB,reason);
  const title=kind==="cancelled"?"Session Cancelled":kind==="rescheduled"?"Session Rescheduled":"New Session Scheduled";
  if(typeof v56NotifyStudent==="function")await v56NotifyStudent(b.studentId,title,text);
  await s97InternalChat(b.tutorId||currentUser?.uid,b.studentId,text,{bookingId:b.id||"",eventType:kind});
  if(openWa){
    const phone=s97StudentPhone(user(b.studentId)||{});
    if(phone)openWhatsApp(phone,text);
    else alert("Student was notified in the website chat, but no WhatsApp/phone number is saved for this student.");
  }
}
function v56CoursesForTutorStudent(studentId){
  const s=user(studentId)||{};
  const assigned=Array.isArray(s.assignedCourses)?s.assignedCourses:[];
  const tutorObj=user(currentUser?.uid)||profile||{};
  const tutorCourses=Array.isArray(tutorObj.courses)?tutorObj.courses:(Array.isArray(profile?.courses)?profile.courses:[]);
  const overlap=assigned.filter(c=>tutorCourses.includes(c));
  const source=overlap.length?overlap:(assigned.length?assigned:tutorCourses);
  return [...new Set(source.filter(Boolean))];
}
function tutorScheduleSessionPage(){
  if(profile.role!=="tutor")return;
  const ss=v56AssignedStudentsForTutor(currentUser.uid);
  const today=typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10);
  $("content").innerHTML=`<div class="card tutor-schedule-form"><h2>Schedule Session</h2>
    <p class="muted">Create a session for one of your assigned students or groups. Once confirmed, this time is blocked across every course you teach.</p>
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
    <button onclick="createTutorScheduledSession()">Confirm Session & Notify Student</button>`:`<p class='muted'>No assigned students yet. Ask admin to assign students/groups to you first.</p>`}
  </div>`;
  updateTutorScheduleCourses();
}
async function createTutorScheduledSession(){
  await loadData();
  const studentId=$("tssStudent")?.value,course=$("tssCourse")?.value,date=$("tssDate")?.value,start=$("tssTime")?.value;
  const duration=Number($("tssDuration")?.value||1),location=$("tssLocation")?.value||"Online";
  const paymentStatus=$("tssPayStatus")?.value||"Unpaid",paymentMethod=$("tssPayMethod")?.value||"Cash";
  if(!studentId||!course||!date||!start||!duration)return alert("Please fill student/group, course, date, time, and duration.");
  if(!v56AssignedStudentsForTutor(currentUser.uid).some(s=>s.id===studentId))return alert("You can only schedule sessions for students/groups assigned to you.");
  if(!candidateWorks(currentUser.uid,studentId,date,start,duration))return alert("This tutor is already booked at this time in another course/session. Choose another time.");
  if(!confirm("Confirm this session and notify the student in website chat + WhatsApp?"))return;
  const student=user(studentId)||{};
  const members=student.type==="group"?(student.members||[]).filter(Boolean).length||1:1;
  const amount=Number((user(currentUser.uid)||profile||{}).rate||0)*duration*members;
  const paidNow=paymentStatus==="Paid";
  const payDate=paidNow?(typeof todayISO==="function"?todayISO():new Date().toISOString().slice(0,10)):"";
  const booking={tutorId:currentUser.uid,studentId,course,date,start,duration,location,paymentMethod,payments:[{name:student.name||"Student",amount,paid:paidNow,method:paymentMethod,paymentDate:payDate}],status:"confirmed",done:false,createdAt:Date.now(),createdBy:currentUser.uid,createdByRole:"tutor",tutorScheduled:true};
  const ref=await db.ref("bookings").push(booking); booking.id=ref.key;
  await autoAssignStudentFromBooking(studentId,currentUser.uid,course);
  await s97NotifyStudent(booking,"scheduled",null,"",true);
  await loadData(); showToast("✓ Session created successfully.","The time is now blocked globally and the student was notified."); tutorScheduleSessionPage();
}
function bookingRows(bs,edit){
  return bs.length?`<table class="table"><tr><th>Date</th><th>Time</th><th>Course</th><th>Tutor</th><th>Student/Group</th><th>Status</th><th>Details</th><th>Payments</th><th>Notes</th><th>Actions</th></tr>${bs.map(b=>{
    const active=s97IsActiveBooking(b);
    const canTutorControl=profile.role==="tutor"&&b.tutorId===currentUser.uid&&active;
    const status=s97Status(b)||"confirmed";
    const actions=edit?`${canTutorControl?`<button onclick="rescheduleTutorBooking('${b.id}')">Reschedule</button><button class="danger" onclick="cancelTutorBooking('${b.id}')">Cancel</button>`:""}<button onclick="editBooking('${b.id}')">Edit</button><button onclick="markBookingPayment('${b.id}')">Mark Paid</button><button onclick="markDone('${b.id}')">Mark Done</button><button class="danger" onclick="deleteBooking('${b.id}')">Delete</button>`:"";
    return `<tr><td>${b.date||""}</td><td>${s97FmtTime(b.start||b.time||"")}</td><td>${b.course||""}</td><td>${user(b.tutorId).name||""}</td><td>${user(b.studentId).name||""}</td><td>${status}${!active?"<br><span class='muted'>released</span>":""}</td><td>${b.duration||""}h • ${b.format||"Individual"} ${b.groupSize||1}<br>${b.location||b.sessionType||""}<br>${b.paymentMethod||""}<br>${(b.sessionTypes||[]).join(", ")}<br>Total: ${s97Money(s97Total(b))}</td><td>${(b.payments||[]).map((p,i)=>`${p.name}: ${s97Money(p.amount)} ${badge(p.paid)} ${edit?`<button onclick="togglePayment('${b.id}',${i})">Toggle</button>`:""}`).join("<br>")}</td><td>${b.notes||""}${b.cancelReason?`<br><b>Cancel reason:</b> ${b.cancelReason}`:""}${edit?`<br><button onclick="editNotes('${b.id}')">Edit Notes</button>`:""}</td><td>${actions}</td></tr>`;
  }).join("")}</table>`:`<p class="muted">No sessions yet.</p>`;
}
function bookingsPage(edit){
  let bs=myBookings().sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.start||a.time||"").localeCompare(b.start||b.time||""));
  const upcoming=bs.filter(b=>!b.done&&s97IsActiveBooking(b));
  const inactive=bs.filter(b=>!b.done&&!s97IsActiveBooking(b));
  const past=bs.filter(b=>b.done);
  $("content").innerHTML=`<div class="card"><h2>Upcoming Sessions</h2>${bookingRows(upcoming,edit&&profile.role!=="student")}</div>${inactive.length?`<div class="card"><h2>Cancelled / Released Sessions</h2>${bookingRows(inactive,edit&&profile.role!=="student")}</div>`:""}<div class="card"><h2>Past Sessions</h2>${bookingRows(past,edit&&profile.role!=="student")}</div>`;
}
async function cancelTutorBooking(id){
  const b=DATA.bookings[id]; if(!b)return alert("Booking not found.");
  if(profile.role!=="tutor"||b.tutorId!==currentUser.uid)return alert("Only the assigned tutor can cancel this session.");
  if(!s97IsActiveBooking(b))return alert("This session is already cancelled, deleted, or completed.");
  const reason=prompt("Cancellation reason/message to student:","The tutor cancelled this session."); if(reason===null)return;
  if(!confirm("Cancel this session? The original time will become available for booking again, and the student will be notified in chat + WhatsApp."))return;
  const cancelled={...b,id,status:"cancelled",cancelledAt:Date.now(),cancelledBy:currentUser.uid,cancelReason:reason};
  await db.ref("bookings/"+id).update({status:"cancelled",cancelledAt:Date.now(),cancelledBy:currentUser.uid,cancelReason:reason});
  await s97NotifyStudent(cancelled,"cancelled",null,reason,true);
  await loadData(); bookingsPage(true);
}
async function rescheduleTutorBooking(id){
  const b=DATA.bookings[id]; if(!b)return alert("Booking not found.");
  if(profile.role!=="tutor"||b.tutorId!==currentUser.uid)return alert("Only the assigned tutor can reschedule this session.");
  if(!s97IsActiveBooking(b))return alert("This session is already cancelled, deleted, or completed.");
  const date=prompt("New date YYYY-MM-DD:",b.date||""); if(date===null)return;
  const start=prompt("New start time HH:MM:",b.start||b.time||""); if(start===null)return;
  const duration=Number(prompt("New duration in hours:",b.duration||1)); if(!duration)return alert("Duration must be a number.");
  const location=prompt("New location:",b.location||b.sessionType||"Online"); if(location===null)return;
  const reason=prompt("Message to student:","The tutor rescheduled this session."); if(reason===null)return;
  if(!candidateWorks(b.tutorId,b.studentId,date,start,duration,id))return alert("This tutor is already booked at the new time in another course/session. Choose another time.");
  if(!confirm("Reschedule this session? The old time will become available again and the new time will be blocked across every course. The student will be notified in chat + WhatsApp."))return;
  const oldB={...b,id};
  const history=Array.isArray(b.rescheduleHistory)?b.rescheduleHistory:[];
  const updates={date,start,duration,location,paymentMethod:b.paymentMethod||method(location),status:"confirmed",rescheduledAt:Date.now(),rescheduledBy:currentUser.uid,rescheduleMessage:reason,rescheduleHistory:[...history,{date:b.date,start:b.start||b.time,duration:b.duration,location:b.location||b.sessionType,changedAt:Date.now(),changedBy:currentUser.uid}]};
  await db.ref("bookings/"+id).update(updates);
  const newB={...b,...updates,id};
  await s97NotifyStudent(newB,"rescheduled",oldB,reason,true);
  await loadData(); bookingsPage(true);
}
async function editBooking(id){
  let b=DATA.bookings[id]; if(!b)return alert("Booking not found.");
  if(profile.role==="tutor"&&b.tutorId===currentUser.uid)return rescheduleTutorBooking(id);
  let date=prompt("Date:",b.date); if(date===null)return;
  let start=prompt("Start time:",b.start||b.time); if(start===null)return;
  let duration=Number(prompt("Duration:",b.duration)); if(!duration)return alert("Duration must be a number.");
  let location=prompt("Location:",b.location||b.sessionType); if(location===null)return;
  if(!candidateWorks(b.tutorId,b.studentId,date,start,duration,id))return alert("This tutor is already booked at this time. Choose another time.");
  await db.ref("bookings/"+id).update({date,start,duration,location,paymentMethod:b.paymentMethod||method(location)});
  await loadData(); bookingsPage(true);
}
function dailyView(date){
  let bs=myBookings().filter(b=>b.date===date&&s97IsActiveBooking(b)).sort((a,b)=>(a.start||a.time||"").localeCompare(b.start||b.time||""));
  $("content").innerHTML=`<div class="card"><button class="ghost" onclick="calendarPage()">Back to Calendar</button><h2>Daily Schedule — ${date}</h2>${bs.length?bs.map(b=>`<div class="schedule-item"><b>${s97FmtTime(b.start||b.time||"")}</b> • ${b.course||""}<br>${profile.role==="student"?user(b.tutorId).name:user(b.studentId).name}<br>${b.duration||""}h • ${b.location||b.sessionType||""}<br>${paymentSummary(b)}${profile.role==="tutor"&&b.tutorId===currentUser.uid?`<br><button onclick="rescheduleTutorBooking('${b.id}')">Reschedule</button><button class="danger" onclick="cancelTutorBooking('${b.id}')">Cancel</button>`:""}</div>`).join(""):"<p class='muted'>No active sessions for this date.</p>"}</div>`;
}
function calendarPage(){
  let now=new Date(),year=Number(localStorage.getItem("calYear")||now.getFullYear()),month=Number(localStorage.getItem("calMonth")||now.getMonth()),days=monthDays(year,month),bs=myBookings().filter(s97IsActiveBooking);
  $("content").innerHTML=`<div class="card"><h2>Calendar</h2><div class="row"><button onclick="moveMonth(-1)">Previous</button><div class="card small"><b>${new Date(year,month,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</b></div><button onclick="moveMonth(1)">Next</button></div><div class="calendar-grid">${days.map(d=>{let dayBookings=bs.filter(b=>b.date===d.date).sort((a,b)=>(a.start||a.time||"").localeCompare(b.start||b.time||""));return`<div class="day-card ${dayBookings.length?'':'not-available'}" onclick="${dayBookings.length?`dailyView('${d.date}')`:''}"><h4>${d.weekday} ${d.day}</h4>${dayBookings.slice(0,3).map(b=>`<div class="event">${s97FmtTime(b.start||b.time||"")} • ${profile.role==="student"?user(b.tutorId).name:user(b.studentId).name}<br>${b.course||""}</div>`).join("")}</div>`}).join("")}</div></div>`;
}
async function openTab(tab,btn){
  await loadData();
  if(typeof closeMenu==="function")setTimeout(closeMenu,0);
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  if(btn)btn.classList.add("active");
  const routes={Dashboard:dashboardPage,Overview:adminOverview,Tutors:adminTutors,"Tutor Profiles":publicTutorProfilesPage,Students:adminStudents,Courses:adminCourses,"Access Requests":accessRequestsPage,Calendar:calendarPage,Bookings:()=>bookingsPage(true),Payments:profile?.role==="student"?paymentsPage:financialPage,"Tutor Reports":adminTutorReportsPage,Announcements:profile?.role==="tutor"?tutorAnnouncementsPage:announcementsPage,"Motivation Banner":motivationBannerSettingsPage,Documents:docsPage,Export:exportPage,Schedule:schedulePage,Availability:availabilityPage,"Schedule Session":tutorScheduleSessionPage,"My Students":myStudentsPage,Financial:financialPage,Statistics:statsPage,Reviews:reviewsPage,Profile:profilePage,Book:bookingPage,Emergency:emergencySessionsPage,Favorites:favoritesPage,"Student Profile":studentProfilePage,"All Tutors":allTutorsPage,"My Tutors":myTutorsPage,"My Sessions":()=>bookingsPage(false)};
  if(routes[tab])return routes[tab]();
  dashboardPage();
}

/* ===== Scheduled v9.13: active course registry + university-specific course filtering ===== */
function s913Norm(v){return String(v||"").trim().replace(/\s+/g," ").toLowerCase();}
function s913Label(v){return typeof prettyOptionLabel==="function"?prettyOptionLabel(v):String(v||"").trim();}
function s913Key(v){return typeof safe==="function"?safe(s913Label(v)):s913Norm(v).replace(/[^a-z0-9]+/g,"_");}
function s913List(obj){return Object.entries(obj||{}).map(([id,v])=>({id,...(v||{})}));}
function s913UniMatch(a,b){return !a || a==="__all__" || !b || s913Norm(a)===s913Norm(b);}
function s913ActiveCourseRows(){
  const rows=s913List(DATA.courses||{}).filter(c=>c && c.name && c.deleted!==true && c.removed!==true && c.hidden!==true && c.active!==false);
  const map=new Map();
  rows.forEach(c=>{const name=s913Label(c.name); const key=s913Norm(name); if(name&&!map.has(key))map.set(key,{...c,name});});
  return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),undefined,{sensitivity:"base"}));
}
function s913FallbackCourseNames(){
  const names=[];
  (typeof tutors==="function"?tutors():[]).forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));
  s913List(DATA.publicTutors||{}).forEach(t=>(t.courses||[]).forEach(c=>names.push(c)));
  return typeof uniqueSorted==="function"?uniqueSorted(names):[...new Set(names.filter(Boolean))].sort();
}
function s913ActiveCourseNames(){
  const active=s913ActiveCourseRows().map(c=>c.name);
  return active.length?active:s913FallbackCourseNames();
}
function s913CourseUniversityRecord(course){
  const key=s913Key(course);
  const rec=(DATA.courseUniversities||{})[key] || (DATA.courses||{})[key] || {};
  const unis=[];
  if(Array.isArray(rec.universities))unis.push(...rec.universities);
  if(rec.university)unis.push(rec.university);
  s913ActiveCourseRows().filter(c=>s913Norm(c.name)===s913Norm(course)).forEach(c=>{if(c.university)unis.push(c.university); if(Array.isArray(c.universities))unis.push(...c.universities);});
  return {name:s913Label(rec.name||course),universities:(typeof uniqueSorted==="function"?uniqueSorted(unis):[...new Set(unis)])};
}
function s913Universities(){
  const arr=[];
  (typeof students==="function"?students():[]).forEach(u=>{if(u.university)arr.push(u.university)});
  (typeof tutors==="function"?tutors():[]).forEach(u=>{if(u.university)arr.push(u.university)});
  s913List(DATA.publicTutors||{}).forEach(u=>{if(u.university)arr.push(u.university)});
  s913ActiveCourseRows().forEach(c=>{if(c.university)arr.push(c.university); if(Array.isArray(c.universities))arr.push(...c.universities)});
  s913List(DATA.courseUniversities||{}).forEach(c=>{if(c.university)arr.push(c.university); if(Array.isArray(c.universities))arr.push(...c.universities)});
  return typeof uniqueSorted==="function"?uniqueSorted(arr):[...new Set(arr.filter(Boolean))].sort();
}
function s913CoursesForUniversity(university, includeAll=true){
  const active=s913ActiveCourseNames();
  if(!university || university==="__all__")return active;
  const filtered=active.filter(course=>{
    const rec=s913CourseUniversityRecord(course);
    if(rec.universities.length)return rec.universities.some(u=>s913UniMatch(university,u));
    return true; // legacy course without mapping remains visible until admin maps it
  });
  return filtered;
}
function s913TutorHasCourse(tutor,course){return (tutor.courses||[]).some(c=>s913Norm(c)===s913Norm(course));}
function s913TutorMatchesUniversity(tutor,university){return !university||university==="__all__"||s913Norm(tutor.university)===s913Norm(university);}
function allCourseNames(){return s913ActiveCourseNames();}
function allAssignableCourses(){return s913ActiveCourseNames();}
function tutorsForCourse(course){return (typeof tutors==="function"?tutors():[]).filter(t=>s913TutorHasCourse(t,course));}
function tutorsForCourseAndUniversity(course,university){return tutorsForCourse(course).filter(t=>s913TutorMatchesUniversity(t,university)).sort((a,b)=>(a.name||"").localeCompare(b.name||""));}
async function getRequestAccessChoices(){return {universities:s913Universities(),courses:s913ActiveCourseNames()};}
async function populateRequestAccessChoices(prefillCourses=""){
  const uniSelect=$("reqUniversity"), courseSelect=$("reqCourses"); if(!uniSelect||!courseSelect)return;
  const universities=s913Universities();
  uniSelect.innerHTML=`<option value="">Select your university</option>${universities.map(u=>`<option value="${safeOptionText(u)}">${safeOptionText(u)}</option>`).join("")}`;
  uniSelect.onchange=()=>s913RefreshRequestCourses(prefillCourses);
  s913RefreshRequestCourses(prefillCourses);
  if(!universities.length)uniSelect.innerHTML=`<option value="">No universities available yet</option>`;
}
function s913RefreshRequestCourses(prefillCourses=""){
  const uni=$("reqUniversity")?.value||""; const courseSelect=$("reqCourses"); if(!courseSelect)return;
  const courses=s913CoursesForUniversity(uni,false);
  courseSelect.innerHTML=courses.length?courses.map(c=>`<option value="${safeOptionText(c)}">${safeOptionText(c)}</option>`).join(""):`<option value="" disabled>No courses available for this university</option>`;
  const prefilled=String(prefillCourses||"").split(",").map(x=>x.trim()).filter(Boolean);
  [...courseSelect.options].forEach(o=>{if(prefilled.some(p=>s913Norm(p)===s913Norm(o.value)))o.selected=true});
}
function s92Tutors(){
  let ts=(typeof tutors==="function"?tutors():s913List(DATA.users||{}).filter(u=>u.role==="tutor")).filter(t=>!t.removed&&!t.hiddenFromBookings);
  if(S92_BOOKING && S92_BOOKING.university && S92_BOOKING.university!=="__all__")ts=ts.filter(t=>s913TutorMatchesUniversity(t,S92_BOOKING.university));
  if(S92_BOOKING && S92_BOOKING.course)ts=ts.filter(t=>s913TutorHasCourse(t,S92_BOOKING.course));
  return ts;
}
function s92Courses(){return s913ActiveCourseRows();}
function s92TutorCourses(tutor){
  const uni=(S92_BOOKING&&S92_BOOKING.university)||"__all__";
  let allowed=s913CoursesForUniversity(uni,true);
  if(tutor && Array.isArray(tutor.courses)&&tutor.courses.length)allowed=allowed.filter(c=>s913TutorHasCourse(tutor,c));
  return allowed.length?allowed:["General Tutoring"];
}
function s92RenderBookingPanel(){
  if(!S92_BOOKING.university)S92_BOOKING.university="__all__";
  let courseChoices=s913CoursesForUniversity(S92_BOOKING.university,true);
  if(!S92_BOOKING.course || !courseChoices.some(c=>s913Norm(c)===s913Norm(S92_BOOKING.course)))S92_BOOKING.course=courseChoices[0]||"";
  let tutorList=(typeof tutors==="function"?tutors():[]).filter(t=>!t.removed&&!t.hiddenFromBookings).filter(t=>s913TutorMatchesUniversity(t,S92_BOOKING.university)).filter(t=>!S92_BOOKING.course||s913TutorHasCourse(t,S92_BOOKING.course));
  if(!S92_BOOKING.tutorId || !tutorList.some(t=>t.id===S92_BOOKING.tutorId))S92_BOOKING.tutorId=tutorList[0]?.id||"";
  const tutor=s92SelectedTutor();
  return `<div class="s92-card">
    <h2>Book a Session</h2>
    <label>University</label>
    <select onchange="S92_BOOKING.university=this.value;S92_BOOKING.course='';S92_BOOKING.tutorId='';S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage();"><option value="__all__" ${S92_BOOKING.university==="__all__"?"selected":""}>All Universities</option>${s913Universities().map(u=>`<option value="${safeOptionText(u)}" ${s913Norm(S92_BOOKING.university)===s913Norm(u)?"selected":""}>${safeOptionText(u)}</option>`).join("")}</select>
    <label>Course</label>
    <select onchange="S92_BOOKING.course=this.value;S92_BOOKING.tutorId='';S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage();">${courseChoices.map(c=>`<option value="${safeOptionText(c)}" ${s913Norm(s92SelectedCourse())===s913Norm(c)?"selected":""}>${safeOptionText(c)}</option>`).join("")}</select>
    <label>Tutor</label>
    <select onchange="s92SelectTutor(this.value)">${tutorList.map(t=>`<option value="${t.id}" ${S92_BOOKING.tutorId===t.id?"selected":""}>${t.name||t.email}</option>`).join("")}</select>
    ${!tutorList.length?`<p class="muted">No tutors available for this university/course combination.</p>`:""}
    <label>Session Type</label>
    <div class="s92-segment"><button type="button" class="${S92_BOOKING.sessionType==="Online"?"active":""}" onclick="S92_BOOKING.sessionType='Online';S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage()">💻 Online</button><button type="button" class="${S92_BOOKING.sessionType==="On Campus"?"active":""}" onclick="S92_BOOKING.sessionType='On Campus';S92_BOOKING.date='';S92_BOOKING.time='';s92RenderBookingPage()">🏫 On Campus</button></div>
    <label>Duration</label><select onchange="S92_BOOKING.duration=Number(this.value);S92_BOOKING.time='';s92RenderBookingPage();"><option value="1" ${S92_BOOKING.duration==1?"selected":""}>1 hour</option><option value="1.5" ${S92_BOOKING.duration==1.5?"selected":""}>1.5 hours</option><option value="2" ${S92_BOOKING.duration==2?"selected":""}>2 hours</option><option value="3" ${S92_BOOKING.duration==3?"selected":""}>3 hours</option></select>
    <label>Payment</label><select disabled><option>Whish</option></select>
  </div>`;
}
function s92SelectedCourse(){return S92_BOOKING.course || s913CoursesForUniversity(S92_BOOKING.university||"__all__",true)[0] || "General Tutoring";}
function adminCourseUniversitySettingsPage(){
  const courses=s913ActiveCourseNames(); const unis=s913Universities();
  $("content").innerHTML=`<div class="card"><h2>Course ↔ University Settings</h2><p class="muted">Assign each course to the university/universities where it should appear. Request Access, bookings, tutor course lists, and availability filters use this mapping.</p>
  ${courses.length?`<table class="table"><tr><th>Course</th><th>Assigned Universities</th><th>Update</th></tr>${courses.map(c=>{const rec=s913CourseUniversityRecord(c);return `<tr><td>${c}</td><td><div class="checkbox-grid">${unis.map(u=>`<label class="check"><input type="checkbox" class="cu-${s913Key(c)}" value="${safeOptionText(u)}" ${rec.universities.some(x=>s913Norm(x)===s913Norm(u))?"checked":""}>${safeOptionText(u)}</label>`).join("")}</div></td><td><button onclick="saveCourseUniversities('${s913Key(c)}','${String(c).replace(/'/g,"\\'")}')">Save</button></td></tr>`}).join("")}</table>`:`<p class="muted">No active courses yet. Add a course first.</p>`}</div>`;
}
async function saveCourseUniversities(key,courseName){
  const universities=[...document.querySelectorAll(`.cu-${key}:checked`)].map(x=>x.value);
  await db.ref("courseUniversities/"+key).set({name:courseName,universities,updatedAt:Date.now(),updatedBy:currentUser.uid});
  await db.ref("courses/"+key).update({name:courseName,universities,updatedAt:Date.now()});
  await loadData(); adminCourseUniversitySettingsPage();
}
function adminCourses(){
  const cs=s913ActiveCourseNames();
  $("content").innerHTML=`<div class="card"><h2>Course Management</h2><p class="muted">Courses shown here are the active courses used across Scheduled.</p><table class="table"><tr><th>Course</th><th>Universities</th><th>Tutors Teaching It</th><th>Actions</th></tr>${cs.map(c=>`<tr><td>${c}</td><td>${s913CourseUniversityRecord(c).universities.join(", ")||"All / not assigned yet"}</td><td>${(typeof tutors==="function"?tutors():[]).filter(t=>s913TutorHasCourse(t,c)).map(t=>t.name).join(", ")||"None"}</td><td><button onclick="openTab('Course Universities')">Assign University</button><button class="danger" onclick="deleteCourseEverywhere('${String(c).replace(/'/g,"\\'")}')">Remove Course</button></td></tr>`).join("")||`<tr><td colspan="4">No active courses.</td></tr>`}</table><hr><h3>Assign Course to Tutor</h3><div class="row"><select id="ct">${(typeof tutors==="function"?tutors():[]).map(t=>`<option value="${t.id}">${t.name}</option>`)}</select><input id="cn" placeholder="Course name exactly: Physics 213"></div><button onclick="assignCourse()">Assign Course</button></div>`;
}
async function assignCourse(){
  let t=user($("ct").value), c=s913Label($("cn").value); if(!c)return alert("Enter a course name.");
  const cs=mergeTextArrayCaseInsensitive(t.courses||[],[c]); const key=s913Key(c);
  await db.ref("users/"+$("ct").value+"/courses").set(cs);
  const existing=s913CourseUniversityRecord(c); const universities=mergeTextArrayCaseInsensitive(existing.universities||[], t.university?[t.university]:[]);
  await db.ref("courses/"+key).set({name:c,universities,active:true,updatedAt:Date.now()});
  await db.ref("courseUniversities/"+key).set({name:c,universities,updatedAt:Date.now(),updatedBy:currentUser.uid});
  await loadData(); adminCourses();
}
async function deleteCourseEverywhere(course){
  if(!confirm(`Remove ${course} from active courses, tutors, public profiles, and future availability choices? Existing bookings stay saved for history.`))return;
  const key=s913Key(course); const updates={};
  updates["courses/"+key]=null; updates["courseUniversities/"+key]=null;
  Object.entries(DATA.users||{}).forEach(([uid,u])=>{if(Array.isArray(u.courses))updates[`users/${uid}/courses`]=u.courses.filter(c=>s913Norm(c)!==s913Norm(course)); if(Array.isArray(u.assignedCourses))updates[`users/${uid}/assignedCourses`]=u.assignedCourses.filter(c=>s913Norm(c)!==s913Norm(course));});
  Object.entries(DATA.publicTutors||{}).forEach(([id,p])=>{if(Array.isArray(p.courses))updates[`publicTutors/${id}/courses`]=p.courses.filter(c=>s913Norm(c)!==s913Norm(course));});
  Object.entries(DATA.availability||{}).forEach(([id,a])=>{if(Array.isArray(a.courses))updates[`availability/${id}/courses`]=a.courses.filter(c=>s913Norm(c)!==s913Norm(course)); if(a.course&&s913Norm(a.course)===s913Norm(course))updates[`availability/${id}/course`]=null;});
  await db.ref().update(updates); await loadData(); adminCourses();
}
function renderTabs(){let t=profile.role==="admin"?["Dashboard","Tutors","Tutor Profiles","Students","Courses","Course Universities","Access Requests","Calendar","Bookings","Payments","Tutor Reports","Announcements","Motivation Banner","Documents","Export"]:profile.role==="tutor"?["Dashboard","Calendar","Schedule Session","Availability","Schedule","My Students","Payments","Statistics","Reviews","Announcements","Documents","Profile"]:["Dashboard","Book","Emergency","All Tutors","My Tutors","Favorites","My Sessions","Payments","Statistics","Reviews","Announcements","Documents","Student Profile","Profile"];$("tabs").innerHTML=t.map((x,i)=>`<button class="${i===0?'active':''}" onclick="openTab('${x}',this)">${x}</button>`).join("");openTab(t[0],$("tabs button"));}
async function openTab(tab,btn){await loadData(); if(typeof closeMenu==="function")setTimeout(closeMenu,0);document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));if(btn)btn.classList.add("active");const routes={Dashboard:dashboardPage,Overview:adminOverview,Tutors:adminTutors,"Tutor Profiles":publicTutorProfilesPage,Students:adminStudents,Courses:adminCourses,"Course Universities":adminCourseUniversitySettingsPage,"Access Requests":accessRequestsPage,Calendar:calendarPage,Bookings:()=>bookingsPage(true),Payments:profile.role==="student"?paymentsPage:financialPage,"Tutor Reports":adminTutorReportsPage,Announcements:profile.role==="tutor"?tutorAnnouncementsPage:announcementsPage,"Motivation Banner":motivationBannerSettingsPage,Documents:docsPage,Export:exportPage,Schedule:schedulePage,Availability:availabilityPage,"My Students":myStudentsPage,Statistics:statsPage,Reviews:reviewsPage,Profile:profilePage,Book:bookingPage,Emergency:emergencySessionsPage,Favorites:favoritesPage,"Student Profile":studentProfilePage,"All Tutors":allTutorsPage,"My Tutors":myTutorsPage,"My Sessions":()=>bookingsPage(false),"Schedule Session":scheduleSessionPage};(routes[tab]||dashboardPage)();}

/* ===== v9.13 SAFE ORGANIZATION + ASSIGNMENT PATCH ===== */
function orgEsc(x){return String(x??"").replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[m]));}
function orgArr(x){return Array.isArray(x)?x:[];}
function orgNowLabel(ts){try{return ts?new Date(ts).toLocaleDateString():"—"}catch(e){return "—"}}
function isBookingTutorActive(t){return !(t?.hiddenFromBookings===true||t?.bookingStatus==="inactive"||t?.active===false);}
function bookingTutors(){return tutors().filter(isBookingTutorActive);}
function orgAllUniversities(){return uniqueSorted([...students().map(s=>s.university),...tutors().map(t=>t.university),...list(DATA.courses||{}).map(c=>c.university)].filter(Boolean));}
function orgAllCourses(){return allAssignableCourses();}
function orgStudentBookings(studentId){return list(DATA.bookings||{}).filter(b=>b.studentId===studentId&&!b.deleted);}
function orgUpcoming(studentId){const today=todayISO();return orgStudentBookings(studentId).filter(b=>!b.done&&(b.date||"")>=today).length;}
function orgStudentBalance(studentId){return orgStudentBookings(studentId).reduce((sum,b)=>sum+(b.paid?0:(Number(user(b.tutorId).rate||0)*Number(b.duration||1))),0);}
function orgBookingTutorIds(studentId){return [...new Set(orgStudentBookings(studentId).map(b=>b.tutorId).filter(Boolean))];}
function orgBookingCourses(studentId){return mergeTextArrayCaseInsensitive([],orgStudentBookings(studentId).map(b=>b.course).filter(Boolean));}
function orgStudentTutorIds(studentId){return [...new Set([...assignedTutorIdsForStudent(studentId),...orgBookingTutorIds(studentId)].filter(Boolean))];}
function orgStudentCourses(studentId){return mergeTextArrayCaseInsensitive(assignedCoursesForStudent(studentId),orgBookingCourses(studentId));}
function orgStatusClass(status){return String(status||"active").toLowerCase().replace(/[^a-z]/g,"")||"active";}
function orgPaymentStatus(studentId){return orgStudentBalance(studentId)>0?"unpaid":"paid";}
function orgMatchesFilter(s){
  const q=($('studentSearch')?.value||'').toLowerCase().trim();
  const uni=$('studentFilterUniversity')?.value||'';
  const tutor=$('studentFilterTutor')?.value||'';
  const course=$('studentFilterCourse')?.value||'';
  const status=$('studentFilterStatus')?.value||'';
  const pay=$('studentFilterPayment')?.value||'';
  const text=[s.name,s.email,s.phone,s.university,orgStudentCourses(s.id).join(' '),orgStudentTutorIds(s.id).map(id=>user(id).name).join(' ')].join(' ').toLowerCase();
  if(q&&!text.includes(q))return false;
  if(uni&&(s.university||'')!==uni)return false;
  if(tutor&&!orgStudentTutorIds(s.id).includes(tutor))return false;
  if(course&&!orgStudentCourses(s.id).includes(course))return false;
  if(status&&String(s.status||'active')!==status)return false;
  if(pay&&orgPaymentStatus(s.id)!==pay)return false;
  return true;
}
function orgCompactFilter(id,label,items,allLabel){return `<label class="org-filter-label">${label}<select id="${id}" class="org-scroll-select" onchange="adminStudents()"><option value="">${allLabel}</option>${items.map(x=>`<option value="${orgEsc(x.id||x)}">${orgEsc(x.name||x)}</option>`).join('')}</select></label>`;}
function adminStudents(){
  const all=profile.role==="admin"?students():students().filter(s=>orgStudentTutorIds(s.id).includes(currentUser.uid));
  const visible=all.filter(orgMatchesFilter);
  const uniVal=$('studentFilterUniversity')?.value||'', tutorVal=$('studentFilterTutor')?.value||'', courseVal=$('studentFilterCourse')?.value||'', statusVal=$('studentFilterStatus')?.value||'', payVal=$('studentFilterPayment')?.value||'', searchVal=$('studentSearch')?.value||'';
  const filters=`<div class="org-filter-bar"><input id="studentSearch" placeholder="Search students..." value="${orgEsc(searchVal)}" oninput="adminStudents()">${orgCompactFilter('studentFilterUniversity','University',orgAllUniversities(),'All universities')}${orgCompactFilter('studentFilterTutor','Tutor',tutors().map(t=>({id:t.id,name:t.name||t.email})),'All tutors')}${orgCompactFilter('studentFilterCourse','Course',orgAllCourses(),'All courses')}<label class="org-filter-label">Status<select id="studentFilterStatus" onchange="adminStudents()"><option value="">All statuses</option>${['active','pending','inactive','archived'].map(x=>`<option value="${x}">${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select></label><label class="org-filter-label">Payment<select id="studentFilterPayment" onchange="adminStudents()"><option value="">Paid + unpaid</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></label></div>`;
  $("content").innerHTML=`<div class="card"><h2>${profile.role==="admin"?'Students':'My Students'}</h2><p class="muted">Compact student cards. Filters update automatically from your current tutors, courses, and universities.</p>${filters}<div class="org-student-grid">${visible.map(s=>`<button class="org-student-card" onclick="viewStudentProfile('${s.id}')"><div class="org-card-head"><b>${orgEsc(s.name||'Unnamed student')}</b><span class="org-dot ${orgStatusClass(s.status)}">${orgEsc(s.status||'active')}</span></div><p>${orgEsc(s.university||'No university')}</p><p><b>Courses:</b> ${orgEsc(orgStudentCourses(s.id).slice(0,2).join(', ')||'None')}</p><p><b>Tutors:</b> ${orgEsc(orgStudentTutorIds(s.id).map(id=>user(id).name).filter(Boolean).slice(0,2).join(', ')||'None')}</p><div class="org-mini-kpis"><span>${orgStudentTutorIds(s.id).length} Tutors</span><span>${orgStudentCourses(s.id).length} Courses</span><span>${orgUpcoming(s.id)} Upcoming</span><span>${money(orgStudentBalance(s.id))}</span></div></button>`).join('')||"<p class='muted'>No students match these filters.</p>"}</div>${profile.role==="admin"?`<hr><h3>Create Student or Group Account</h3><div class="row"><input id="sn" placeholder="Name"><input id="se" type="email" placeholder="Email"><input id="sp" placeholder="Password"><input id="sphone" placeholder="Phone"><input id="suniversity" placeholder="University"><select id="stype"><option>individual</option><option>group</option></select></div><input id="smembers" placeholder="Group members comma separated"><label>Assign Tutor(s)</label><div class="checkbox-grid">${tutorCheckboxes('assignedTutor')}</div><label>Assign Course(s)</label><div class="checkbox-grid">${courseCheckboxes('assignedCourse')}</div><button onclick="createAccount('student')">Create Student/Group</button>`:''}</div>`;
  if($('studentFilterUniversity'))$('studentFilterUniversity').value=uniVal;if($('studentFilterTutor'))$('studentFilterTutor').value=tutorVal;if($('studentFilterCourse'))$('studentFilterCourse').value=courseVal;if($('studentFilterStatus'))$('studentFilterStatus').value=statusVal;if($('studentFilterPayment'))$('studentFilterPayment').value=payVal;if($('studentSearch')){$('studentSearch').value=searchVal;$('studentSearch').focus();}
}
function orgAssignmentHistory(studentId){
  const rows=[];const bs=orgStudentBookings(studentId);
  orgStudentTutorIds(studentId).forEach(tid=>{const t=user(tid);const courses=mergeTextArrayCaseInsensitive([],bs.filter(b=>b.tutorId===tid).map(b=>b.course).filter(Boolean));const future=bs.some(b=>b.tutorId===tid&&!b.done&&(b.date||'')>=todayISO());rows.push({tutor:t.name||'Tutor',courses:courses.length?courses:assignedCoursesForStudent(studentId),since:Math.min(...bs.filter(b=>b.tutorId===tid).map(b=>b.createdAt||Date.now()),Date.now()),status:isBookingTutorActive(t)?(future?'Active':'Inactive'):'Tutor inactive/unavailable'});});return rows;}
function viewStudentProfile(id){
  const s=user(id);if(!s)return alert('Student not found.');const bs=orgStudentBookings(id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));const hist=orgAssignmentHistory(id);
  $("content").innerHTML=`<div class="card"><button class="ghost" onclick="adminStudents()">← Back to Students</button><h2>${orgEsc(s.name||'Student')}</h2><div class="org-profile-grid"><div><b>Email</b><br>${orgEsc(s.email||'')}</div><div><b>Phone</b><br>${orgEsc(s.phone||'')}</div><div><b>University</b><br>${orgEsc(s.university||'')}</div><div><b>Status</b><br>${orgEsc(s.status||'active')}</div><div><b>Courses taken</b><br>${orgStudentCourses(id).length}</div><div><b>Total sessions</b><br>${bs.length}</div><div><b>Upcoming sessions</b><br>${orgUpcoming(id)}</div><div><b>Balance</b><br>${money(orgStudentBalance(id))}</div></div><h3>Assigned Tutors</h3>${hist.map(h=>`<div class="timeline-item"><b>${orgEsc(h.tutor)}</b><br>${orgEsc(h.courses.join(', ')||'No course yet')}<br>Since: ${orgEsc(orgNowLabel(h.since))}<br>Status: ${orgEsc(h.status)}</div>`).join('')||"<p class='muted'>No tutor assignments yet.</p>"}<h3>Admin Notes</h3>${profile.role==='admin'?`<textarea id="studentAdminNotes">${orgEsc(s.adminNotes||'')}</textarea><button onclick="saveStudentNotes('${id}')">Save Notes</button><button class="ghost" onclick="editStudent('${id}')">Edit Student Info</button><button class="ghost" onclick="editStudentTutors('${id}')">Assign Tutors</button><button class="ghost" onclick="editStudentCourses('${id}')">Assign Courses</button>`:`<p class='muted'>Admin only.</p>`}<h3>Relationship Timeline</h3>${orgTimeline(id).map(x=>`<div class="timeline-item">${x}</div>`).join('')||"<p class='muted'>No timeline yet.</p>"}</div>`;
}
function orgTimeline(studentId){const s=user(studentId);let out=[];if(s.createdAt)out.push(`Created account — ${orgNowLabel(s.createdAt)}`);if(s.autoAssignedUpdatedAt)out.push(`Assignments updated automatically — ${orgNowLabel(s.autoAssignedUpdatedAt)}`);orgStudentBookings(studentId).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).forEach(b=>out.push(`Booked ${orgEsc(b.course||'session')} with ${orgEsc(user(b.tutorId).name||'Tutor')} — ${orgEsc(b.date||orgNowLabel(b.createdAt))}`));return out;}
async function saveStudentNotes(id){await db.ref('users/'+id+'/adminNotes').set($('studentAdminNotes').value||'');await loadData();viewStudentProfile(id);}
async function editStudent(id){const s=DATA.users[id];if(!s)return alert('Student not found.');const name=prompt('Student name:',s.name||'');if(name===null)return;const phone=prompt('Phone number:',s.phone||'');if(phone===null)return;const university=prompt('University:',s.university||'');if(university===null)return;const status=prompt('Status: active, pending, inactive, archived',s.status||'active');if(status===null)return;const type=prompt('Type: individual or group',s.type||'individual');if(type===null)return;const membersText=prompt('Group members comma separated:',(s.members||[]).join(', '));if(membersText===null)return;await db.ref('users/'+id).update({name,phone,university,status,type,members:membersText.split(',').map(x=>x.trim()).filter(Boolean),updatedAt:Date.now()});await loadData();viewStudentProfile(id);}
function adminTutors(){const ts=tutors();$("content").innerHTML=`<div class="card"><h2>Booking Tutor Accounts</h2><p class="admin-note"><b>Tutors tab = booking availability only.</b> Inactive tutors cannot be booked and their unavailable status appears in student accounts. Public tutor profiles are controlled separately in Tutor Profiles.</p>${ts.length?`<div class="org-tutor-grid">${ts.map(t=>{const active=isBookingTutorActive(t);const activeStudents=students().filter(s=>orgStudentTutorIds(s.id).includes(t.id)&&String(s.status||'active')==='active').length;const upcoming=list(DATA.bookings||{}).filter(b=>b.tutorId===t.id&&!b.done&&(b.date||'')>=todayISO()).length;return `<div class="org-tutor-card"><div class="org-card-head"><b>${orgEsc(t.name||t.email)}</b><span class="org-dot ${active?'active':'inactive'}">${active?'Active':'Inactive'}</span></div><p>${orgEsc(t.university||'No university')}</p><p>${orgEsc((t.courses||[]).join(', ')||'No courses')}</p><div class="org-mini-kpis"><span>${activeStudents} Active Students</span><span>${(t.courses||[]).length} Courses</span><span>${upcoming} Upcoming</span><span>${money(t.rate||0)}/h</span></div><button onclick="editTutor('${t.id}')">Edit</button><button class="ghost" onclick="toggleBookingTutorStatus('${t.id}')">Set ${active?'Inactive':'Active'}</button><button class="danger" onclick="deleteTutor('${t.id}')">Remove Access</button></div>`}).join('')}</div>`:`<p class='muted'>No booking tutor accounts yet.</p>`}<hr><h3>Create Booking Tutor Account</h3><div class="row"><input id="tn" placeholder="Full name"><input id="te" type="email" placeholder="Email"><input id="tp" placeholder="Temporary password"><input id="tw" placeholder="WhatsApp e.g. 96176174738"><input id="tr" type="number" placeholder="Hourly rate"><input id="tuiv" placeholder="University e.g. University of Balamand"></div><input id="tl" placeholder="General locations: Online, On Campus (Koura Campus)"><button onclick="createAccount('tutor')">Create / Link Booking Tutor</button></div>`;}
async function toggleBookingTutorStatus(id){const t=user(id);const active=isBookingTutorActive(t);await db.ref('users/'+id).update({hiddenFromBookings:active,bookingStatus:active?'inactive':'active',updatedAt:Date.now()});await db.ref('assignmentEvents').push({type:'tutor_booking_status_changed',tutorId:id,status:active?'inactive':'active',createdAt:Date.now()});await loadData();adminTutors();}
async function editTutor(id){const t=DATA.users[id];if(!t)return alert('Tutor not found.');const name=prompt('Tutor full name:',t.name||'');if(name===null)return;const university=prompt('University:',t.university||'');if(university===null)return;const rate=prompt('Hourly rate:',t.rate||15);if(rate===null)return;const whatsapp=prompt('WhatsApp number:',t.whatsapp||'');if(whatsapp===null)return;const coursesText=prompt('Courses, comma separated:',(t.courses||[]).join(', '));if(coursesText===null)return;const locationsText=prompt('General locations, comma separated:',(t.locations||[]).join(', '));if(locationsText===null)return;const photoUrl=prompt('Profile picture URL:',t.photoUrl||'');if(photoUrl===null)return;const description=prompt('Description / teaching style:',t.description||'');if(description===null)return;const status=prompt('Booking status: active or inactive',isBookingTutorActive(t)?'active':'inactive');if(status===null)return;const courses=coursesText.split(',').map(x=>x.trim()).filter(Boolean),locations=locationsText.split(',').map(x=>x.trim()).filter(Boolean);await db.ref('users/'+id).update({name,university,rate:Number(rate||0),whatsapp,courses,locations,photoUrl,description,bookingStatus:String(status).toLowerCase()==='inactive'?'inactive':'active',hiddenFromBookings:String(status).toLowerCase()==='inactive',updatedAt:Date.now()});for(const c of courses){await db.ref('courses/'+safe(c)).set({name:c})}await loadData();adminTutors();}
function s92Tutors(){return (typeof tutors==='function'?tutors():s92List(DATA.users||{}).filter(u=>u.role==='tutor'&&!u.removed)).filter(isBookingTutorActive);}
async function autoAssignStudentFromBooking(studentId,tutorId,course){if(!studentId||!tutorId)return;const s=(DATA.users||{})[studentId]||{};const assignedTutorIds=Array.from(new Set([...(Array.isArray(s.assignedTutorIds)?s.assignedTutorIds:[]),tutorId].filter(Boolean)));const assignedCourses=mergeTextArrayCaseInsensitive(Array.isArray(s.assignedCourses)?s.assignedCourses:[],course?[course]:[]);const updates={assignedTutorIds,assignedCourses,autoAssignedUpdatedAt:Date.now()};const tutor=user(tutorId);if(tutor.university&&!s.university)updates.university=tutor.university;await db.ref('users/'+studentId).update(updates);await db.ref('assignmentEvents').push({type:'auto_assignment',studentId,tutorId,course,status:'active',createdAt:Date.now()});}
function publicTutorProfilesPage(){const ps=list(DATA.publicTutors||{}).sort((a,b)=>(a.name||'').localeCompare(b.name||''));$("content").innerHTML=`<div class="card"><h2>Tutor Profiles</h2><p class="admin-note"><b>Tutor Profiles = public visibility only.</b> Inactive here hides the outside public profile, but it does not change booking availability.</p>${ps.length?`<table class="table"><tr><th>Photo</th><th>Name</th><th>Status</th><th>University</th><th>Courses</th><th>Linked Booking Tutor</th><th>Actions</th></tr>${ps.map(p=>{const active=!p.hidden&&p.visible!==false;return `<tr><td><img class="profile-preview" src="${publicPhoto(p)}" onerror="this.src='scheduled-icon.jpeg'"></td><td>${orgEsc(p.name||'')}</td><td><span class="org-dot ${active?'active':'inactive'}">${active?'Active':'Inactive'}</span></td><td>${orgEsc(p.university||'')}</td><td>${orgEsc((p.courses||[]).join(', '))}</td><td>${p.linkedTutorId?(orgEsc(user(p.linkedTutorId).name||'Linked')):'Not linked'}</td><td><button onclick="editPublicTutorProfile('${p.id}')">Edit</button><button onclick="editPublicTutorPhoto('${p.id}')">Photo</button><button class="ghost" onclick="togglePublicTutorProfileStatus('${p.id}')">Set ${active?'Inactive':'Active'}</button><button class="danger" onclick="deletePublicTutorProfile('${p.id}')">Delete</button></td></tr>`}).join('')}</table>`:`<p class='muted'>No public tutor profiles yet.</p>`}<hr><h3>Add Public Tutor Profile</h3><div class="row"><input id="pname" placeholder="Tutor name"><input id="puniversity" placeholder="University"><input id="prate" type="number" placeholder="Hourly rate"><select id="plink"><option value="">No linked booking tutor account</option>${tutors().map(t=>`<option value="${t.id}">${orgEsc(t.name)} — ${orgEsc(t.email)}</option>`).join('')}</select></div><input id="pcourses" placeholder="Courses taught, comma separated"><input id="plocations" placeholder="Locations, comma separated"><label>Profile picture</label><input id="pphotoFile" type="file" accept="image/*"><textarea id="pdesc" placeholder="Description / teaching style"></textarea><button onclick="addPublicTutorProfile()">Add Public Profile</button></div>`;}
async function togglePublicTutorProfileStatus(id){const p=(DATA.publicTutors||{})[id];const active=!p.hidden&&p.visible!==false;await db.ref('publicTutors/'+id).update({hidden:active,visible:!active,updatedAt:Date.now()});await loadData();publicTutorProfilesPage();}
function adminCourses(){const courses=orgAllCourses();$("content").innerHTML=`<div class="card"><h2>Course Management</h2><div class="org-course-grid">${courses.map(c=>{const relatedTutors=tutors().filter(t=>(t.courses||[]).includes(c));const studentCount=students().filter(s=>orgStudentCourses(s.id).includes(c)).length;const sessions=list(DATA.bookings||{}).filter(b=>b.course===c&&(b.date||'').startsWith(currentMonth())).length;return `<div class="org-course-card"><h3>${orgEsc(c)}</h3><p>Tutors: ${relatedTutors.length}</p><p>Students: ${studentCount}</p><p>Sessions this month: ${sessions}</p></div>`}).join('')||"<p class='muted'>No courses yet.</p>"}</div><hr><h3>Assign Course to Booking Tutor</h3><div class="row"><select id="ct">${tutors().map(t=>`<option value="${t.id}">${orgEsc(t.name||t.email)}</option>`).join('')}</select><input id="cn" placeholder="Course name exactly: PHYS213"></div><button onclick="assignCourse()">Assign Course</button></div>`;}
