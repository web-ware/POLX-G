const $=s=>document.querySelector(s);
const KEY="polxg_gemini_key",STATE="polx_state_v1";
const MODEL="gemini-3-flash-preview";
const WORLD_COUNTRIES={
 DZ:{name:"الجزائر",flag:"🇩🇿",role:"دولتنا",gdp:67,industry:51,energy:82,stability:73,relation:100,trade:58},
 SA:{name:"السعودية",flag:"🇸🇦",role:"دولة رئيسية",gdp:76,industry:62,energy:94,stability:78,relation:55,trade:72},
 RU:{name:"روسيا",flag:"🇷🇺",role:"دولة رئيسية",gdp:72,industry:79,energy:96,stability:61,relation:31,trade:48},
 US:{name:"الولايات المتحدة",flag:"🇺🇸",role:"دولة رئيسية",gdp:96,industry:91,energy:84,stability:70,relation:18,trade:41},
 FR:{name:"فرنسا",flag:"🇫🇷",role:"دولة رئيسية",gdp:82,industry:78,energy:76,stability:75,relation:42,trade:64}
};
let globeRoot=null,globeChart=null,worldSeries=null,largeWorldReady=false;
function countryById(id){return WORLD_COUNTRIES[String(id||"").toUpperCase()]||null}
function countryInfo(id){
 const c=countryById(id);
 if(c)return c;
 return {name:"دولة من العالم",flag:"🌐",role:"دولة عالمية",gdp:50,industry:50,energy:50,stability:50,relation:0,trade:50};
}
function showCountry(id){
 const c=countryInfo(id);
 $("#countryName").textContent=c.flag+" "+c.name;
 $("#countryDetails").innerHTML='<div class="country-info">'+[
  ["الدور",c.role],["الناتج المحلي",c.gdp+"/100"],["الصناعة",c.industry+"/100"],["الطاقة",c.energy+"/100"],
  ["الاستقرار",c.stability+"/100"],["العلاقة معنا",(c.relation>=0?"+":"")+c.relation],["التجارة",c.trade+"/100"],["الحالة","نشطة"]
 ].map(x=>'<div class="info"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("")+'</div><p class="country-note">هذه طبقة المعلومات الحالية في محاكاة POLX. الدول الخمس الرئيسية لديها بيانات كاملة، وباقي دول العالم تظهر كبنية قابلة للتوسع.</p>';
 $("#countryDialog").showModal();
}
function colorForCountry(id){
 const code=String(id||"").toUpperCase();
 if(code==="DZ")return am5.color(0x55d69a);
 if(WORLD_COUNTRIES[code])return am5.color(0x8879ff);
 return am5.color(0x526176);
}
function initGlobe(targetId,large=false){
 const target=document.getElementById(targetId);
 if(!target||typeof am5==="undefined"||typeof am5map==="undefined"||typeof am5geodata_worldLow==="undefined")return;
 const root=am5.Root.new(targetId);
 if(!large)globeRoot=root;
 root.setThemes([am5themes_Animated.new(root),am5themes_Dark.new(root)]);
 const chart=root.container.children.push(am5map.MapChart.new(root,{projection:am5map.geoOrthographic(),panX:"rotateX",panY:"rotateY",minZoomLevel:.85,zoomLevel:.95}));
 const background=chart.series.push(am5map.MapPolygonSeries.new(root,{}));
 background.data.push({geometry:am5map.getGeoRectangle(90,180,-90,-180)});
 background.mapPolygons.template.setAll({fill:root.interfaceColors.get("alternativeBackground"),fillOpacity:.035,strokeOpacity:0});
 const graticule=chart.series.push(am5map.GraticuleSeries.new(root,{}));
 graticule.mapLines.template.setAll({strokeOpacity:.08});
 const series=chart.series.push(am5map.MapPolygonSeries.new(root,{geoJSON:am5geodata_worldLow}));
 series.mapPolygons.template.setAll({fill:am5.color(0x526176),fillOpacity:.78,stroke:am5.color(0x101923),strokeWidth:.45,tooltipText:"{name}"});
 series.mapPolygons.template.adapters.add("fill",(fill,target)=>{
   const id=target.dataItem?.get("id");
   return colorForCountry(id);
 });
 series.mapPolygons.template.states.create("hover",{fill:am5.color(0x38bdf8),fillOpacity:1});
 series.mapPolygons.template.events.on("click",ev=>{
   const id=ev.target.dataItem?.get("id");
   if(id)showCountry(id);
 });
 chart.set("zoomControl",am5map.ZoomControl.new(root,{}));
 chart.appear(700,80);
 if(!large)chart.animate({key:"rotationX",from:-25,to:335,duration:45000,loops:Infinity});
 return {root,chart,series};
}
function initWorldMaps(){
 const a=initGlobe("globe",false); if(a){globeRoot=a.root;globeChart=a.chart;worldSeries=a.series}
}
function ensureLargeWorldMap(){
 if(largeWorldReady)return;
 const el=document.getElementById("worldMapLarge");
 if(!el)return;
 const a=initGlobe("worldMapLarge",true);
 if(a){largeWorldReady=true;setTimeout(()=>a.chart.appear(500,50),30)}
}

const defaultState={
 country:"جمهورية POLX",year:2028,season:"الربيع",turn:1,
 treasury:82,gdp:67,inflation:4.2,unemployment:8.1,industry:51,energy:82,approval:73,influence:48,
 relations:[["اتحاد الشمال",35],["جمهورية الشرق",57],["مملكة الغرب",48],["اتحاد المحيط",12]],
 ministers:[
  ["وزير الاقتصاد","ليان بن عيسى","اقتصاد • إصلاح مالي"],
  ["وزير الخارجية","آدم مراد","دبلوماسية • تجارة"],
  ["وزير الصناعة","سارة نوري","صناعة • ابتكار"],
  ["وزير الطاقة","كمال ريان","طاقة • بنية تحتية"]
 ],
 feed:[
  ["افتتاح اللعبة","أنت تتولى قيادة جمهورية POLX في بداية عام 2028.","بداية"],
  ["مؤشر الأسواق","الأسواق مستقرة، لكن التضخم يحتاج إلى مراقبة.","اقتصاد"],
  ["المشهد الدولي","الدول الكبرى تراقب سياستك الخارجية الأولى.","دبلوماسية"]
 ],
 news:[]
};
let state=loadState(),busy=false;
function loadState(){try{return JSON.parse(localStorage.getItem(STATE))||structuredClone(defaultState)}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(STATE,JSON.stringify(state))}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function money(v){return "$"+Number(v).toFixed(1)+"B"}
function render(){
 $("#countryTitle").textContent=state.country;
 $("#dateLine").textContent="السنة "+state.year+" • "+state.season+" • الدور "+state.turn;
 $("#turn").textContent=String(state.turn).padStart(2,"0");
 const stats=[
  ["الخزينة",money(state.treasury),"متاح للإنفاق"],
  ["الناتج المحلي",state.gdp+"/100","قوة الاقتصاد"],
  ["التضخم",state.inflation.toFixed(1)+"%","الهدف 2–4%"],
  ["البطالة",state.unemployment.toFixed(1)+"%","سوق العمل"],
  ["رضا الشعب",state.approval+"/100","الاستقرار الداخلي"],
  ["النفوذ",state.influence+"/100","المكانة الدولية"]
 ];
 $("#stats").innerHTML=stats.map(x=>'<div class="stat"><span>'+x[0]+'</span><b>'+x[1]+'</b><small>'+x[2]+'</small></div>').join("");
 $("#feed").innerHTML=state.feed.slice(0,7).map(x=>'<div class="feed-item"><strong><span class="feed-tag">'+esc(x[2])+'</span>'+esc(x[0])+'</strong><p>'+esc(x[1])+'</p></div>').join("");
 $("#economyGrid").innerHTML=[
  ["الصناعة",state.industry,100],["الطاقة",state.energy,100],["الناتج المحلي",state.gdp,100],
  ["رضا الشعب",state.approval,100],["النفوذ الدولي",state.influence,100],["استقرار الأسعار",clamp(100-Math.max(0,state.inflation-2)*12,0,100),100]
 ].map(x=>'<div class="detail"><h3>'+x[0]+'</h3><strong>'+Number(x[1]).toFixed(x[1]%1?1:0)+'</strong><div class="bar"><i style="width:'+clamp(x[1],0,100)+'%"></i></div></div>').join("");
 $("#diplomacyGrid").innerHTML=state.relations.map(x=>'<div class="country"><h3>🌐 '+esc(x[0])+'</h3><span class="relation '+(x[1]>=0?"good":"bad")+'">'+(x[1]>=0?"+":"")+x[1]+'</span><p style="color:#7f8a9e;font-size:10px">مؤشر العلاقة الدبلوماسية</p><div class="bar"><i style="width:'+clamp((x[1]+100)/2,0,100)+'%"></i></div></div>').join("");
 $("#governmentGrid").innerHTML=state.ministers.map(x=>'<div class="detail"><h3>'+esc(x[0])+'</h3><strong style="font-size:16px">'+esc(x[1])+'</strong><p style="color:#7f8a9e;font-size:10px">'+esc(x[2])+'</p></div>').join("");
 $("#newsGrid").innerHTML=(state.news.length?state.news:state.feed).map(x=>'<article class="news"><time>'+esc(state.year)+' • '+esc(state.season)+'</time><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p></article>').join("");
}
function addFeed(title,text,tag="حدث"){state.feed.unshift([title,text,tag]);state.feed=state.feed.slice(0,12)}
function addNews(title,text){state.news.unshift([title,text]);state.news=state.news.slice(0,20)}
function nextTurn(){
 state.turn++;
 const seasons=["الربيع","الصيف","الخريف","الشتاء"];
 state.season=seasons[(state.turn-1)%4];
 if(state.turn%4===1)state.year++;
 state.inflation=clamp(state.inflation+(state.gdp<45?.25:-.05),0,30);
 state.approval=clamp(state.approval+(state.unemployment>12?-1:.15),0,100);
 state.gdp=clamp(state.gdp+(state.industry>60?.3:-.05),0,100);
 save();render();
initWorldMaps();
}
function extractJSON(text){
 const clean=text.replace(/\`\`\`json|\`\`\`/g,"").trim();
 try{return JSON.parse(clean)}catch{}
 const m=clean.match(/\{[\s\S]*\}/);if(m){try{return JSON.parse(m[0])}catch{}}
 return null;
}
function applyAI(result,command){
 const e=result?.effects||{};
 if(typeof e.treasury==="number")state.treasury=clamp(state.treasury+e.treasury,0,9999);
 ["gdp","inflation","unemployment","industry","energy","approval","influence"].forEach(k=>{if(typeof e[k]==="number")state[k]=k==="inflation"||k==="unemployment"?clamp(state[k]+e[k],0,100):clamp(state[k]+e[k],0,100)});
 if(Array.isArray(e.relations))e.relations.forEach(r=>{const i=state.relations.findIndex(x=>x[0]===r.name);if(i>=0)state.relations[i][1]=clamp(state.relations[i][1]+Number(r.change||0),-100,100)});
 const title=result?.event_title||"قرار رئاسي";
 const summary=result?.summary||"تم تنفيذ القرار مع آثار تحتاج إلى متابعة.";
 addFeed(title,summary,"قرار");
 addNews(title,summary);
 if(result?.news)addFeed("خبر دولي",result.news,"أخبار");
 nextTurn();
}
async function execute(command){
 const key=localStorage.getItem(KEY);
 if(!key){openSettings();return}
 busy=true;$("#execute").disabled=true;$("#execute").textContent="جاري المحاكاة…";
 const system=`أنت محرك محاكاة للعبة استراتيجية خيالية اسمها POLX. اللاعب رئيس دولة خيالية. حلل أوامر اللاعب بواقعية داخل عالم اللعبة. لا تكن مجاملاً: القرارات قد تنجح أو تفشل ولها آثار قصيرة وطويلة المدى. لا تغيّر القيم مباشرة إلا عبر effects. أعد JSON صالحاً فقط بلا Markdown بهذا الشكل:
{"event_title":"عنوان قصير","summary":"ما حدث ونتيجته","news":"خبر أو رد فعل عالمي قصير","effects":{"treasury":-2.5,"gdp":1,"inflation":0.2,"unemployment":-0.3,"industry":2,"energy":0,"approval":1,"influence":0,"relations":[{"name":"اتحاد الشمال","change":2}]}}
الأرقام في effects هي تغييرات تضاف إلى الحالة الحالية. treasury بوحدة مليار دولار. لا تستخدم أرقاماً مبالغاً فيها. الحالة الحالية: ${JSON.stringify(state)}`;
 try{
  const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODEL+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:command}]}],systemInstruction:{parts:[{text:system}]},generationConfig:{temperature:.8,maxOutputTokens:900,responseMimeType:"application/json"}})});
  const data=await res.json();
  if(!res.ok)throw new Error(data?.error?.message||"فشل اتصال Gemini");
  const text=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
  const result=extractJSON(text);
  if(!result)throw new Error("المحرك رجع نتيجة غير صالحة.");
  applyAI(result,command);
 }catch(err){
  addFeed("تعذر تنفيذ القرار","صار خطأ: "+err.message,"خطأ");save();render();
 }finally{busy=false;$("#execute").disabled=false;$("#execute").textContent="تنفيذ القرار ↵"}
}
function openSettings(){apiKey.value=localStorage.getItem(KEY)||"";$("#settingsDialog").showModal()}
const apiKey=$("#apiKey");
$("#settings").onclick=openSettings;$("#settingsTop").onclick=openSettings;$("#closeSettings").onclick=()=>$("#settingsDialog").close();
$("#toggleKey").onclick=()=>{apiKey.type=apiKey.type==="password"?"text":"password";$("#toggleKey").textContent=apiKey.type==="password"?"إظهار":"إخفاء"};
$("#settingsForm").addEventListener("submit",e=>{e.preventDefault();localStorage.setItem(KEY,apiKey.value.trim());$("#settingsDialog").close()});
$("#commandForm").addEventListener("submit",e=>{e.preventDefault();const v=$("#command").value.trim();if(v)execute(v)});
document.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>{$("#command").value=b.dataset.command;$("#command").focus()});
document.querySelectorAll(".nav[data-panel]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav[data-panel]").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.panel).classList.add("active");if(b.dataset.panel==="diplomacy")ensureLargeWorldMap()});
$("#newGame").onclick=()=>{if(confirm("بدء عالم جديد وحذف تقدم العالم الحالي؟")){state=structuredClone(defaultState);save();render()}};
if(document.getElementById("closeCountry"))$("#closeCountry").onclick=()=>$("#countryDialog").close();
$("#reset").onclick=()=>{if(confirm("إعادة العالم بالكامل؟")){state=structuredClone(defaultState);save();render()}};
render();