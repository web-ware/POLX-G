import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getDatabase, ref, get, set, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const $=s=>document.querySelector(s);
const seasons=["الربيع","الصيف","الخريف","الشتاء"];
const FLAGS={DZ:"🇩🇿",MA:"🇲🇦",TN:"🇹🇳",EG:"🇪🇬",LY:"🇱🇾",MR:"🇲🇷",ES:"🇪🇸",FR:"🇫🇷",IT:"🇮🇹",DE:"🇩🇪",GB:"🇬🇧",US:"🇺🇸",CA:"🇨🇦",BR:"🇧🇷",AR:"🇦🇷",MX:"🇲🇽",CN:"🇨🇳",JP:"🇯🇵",IN:"🇮🇳",RU:"🇷🇺",TR:"🇹🇷",SA:"🇸🇦",AE:"🇦🇪",QA:"🇶🇦",IQ:"🇮🇶",IR:"🇮🇷",PK:"🇵🇰",UA:"🇺🇦",AU:"🇦🇺",ZA:"🇿🇦"};
const BASE={DZ:[46,267],MA:[38,146],TN:[12,51],EG:[112,395],LY:[7,50],FR:[68,3050],DE:[84,4700],GB:[69,3600],IT:[59,2300],ES:[49,1700],US:[340,29000],CA:[41,2200],BR:[216,2200],AR:[46,650],MX:[130,1800],CN:[1410,18500],JP:[124,4200],IN:[1420,3900],RU:[144,2100],TR:[86,1100],SA:[37,1080],AE:[10,540],QA:[3,220],IQ:[46,280],IR:[89,430],PK:[250,370],UA:[38,180],AU:[27,1700],ZA:[63,400]};
let world={year:2026,season:"الربيع",turn:1,countries:{},news:[{title:"البداية",text:"العالم مفتوح. الدول غير المحجوزة تنتظر حكامها."}]};
let myCode="",myCountryId="",spectator=false,selectedId="",globeRoot=null,mapSeries=null,setupRoot=null;
const initialCountry=(id,name)=>{const b=BASE[id]||[10,80];return{id,name:name||id,color:"#4d514b",ownerUid:null,ownerCode:null,leaderName:null,pop:b[0],gdp:b[1],treasury:120,approval:65,stability:70,army:35,industry:45,prestige:10,relations:{},alliances:{},trade:{},wars:{},occupation:{}}};
function esc(x){return String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
function money(n){return "$"+Math.round(n||0).toLocaleString()+"B"}
function toast(t){$("#toast").textContent=t;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2200)}
function code(){return Math.random().toString(36).slice(2,8).toUpperCase()}
async function authReady(){if(!auth.currentUser)await signInAnonymously(auth)}
async function seed(){const r=ref(db,"world");const x=await get(r);if(!x.exists())await set(r,world)}
function setScreen(id){["loginScreen","setupScreen","gameScreen"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id))}
function my(){return myCountryId&&world.countries?.[myCountryId]}
function stat(label,val,pct){return '<div><span>'+label+'</span><b>'+val+'</b><i><u style="width:'+Math.max(0,Math.min(100,pct||0))+'%"></u></i></div>'}
function render(){
 const c=my();$("#topStats").innerHTML=c?[
 ["💰","الخزينة",money(c.treasury)],["👥","السكان",c.pop+"M"],["📈","الاقتصاد",money(c.gdp)],["😊","الرضا",c.approval+"%"],["🛡️","الجيش",c.army],["⭐","الهيبة",c.prestige]
 ].map(x=>'<div class="topStat"><span>'+x[0]+" "+x[1]+'</span><b>'+x[2]+"</b></div>").join(""):"<div class='topStat'><span>الوضع</span><b>مشاهدة فقط</b></div>";
 $("#turnLabel").textContent=world.year+" • "+world.season+" • الدور "+world.turn;
 if(c){$("#myFlag").textContent=FLAGS[myCountryId]||"🏳️";$("#myName").textContent=c.name;$("#gdp").textContent=money(c.gdp);$("#stabilityBadge").textContent=c.stability>70?"مستقرة":c.stability>45?"متوترة":"أزمة";$("#myStats").innerHTML=stat("الاستقرار",c.stability,c.stability)+stat("رضا الشعب",c.approval,c.approval)+stat("الجيش",c.army,c.army)+stat("الصناعة",c.industry,c.industry)}
 else{$("#myFlag").textContent="🌍";$("#myName").textContent="مشاهد";$("#gdp").textContent="—";$("#myStats").innerHTML=stat("العالم",Object.keys(world.countries||{}).length,Math.min(100,Object.keys(world.countries||{}).length))}
 $("#newsCount").textContent=(world.news||[]).length;$("#news").innerHTML=(world.news||[]).slice(0,8).map(n=>'<article class="newsItem"><b>'+esc(n.title)+'</b><p>'+esc(n.text)+'</p></article>').join("");
 renderTarget();renderRelations()
}
function renderTarget(){
 const c=world.countries?.[selectedId];$("#selectedHint").textContent=c?c.name:"اختر دولة من الخريطة";$("#targetFlag").textContent=FLAGS[selectedId]||"🏳️";$("#targetName").textContent=c?c.name:"الدولة المحددة";$("#targetOwner").textContent=c?.ownerCode?"لاعب":"محايدة";
 if(!c){$("#targetInfo").textContent="اضغط دولة على الخريطة.";$("#targetActions").innerHTML="";return}
 $("#targetInfo").innerHTML='<div class="targetGrid">'+[["السكان",c.pop+"M"],["الناتج",money(c.gdp)],["الخزينة",money(c.treasury)],["الرضا",c.approval+"%"],["الاستقرار",c.stability+"%"],["الجيش",c.army],["الصناعة",c.industry],["العلاقة",my()&&selectedId!==myCountryId?((my().relations||{})[selectedId]??0):"—"]].map(x=>'<div class="metric"><small>'+x[0]+'</small><b>'+esc(x[1])+'</b></div>').join("")+"</div>";
 if(spectator||!my()||selectedId===myCountryId){$("#targetActions").innerHTML="";return}
 const rel=my().relations?.[selectedId]??0,ally=!!my().alliances?.[selectedId];
 $("#targetActions").innerHTML=(c.ownerCode?[
 '<button data-act="trade">📦 تجارة</button>',
 '<button data-act="alliance">'+(ally?"🤝 متحالف":"🛡️ طلب تحالف")+"</button>",
 '<button data-act="moneyAid" '+(!ally?"disabled":"")+'>💰 مساعدة مالية</button>',
 '<button data-act="armyAid" '+(!ally?"disabled":"")+'>🛡️ مساعدة جيش</button>',
 '<button data-act="war">⚔️ إعلان حرب</button>',
 '<button data-act="diplomacy">🕊️ تحسين العلاقات</button>'
 ]:[
 '<button data-act="colonize">🏴 نفوذ سياسي</button>',
 '<button data-act="trade">📦 فتح تجارة</button>'
 ]).join("");
 document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>doAction(b.dataset.act,selectedId))
}
function renderRelations(){
 const arr=Object.values(world.countries||{}).filter(c=>c.ownerCode);
 $("#relations").innerHTML=arr.length?arr.map(c=>{const r=my()?(my().relations?.[c.id]??0):0;return '<div class="rel"><span class="flag">'+(FLAGS[c.id]||"🏳️")+'</span><div><b>'+esc(c.name)+'</b><small>'+esc(c.leaderName||"حاكم مجهول")+'</small></div><meter min="-100" max="100" value="'+r+'"></meter></div>'}).join(""):"<small class='muted'>لا توجد دول لاعبين بعد.</small>"
}
function paint(series){
 series.mapPolygons.template.adapters.add("fill",(fill,t)=>{const id=String(t.dataItem?.get("id")||"").toUpperCase(),c=world.countries?.[id];if(c?.ownerCode)return am5.color(c.color||"#4d514b");if(c)return am5.color(0x303a35);return fill});
}
function makeGlobe(el,setup=false){
 const root=am5.Root.new(el);if(setup)setupRoot=root;else globeRoot=root;root.setThemes([am5themes_Animated.new(root)]);
 const chart=root.container.children.push(am5map.MapChart.new(root,{projection:am5map.geoOrthographic(),panX:"rotateX",panY:"rotateY",wheelY:"zoom",minZoomLevel:.7,maxZoomLevel:4,zoomLevel:1.05}));
 const bg=chart.series.push(am5map.MapPolygonSeries.new(root,{}));bg.data.push({geometry:am5map.getGeoRectangle(90,180,-90,-180)});bg.mapPolygons.template.setAll({fill:am5.color(0x10201a),fillOpacity:1,strokeOpacity:0});
 const grid=chart.series.push(am5map.GraticuleSeries.new(root,{}));grid.mapLines.template.setAll({stroke:am5.color(0x6d756e),strokeOpacity:.12});
 const s=chart.series.push(am5map.MapPolygonSeries.new(root,{geoJSON:am5geodata_worldLow}));if(!setup)mapSeries=s;s.mapPolygons.template.setAll({fill:am5.color(0x36413b),fillOpacity:.92,stroke:am5.color(0x111914),strokeWidth:.55,tooltipText:"{name}"});paint(s);s.mapPolygons.template.states.create("hover",{fill:am5.color(0xd1b66b),fillOpacity:1});
 s.mapPolygons.template.events.on("click",ev=>{const id=String(ev.target.dataItem?.get("id")||"").toUpperCase();if(setup){if(world.countries?.[id]?.ownerCode){toast("هذه الدولة محجوزة");return}selectedId=id;$("#selectedCountry").textContent=(ev.target.dataItem?.get("name")||id)+" • "+id}else{selectedId=id;renderTarget()}});
 chart.appear(700,50);return chart
}
async function refreshWorld(){const s=await get(ref(db,"world"));if(s.exists()){world=s.val();world.countries??={};world.news??=[];render();if(mapSeries)mapSeries.mapPolygons.invalidate("fill")}}
async function login(){
 await authReady();const raw=$("#accessCode").value.trim().toUpperCase();if(!raw){$("#loginStatus").textContent="اكتب الكود أولاً.";return}
 const s=await get(ref(db,"players/"+raw));if(!s.exists()){$("#loginStatus").textContent="الكود غير موجود.";return}
 const p=s.val();myCode=raw;myCountryId=p.countryId;spectator=false;setScreen("gameScreen");toast("تم الدخول");render()
}
async function register(){
 await authReady();selectedId="";$("#selectedCountry").textContent="لم تختر دولة بعد";setScreen("setupScreen");if(!setupRoot)makeGlobe("setupGlobe",true);else setupRoot.container.children.getIndex(0)?.children?.each?.(()=>{});
}
async function createCountry(){
 const id=selectedId,n=($("#countryName").value.trim()||"دولة جديدة"),leader=($("#leaderName").value.trim()||"حاكم"),color=$("#countryColor").value;if(!id){toast("اختار دولة من الكرة");return}
 const cRef=ref(db,"world/countries/"+id);const result=await runTransaction(cRef,current=>{if(current?.ownerCode)return;const c=initialCountry(id,n);c.name=n;c.color=color;c.ownerUid=auth.currentUser.uid;c.ownerCode="PENDING";c.leaderName=leader;return c});
 if(!result.committed){toast("الدولة حُجزت قبل وصولك");return}
 let ccode=code();while((await get(ref(db,"players/"+ccode))).exists())ccode=code();
 await set(ref(db,"players/"+ccode),{uid:auth.currentUser.uid,countryId:id,leaderName:leader,createdAt:Date.now()});
 await runTransaction(cRef,c=>{if(!c||c.ownerUid!==auth.currentUser.uid)return c;c.ownerCode=ccode;return c});
 myCode=ccode;myCountryId=id;spectator=false;toast("دولتك تأسست • الكود: "+ccode);setScreen("gameScreen");await refreshWorld()
}
function addNews(state,title,text){state.news=state.news||[];state.news.unshift({title,text});state.news=state.news.slice(0,20)}
async function doAction(action,targetId){
 if(!my()||spectator||targetId===myCountryId)return;
 const mine=myCountryId;let msg="";
 await runTransaction(ref(db,"world"),w=>{if(!w)return w;const a=w.countries?.[mine],b=w.countries?.[targetId];if(!a||!b||a.ownerUid!==auth.currentUser.uid)return w;a.relations??={};a.alliances??={};b.relations??={};b.alliances??={};
 if(action==="diplomacy"){a.relations[targetId]=Math.min(100,(a.relations[targetId]??0)+10);b.relations[mine]=Math.min(100,(b.relations[mine]??0)+4);msg="تحسنت العلاقات."}
 if(action==="trade"){if((a.relations[targetId]??0)<0){msg="العلاقة سيئة؛ حسّنها أولاً."}else{a.treasury-=10;a.gdp+=5;b.treasury+=8;b.gdp+=3;a.relations[targetId]=Math.min(100,(a.relations[targetId]??0)+4);b.relations[mine]=Math.min(100,(b.relations[mine]??0)+4);msg="تم فتح خط تجاري."}}
 if(action==="alliance"){if((a.relations[targetId]??0)<40){msg="العلاقة تحتاج 40+ لاقتراح التحالف."}else{a.alliances[targetId]=true;b.alliances[mine]=true;msg="تم إنشاء التحالف."}}
 if(action==="moneyAid"){if(!a.alliances?.[targetId]||a.treasury<25){msg="لا يمكن تقديم المساعدة."}else{a.treasury-=25;b.treasury+=25;b.approval=Math.min(100,b.approval+2);msg="أرسلت مساعدة مالية."}}
 if(action==="armyAid"){if(!a.alliances?.[targetId]||a.army<5){msg="لا يمكن تقديم المساعدة."}else{const x=Math.max(1,Math.floor(a.army*.25));a.army-=x;b.army+=x;msg="أرسلت 25% من قوتك العسكرية."}}
 if(action==="war"){if(a.stability<20){msg="الاستقرار منخفض جداً."}else{a.wars[targetId]=true;b.wars[mine]=true;a.relations[targetId]=-100;b.relations[mine]=-100;msg="بدأ النزاع داخل اللعبة."}}
 if(action==="colonize"){b.approval=Math.max(0,b.approval-2);a.prestige=Math.min(100,a.prestige+2);msg="زاد نفوذك السياسي."}
 addNews(w,"دبلوماسية",a.name+" • "+msg);return w});
 toast(msg||"تم تنفيذ القرار")
}
async function quick(type){
 if(!my()||spectator)return;
 const mine=myCountryId;
 await runTransaction(ref(db,"world"),w=>{const a=w?.countries?.[mine];if(!a||a.ownerUid!==auth.currentUser.uid)return w;
 if(type==="economy"&&a.treasury>=30){a.treasury-=30;a.gdp+=12;a.industry=Math.min(100,a.industry+4);a.approval=Math.max(0,a.approval-1)}
 if(type==="army"&&a.treasury>=25){a.treasury-=25;a.army=Math.min(100,a.army+5);a.stability=Math.max(0,a.stability-1)}
 if(type==="research"&&a.treasury>=35){a.treasury-=35;a.industry=Math.min(100,a.industry+7);a.gdp+=6}
 if(type==="diplomacy"){Object.keys(w.countries||{}).forEach(id=>{if(id!==mine&&w.countries[id].ownerCode)a.relations[id]=Math.min(100,(a.relations[id]??0)+3)})}
 addNews(w,"قرار داخلي",a.name+" نفذت قراراً جديداً.");return w});toast("تم تنفيذ القرار")
}
async function endTurn(){
 if(!my()||spectator){toast("وضع المشاهدة لا يمرر الأدوار");return}
 const mine=myCountryId;
 await runTransaction(ref(db,"world"),w=>{const a=w?.countries?.[mine];if(!a||a.ownerUid!==auth.currentUser.uid)return w;
 w.turn=(w.turn||1)+1;w.season=seasons[(w.turn-1)%4];if(w.turn%4===1)w.year=(w.year||2026)+1;
 Object.values(w.countries||{}).forEach(c=>{if(c.ownerCode){c.treasury=Math.max(0,c.treasury+Math.floor(c.gdp*.015));c.approval=Math.max(0,Math.min(100,c.approval+(c.stability>60?1:-1)));for(const target of Object.keys(c.wars||{})){if(!c.wars[target])continue;const e=w.countries[target];if(!e)continue;const swing=Math.max(1,Math.floor((c.army-e.army)/15)+2);e.stability=Math.max(0,e.stability-swing);e.army=Math.max(0,e.army-Math.max(1,Math.floor(swing/2)));c.army=Math.max(0,c.army-Math.max(1,Math.floor(swing/3)));e.occupation??={};e.occupation[mine]=Math.min(100,(e.occupation[mine]||0)+Math.max(1,swing));if(e.occupation[mine]>=100){e.ownerUid=c.ownerUid;e.ownerCode=c.ownerCode;e.leaderName=c.leaderName;e.color=c.color;e.wars={};c.wars[target]=false}}}});addNews(w,"نهاية الدور","مرت مرحلة جديدة وتحركت الاقتصادات والعلاقات.");return w});toast("انتهى الدور")
}
function command(){
 const q=$("#command").value.trim();if(!q)return;
 const l=q.toLowerCase();if(l.includes("اقتصاد")||l.includes("استثمار"))quick("economy");else if(l.includes("جيش")||l.includes("دفاع"))quick("army");else if(l.includes("بحث")||l.includes("تطوير"))quick("research");else if(l.includes("دبلوماس"))quick("diplomacy");else toast("استعمل أوامر سريعة أو اختر دولة من الخريطة")
}
$("#loginScreen #registerBtn").onclick=register;$("#loginScreen #watchBtn").onclick=async()=>{await authReady();spectator=true;setScreen("gameScreen");toast("دخلت كمشاهد");render()};$("#accessCode").onkeydown=e=>{if(e.key==="Enter")login()};$("#backLoginBtn").onclick=()=>setScreen("loginScreen");$("#createCountryBtn").onclick=createCountry;$("#executeBtn").onclick=command;$("#endTurnBtn").onclick=endTurn;$("#saveBtn").onclick=()=>toast("الحالة محفوظة تلقائياً في Firebase");$("#logoutBtn").onclick=()=>{spectator=false;myCode="";myCountryId="";setScreen("loginScreen")};
document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>quick(b.dataset.action));document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("active"));b.classList.add("active");const mode=b.dataset.mode;if(mapSeries)mapSeries.mapPolygons.template.adapters.add("fill",(fill,t)=>{const id=String(t.dataItem?.get("id")||"").toUpperCase(),c=world.countries?.[id];if(!c)return fill;if(mode==="economy")return am5.color(c.gdp>5000?"#6e8fd1":c.gdp>1000?"#5b7db6":"#465f78");if(mode==="relations"){const r=my()?.relations?.[id]??0;return am5.color(r>40?"#3e9272":r>=0?"#547d6c":"#785f54")}return am5.color(c.color||"#4d514b")})});
$("#command").onkeydown=e=>{if(e.key==="Enter")command()};
async function boot(){try{await authReady();await seed();onValue(ref(db,"world"),s=>{if(s.exists()){world=s.val();world.countries??={};render();if(mapSeries)mapSeries.mapPolygons.invalidate("fill")}});makeGlobe("globe");}catch(e){$("#loginStatus").textContent="Firebase غير مهيأ: افتح config.js وضع إعدادات مشروعك.";console.error(e)}}
boot();
