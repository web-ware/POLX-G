const $=s=>document.querySelector(s);
const KEY="polx_gemini_key_v3",SAVE_KEY="polx_world_v1";
const MODELS=["gemini-3.5-flash","gemini-3.5-flash-lite","gemini-3-flash-preview","gemini-2.5-flash"];
const COUNTRIES={
 DZ:{name:"الجزائر",flag:"🇩🇿",gdp:267,pop:"46.0M",stability:73,approval:68,army:54,prestige:42,relation:100,industry:52,energy:80,trade:58,role:"الدولة التي تقودها"},
 MA:{name:"المغرب",flag:"🇲🇦",gdp:146,pop:"37.8M",stability:67,approval:61,army:48,prestige:38,relation:35,industry:55,energy:62,trade:61,role:"دولة مجاورة"},
 TN:{name:"تونس",flag:"🇹🇳",gdp:51,pop:"12.4M",stability:59,approval:55,army:32,prestige:28,relation:58,industry:48,energy:55,trade:52,role:"دولة مجاورة"},
 EG:{name:"مصر",flag:"🇪🇬",gdp:395,pop:"111M",stability:64,approval:57,army:71,prestige:63,relation:41,industry:69,energy:72,trade:54,role:"قوة إقليمية"},
 SA:{name:"السعودية",flag:"🇸🇦",gdp:1085,pop:"37.5M",stability:78,approval:72,army:62,prestige:70,relation:31,industry:64,energy:96,trade:47,role:"قوة إقليمية"},
 TR:{name:"تركيا",flag:"🇹🇷",gdp:1118,pop:"86M",stability:62,approval:51,army:78,prestige:67,relation:24,industry:76,energy:58,trade:42,role:"قوة إقليمية"},
 RU:{name:"روسيا",flag:"🇷🇺",gdp:2100,pop:"144M",stability:61,approval:49,army:91,prestige:84,relation:18,industry:82,energy:94,trade:29,role:"قوة عالمية"},
 US:{name:"الولايات المتحدة",flag:"🇺🇸",gdp:29000,pop:"340M",stability:71,approval:53,army:96,prestige:92,relation:12,industry:94,energy:81,trade:35,role:"قوة عالمية"},
 CN:{name:"الصين",flag:"🇨🇳",gdp:18500,pop:"1410M",stability:79,approval:66,army:90,prestige:89,relation:9,industry:96,energy:86,trade:31,role:"قوة عالمية"},
 FR:{name:"فرنسا",flag:"🇫🇷",gdp:3050,pop:"68M",stability:74,approval:56,army:68,prestige:72,relation:26,industry:83,energy:70,trade:46,role:"قوة عالمية"}
};
const state=load();
let selected="DZ",mapMode="political",busy=false,globe=null;
function load(){try{const x=JSON.parse(localStorage.getItem(SAVE_KEY));if(x)return x}catch{}return{year:1446,season:"الربيع",turn:1,money:1200,prestige:42,selected:"DZ",news:[
 ["بداية عصر جديد","بدأت حملة جديدة. اختر دولة وابدأ ببناء اقتصادك وعلاقاتك."],
 ["الأسواق","الأسواق الإقليمية تراقب أول قرارات الحكومة."],
 ["الدبلوماسية","الدول المجاورة مستعدة للتفاوض أو المنافسة."]
],countries:structuredClone(COUNTRIES),objectives:[["اقتصاد","ارفع الناتج المحلي إلى $300B.","0 / 300"],["جيش","ارفع قوة الجيش إلى 65.","54 / 65"],["دبلوماسية","حافظ على علاقة إيجابية مع 3 دول.","1 / 3"]]}}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state))}
function current(){return state.countries.DZ}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function money(n){return "$"+Number(n).toLocaleString()+"B"}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function addNews(title,text){state.news.unshift([title,text]);state.news=state.news.slice(0,12)}
function render(){
 const c=current();
 $("#flag").textContent=c.flag;$("#nationName").textContent=c.name;
 $("#date").textContent=state.year+" • "+state.season+" • الدور "+state.turn;
 $("#money").textContent=Math.round(state.money).toLocaleString();$("#pop").textContent=c.pop;$("#prestige").textContent=c.prestige;
 $("#gdp").textContent=money(c.gdp);$("#stability").textContent=c.stability;$("#approval").textContent=c.approval;$("#army").textContent=c.army;
 $("#stabilityBar").style.width=c.stability+"%";$("#approvalBar").style.width=c.approval+"%";$("#armyBar").style.width=c.army+"%";
 $("#stabilityBadge").textContent=c.stability>70?"مستقرة":c.stability>45?"متوترة":"أزمة";
 $("#newsCount").textContent=state.news.length;
 $("#news").innerHTML=state.news.map(n=>'<article class="newsItem"><b>'+esc(n[0])+'</b><p>'+esc(n[1])+'</p></article>').join("");
 renderTarget();renderRelations();renderObjectives();save()
}
function renderTarget(){
 const c=state.countries[selected];$("#targetFlag").textContent=c.flag;$("#targetName").textContent=c.name;
 $("#targetInfo").innerHTML='<div class="targetGrid">'+[
 ["الناتج",money(c.gdp)],["السكان",c.pop],["الاستقرار",c.stability],["الجيش",c.army],["الصناعة",c.industry],["الطاقة",c.energy],["التجارة",c.trade],["العلاقة",selected==="DZ"?"—":(c.relation>0?"+"+c.relation:c.relation)]
 ].map(x=>'<div class="metric"><small>'+x[0]+'</small><b>'+esc(x[1])+'</b></div>').join("");
 if(selected==="DZ"){$("#countryActions").innerHTML="<button data-cmd='خصص استثماراً كبيراً للصناعة والبنية التحتية في الجزائر.'>🏭 استثمار داخلي</button><button data-cmd='أطلق إصلاحاً اقتصادياً يرفع الإنتاج ويحافظ على الاستقرار.'>📈 إصلاح اقتصادي</button><button data-cmd='زد الإنفاق الدفاعي مع الحفاظ على توازن الميزانية.'>⚔ تطوير الجيش</button>"}
 else{$("#countryActions").innerHTML="<button data-cmd='اقترح اتفاقية تجارية مع "+c.name+" لزيادة التبادل الاقتصادي.'>📦 اتفاق تجاري</button><button data-cmd='اقترح اتفاقية دبلوماسية مع "+c.name+" وتحسين العلاقات.'>🤝 مبادرة دبلوماسية</button><button data-cmd='حلل إمكانية تشكيل تحالف دفاعي مع "+c.name+" داخل اللعبة.'>🛡 تحالف</button><button data-cmd='ابدأ نزاعاً عسكرياً داخل اللعبة مع "+c.name+" وقيّم النتائج دون تفاصيل تكتيكية.'>⚔ نزاع عسكري</button>"}
 document.querySelectorAll("[data-cmd]").forEach(b=>b.onclick=()=>{setCommand(b.dataset.cmd);$("#command").focus()})
}
function renderRelations(){
 const ids=["MA","TN","EG","SA","TR","RU","US","CN","FR"];
 $("#relations").innerHTML=ids.map(id=>{const c=state.countries[id];return '<div class="rel"><span class="flag">'+c.flag+'</span><div><b>'+c.name+'</b><small>'+c.role+'</small></div><meter min="-100" max="100" value="'+c.relation+'"></meter></div>'}).join("")
}
function renderObjectives(){
 const c=current();state.objectives[0][2]=Math.min(c.gdp,300)+" / 300";state.objectives[1][2]=c.army+" / 65";const positive=Object.values(state.countries).filter(x=>x.relation>20&&x!==c).length;state.objectives[2][2]=Math.min(positive,3)+" / 3";
 $("#objectives").innerHTML=state.objectives.map(o=>'<div class="objective"><b>'+o[0]+'</b><small>'+o[1]+' • '+o[2]+'</small></div>').join("")
}
function setCommand(text){$("#command").value=text;$("#decisionPreview").textContent=text}
function endTurn(){if(busy)return;const c=current();state.turn++;const seasons=["الربيع","الصيف","الخريف","الشتاء"];state.season=seasons[(state.turn-1)%4];if(state.turn%4===1)state.year++;state.money+=Math.round(c.gdp*.015);Object.keys(state.countries).forEach(id=>{if(id!=="DZ"){const x=state.countries[id];x.relation=clamp(x.relation+Math.floor(Math.random()*5)-2,-100,100)}});addNews("نهاية الدور","مرت فترة جديدة. الأسواق والدول الأخرى تحركت.");render()}
function applyResult(r,cmd,model){const c=current(),e=r.effects||{};c.gdp=clamp(c.gdp+Number(e.gdp||0),1,999999);c.approval=clamp(c.approval+Number(e.approval||0),0,100);c.stability=clamp(c.stability+Number(e.stability||0),0,100);c.army=clamp(c.army+Number(e.army||0),0,100);c.industry=clamp(c.industry+Number(e.industry||0),0,100);state.money=clamp(state.money+Number(e.money||0),0,999999);state.prestige=clamp(state.prestige+Number(e.prestige||0),0,100);if(Array.isArray(e.relations))e.relations.forEach(x=>{const id=Object.keys(state.countries).find(k=>state.countries[k].name===x.name);if(id)state.countries[id].relation=clamp(state.countries[id].relation+Number(x.change||0),-100,100)});addNews(r.title||"قرار حكومي",r.summary||"ظهرت نتائج جديدة لقرارك.");if(r.news)addNews("العالم",r.news);$("#aiStatus").textContent="AI • "+model;endTurn()}
function systemPrompt(cmd){return 'أنت محرك محاكاة لعبة استراتيجية عالمية خيالية اسمها POLX. اللاعب يقود الجزائر. أنت لا تعطي نصائح للعالم الحقيقي؛ أنت تصف نتائج داخل اللعبة فقط. حلل الأمر مع نتائج اقتصادية وسياسية ودبلوماسية وعسكرية ممكنة. أعد JSON فقط بهذا الشكل: {"title":"عنوان","summary":"نتيجة مختصرة","news":"خبر عالمي مختصر","effects":{"gdp":1,"money":-20,"approval":-1,"stability":-1,"army":1,"industry":1,"prestige":1,"relations":[{"name":"فرنسا","change":2}]}}. اجعل الأرقام معقولة ولا تغير حقولاً أخرى. الأمر: '+cmd}
async function askAI(key,cmd){let last;for(const model of MODELS){try{const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:systemPrompt(cmd)}]}],generationConfig:{responseMimeType:"application/json",temperature:.65,maxOutputTokens:500}})});const data=await res.json();if(!res.ok){last=new Error(data?.error?.message||"API error");continue}const raw=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");let r;try{r=JSON.parse(raw)}catch{const a=raw.indexOf("{"),b=raw.lastIndexOf("}");if(a>=0)r=JSON.parse(raw.slice(a,b+1))}if(r)return{r,model}}catch(e){last=e}}throw last||new Error("AI unavailable")}
async function execute(){const cmd=$("#command").value.trim();if(!cmd||busy)return;const key=localStorage.getItem(KEY);if(!key){$("#settings").showModal();return}busy=true;$("#execute").disabled=true;$("#aiStatus").textContent="AI يحاكي...";try{const x=await askAI(key,cmd);applyResult(x.r,cmd,x.model);$("#command").value="";$("#decisionPreview").textContent="تم تنفيذ القرار. اختر خطوتك التالية."}catch(e){$("#aiStatus").textContent="AI غير متاح";addNews("تعذر تنفيذ القرار",e.message);render()}finally{busy=false;$("#execute").disabled=false}}
function initMap(){if(typeof am5==="undefined"||typeof am5map==="undefined")return;const root=am5.Root.new("globe");globe=root;root.setThemes([am5themes_Animated.new(root)]);const chart=root.container.children.push(am5map.MapChart.new(root,{projection:am5map.geoOrthographic(),panX:"rotateX",panY:"rotateY",wheelY:"zoom",minZoomLevel:.7,maxZoomLevel:4,zoomLevel:1.05}));const bg=chart.series.push(am5map.MapPolygonSeries.new(root,{}));bg.data.push({geometry:am5map.getGeoRectangle(90,180,-90,-180)});bg.mapPolygons.template.setAll({fill:am5.color(0x17222a),fillOpacity:1,strokeOpacity:0});const grid=chart.series.push(am5map.GraticuleSeries.new(root,{}));grid.mapLines.template.setAll({stroke:am5.color(0x6d756e),strokeOpacity:.13});const s=chart.series.push(am5map.MapPolygonSeries.new(root,{geoJSON:am5geodata_worldLow}));s.mapPolygons.template.setAll({fill:am5.color(0x4d514b),fillOpacity:.88,stroke:am5.color(0x191814),strokeWidth:.6,tooltipText:"{name}"});s.mapPolygons.template.adapters.add("fill",(fill,t)=>{const id=String(t.dataItem?.get("id")||"").toUpperCase();if(id==="DZ")return am5.color(0x78985f);if(state.countries[id])return am5.color(0x756b52);return fill});s.mapPolygons.template.states.create("hover",{fill:am5.color(0xd1b66b),fillOpacity:1});s.mapPolygons.template.events.on("click",ev=>{const id=String(ev.target.dataItem?.get("id")||"").toUpperCase();if(state.countries[id]){selected=id;state.selected=id;renderTarget();}});chart.set("zoomControl",am5map.ZoomControl.new(root,{}));chart.appear(700,50)}
$("#execute").onclick=execute;$("#endTurn").onclick=endTurn;document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{const t={economy:"ضع خطة اقتصادية لزيادة النمو والاستثمار.",military:"زد كفاءة الجيش والدفاع مع الحفاظ على الميزانية.",diplomacy:"أطلق مبادرة دبلوماسية لتحسين العلاقات الدولية.",research:"استثمر في البحث والتقنية والبنية التحتية."}[b.dataset.action];setCommand(t)});document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("active"));b.classList.add("active");mapMode=b.dataset.mode;});$("#command").oninput=()=>$("#decisionPreview").textContent=$("#command").value||"اختر أمراً أو اكتب قراراً للذكاء الاصطناعي...";$("#settingsBtn").onclick=()=>{$("#apiKey").value=localStorage.getItem(KEY)||"";$("#settings").showModal()};$("#saveKey").onclick=()=>localStorage.setItem(KEY,$("#apiKey").value.trim());$("#saveBtn").onclick=()=>{save();$("#aiStatus").textContent="تم الحفظ"};$("#closeCountry").onclick=()=>$("#countryDialog").close();selected=state.selected||"DZ";render();initMap();