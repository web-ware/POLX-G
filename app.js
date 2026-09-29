const $=s=>document.querySelector(s);
const KEY="polxg_gemini_key",STATE="polx_state_v2";
const MODEL="gemini-3-flash-preview";

const WORLD_COUNTRIES={
 DZ:{name:"الجزائر",flag:"🇩🇿",role:"دولتنا",gdp:67,industry:51,energy:82,stability:73,relation:100,trade:58},
 SA:{name:"السعودية",flag:"🇸🇦",role:"شريك إقليمي",gdp:76,industry:62,energy:94,stability:78,relation:55,trade:72},
 RU:{name:"روسيا",flag:"🇷🇺",role:"قوة دولية",gdp:72,industry:79,energy:96,stability:61,relation:31,trade:48},
 US:{name:"الولايات المتحدة",flag:"🇺🇸",role:"قوة دولية",gdp:96,industry:91,energy:84,stability:70,relation:18,trade:41},
 FR:{name:"فرنسا",flag:"🇫🇷",role:"شريك أوروبي",gdp:82,industry:78,energy:76,stability:75,relation:42,trade:64}
};
let globeRoot=null,globeChart=null;

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function money(v){return "$"+Number(v).toFixed(0)+"B"}
function countryById(id){return WORLD_COUNTRIES[String(id||"").toUpperCase()]||null}
function countryInfo(id){return countryById(id)||{name:"دولة من العالم",flag:"🌐",role:"دولة عالمية",gdp:50,industry:50,energy:50,stability:50,relation:0,trade:50}}

const defaultState={
 country:"الجزائر",year:2028,season:"الربيع",turn:1,
 gdp:67,approval:73,prestige:48,
 relations:{SA:55,RU:31,US:18,FR:42},
 feed:[
  ["افتتاح اللعبة","أنت تتولى قيادة الجزائر في بداية عام 2028.","بداية"],
  ["مؤشر الأسواق","الأسواق المحلية مستقرة وتترقب قرارات الحكومة الجديدة.","اقتصاد"],
  ["المشهد الدولي","السعودية وروسيا والولايات المتحدة وفرنسا تراقب توجهاتك الأولى.","دبلوماسية"]
 ],
 alerts:[
  ["إشعار سياسي","البرلمان ينتظر أول حزمة قرارات اقتصادية."],
  ["إشارة دبلوماسية","هناك اهتمام دولي بزيادة التعاون التجاري مع الجزائر."],
  ["تنبيه اقتصادي","أي قرار كبير يجب أن يوازن بين النمو ورضا الشعب."]
 ],
 history:[]
};

let state=loadState(),busy=false,lastDecision="";
function loadState(){
 try{
  const saved=JSON.parse(localStorage.getItem(STATE));
  if(saved)return {...structuredClone(defaultState),...saved};
 }catch{}
 return structuredClone(defaultState);
}
function save(){localStorage.setItem(STATE,JSON.stringify(state))}
function setCommand(text,append=false){
 const box=$("#command");
 if(append&&box.value.trim())box.value=box.value.trim()+"\n"+text;
 else box.value=text;
 box.focus();
 updateLastDecision();
}
function updateLastDecision(){
 const value=$("#command").value.trim();
 $("#lastDecision").innerHTML="<span>آخر قرار</span><b>"+esc(value||lastDecision||"لا يوجد قرار غير مُرسل")+"</b>";
}
function addFeed(title,text,tag="حدث"){state.feed.unshift([title,text,tag]);state.feed=state.feed.slice(0,12)}
function addAlert(title,text){state.alerts.unshift([title,text]);state.alerts=state.alerts.slice(0,8)}
function addHistory(command,result){state.history.unshift({command,...result,turn:state.turn});state.history=state.history.slice(0,30)}

