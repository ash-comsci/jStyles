/* ===== EDIT THESE DETAILS ===== */
const CONFIG = {
  price: "$40",
  deadline: "2026-11-20T23:59:00",          // order deadline (local time)
  deadlineText: "Fri, November 20th",
  pickup: "ASH Drama Guild Room",
  pickupLong: "Hoodies will be handed out to students in the ASH Drama Guild Room once they arrive. We'll announce the pickup date in class and on the morning announcements."
};
/* ============================== */

document.querySelectorAll("[data-cfg]").forEach(el => el.textContent = CONFIG[el.dataset.cfg]);

/* size data (inches) */
const SIZES = {
  youth: { cols:["Size","Age guide","Hoodie chest","Body length","Sleeve","Fits chest","Fits waist"],
    rows:[["XS","4–6",32,20,25,[24,25],[22,23]],["S","8–10",34,21,27,[26,27],[24,25]],["M","10–12",36,23,29,[28,29],[26,27]],["L","14–16",38,25,31,[30,31],[28,29]],["XL","18–20",40,26,33,[32,33],[30,31]]],
    num:[2,3,4,5,6] },
  adult: { cols:["Size","Hoodie chest","Body length","Sleeve","Fits chest","Fits waist"],
    rows:[["XS",36,26.25,34,[29,32],[26,28]],["S",40,27.5,35,[33,36],[29,31]],["M",44,28.75,36,[37,40],[32,34]],["L",48,30,37,[41,44],[35,37]],["XL",52,31,38,[45,48],[38,40]],["2XL",56,32.25,39,[49,52],[41,43]],["3XL",60,33.5,40,[53,56],[44,46]],["4XL",64,34.5,41,[57,60],[47,49]]],
    num:[1,2,3,4,5] }
};
const units = {youth:"in", adult:"in"};
const fmt = (v,u) => {
  if (Array.isArray(v)) return v.map(x=>fmt(x,u)).join("–");
  if (u==="cm") return Math.round(v*2.54);
  const w=Math.floor(v), fr={0.25:"¼",0.5:"½",0.75:"¾"}[+(v-w).toFixed(2)];
  return fr ? w+" "+fr : v;
};
function renderTable(k){
  const d=SIZES[k], u=units[k];
  let h="<table><thead><tr>"+d.cols.map((c,i)=>`<th>${c}${d.num.includes(i)?` <span style="opacity:.7;font-weight:400">(${u})</span>`:""}</th>`).join("")+"</tr></thead><tbody>";
  d.rows.forEach(r=>{ h+="<tr>"+r.map((c,i)=>`<td>${d.num.includes(i)?fmt(c,u):c}</td>`).join("")+"</tr>"; });
  document.getElementById("tbl-"+k).innerHTML=h+"</tbody></table>";
  // column hover highlight
  const t=document.querySelector("#tbl-"+k+" table");
  t.querySelectorAll("td,th").forEach(cell=>{
    cell.addEventListener("mouseenter",()=>{const i=cell.cellIndex;if(i===0)return;t.querySelectorAll("tr").forEach(tr=>tr.children[i]&&tr.children[i].classList.add("colhi"))});
    cell.addEventListener("mouseleave",()=>t.querySelectorAll(".colhi").forEach(c=>c.classList.remove("colhi")));
  });
}
renderTable("youth"); renderTable("adult");
document.querySelectorAll("[data-unit-for]").forEach(seg=>{
  seg.addEventListener("click",e=>{
    const b=e.target.closest("button"); if(!b) return;
    seg.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
    units[seg.dataset.unitFor]=b.dataset.v; renderTable(seg.dataset.unitFor);
  });
});

