import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";

// 🔥 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB_PymE3aacSLID0EZduTVTwXfqiC9-lts",
  authDomain: "iqzad-tap-eran-halal-crypto.firebaseapp.com",
  projectId: "iqzad-tap-eran-halal-crypto",
  storageBucket:"iqzad-tap-eran-halal-crypto.appspot.com",
  messagingSenderId: "94523079394",
  appId: "1:94523079394:web:5db9e23146eed248297cbb",
  measurementId: "G-RT0Y3Z9Y24"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// UI references
const pointsEl = document.getElementById('points');
const energyEl = document.getElementById('energy');
const timeLeftEl = document.getElementById('timeleft');
const dailyEl = document.getElementById('daily');
const energyFill = document.getElementById('energyFill');
const tapBtn = document.getElementById('tapBtn');
const authArea = document.getElementById('auth-area');
const myRefCodeEl = document.getElementById('myRefCode');
const shareLink = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const withdrawBtn = document.getElementById('withdrawBtn');

// nav & panels
const navHome = document.getElementById('navHome');
const navWithdraw = document.getElementById('navWithdraw');
const navInvite = document.getElementById('navInvite');
const navSocial = document.getElementById('navSocial');
const panels = {
  home: document.getElementById('tap-screen'),
  withdraw: document.getElementById('withdraw-panel'),
  invite: document.getElementById('invite-panel'),
  social: document.getElementById('social-panel')
};

// Social links
const socialLinks = {
  yt: "https://www.youtube.com/@Iqzad-Tokans-official",
  x: "https://x.com/IqzadO75376",
  ig: "https://www.instagram.com/iqzadofficial",
  tt: "https://www.tiktok.com/@iqzad.official",
  fb: "https://www.facebook.com/share/1GHNMPeX8W/",
  wa: "https://whatsapp.com/channel/0029Vb6C3kN2phHLMCcenQ1I"
};
document.getElementById('s_yt').href = socialLinks.yt;
document.getElementById('s_x').href = socialLinks.x;
document.getElementById('s_ig').href = socialLinks.ig;
document.getElementById('s_tt').href = socialLinks.tt;
document.getElementById('s_fb').href = socialLinks.fb;
document.getElementById('s_wa').href = socialLinks.wa;

// Local state
let state = { uid:null, points:0, buffer:0, energy:2500, maxEnergy:2500, daily:0, maxDaily:3600 };

// Helpers
function showToast(msg){
  const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);
  setTimeout(()=>d.remove(),2500);
}
function switchPanel(name){
  Object.values(panels).forEach(p=>p.classList.remove('active'));
  panels[name].classList.add('active');
  [navHome,navWithdraw,navInvite,navSocial].forEach(b=>b.classList.remove('active'));
  if(name==='home') navHome.classList.add('active');
  if(name==='withdraw') navWithdraw.classList.add('active');
  if(name==='invite') navInvite.classList.add('active');
  if(name==='social') navSocial.classList.add('active');
}
navHome.onclick=()=>switchPanel('home');
navWithdraw.onclick=()=>switchPanel('withdraw');
navInvite.onclick=()=>switchPanel('invite');
navSocial.onclick=()=>switchPanel('social');

function updateUI(){
  pointsEl.textContent = state.points + state.buffer;
  energyEl.textContent = state.energy;
  dailyEl.textContent = `${Math.floor(state.daily/60)}:${String(state.daily%60).padStart(2,'0')}`;
  timeLeftEl.textContent = "59:59";
  energyFill.style.width = ((state.energy/state.maxEnergy)*100)+"%";
}

// Auth
onAuthStateChanged(auth, async (user)=>{
  if(user){
    state.uid = user.uid;
    authArea.innerHTML = `Signed in as <b>${user.displayName||user.email}</b> — <span id="logout" class="link-like">Logout</span>`;
    document.getElementById('logout').onclick=()=>signOut(auth);
    const uref=doc(db,'users',user.uid);
    const snap=await getDoc(uref);
    if(!snap.exists()){
      await setDoc(uref,{points:0,energy:2500,daily:0,refCode:"IQZ"+user.uid.slice(0,6)});
    }
    const data=(await getDoc(uref)).data();
    state.points=data.points;state.energy=data.energy;state.daily=data.daily;myRefCodeEl.textContent=data.refCode;
    shareLink.value=location.origin+"?ref="+data.refCode;
    updateUI();
  } else {
    authArea.innerHTML=`<button id="glogin" class="gold-btn">Sign in with Google</button>`;
    document.getElementById('glogin').onclick=()=>signInWithPopup(auth,googleProvider).catch(e=>showToast(e.message));
  }
});

// Tap button
tapBtn.onclick=()=>{
  if(state.energy<=0) return showToast("No energy!");
  if(state.daily>=state.maxDaily) return showToast("Daily limit reached!");
  state.buffer++;state.energy--;state.daily++;updateUI();
};

// Auto save
setInterval(async()=>{
  if(state.uid && state.buffer>0){
    state.points+=state.buffer;
    const add=state.buffer;state.buffer=0;
    await updateDoc(doc(db,'users',state.uid),{points:state.points,energy:state.energy,daily:state.daily});
  }
},2000);

// Copy referral
copyBtn.onclick=()=>{shareLink.select();document.execCommand('copy');showToast("Link copied");};
shareBtn.onclick=()=>{navigator.share?navigator.share({url:shareLink.value}):showToast("Sharing not supported");};

// Withdraw button
withdrawBtn.onclick=()=>{window.open("https://forms.gle/WTK4DaWgmuCx6yZR7","_blank");showToast("Withdrawal form opened");};

// Social reward
async function reward(key){
  if(!state.uid) return showToast("Sign in first");
  const uref=doc(db,'users',state.uid);const snap=await getDoc(uref);const d=snap.data();
  if(d['reward_'+key]) return showToast("Already rewarded");
  await updateDoc(uref,{points:d.points+100,["reward_"+key]:true});
  state.points+=100;updateUI();showToast("+100 IQZ for following!");
}
['yt','x','ig','tt','fb','wa'].forEach(k=>{
  document.getElementById('s_'+k).onclick=(e)=>{e.preventDefault();window.open(socialLinks[k]);setTimeout(()=>reward(k),1000);};
});