function render(){
 $("#countryTitle").textContent=state.country;
 $("#dateLine").textContent="2028 • "+state.season+" • الدور "+state.turn;
 $("#turn").textContent=String(state.turn).padStart(2,"0");

 const stats=[
  ["الناتج المحلي",money(state.gdp),"حجم الاقتصاد"],
  ["رضا الشعب",Math.round(state.approval)+"/100","الاستقرار الداخلي"],
  ["الهيبة",Math.round(state.prestige)+"/100","المكانة الدولية"]
 ];
 $("#stats").innerHTML=stats.map(x=>'<div class="national-stat"><span>'+x[0]+'</span><b>'+x[1]+'</b><small>'+x[2]+'</small></div>').join("");

 $("#feed").innerHTML=state.feed.slice(0,8).map(x=>'<div class="feed-item"><strong><span class="feed-tag">'+esc(x[2])+"</span>"+esc(x[0])+"</strong><p>"+esc(x[1])+"</p></div>").join("");
 $("#alerts").innerHTML=state.alerts.slice(0,5).map(x=>'<div class="alert"><b>'+esc(x[0])+'</b><small>'+esc(x[1])+"</small></div>").join("");
 updateLastDecision();
}

function colorForCountry(id){
 const code=String(id||"").toUpperCase();
 if(code==="DZ")return am5.color(0x55d69a);
 if(WORLD_COUNTRIES[code])return am5.color(0x8879ff);
 return am5.color(0x526176);
}

