import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getDatabase, ref, get, set, onValue, runTransaction, push, limitToLast, query } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const $=s=>document.querySelector(s);
const FLAGS={DZ:"🇩🇿",MA:"🇲🇦",TN:"🇹🇳",EG:"🇪🇬",LY:"🇱🇾",MR:"🇲🇷",ES:"🇪🇸",FR:"🇫🇷",IT:"🇮🇹",DE:"🇩🇪",GB:"🇬🇧",US:"🇺🇸",CA:"🇨🇦",BR:"🇧🇷",AR:"🇦🇷",MX:"🇲🇽",CN:"🇨🇳",JP:"🇯🇵",IN:"🇮🇳",RU:"🇷🇺",TR:"🇹🇷",SA:"🇸🇦",AE:"🇦🇪",QA:"🇶🇦",IQ:"🇮🇶",IR:"🇮🇷",PK:"🇵🇰",UA:"🇺🇦",AU:"🇦🇺",ZA:"🇿🇦"};
const BASE={DZ:[46,267],MA:[38,146],TN:[12,51],EG:[112,395],LY:[7,50],FR:[68,3050],DE:[84,4700],GB:[69,3600],IT:[59,2300],ES:[49,1700],US:[340,29000],CA:[41,2200],BR:[216,2200],AR:[46,650],MX:[130,1800],CN:[1410,18500],JP:[124,4200],IN:[1420,3900],RU:[144,2100],TR:[86,1100],SA:[37,1080],AE:[10,540],QA:[3,220],IQ:[46,280],IR:[89,430],PK:[250,370],UA:[38,180],AU:[27,1700],ZA:[63,400]};
let world={countries:{},news:[{title:"البداية",text:"العالم مفتوح، تحدث مع الحكام الآخرين وابدأ استراتيجيتك."}],chat:[]};
let myCode="",myCountryId="",spectator=false,selectedId="",globeRoot=null,mapSeries=null,setupRoot=null;

const initialCountry=(id,name)=>{const b=BASE[id]||[10,80];return{id,name:name||id,color:"#4d514b",ownerUid:null,ownerCode:null,leaderName:null,pop:b[0],gdp:b[1],treasury:120,approval:65,stability:70,army:35,industry:45,prestige:10,relations:{},alliances:{},trade:{},wars:{}}};
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
 const c=my();
 $("#topStats").innerHTML=c?[
  ["💰","الخزينة",money(c.treasury)],["👥","السكان",c.pop+"M"],["📈","الاقتصاد",money(c.gdp)],["😊","الرضا",c.approval+"%"],["🛡️","الجيش",c.army],["⭐","الهيبة",c.prestige]
 ].map(x=>'<div class="topStat"><span>'+x[0]+" "+x[1]+'</span><b>'+x[2]+"</b></div>").join(""):"<div class='topStat'><span>الوضع</span><b>مشاهدة فقط</b></div>";
 
 // إخفاء أو تغيير خانة الدور لأن اللعبة أصبحت مفتوحة (Real-time)
 $("#turnLabel").textContent="🌍 عالم مباشر حر";

 if(c){
  $("#myFlag").textContent=FLAGS[myCountryId]||"🏳️";
  $("#myName").textContent=c.name;
  $("#gdp").textContent=money(c.gdp);
  $("#stabilityBadge").textContent=c.stability>70?"مستقرة":c.stability>45?"متوترة":"أزمة";
  $("#myStats").innerHTML=stat("الاستقرار",c.stability,c.stability)+stat("رضا الشعب",c.approval,c.approval)+stat("الجيش",c.army,c.army)+stat("الصناعة",c.industry,c.industry)
 }else{
  $("#myFlag").textContent="🌍";$("#myName").textContent="مشاهد";$("#gdp").textContent="—";
  $("#myStats").innerHTML=stat("العالم",Object.keys(world.countries||{}).length,Math.min(100,Object.keys(world.countries||{}).length))
 }

 $("#newsCount").textContent=(world.news||[]).length;
 $("#news").innerHTML=(world.news||[]).slice(0,8).map(n=>'<article class="newsItem"><b>'+esc(n.title)+'</b><p>'+esc(n.text)+'</p></article>').join("");
 
 // عرض رسائل الدردشة في خانة الأخبار أو مكان مخصص إذا أردت، أو دمجها
 renderTarget();renderRelations();renderChat();
}

