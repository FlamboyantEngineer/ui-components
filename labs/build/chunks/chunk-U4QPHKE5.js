function a(t,s){let r=new Map;return t.map(n=>{let e=s(n),c=r.get(e)??0;return r.set(e,c+1),{key:`${e}:${c}`,value:n}})}export{a};
