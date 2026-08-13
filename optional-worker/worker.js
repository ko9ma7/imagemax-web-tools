import {validateTemplatePack} from '../script/template-library.js';

/**
 * Optional Cloudflare Worker for direct community-template submission.
 * Required secrets/vars:
 *   GITHUB_TOKEN  - fine-grained token with Issues: write on the target repo only
 *   GITHUB_REPO   - e.g. ko9ma7/imagemax-web-tools
 *   ALLOWED_ORIGIN - e.g. https://ko9ma7.github.io
 *   TURNSTILE_SECRET_KEY - Cloudflare Turnstile server-side secret
 *
 * This Worker does NOT write repository contents. It only creates a GitHub Issue.
 * The repository's template-submission.yml Action performs validation and opens a PR.
 */
export default {
  async fetch(request, env) {
    const origin=request.headers.get('origin')||'';
    const allowed=env.ALLOWED_ORIGIN||'https://ko9ma7.github.io';
    const cors={'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','cache-control':'no-store','vary':'Origin'};
    if(origin===allowed)cors['access-control-allow-origin']=origin;
    if(request.method==='OPTIONS')return origin===allowed?new Response(null,{status:204,headers:cors}):json({error:'origin not allowed'},403,cors);
    if(request.method!=='POST')return json({error:'POST only'},405,cors);
    if(!origin||origin!==allowed)return json({error:'origin not allowed'},403,cors);
    if(!env.GITHUB_TOKEN||!env.TURNSTILE_SECRET_KEY)return json({error:'worker is not fully configured'},503,cors);
    const len=Number(request.headers.get('content-length')||0);if(len>65000)return json({error:'payload too large'},413,cors);
    let payload;try{payload=await request.json()}catch{return json({error:'invalid json'},400,cors)}
    const pack=payload?.pack,turnstileToken=String(payload?.turnstileToken||'');if(!turnstileToken)return json({error:'turnstile token required'},400,cors);
    const form=new FormData();form.set('secret',env.TURNSTILE_SECRET_KEY);form.set('response',turnstileToken);const ip=request.headers.get('CF-Connecting-IP');if(ip)form.set('remoteip',ip);
    const verified=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form}).then(r=>r.json()).catch(()=>({success:false}));
    if(!verified.success)return json({error:'turnstile verification failed'},403,cors);
    try{validateTemplatePack(pack,{maxTemplates:20,maxPackBytes:60000})}catch(e){return json({error:e.message},400,cors)}
    const repo=env.GITHUB_REPO||'ko9ma7/imagemax-web-tools';
    const title=`[Template] ${pack.templates[0]?.title||pack.name||'ImageMax template'}`;
    const body=`<!-- IMAGEMAX_TEMPLATE_SUBMISSION -->\nImageMax Web Tools direct submission.\n\n<!-- IMAGEMAX_TEMPLATE_JSON_START -->\n\`\`\`json\n${JSON.stringify(pack,null,2)}\n\`\`\`\n<!-- IMAGEMAX_TEMPLATE_JSON_END -->\n`;
    const r=await fetch(`https://api.github.com/repos/${repo}/issues`,{method:'POST',headers:{'accept':'application/vnd.github+json','authorization':`Bearer ${env.GITHUB_TOKEN}`,'user-agent':'imagemax-template-worker','x-github-api-version':'2026-03-10','content-type':'application/json'},body:JSON.stringify({title,body})});
    const data=await r.json().catch(()=>({}));if(!r.ok)return json({error:data.message||`GitHub ${r.status}`},502,cors);
    return json({ok:true,url:data.html_url,issue:data.number},201,cors);
  }
};
function json(value,status,headers){return new Response(JSON.stringify(value),{status,headers:{...headers,'content-type':'application/json;charset=utf-8'}})}