// عرض الدردشة في مكان الأخبار أو الأضواء
function renderChat(){
 const chatBox = $("#news"); // نقدر نخليهم يظهروا مع الأخبار أو تحتها
 const chats = world.chat || [];
 const chatHtml = chats.slice(-10).map(ch => '<article class="newsItem" style="border-color:#35b77a33"><b style="color:var(--accent)">💬 '+esc(ch.sender)+' ('+esc(ch.country)+'):</b><p>'+esc(ch.text)+'</p></article>').join("");
 if(chats.length > 0) {
   $("#news").innerHTML = chatHtml + "<hr style='border-color:var(--line);margin:8px 0'>" + $("#news").innerHTML;
 }
}

function renderTarget(){
 const c=world.countries?.[selectedId];
 $("#selectedHint").textContent=c?c.name:"اختر دولة من الخريطة";
 $("#targetFlag").textContent=FLAGS[selectedId]||"🏳️";
 $("#targetName").textContent=c?c.name:"الدولة المحددة";
 $("#targetOwner").textContent=c?.ownerCode?"لاعب":"محايدة";
 
 if(!c){$("#targetInfo").textContent="اضغط دولة على الخريطة.";$("#targetActions").innerHTML="";return}
 
 $("#targetInfo").innerHTML='<div class="targetGrid">'+[["السكان",c.pop+"M"],["الناتج",money(c.gdp)],["الخزينة",money(c.treasury)],["الرضا",c.approval+"%"],["الاستقرار",c.stability+"%"],["الجيش",c.army],["الصناعة",c.industry],["العلاقة",my()&&selectedId!==myCountryId?((my().relations||{})[selectedId]??0):"—"]].map(x=>'<div class="metric"><small>'+x[0]+'</small><b>'+esc(x[1])+'</b></div>').join("")+"</div>";
 
 if(spectator||!my()||selectedId===myCountryId){$("#targetActions").innerHTML="";return}
 const rel=my().relations?.[selectedId]??0,ally=!!my().alliances?.[selectedId];
 
 $("#targetActions").innerHTML=(c.ownerCode?[
 '<button data-act="trade">📦 تجارة</button>',
 '<button data-act="alliance">'+(ally?"🤝 متحالف":"🛡️ طلب تحالف")+"</button>",
 '<button data-act="moneyAid" '+(!ally?"disabled":"")+'>💰 مساعدة مالية</button>',
 '<button data-act="armyAid" '+(!ally?"disabled":"")+'>🛡️ مساعدة جيش</button>',
 '<button data-act="war" style="color:var(--danger);border-color:var(--danger)">⚔️ إعلان حرب فورية</button>',
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

async function refreshWorld(){const s=await get(ref(db,"world"));if(s.exists()){world=s.val();world.countries??={};world.news??=[];world.chat??=[];render();if(mapSeries)mapSeries.mapPolygons.invalidate("fill")}}

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

// --- إرسال رسالة في الدردشة العالمية (عبر شريط الكتابة السفلي) ---
async function sendChatMessage(){
 const input = $("#command");
 const text = input.value.trim();
 if(!text) return;
 
 const player = my();
 const senderName = player ? player.leaderName : (spectator ? "مشاهد" : "زائر");
 const countryName = player ? player.name : "عالمي";

 await runTransaction(ref(db,"world"), w => {
   if(!w) return w;
   w.chat = w.chat || [];
   w.chat.push({ sender: senderName, country: countryName, text: text, time: Date.now() });
   if(w.chat.length > 30) w.chat.shift(); // الحفاظ على آخر 30 رسالة فقط
   return w;
 });
 
 input.value = "";
}

// --- تنفيذ الأفعال الفورية (بما فيها إعلان الحرب الفوري) ---
async function doAction(action, targetId){
 if(!my()||spectator||targetId===myCountryId)return;
 const mine=myCountryId;let msg="";
 
 await runTransaction(ref(db,"world"),w=>{
   if(!w)return w;
   const a=w.countries?.[mine], b=w.countries?.[targetId];
   if(!a||!b||a.ownerUid!==auth.currentUser.uid)return w;
   
   a.relations??={}; a.alliances??={}; b.relations??={}; b.alliances??={}; b.wars??={}; a.wars??={};
   
   if(action==="diplomacy"){
     if(a.treasury < 10){ msg="تحتاج إلى 10$ لتحسين العلاقات."; return w; }
     a.treasury -= 10;
     a.relations[targetId] = Math.min(100, (a.relations[targetId]??0) + 6);
     msg="تحسنت العلاقات الدبلوماسية.";
   }
   else if(action==="trade"){
     if((a.relations[targetId]??0) < 10){ msg="العلاقة ضعيفة لفتح التجارة."; }
     else {
       a.treasury -= 15; a.gdp += 8; b.treasury += 12;
       a.relations[targetId] = Math.min(100, (a.relations[targetId]??0) + 5);
       msg="تم فتح خط تجاري فوري.";
     }
   }
   else if(action==="alliance"){
     if((a.relations[targetId]??0) < 60){ msg="العلاقة تحتاج 60+ للتحالف."; }
     else {
       a.alliances[targetId] = true; b.alliances[mine] = true;
       msg="تم إبرام التحالف رسمياً.";
     }
   }
   else if(action==="moneyAid"){
     if(!a.alliances?.[targetId] || a.treasury < 40){ msg="شروط المساعدة غير متوفرة."; }
     else {
       a.treasury -= 40; b.treasury += 40;
       msg="أرسلت مساعدة مالية فورية.";
     }
   }
   else if(action==="armyAid"){
     if(!a.alliances?.[targetId] || a.army < 10){ msg="جيشك لا يكفي للإرسال."; }
     else {
       const x = Math.max(2, Math.floor(a.army * 0.2));
       a.army -= x; b.army += x;
       msg="أرسلت تعزيزات عسكرية فورية للحليف.";
     }
   }
   else if(action==="war"){
     // إعلان حرب فوري ومباشر ينقص استقرار الخصم فوراً
     a.wars[targetId] = true; b.wars[mine] = true;
     a.relations[targetId] = -100; b.relations[mine] = -100;
     b.stability = Math.max(0, b.stability - 15); // ضربة فورية عند إعلان الحرب
     msg="🔥 تم إعلان الحرب الفورية! اهتز استقرار الدولة المستهدفة!";
   }
   else if(action==="colonize"){
     if(a.treasury < 20){ msg="تحتاج 20$ لبسط النفوذ."; }
     else {
       a.treasury -= 20; b.approval = Math.max(0, b.approval - 4);
       a.prestige = Math.min(100, a.prestige + 3);
       msg="فرضت نفوذاً سياسياً مباشراً.";
     }
   }
   
   addNews(w, "حدث عسكري/دبلوماسي", a.name + " • " + msg);
   return w;
 });
 toast(msg || "تم التنفيذ");
}

async function quick(type){
 if(!my()||spectator)return;
 const mine=myCountryId;
 await runTransaction(ref(db,"world"),w=>{const a=w?.countries?.[mine];if(!a||a.ownerUid!==auth.currentUser.uid)return w;
 if(type==="economy"&&a.treasury>=30){a.treasury-=30;a.gdp+=12;a.industry=Math.min(100,a.industry+4)}
 if(type==="army"&&a.treasury>=25){a.treasury-=25;a.army=Math.min(100,a.army+5)}
 if(type==="research"&&a.treasury>=35){a.treasury-=35;a.industry=Math.min(100,a.industry+7);a.gdp+=6}
 addNews(w,"قرار داخلي",a.name+" نفذت قراراً اقتصادياً/عسكرياً.");return w});
 toast("تم تنفيذ القرار بنجاح")
}

// استبدال زر نهاية الدور ليعمل كـ "تحديث عام" أو زر إرسال الدردشة
$("#command").onkeydown=e=>{if(e.key==="Enter")sendChatMessage()};
$("#executeBtn").onclick=sendChatMessage; // زر التنفيذ أصبح يرسل رسالة في الدردشة

// تغيير نص الزر السفلي ليوضح أنه خاص بالدردشة
window.addEventListener('DOMContentLoaded', () => {
  const cmdInput = $("#command");
  if(cmdInput) cmdInput.placeholder = "اكتب رسالة لدردشة الحكام العالمية واضغط Enter...";
  const execBtn = $("#executeBtn");
  if(execBtn) execBtn.textContent = "إرسال 💬";
  
  // تحويل زر "نهاية الدور" إلى زر "تحديث الاقتصاد" أو إخفائه لأن اللعبة أصبحت أونلاين حية
  const endBtn = $("#endTurnBtn");
  if(endBtn) {
    endBtn.textContent = "⚡ تحديث الدخل";
    endBtn.onclick = async () => {
      if(!my()) return;
      await runTransaction(ref(db,"world"), w => {
        const c = w?.countries?.[myCountryId];
        if(!c) return w;
        // تحديث يدوي فوري للخزينة بناء على الناتج المحلي وصيانة الجيش
        const cost = Math.floor(c.army * 0.5);
        c.treasury = Math.max(0, c.treasury + Math.floor(c.gdp * 0.01) - cost);
        return w;
      });
      toast("تم جني أرباح الاقتصاد ودفع رواتب الجيش!");
    };
  }
});

$("#loginScreen #registerBtn").onclick=register;
$("#loginScreen #watchBtn").onclick=async()=>{await authReady();spectator=true;setScreen("gameScreen");toast("دخلت كمشاهد");render()};
$("#accessCode").onkeydown=e=>{if(e.key==="Enter")login()};
$("#backLoginBtn").onclick=()=>setScreen("loginScreen");
$("#createCountryBtn").onclick=createCountry;
$("#saveBtn").onclick=()=>toast("الحالة محفوظة تلقائياً في Firebase");
$("#logoutBtn").onclick=()=>{spectator=false;myCode="";myCountryId="";setScreen("loginScreen")};

document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>quick(b.dataset.action));
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("active"));b.classList.add("active");const mode=b.dataset.mode;if(mapSeries)mapSeries.mapPolygons.template.adapters.add("fill",(fill,t)=>{const id=String(t.dataItem?.get("id")||"").toUpperCase(),c=world.countries?.[id];if(!c)return fill;if(mode==="economy")return am5.color(c.gdp>5000?"#6e8fd1":c.gdp>1000?"#5b7db6":"#465f78");if(mode==="relations"){const r=my()?.relations?.[id]??0;return am5.color(r>40?"#3e9272":r>=0?"#547d6c":"#785f54")}return am5.color(c.color||"#4d514b")})});

async function boot(){
 try{
   await authReady();
   await seed();
   onValue(ref(db,"world"),s=>{
     if(s.exists()){
       world=s.val();
       world.countries??={};
       world.chat??=[];
       render();
       if(mapSeries)mapSeries.mapPolygons.invalidate("fill");
     }
   });
   makeGlobe("globe");
 }catch(e){
   $("#loginStatus").textContent="Firebase غير مهيأ: افتح config.js وضع إعدادات مشروعك.";
   console.error(e);
 }
}
boot();
