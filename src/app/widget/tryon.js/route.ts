import { NextRequest, NextResponse } from 'next/server';

const WIDGET_SCRIPT = `(function(){
var $=function(s,r){return(r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var script=document.currentScript;
var base=(script&&script.getAttribute('data-base'))||(typeof location!='undefined'?location.origin:'');
var API=base.replace(/\\/$/,'')+'/api/v1';
function style(el,c){for(var k in c)el.style[k]=c[k];return el}
function el(tag,attrs,children){
  var e=document.createElement(tag);
  if(attrs)for(var k in attrs){if(k==='className')e.className=attrs[k];else if(k==='innerHTML')e.innerHTML=attrs[k];else if(k==='onclick')e.onclick=attrs[k];else if(k==='style')style(e,attrs[k]);else if(k.startsWith('on'))e.addEventListener(k.slice(2).toLowerCase(),attrs[k]);else if(k!=='children')e.setAttribute(k,attrs[k])}
  if(children)children.forEach(function(c){if(c&&c.nodeType)e.appendChild(c);else if(c)e.appendChild(document.createTextNode(c))});
  return e;
}
function openModal(btn){
  var apiKey=btn.getAttribute('data-api-key')||btn.dataset.apiKey;
  var garmentUrl=btn.getAttribute('data-garment-url')||btn.dataset.garmentUrl||'';
  var garmentUrls=btn.getAttribute('data-garment-urls');
  if(!garmentUrls&&garmentUrl)garmentUrls=garmentUrl;
  var tier=(btn.getAttribute('data-tier')||btn.dataset.tier||'basic').toLowerCase();
  var swapTarget=btn.getAttribute('data-swap-target')||btn.dataset.swapTarget||'full_outfit';
  if(!apiKey){alert('VirtuFit: data-api-key is required on the button.');return}
  try{fetch(API+'/widget-beacon',{method:'POST',headers:{'X-API-Key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({origin:typeof location!='undefined'?location.origin:''})}).catch(function(){})}catch(_){}
  var root=document.createElement('div');
  root.id='virtufit-root';
  var sh=root.attachShadow({mode:'closed'});
  var sheet=document.createElement('style');
  sheet.textContent='*{box-sizing:border-box}.V{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif}.V-panel{background:#222;color:#eee;border-radius:16px;max-width:440px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)}.V-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.1)}.V-title{font-size:18px;font-weight:600}.V-close{background:0;border:0;color:#aaa;cursor:pointer;font-size:24px;line-height:1;padding:4px}.V-close:hover{color:#fff}.V-body{padding:20px}.V-btn{display:block;width:100%;padding:14px 20px;background:#d9714a;color:#fff;border:0;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer;margin-top:12px}.V-btn:disabled{opacity:.6;cursor:not-allowed}.V-btn.secondary{background:transparent;border:1px solid rgba(255,255,255,.2);color:#eee}.V-zone{border:2px dashed rgba(255,255,255,.2);border-radius:12px;padding:32px;text-align:center;color:#999;cursor:pointer;transition:border-color .2s}.V-zone:hover,.V-zone.dragover{border-color:#d9714a;color:#ccc}.V-zone input{display:none}.V-preview{max-width:100%;max-height:200px;border-radius:8px;margin-top:12px}.V-load{text-align:center;padding:24px;color:#aaa}.V-result img{width:100%;border-radius:12px;margin-top:12px}.V-result a{display:inline-block;margin-top:12px;padding:10px 20px;background:#2c2c2c;color:#fff;border-radius:8px;text-decoration:none;font-size:14px}.V-result a:hover{background:#3a3a3a}.V-err{color:#e55;padding:12px;border-radius:8px;background:rgba(229,85,85,.1);margin-top:12px;font-size:14px}';
  sh.appendChild(sheet);
  var state={personFile:null,step:'upload'};
  function close(){var r=document.getElementById('virtufit-root');if(r)r.remove()}
  function render(){
    sh.innerHTML='';sh.appendChild(sheet);
    var panel=el('div',{className:'V-panel'});
    var head=el('div',{className:'V-head'});
    head.appendChild(el('span',{className:'V-title',innerHTML:'Virtual try-on'}));
    head.appendChild(el('button',{className:'V-close',innerHTML:'&times;',onclick:close}));
    panel.appendChild(head);
    var body=el('div',{className:'V-body'});
    if(state.step==='upload'){
      var zone=el('div',{className:'V-zone'});
      zone.innerHTML='Drop your photo here or click to upload';
      var inp=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp'});
      zone.appendChild(inp);
      zone.onclick=function(){inp.click()};
      zone.ondragover=function(e){e.preventDefault();zone.classList.add('dragover')};
      zone.ondragleave=function(){zone.classList.remove('dragover')};
      zone.ondrop=function(e){e.preventDefault();zone.classList.remove('dragover');var f=e.dataTransfer.files[0];if(f&&f.type.match(/^image\\//')){state.personFile=f;render()}};
      inp.onchange=function(){var f=inp.files[0];if(f){state.personFile=f;render()}};
      body.appendChild(zone);
      if(state.personFile){
        var prev=el('img',{className:'V-preview',src:URL.createObjectURL(state.personFile)});
        body.appendChild(prev);
        body.appendChild(el('button',{className:'V-btn',innerHTML:'Generate try-on',onclick:function(){generate()}}));
      }
    }else if(state.step==='loading'){
      body.appendChild(el('div',{className:'V-load',innerHTML:'Generating your try-on…'}));
    }else if(state.step==='result'){
      body.appendChild(el('img',{src:state.resultUrl}));
      body.appendChild(el('a',{href:state.resultUrl,download:'virtufit-tryon.png',className:'V-btn',innerHTML:'Download image'}));
      body.appendChild(el('button',{className:'V-btn secondary',innerHTML:'Close',onclick:close}));
    }else if(state.step==='error'){
      body.appendChild(el('div',{className:'V-err',innerHTML:state.error||'Something went wrong'}));
      body.appendChild(el('button',{className:'V-btn secondary',innerHTML:'Close',onclick:close}));
    }
    panel.appendChild(body);
    var wrap=el('div',{className:'V'});
    var backdrop=el('div',{style:{position:'absolute',inset:0,background:'transparent'},onclick:close});
    wrap.appendChild(backdrop);
    wrap.appendChild(panel);
    sh.appendChild(wrap);
  }
  function generate(){
    state.step='loading';render();
    var fd=new FormData();
    fd.append('person_image',state.personFile);
    fd.append('tier',tier);
    fd.append('swap_target',swapTarget);
    if(garmentUrls){fd.append('garment_urls',garmentUrls);}else if(garmentUrl){fd.append('garment_urls',garmentUrl);}
    fetch(API+'/generate',{method:'POST',headers:{'X-API-Key':apiKey},body:fd})
      .then(function(r){return r.json().then(function(d){return{r:r,d:d}})})
      .then(function(_){var r=_.r,d=_.d;if(!r.ok){state.step='error';state.error=d.error||d.details||'Request failed';render();return}state.step='result';state.resultUrl=d.output_url||(d.output_urls&&d.output_urls[0]);if(!state.resultUrl){state.step='error';state.error='No image returned';}render()})
      .catch(function(e){state.step='error';state.error=e.message||'Network error';render()});
  }
  render();
}
function init(){
  $$('[data-virtufit-btn]').forEach(function(btn){btn.addEventListener('click',function(e){e.preventDefault();openModal(btn)})});
  function boot(){$$('[data-virtufit-btn]').forEach(function(btn){if(btn._virtufit)return;btn._virtufit=1;btn.addEventListener('click',function(e){e.preventDefault();openModal(btn)})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
`;

export async function GET(request: NextRequest) {
  return new NextResponse(WIDGET_SCRIPT, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
