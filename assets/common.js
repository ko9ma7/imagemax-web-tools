export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export function escLua(value=''){return `'${String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,'\\n')}'`}
export function sanitizeId(v='script'){let s=String(v).trim().replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,'_');if(!s)s='script';return s}
export function luaId(v='value'){let s=String(v).trim().replace(/[^0-9A-Za-z_]/g,'_');if(!s)s='value';if(/^\d/.test(s))s='v_'+s;return s}
export function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
export async function copyText(text){await navigator.clipboard.writeText(text);toast('클립보드에 복사했습니다.');}
export function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.append(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1800)}
export function uid(prefix='id'){return `${prefix}_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`}
export function encodeProject(obj){return JSON.stringify({...obj,updatedAt:new Date().toISOString()},null,2)}
export function readJsonFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{try{res(JSON.parse(r.result))}catch(e){rej(e)}};r.onerror=rej;r.readAsText(file,'utf-8')})}

function crc32(bytes){let table=crc32._t;if(!table){table=crc32._t=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0})}let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function u16(n){return [n&255,(n>>>8)&255]} function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
export function makeStoreZip(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);const local=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);parts.push(local,data);central.push(new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]));offset+=local.length+data.length}const csize=central.reduce((n,a)=>n+a.length,0),end=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(csize),...u32(offset),...u16(0)]);const all=[...parts,...central,end],len=all.reduce((n,a)=>n+a.length,0),out=new Uint8Array(len);let pos=0;for(const a of all){out.set(a,pos);pos+=a.length}return out}
export function downloadBytes(name,bytes,type='application/octet-stream'){const blob=new Blob([bytes],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

export function html(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