/* modals */
let lastFocus=null;
function openModal(k){ lastFocus=document.activeElement; const m=document.getElementById("modal-"+k); m.classList.add("open"); document.body.style.overflow="hidden"; m.querySelector(".x").focus(); try{history.replaceState(null,"","#"+k+"-sizes")}catch(e){} }
function closeModals(){ document.querySelectorAll(".modal.open").forEach(m=>m.classList.remove("open")); document.body.style.overflow=""; if(lastFocus) lastFocus.focus(); try{history.replaceState(null,"","#sizing")}catch(e){} }
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.open)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{ if(e.target===m||e.target.closest("[data-close]")) closeModals(); }));
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModals(); });
function hashRoute(){ const h=location.hash; if(h==="#youth-sizes") openModal("youth"); else if(h==="#adult-sizes") openModal("adult"); }
window.addEventListener("hashchange",hashRoute); hashRoute();

/* size finder */
const f={group:"youth",unit:"in"};
function segBind(id,key){ const s=document.getElementById(id); s.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;s.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));f[key]=b.dataset.v;findSize();}); }
segBind("fGroup","group"); segBind("fUnit","unit");
const fIn=document.getElementById("fChest"), fOut=document.getElementById("fResult");
fIn.addEventListener("input",findSize);
function findSize(){
  let v=parseFloat(fIn.value);
  if(!v||v<=0){ fOut.innerHTML="Enter a chest measurement to see your size."; return; }
  if(f.unit==="cm") v=v/2.54;
  const d=SIZES[f.group], fi=d.cols.indexOf("Fits chest");
  const rows=d.rows; let pick=null;
  for(const r of rows){ if(v<=r[fi][1]){ pick=r; break; } }
  if(!pick){
    fOut.innerHTML = f.group==="youth"
      ? `<span class="sz">Adult</span> That's larger than youth XL. Switch to <b>Adult</b> to find a size.`
      : `<span class="sz">4XL+</span> Larger than our biggest size. Contact the Music Department and we'll do our best to help.`;
    return;
  }
  const small = v < rows[0][fi][0]-2;
  fOut.innerHTML = `<span class="sz">${f.group==="youth"?"Youth ":"Adult "}${pick[0]}</span>` +
    (small? "This is our smallest size, so it may fit a little roomy." : "This should be a comfortable fit. Size up for a looser look.");
  fOut.animate([{transform:"scale(.96)"},{transform:"scale(1)"}],{duration:250});
}

/* countdown */
function tick(){
  const el=document.getElementById("countdown"); const diff=new Date(CONFIG.deadline)-new Date();
  if(diff<=0){ el.innerHTML='<div style="padding:8px 12px"><b style="font-size:1rem">Orders closed</b></div>'; return; }
  const d=Math.floor(diff/864e5), h=Math.floor(diff/36e5)%24, m=Math.floor(diff/6e4)%60, s=Math.floor(diff/1e3)%60;
  el.innerHTML=[[d,"days"],[h,"hrs"],[m,"min"],[s,"sec"]].map(([n,l])=>`<div><b>${String(n).padStart(2,"0")}</b><small>${l}</small></div>`).join("");
}
tick(); setInterval(tick,1000);

/* floating notes */
const glyphs=["♪","♫","♬","♩","𝄞"], notes=document.getElementById("notes");
for(let i=0;i<16;i++){ const n=document.createElement("span"); n.className="note"; n.textContent=glyphs[i%glyphs.length];
  n.style.left=Math.random()*100+"%"; n.style.bottom=(-20+Math.random()*40)+"px"; n.style.fontSize=(1.2+Math.random()*1.8)+"rem";
  n.style.animationDuration=(9+Math.random()*9)+"s"; n.style.animationDelay=(-Math.random()*16)+"s"; notes.appendChild(n); }

/* marquee */
const phrase='<span>ALL SAINTS HARMONICS <i>♪</i></span><span>SING <i>♫</i></span><span>PLAY <i>♬</i></span><span>BELONG <i>♪</i></span><span>WEAR THE MUSIC <i>♫</i></span>';
document.getElementById("track").innerHTML=phrase.repeat(4);