function showCountry(id){
 const code=String(id||"").toUpperCase(),c=countryInfo(code);
 if(code!=="DZ"&&WORLD_COUNTRIES[code])c.relation=state.relations[code]??c.relation;
 $("#countryName").textContent=c.flag+" "+c.name;
 const relation=code==="DZ"?"—":((c.relation>=0?"+":"")+c.relation);
 const actionNames=code==="DZ"
  ?[["🏭","استثمار داخلي","طوّر الصناعة المحلية وخصص استثماراً جديداً لها."],["📈","إصلاح اقتصادي","ضع حزمة إصلاح لرفع الناتج المحلي."],["🗣️","قرار داخلي","اتخذ قراراً لتحسين رضا الشعب."]]
  :[["🤝","اتفاقية","اقترح اتفاقية تعاون جديدة مع "+c.name+"."],["📦","تجارة","اقترح زيادة التبادل التجاري مع "+c.name+"."],["🏛️","دبلوماسية","أرسل مبادرة دبلوماسية إلى "+c.name+" لتحسين العلاقات."]];

 $("#countryDetails").innerHTML='<div class="country-info">'+[
  ["الدور",c.role],["الناتج المحلي",money(c.gdp)],["الصناعة",c.industry+"/100"],["الطاقة",c.energy+"/100"],
  ["الاستقرار",c.stability+"/100"],["العلاقة معنا",relation],["التجارة",c.trade+"/100"],["الحالة","نشطة"]
 ].map(x=>'<div class="info"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+"</b></div>").join("")+
 '</div><div class="country-actions">'+actionNames.map(x=>'<button data-country-command="'+esc(x[2])+'">'+x[0]+" "+esc(x[1])+"</button>").join("")+
 '</div><p class="country-note">الأزرار لا تنفذ القرار مباشرة؛ تضيف صياغة مقترحة إلى خانة الأوامر أسفل الخريطة حتى تستطيع تعديلها قبل الإرسال.</p>";
 $("#countryDialog").showModal();
 document.querySelectorAll("[data-country-command]").forEach(b=>b.onclick=()=>{setCommand(b.dataset.countryCommand,true);$("#countryDialog").close()});
}

function initGlobe(){
 const target=document.getElementById("globe");
 if(!target||typeof am5==="undefined"||typeof am5map==="undefined"||typeof am5geodata_worldLow==="undefined")return;
 const root=am5.Root.new("globe");globeRoot=root;
 root.setThemes([am5themes_Animated.new(root),am5themes_Dark.new(root)]);
 const chart=root.container.children.push(am5map.MapChart.new(root,{projection:am5map.geoOrthographic(),panX:"rotateX",panY:"rotateY",minZoomLevel:.85,zoomLevel:.95}));
 globeChart=chart;
 const background=chart.series.push(am5map.MapPolygonSeries.new(root,{}));
 background.data.push({geometry:am5map.getGeoRectangle(90,180,-90,-180)});
 background.mapPolygons.template.setAll({fill:root.interfaceColors.get("alternativeBackground"),fillOpacity:.035,strokeOpacity:0});
 const graticule=chart.series.push(am5map.GraticuleSeries.new(root,{}));
 graticule.mapLines.template.setAll({strokeOpacity:.08});
 const series=chart.series.push(am5map.MapPolygonSeries.new(root,{geoJSON:am5geodata_worldLow}));
 series.mapPolygons.template.setAll({fill:am5.color(0x526176),fillOpacity:.78,stroke:am5.color(0x101923),strokeWidth:.45,tooltipText:"{name}"});
 series.mapPolygons.template.adapters.add("fill",(fill,target)=>colorForCountry(target.dataItem?.get("id")));
 series.mapPolygons.template.states.create("hover",{fill:am5.color(0x38bdf8),fillOpacity:1});
 series.mapPolygons.template.events.on("click",ev=>{const id=ev.target.dataItem?.get("id");if(id)showCountry(id)});
 chart.set("zoomControl",am5map.ZoomControl.new(root,{}));
 chart.appear(700,80);
 chart.animate({key:"rotationX",from:-25,to:335,duration:45000,loops:Infinity});
}

function nextTurn(){
 state.turn++;
 const seasons=["الربيع","الصيف","الخريف","الشتاء"];
 state.season=seasons[(state.turn-1)%4];
 if(state.turn%4===1)state.year++;
 save();render();
}

function extractJSON(raw){
 if(!raw)return null;
 let text=String(raw).trim().replace(/^\s*\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`\s*$/,"").trim();
 try{return JSON.parse(text)}catch{}
 const start=text.indexOf("{"),end=text.lastIndexOf("}");
 if(start>=0&&end>start){try{return JSON.parse(text.slice(start,end+1))}catch{}}
 return null;
}
function normalizeResult(result){
 if(!result||typeof result!=="object")return null;
 const effects=result.effects&&typeof result.effects==="object"?result.effects:{};
 const safe={event_title:String(result.event_title||"قرار حكومي"),summary:String(result.summary||"تمت محاكاة القرار وظهرت نتائجه في العالم."),news:String(result.news||""),effects:{}};
 ["gdp","approval","prestige"].forEach(k=>{if(Number.isFinite(Number(effects[k])))safe.effects[k]=Number(effects[k])});
 if(Array.isArray(effects.relations))safe.effects.relations=effects.relations.filter(x=>x&&typeof x.name==="string"&&Number.isFinite(Number(x.change))).map(x=>({name:x.name,change:Number(x.change)}));
 return safe;
}

function applyAI(result,command){
 const e=result.effects||{};
 if(Number.isFinite(e.gdp))state.gdp=clamp(state.gdp+e.gdp,1,99999);
 if(Number.isFinite(e.approval))state.approval=clamp(state.approval+e.approval,0,100);
 if(Number.isFinite(e.prestige))state.prestige=clamp(state.prestige+e.prestige,0,100);
 if(Array.isArray(e.relations))e.relations.forEach(r=>{
  const entry=Object.entries(WORLD_COUNTRIES).find(([,c])=>c.name===r.name);
  if(entry)state.relations[entry[0]]=clamp((state.relations[entry[0]]??entry[1].relation)+r.change,-100,100);
 });
 addFeed(result.event_title,result.summary,"قرار");
 if(result.news)addFeed("خبر دولي",result.news,"أخبار");
 addAlert("قرار جديد",result.event_title+" — "+result.summary);
 addHistory(command,result);
 lastDecision=command;
 nextTurn();
}

function buildSystem(command){
 return `أنت محرك العالم للعبة POLX. اللاعب يقود الجزائر داخل محاكاة استراتيجية خيالية. حلل الأمر بواقعية وبدون مجاملة: قد ينجح القرار أو يفشل، وقد تكون له نتائج مباشرة وثانوية ومتأخرة. لا تعطِ نصائح سياسية للعالم الحقيقي؛ كل شيء داخل اللعبة.
مهم جداً: أعد كائن JSON واحداً فقط، بلا Markdown ولا شرح خارج JSON.
الشكل الإلزامي:
{"event_title":"عنوان قصير","summary":"وصف قصير لما حدث ونتيجته","news":"خبر دولي قصير أو فارغ","effects":{"gdp":1,"approval":-1,"prestige":2,"relations":[{"name":"السعودية","change":2}]}}
effects.gdp تغيير بالنقاط في الناتج المحلي، effects.approval تغيير رضا الشعب، effects.prestige تغيير الهيبة. لا تضف حقولاً أخرى. relation change من -20 إلى 20.
الحالة الحالية: ${JSON.stringify({country:state.country,year:state.year,turn:state.turn,gdp:state.gdp,approval:state.approval,prestige:state.prestige,relations:state.relations})}
أمر اللاعب: ${command}`;
}

async function askGemini(key,command,attempt=1){
 const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODEL+":generateContent",{
  method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
  body:JSON.stringify({
   contents:[{role:"user",parts:[{text:command}]}],
   systemInstruction:{parts:[{text:buildSystem(command)}]},
   generationConfig:{temperature:.65,maxOutputTokens:500,responseMimeType:"application/json"}
  })
 });
 const data=await res.json();
 if(!res.ok)throw new Error(data?.error?.message||"تعذر الاتصال بالمحرك");
 const raw=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
 const result=normalizeResult(extractJSON(raw));
 if(result)return result;
 if(attempt<2){
  return askGemini(key,command+"\nأعد المحاولة: JSON فقط، ويجب أن يبدأ مباشرة بـ { وينتهي بـ }.",2);
 }
 throw new Error("المحرك أرسل نتيجة غير منظمة بعد محاولتين.");
}

async function execute(command){
 const key=localStorage.getItem(KEY);
 if(!key){openSettings();return}
 busy=true;$("#execute").disabled=true;$("#execute").textContent="جاري المحاكاة…";
 try{
  const result=await askGemini(key,command);
  applyAI(result,command);
 }catch(err){
  addFeed("تعذر تنفيذ القرار","لم يُحتسب الدور لأن المحرك لم يعط نتيجة صالحة: "+err.message,"خطأ");
  addAlert("تنبيه AI","لم يُحتسب هذا القرار. عدّل الأمر أو أعد الإرسال.");
  save();render();
 }finally{
  busy=false;$("#execute").disabled=false;$("#execute").textContent="تنفيذ القرار ↵";
 }
}

function openSettings(){apiKey.value=localStorage.getItem(KEY)||"";$("#settingsDialog").showModal()}
const apiKey=$("#apiKey");
$("#settings").onclick=openSettings;$("#settingsTop").onclick=openSettings;
$("#closeSettings").onclick=()=>$("#settingsDialog").close();
$("#toggleKey").onclick=()=>{apiKey.type=apiKey.type==="password"?"text":"password";$("#toggleKey").textContent=apiKey.type==="password"?"إظهار":"إخفاء"};
$("#settingsForm").addEventListener("submit",e=>{e.preventDefault();localStorage.setItem(KEY,apiKey.value.trim());$("#settingsDialog").close()});
$("#commandForm").addEventListener("submit",e=>{e.preventDefault();const v=$("#command").value.trim();if(v&&!busy)execute(v)});
document.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>setCommand(b.dataset.command,false));
$("#newGame").onclick=()=>{if(confirm("بدء عالم جديد وحذف تقدم العالم الحالي؟")){state=structuredClone(defaultState);lastDecision="";$("#command").value="";save();render()}};
$("#reset").onclick=()=>{if(confirm("إعادة الحملة بالكامل؟")){state=structuredClone(defaultState);lastDecision="";$("#command").value="";save();render()}};
$("#closeCountry").onclick=()=>$("#countryDialog").close();
$("#command").addEventListener("input",updateLastDecision);
render();
initGlobe();