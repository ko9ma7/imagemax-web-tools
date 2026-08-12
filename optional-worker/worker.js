/**
 * Optional Cloudflare Worker for direct community-template submission.
 * Required secrets/vars:
 *   GITHUB_TOKEN  - fine-grained token with Issues: write on the target repo only
 *   GITHUB_REPO   - e.g. ko9ma7/imagemax-web-tools
 *   ALLOWED_ORIGIN - e.g. https://ko9ma7.github.io
 *
 * This Worker does NOT write repository contents. It only creates a GitHub Issue.
 * The repository's template-submission.yml Action performs validation and opens a PR.
 */
export default {
  async fetch(request, env) {
    const origin=request.headers.get('origin')||'';
    const allowed=env.ALLOWED_ORIGIN||'https://ko9ma7.github.io';
    const cors={'access-control-allow-origin':origin===allowed?origin:allowed,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'};
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(request.method!=='POST')return json({error:'POST only'},405,cors);
    if(origin&&origin!==allowed)return json({error:'origin not allowed'},403,cors);
    const len=Number(request.headers.get('content-length')||0);if(len>65000)return json({error:'payload too large'},413,cors);
    let pack;try{pack=await request.json()}catch{return json({error:'invalid json'},400,cors)}
    try{basicValidate(pack)}catch(e){return json({error:e.message},400,cors)}
    const repo=env.GITHUB_REPO||'ko9ma7/imagemax-web-tools';
    const title=`[Template] ${pack.templates[0]?.title||pack.name||'ImageMax template'}`;
    const body=`<!-- IMAGEMAX_TEMPLATE_SUBMISSION -->\nImageMax Web Tools direct submission.\n\n<!-- IMAGEMAX_TEMPLATE_JSON_START -->\n\`\`\`json\n${JSON.stringify(pack,null,2)}\n\`\`\`\n<!-- IMAGEMAX_TEMPLATE_JSON_END -->\n`;
    const r=await fetch(`https://api.github.com/repos/${repo}/issues`,{method:'POST',headers:{'accept':'application/vnd.github+json','authorization':`Bearer ${env.GITHUB_TOKEN}`,'user-agent':'imagemax-template-worker','x-github-api-version':'2026-03-10','content-type':'application/json'},body:JSON.stringify({title,body})});
    const data=await r.json().catch(()=>({}));if(!r.ok)return json({error:data.message||`GitHub ${r.status}`},502,cors);
    return json({ok:true,url:data.html_url,issue:data.number},201,cors);
  }
};
function basicValidate(pack){if(!pack||pack.format!=='imagemax-template-pack')throw new Error('invalid template format');if(Number(pack.version)!==1)throw new Error('unsupported version');if(!Array.isArray(pack.templates)||!pack.templates.length||pack.templates.length>20)throw new Error('templates must contain 1-20 items');if(JSON.stringify(pack).length>60000)throw new Error('template pack too large')}
function json(value,status,headers){return new Response(JSON.stringify(value),{status,headers:{...headers,'content-type':'application/json;charset=utf-8'}})}