/* 3D tilt + magnifier */
const prod=document.getElementById("product"), box=document.getElementById("imgbox"), lens=document.getElementById("lens"), img=document.getElementById("heroImg");
const fine = matchMedia("(hover:hover)").matches;
if(fine){
  prod.addEventListener("mousemove",e=>{ const r=prod.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    prod.style.transform=`rotateY(${x*12}deg) rotateX(${-y*12}deg)`; });
  prod.addEventListener("mouseleave",()=>prod.style.transform="");
  box.addEventListener("mousemove",e=>{
    const r=box.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top, z=2.6;
    lens.style.left=(x-85)+"px"; lens.style.top=(y-85)+"px";
    lens.style.backgroundImage=`url(${img.src})`;
    lens.style.backgroundSize=`${r.width*z}px ${r.height*z}px`;
    lens.style.backgroundPosition=`${-(x*z-85)}px ${-(y*z-85)}px`;
  });
}
/* spotlight on logo */
const spot=document.getElementById("spot");
spot.addEventListener("mousemove",e=>{const r=spot.getBoundingClientRect(); spot.style.setProperty("--mx",(e.clientX-r.left)+"px"); spot.style.setProperty("--my",(e.clientY-r.top)+"px");});

/* flip on tap for touch */
document.querySelectorAll(".flip").forEach(c=>c.addEventListener("click",()=>{ if(!fine) c.classList.toggle("flipped"); }));

/* ripple on buttons */
document.querySelectorAll(".btn").forEach(b=>b.addEventListener("click",e=>{
  const r=b.getBoundingClientRect(), s=document.createElement("span"), d=Math.max(r.width,r.height);
  s.className="ripple"; s.style.width=s.style.height=d+"px"; s.style.left=(e.clientX-r.left-d/2)+"px"; s.style.top=(e.clientY-r.top-d/2)+"px";
  b.appendChild(s); setTimeout(()=>s.remove(),600);
}));

/* music-note burst on click */
document.addEventListener("click",e=>{
  if(e.target.closest(".modal,input")) return;
  for(let i=0;i<6;i++){ const n=document.createElement("span"); n.className="burst"; n.textContent=glyphs[Math.floor(Math.random()*4)];
    n.style.left=e.clientX+"px"; n.style.top=e.clientY+"px";
    const a=Math.random()*Math.PI*2, dist=40+Math.random()*50;
    n.style.setProperty("--dx",Math.cos(a)*dist+"px"); n.style.setProperty("--dy",(Math.sin(a)*dist-30)+"px"); n.style.setProperty("--r",(Math.random()*90-45)+"deg");
    document.body.appendChild(n); setTimeout(()=>n.remove(),900); }
});

/* FAQ accordion */
document.querySelectorAll(".qa button").forEach(b=>b.addEventListener("click",()=>{
  const qa=b.parentElement, ans=qa.querySelector(".ans"), open=qa.classList.contains("open");
  document.querySelectorAll(".qa.open").forEach(o=>{o.classList.remove("open");o.querySelector(".ans").style.maxHeight=null;});
  if(!open){ qa.classList.add("open"); ans.style.maxHeight=ans.scrollHeight+"px"; }
}));

/* nav, progress, back-to-top */
const nav=document.getElementById("nav"), prog=document.getElementById("progress"), toTopBtn=document.getElementById("toTop");
addEventListener("scroll",()=>{ const y=scrollY, h=document.documentElement.scrollHeight-innerHeight;
  prog.style.width=(y/h*100)+"%"; nav.classList.toggle("scrolled",y>40); toTopBtn.classList.toggle("show",y>600); },{passive:true});
toTopBtn.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
document.getElementById("burger").addEventListener("click",()=>document.getElementById("links").classList.toggle("open"));
document.querySelectorAll(".links a").forEach(a=>a.addEventListener("click",()=>document.getElementById("links").classList.remove("open")));

/* reveal on scroll */
const io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target);} }),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
