function r(){let t=localStorage.getItem("familyBranding");if(!t)return null;try{return JSON.parse(t)}catch{return null}}async function d(){let t=r();if(!t)try{let a=await fetch("/api/auth/me",{credentials:"include"});if(a.ok){let n=await a.json();t=n.user?.family??null,t&&localStorage.setItem("familyBranding",JSON.stringify(t)),n.user?.language&&localStorage.setItem("language",n.user.language)}}catch{t=null}t&&(t.name&&document.querySelectorAll("[data-family-name]").forEach(a=>{a.textContent=t?.name??""}),t.accentColor&&document.documentElement.style.setProperty("--theme-color",t.accentColor))}var c=document.getElementById("tenantsBody"),m=document.getElementById("auditTableBody"),l=document.getElementById("messageBox"),u=document.getElementById("totalFamilies"),g=document.getElementById("totalMembers"),y=document.getElementById("activeFamilies");function o(t){l.textContent=t,l.classList.remove("hidden")}async function p(){let t=await fetch("/api/family/tenants",{credentials:"include"});if(!t.ok)throw new Error("Failed to load tenants.");let n=(await t.json()).tenants||[];u.textContent=String(n.length),g.textContent=String(n.reduce((e,s)=>e+(s.memberCount||0),0)),y.textContent=String(n.filter(e=>!e.deletedAt).length),c.innerHTML=n.map(e=>{let s=new Date(e.createdAt).toLocaleDateString(),i=e.deletedAt?'<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Deleted</span>':'<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Active</span>';return`<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 font-medium text-[#2c2420]">${e.name}</td>
      <td class="py-3 text-[#5a4e46]">${e.adminUsername}</td>
      <td class="py-3 text-[#5a4e46]">\u2014</td>
      <td class="py-3">${e.memberCount}</td>
      <td class="py-3 text-[#7a6e66]">${s}</td>
      <td class="py-3">${i}</td>
    </tr>`}).join("")}async function f(){let t=await fetch("/api/audit",{credentials:"include"});if(!t.ok)throw new Error("Failed to load audit logs.");let n=(await t.json()).logs||[];m.innerHTML=n.map(e=>{let s=new Date(e.createdAt);return`<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 text-[#2c2420]">${e.actorUserId??"\u2014"}</td>
      <td class="py-3 text-[#5a4e46]">Super Admin</td>
      <td class="py-3 text-[#5a4e46]">${e.familyId??"All Families"}</td>
      <td class="py-3 text-[#5a4e46]">${e.action}</td>
      <td class="py-3 text-[#5a4e46]">${s.toLocaleDateString()}</td>
      <td class="py-3 text-[#5a4e46]">${s.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</td>
      <td class="py-3"><span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Success</span></td>
    </tr>`}).join("")}d().catch(()=>{});p().catch(t=>o(t instanceof Error?t.message:"Failed to load tenants."));f().catch(t=>o(t instanceof Error?t.message:"Failed to load audit logs."));
