/* Module « Calcul mental ».
   Générateurs repris tels quels de la page « Calcul mental » (contenu inchangé) ;
   seul le hasard passe par RNG pour pouvoir être injecté dans les tests. */
import { esc } from '../core/util.js';

let RNG = Math.random;
const R=(a,b)=>Math.floor(RNG()*(b-a+1))+a,P=a=>a[R(0,a.length-1)];
const f=n=>(+n).toLocaleString('fr-FR',{maximumFractionDigits:4}).replace('-','−');
const gcd=(a,b)=>b?gcd(b,a%b):a;
const term=(c,v,first)=>{if(!c)return'';const m=Math.abs(c),body=(m===1&&v)?v:m+v;return first?(c<0?'−':'')+body:' '+(c<0?'−':'+')+' '+body};
const poly=(a,b,c)=>term(a,'x²',true)+term(b,'x')+term(c,'');
const pw=n=>n<0?`(${f(n)})`:f(n);

/* ---------- Générateurs : {q, a, s:[étapes], d?:affichage} ---------- */
const G={
table(){const a=R(3,12),b=P([6,7,8,9,11,12]);let s;
 if(b>10)s=[`Sépare ${b} en 10 + ${b-10}.`,`${a} × 10 = ${a*10} et ${a} × ${b-10} = ${a*(b-10)}.`,`${a*10} + ${a*(b-10)} = <mark>${a*b}</mark>.`];
 else if(b>=8)s=[`${b} est proche de 10 : ${a} × ${b} = ${a} × 10 − ${a} × ${10-b}.`,`${a*10} − ${a*(10-b)} = <mark>${a*b}</mark>.`];
 else s=[`Sépare ${b} en 5 + ${b-5}.`,`${a} × 5 = ${a*5} et ${a} × ${b-5} = ${a*(b-5)}.`,`${a*5} + ${a*(b-5)} = <mark>${a*b}</mark>.`];
 return{q:`${a} × ${b}`,a:a*b,s}},
c100(){let n;do n=R(11,99);while(n%10===0);const t=Math.floor(n/10),u=n%10;
 return{q:`100 − ${n}`,a:100-n,s:[`Pour aller à 100 : complète les dizaines à 9 et les unités à 10.`,`${t} → ${9-t} et ${u} → ${10-u}.`,`Résultat : <mark>${100-n}</mark>.`]}},
c1000(){let n;do n=R(101,999);while(n%10===0);const h=Math.floor(n/100),t=Math.floor(n/10)%10,u=n%10;
 return{q:`1000 − ${n}`,a:1000-n,s:[`Pour aller à 1000 : centaines et dizaines à 9, unités à 10.`,`${h} → ${9-h}, ${t} → ${9-t}, ${u} → ${10-u}.`,`Résultat : <mark>${1000-n}</mark>.`]}},
moitie(){const n=2*R(51,499),h=Math.floor(n/100)*100,r=n-h;
 return{q:`La moitié de ${n}`,a:n/2,s:[`Coupe ${n} = ${h} + ${r}.`,`Moitié de ${h} : ${h/2}. Moitié de ${r} : ${r/2}.`,`${h/2} + ${r/2} = <mark>${n/2}</mark>.`]}},
double(){const n=R(125,499),h=Math.floor(n/100)*100,r=n-h;
 return{q:`Le double de ${n}`,a:2*n,s:[`Coupe ${n} = ${h} + ${r}.`,`Double de ${h} : ${2*h}. Double de ${r} : ${2*r}.`,`${2*h} + ${2*r} = <mark>${2*n}</mark>.`]}},
add(){const a=R(23,89),u=R(7,9),b=R(1,6)*10+u,k=10-u;
 return{q:`${a} + ${b}`,a:a+b,s:[`${b} est tout près de ${b+k} : ${b} = ${b+k} − ${k}.`,`${a} + ${b+k} = ${a+b+k}.`,`${a+b+k} − ${k} = <mark>${a+b}</mark>.`]}},
x5(){const n=2*R(12,90);
 return{q:`${n} × 5`,a:n*5,s:[`× 5, c’est ÷ 2 puis × 10 (car 5 = 10 ÷ 2).`,`${n} ÷ 2 = ${n/2}.`,`${n/2} × 10 = <mark>${n*5}</mark>.`]}},
x9(){const n=R(12,60);
 return{q:`${n} × 9`,a:n*9,s:[`× 9, c’est × 10 puis on retire une fois le nombre.`,`${n} × 10 = ${n*10}.`,`${n*10} − ${n} = <mark>${n*9}</mark>.`]}},
x11(){const n=R(12,98);
 return{q:`${n} × 11`,a:n*11,s:[`× 11, c’est × 10 puis on ajoute une fois le nombre.`,`${n} × 10 = ${n*10}.`,`${n*10} + ${n} = <mark>${n*11}</mark>.`]}},
x25(){const n=4*R(3,30);
 return{q:`${n} × 25`,a:n*25,s:[`× 25, c’est ÷ 4 puis × 100 (car 25 = 100 ÷ 4).`,`${n} ÷ 4 = ${n/4}.`,`${n/4} × 100 = <mark>${n*25}</mark>.`]}},
distrib(){const a=R(3,9),b=R(12,19);
 return{q:`${a} × ${b}`,a:a*b,s:[`Distributivité : ${a} × ${b} = ${a} × 10 + ${a} × ${b-10}.`,`${a*10} + ${a*(b-10)} = <mark>${a*b}</mark>.`]}},
comp(){const a=R(61,99),u=R(7,9);let b=R(2,5)*10+u;const k=10-u;
 return{q:`${a} − ${b}`,a:a-b,s:[`Compensation : ${b} = ${b+k} − ${k}.`,`${a} − ${b+k} = ${a-b-k}.`,`On a retiré ${k} de trop, on les rend : ${a-b-k} + ${k} = <mark>${a-b}</mark>.`]}},
pct(){const p=P([10,20,50,5,15,25,30,75]),n=P([40,60,80,120,140,160,200,240,360]),r=n*p/100,t=n/10;
 const m={10:[`10 % = ÷ 10 : ${n} ÷ 10 = <mark>${r}</mark>.`],20:[`10 % de ${n} = ${t}.`,`20 % = 2 × 10 % = 2 × ${t} = <mark>${r}</mark>.`],50:[`50 % = la moitié : ${n} ÷ 2 = <mark>${r}</mark>.`],5:[`10 % de ${n} = ${t}.`,`5 % = la moitié de 10 % : ${t} ÷ 2 = <mark>${r}</mark>.`],15:[`10 % de ${n} = ${t}, 5 % = ${t/2}.`,`15 % = 10 % + 5 % = ${t} + ${t/2} = <mark>${r}</mark>.`],25:[`25 % = un quart : ${n} ÷ 4 = <mark>${r}</mark>.`],30:[`10 % de ${n} = ${t}.`,`30 % = 3 × ${t} = <mark>${r}</mark>.`],75:[`75 % = trois quarts. ${n} ÷ 4 = ${n/4}.`,`3 × ${n/4} = <mark>${r}</mark>.`]};
 return{q:`${p} % de ${n}`,a:r,s:m[p]}},
frac(){const d=P([2,3,4,5,6,8]),nu=R(1,d-1),n=d*R(3,12);
 return{q:`${nu}⁄${d} de ${n}`,a:n/d*nu,s:[`Divise par le dénominateur : ${n} ÷ ${d} = ${n/d}.`,`Multiplie par le numérateur : ${n/d} × ${nu} = <mark>${n/d*nu}</mark>.`]}},
solde(){const pr=P([40,60,80,120,200]),p=P([10,20,25,50]),r=pr*p/100;
 return{q:`Un article à ${pr} € est soldé à −${p} %. Nouveau prix (en €) ?`,a:pr-r,s:[`Calcule la réduction : ${p} % de ${pr} = ${r}.`,`${pr} − ${r} = <mark>${pr-r}</mark>.`]}},
hausse(){const pr=P([40,60,80,120,200]),p=P([10,20,25,50]),r=pr*p/100;
 return{q:`Un prix de ${pr} € augmente de ${p} %. Nouveau prix (en €) ?`,a:pr+r,s:[`Calcule l’augmentation : ${p} % de ${pr} = ${r}.`,`${pr} + ${r} = <mark>${pr+r}</mark>.`]}},
fpc(){const d=P([2,4,5,10,20,25,50]),nu=R(1,d-1),k=100/d;
 return{q:`${nu}⁄${d} en pourcentage (sans le signe %)`,a:nu*k,s:[`Ramène le dénominateur à 100 : ${d} × ${k} = 100.`,`Même opération en haut : ${nu} × ${k} = <mark>${nu*k}</mark>.`,`Donc ${nu}⁄${d} = ${nu*k} %.`]}},
carre(){let n;do n=R(11,29);while(n%10===0);const m=Math.round(n/10)*10,d=Math.abs(n-m),o=n<m?n-d:n+d;
 return{q:`${n}²`,a:n*n,s:[`Passe par la dizaine la plus proche : ${n}² = (${n}−${d})(${n}+${d}) + ${d}².`,`${n}−${d} et ${n}+${d} donnent ${m} et ${o} : ${m} × ${o} = ${m*o}.`,`${m*o} + ${d*d} = <mark>${n*n}</mark>.`]}},
cinq(){const a=R(1,9),n=10*a+5;
 return{q:`${n}²`,a:n*n,s:[`Un nombre qui finit par 5 : on calcule ${a} × ${a+1} puis on écrit 25 derrière.`,`${a} × ${a+1} = ${a*(a+1)}.`,`${a*(a+1)} suivi de 25 : <mark>${n*n}</mark>.`]}},
conj(){const m=P([20,30,40,50,100]),k=R(1,4);
 return{q:`${m-k} × ${m+k}`,a:m*m-k*k,s:[`Identité remarquable : (${m}−${k})(${m}+${k}) = ${m}² − ${k}².`,`${m*m} − ${k*k} = <mark>${m*m-k*k}</mark>.`]}},
proche(){const m=P([20,30,40,50,100]),sg=P([-1,1]),n=m+sg;
 return{q:`${n}²`,a:n*n,s:[`${n} = ${m} ${sg>0?'+':'−'} 1 donc ${n}² = ${m}² ${sg>0?'+':'−'} 2×${m} + 1.`,`${m*m} ${sg>0?'+':'−'} ${2*m} + 1 = <mark>${n*n}</mark>.`]}},
racines(){let r1,r2;do{r1=R(-6,8);r2=R(-6,8)}while(!r1||!r2||r1===r2);const S=r1+r2,Pr=r1*r2,mx=Math.max(r1,r2);
 return{q:`Plus grande racine de ${poly(1,-S,Pr)} = 0`,a:mx,s:[`Pour x² + bx + c : cherche deux nombres de somme ${f(S)} (c’est −b) et de produit ${f(Pr)}.`,`${f(r1)} + ${pw(r2)} = ${f(S)} et ${f(r1)} × ${pw(r2)} = ${f(Pr)} : ce sont les racines.`,`La plus grande est <mark>${f(mx)}</mark>.`]}},
delta(){const a=R(1,3);let b,c;do b=R(-6,6);while(!b);do c=R(-4,4);while(!c);const D=b*b-4*a*c;
 return{q:`Discriminant Δ de ${poly(a,b,c)}`,a:D,s:[`Δ = b² − 4ac avec a = ${a}, b = ${f(b)}, c = ${f(c)}.`,`b² = ${b*b} et 4ac = 4 × ${a} × ${pw(c)} = ${f(4*a*c)}.`,`${b*b} − ${pw(4*a*c)} = <mark>${f(D)}</mark>.`]}},
eval(){const a=R(1,3);let b,c,k;do b=R(-5,5);while(!b);do c=R(-5,5);while(!c);do k=R(-3,3);while(!k);const v=a*k*k+b*k+c;
 return{q:`f(x) = ${poly(a,b,c)}. Calcule f(${f(k)}).`,a:v,s:[`Remplace x par ${f(k)} : le carré d’abord, ${f(k)}² = ${k*k}.`,`${a} × ${k*k} = ${a*k*k} et ${f(b)} × ${pw(k)} = ${f(b*k)}.`,`${f(a*k*k)} + ${pw(b*k)} + ${pw(c)} = <mark>${f(v)}</mark>.`]}},
deriv(){let b,k;do b=R(-5,5);while(!b);do k=R(-3,3);while(!k);
 if(RNG()<.6){const a=R(1,4),c=R(-5,5),v=2*a*k+b;
  return{q:`f(x) = ${poly(a,b,c)}. Calcule f ′(${f(k)}).`,a:v,s:[`On dérive terme à terme : f ′(x) = ${term(2*a,'x',true)}${term(b,'')}.`,`Remplace x par ${f(k)} : ${f(2*a)} × ${pw(k)} = ${f(2*a*k)}.`,`${f(2*a*k)} + ${pw(b)} = <mark>${f(v)}</mark>.`]}}
 const a=R(1,3),v=3*a*k*k+b;
 return{q:`f(x) = ${term(a,'x³',true)}${term(b,'x')}. Calcule f ′(${f(k)}).`,a:v,s:[`(x³)′ = 3x² et (x)′ = 1 : f ′(x) = ${term(3*a,'x²',true)}${term(b,'')}.`,`x² = ${k*k}, donc ${3*a} × ${k*k} = ${3*a*k*k}.`,`${3*a*k*k} + ${pw(b)} = <mark>${f(v)}</mark>.`]}},
trig(){const T=[['cos(0)',1],['sin(0)',0],['cos(π/3)',.5],['sin(π/6)',.5],['cos(π/2)',0],['sin(π/2)',1],['cos(π)',-1],['sin(π)',0],['sin(−π/2)',-1]];
 const X=P(T);let Y;do Y=P(T);while(Y===X);const a=P([2,4,6]),b=P([2,4,6]),v=a*X[1]+b*Y[1];
 return{q:`${a}·${X[0]} + ${b}·${Y[0]}`,a:v,s:[`Rappelle-toi le cercle trigonométrique : ${X[0]} = ${f(X[1])} et ${Y[0]} = ${f(Y[1])}.`,`${a} × ${pw(X[1])} = ${f(a*X[1])} et ${b} × ${pw(Y[1])} = ${f(b*Y[1])}.`,`Somme : <mark>${f(v)}</mark>.`]}},
racine(){if(RNG()<.5){const n=R(11,20);return{q:`√${n*n}`,a:n,s:[`Cherche un nombre dont le carré vaut ${n*n}.`,`${n}² = ${n*n} donc √${n*n} = <mark>${n}</mark>.`]}}
 const [x,y]=P([[2,8],[2,18],[2,50],[3,12],[5,20],[8,18],[12,27],[18,50]]),p=x*y,r=Math.sqrt(p);
 return{q:`√${x} × √${y}`,a:r,s:[`√a × √b = √(a×b) : on regroupe sous une seule racine.`,`${x} × ${y} = ${p}.`,`√${p} = <mark>${r}</mark>.`]}},
puiss(){const t=P([0,1,2]);let b,n,sg=1;
 if(t===0){b=2;n=R(5,10)}else if(t===1){b=3;n=R(3,5)}else{b=2;n=R(3,5);sg=-1}
 const ch=[];let v=1;for(let i=1;i<=n;i++){v*=b;ch.push(v)}
 const neg=sg<0,odd=n%2===1,res=neg&&odd?-v:v;
 return{q:neg?`(−${b})<sup>${n}</sup>`:`${b}<sup>${n}</sup>`,a:res,s:[`On multiplie pas à pas : ${ch.join(', ')}.`,neg?`Exposant ${odd?'impair : le résultat est négatif':'pair : le résultat est positif'}.`:`${b}<sup>${n}</sup> = <mark>${v}</mark>.`,...(neg?[`Résultat : <mark>${f(res)}</mark>.`]:[])]}},
fadd(){let b,d;do{b=P([2,3,4,5,6]);d=P([2,3,4,5,6])}while(b===d);const a=R(1,b-1),c=R(1,d-1),l=b*d/gcd(b,d),nu=a*l/b+c*l/d,g=gcd(nu,l),dn=l/g,nn=nu/g;
 return{q:`${a}⁄${b} + ${c}⁄${d} (réponse en fraction a/b ou en décimal)`,a:nn/dn,d:dn===1?String(nn):`${nn}/${dn}`,s:[`Dénominateur commun : ${l}.`,`${a}⁄${b} = ${a*l/b}⁄${l} et ${c}⁄${d} = ${c*l/d}⁄${l}.`,g>1?`Somme : ${nu}⁄${l} = <mark>${dn===1?nn:nn+'⁄'+dn}</mark> après simplification.`:`Somme : <mark>${nu}⁄${l}</mark>.`]}}
};

/* ---------- Tables de 1 à 20 ---------- */
const mulS=(a,b)=>{const p=a*b,k=[1,10,20,5,15,11,9,2].find(k=>a===k||b===k);
 if(k){const x=a===k?b:a;return{
  1:[`× 1 ne change rien : ${x} × 1 = <mark>${p}</mark>.`],
  10:[`× 10 : on ajoute un zéro à ${x}.`,`${x} × 10 = <mark>${p}</mark>.`],
  20:[`× 20 = × 2 puis × 10.`,`${x} × 2 = ${x*2}.`,`${x*2} × 10 = <mark>${p}</mark>.`],
  5:[`× 5 = × 10 puis on prend la moitié.`,`${x} × 10 = ${x*10}.`,`La moitié de ${x*10} = <mark>${p}</mark>.`],
  15:[`× 15 = × 10 + × 5, et × 5 est la moitié de × 10.`,`${x} × 10 = ${x*10} et sa moitié = ${x*5}.`,`${x*10} + ${x*5} = <mark>${p}</mark>.`],
  11:[`× 11 = × 10 + une fois ${x}.`,`${x*10} + ${x} = <mark>${p}</mark>.`],
  9:[`× 9 = × 10 − une fois ${x}.`,`${x*10} − ${x} = <mark>${p}</mark>.`],
  2:[`× 2 : on double. ${x} + ${x} = <mark>${p}</mark>.`]}[k]}
 const big=Math.max(a,b),sm=Math.min(a,b);
 if(big>10)return[`Coupe ${big} en 10 + ${big-10}.`,`${sm} × 10 = ${sm*10} et ${sm} × ${big-10} = ${sm*(big-10)}.`,`${sm*10} + ${sm*(big-10)} = <mark>${p}</mark>.`];
 if(big>=8)return[`${big} est proche de 10 : ${sm} × ${big} = ${sm} × 10 − ${sm} × ${10-big}.`,`${sm*10} − ${sm*(10-big)} = <mark>${p}</mark>.`];
 return[`Coupe ${big} en 5 + ${big-5}.`,`${sm} × 5 = ${sm*5} et ${sm} × ${big-5} = ${sm*(big-5)}.`,`${sm*5} + ${sm*(big-5)} = <mark>${p}</mark>.`]};
const divS=(p,a,q)=>{
 if(a===1)return[`÷ 1 ne change rien : <mark>${q}</mark>.`];
 if(q===1)return[`Un nombre divisé par lui-même vaut 1 : <mark>1</mark>.`];
 if(a===2)return[`÷ 2 : on prend la moitié de ${p}.`,`La moitié de ${p} = <mark>${q}</mark>.`];
 if(a===4)return[`÷ 4 = la moitié de la moitié.`,`La moitié de ${p} = ${p/2}, puis la moitié de ${p/2} = <mark>${q}</mark>.`];
 if(a===5)return[`÷ 5 = × 2 puis ÷ 10.`,`${p} × 2 = ${p*2}.`,`${p*2} ÷ 10 = <mark>${q}</mark>.`];
 if(a===10)return[`÷ 10 : on enlève un zéro à ${p}.`,`Résultat : <mark>${q}</mark>.`];
 if(a===20)return[`÷ 20 = ÷ 10 puis ÷ 2.`,`${p} ÷ 10 = ${p/10}.`,`La moitié de ${p/10} = <mark>${q}</mark>.`];
 if(q>5){const h=q>10?10:5;return[`Une division est une multiplication à l’envers : par combien multiplier ${a} pour obtenir ${p} ?`,`${a} × ${h} = ${a*h}, il reste ${p-a*h}.`,`${p-a*h} = ${a} × ${q-h}, donc ${h} + ${q-h} = <mark>${q}</mark>.`]}
 return[`Une division est une multiplication à l’envers : compte les multiples de ${a}.`,`${Array.from({length:q},(_,i)=>a*(i+1)).join(', ')}.`,`${p} est le multiple numéro ${q} : <mark>${q}</mark>.`]};
/* ---------- Fractions, racines, puissances ---------- */
const lcm=(a,b)=>a*b/gcd(a,b);
const sf=(n,d)=>{const g=gcd(Math.abs(n),d);n/=g;d/=g;return{n,d,v:n/d,t:d===1?String(n):`${n}⁄${d}`,x:d===1?String(n):`${n}/${d}`}};
const FQ='<small>Réponds par une fraction simplifiée (ex. 5/6) ou un décimal</small>';
const DEN=[2,3,4,5,6,8,10,12];
const simpl=(r,de,nu)=>r.d!==de?`${nu}⁄${de} = <mark>${r.t}</mark> après simplification.`:`Résultat : <mark>${r.t}</mark>, la fraction est déjà simplifiée.`;
const fop=sg=>{let a,b,c,d;
 do{b=P(DEN);d=P(DEN);a=R(1,b-1);c=R(1,d-1)}while((sg<0&&a*d<=c*b)||(b===d&&RNG()<.6));
 const l=lcm(b,d),x=a*l/b,y=c*l/d,nu=sg>0?x+y:x-y,r=sf(nu,l),op=sg>0?'+':'−';
 const s=b===d?[`Même dénominateur ${b} : on ${sg>0?'additionne':'soustrait'} seulement les numérateurs.`]:[`Cherche un dénominateur commun : ${l}.`,`${a}⁄${b}${b===l?'':` = ${x}⁄${l}`} et ${c}⁄${d}${d===l?'':` = ${y}⁄${l}`}.`];
 s.push(`${x} ${op} ${y} = ${nu}.`,simpl(r,l,nu));
 return{q:`${FQ}${a}⁄${b} ${op} ${c}⁄${d}`,a:r.v,d:r.x,s}};
Object.assign(G,{
 fsimp(){let n0,d0,g=R(2,9);do{n0=R(1,9);d0=R(2,10)}while(gcd(n0,d0)!==1||n0===d0);
  return{q:`<small>Simplifie au maximum (réponse a/b)</small>${n0*g}⁄${d0*g}`,a:n0/d0,d:`${n0}/${d0}`,s:[`Cherche un nombre qui divise le haut et le bas : ${g}.`,`${n0*g} ÷ ${g} = ${n0} et ${d0*g} ÷ ${g} = ${d0}.`,`Résultat : <mark>${n0}⁄${d0}</mark>.`]}},
 fadd2(){return fop(1)},
 fsub2(){return fop(-1)},
 fmul(){const a=R(1,8),c=R(1,8),b=R(2,9),d=R(2,9),nu=a*c,de=b*d,r=sf(nu,de);
  return{q:`${FQ}${a}⁄${b} × ${c}⁄${d}`,a:r.v,d:r.x,s:[`On multiplie les numérateurs : ${a} × ${c} = ${nu}.`,`On multiplie les dénominateurs : ${b} × ${d} = ${de}.`,simpl(r,de,nu)]}},
 fdiv(){const a=R(1,8),c=R(1,8),b=R(2,9),d=R(2,9),nu=a*d,de=b*c,r=sf(nu,de);
  return{q:`${FQ}${a}⁄${b} ÷ ${c}⁄${d}`,a:r.v,d:r.x,s:[`Diviser par ${c}⁄${d}, c’est multiplier par son inverse ${d}⁄${c}.`,`${a}⁄${b} × ${d}⁄${c} = ${nu}⁄${de}.`,simpl(r,de,nu)]}},
 rcarre(){const n=R(2,25),t=Math.floor(n/10)*10;
  return{q:`√${n*n}`,a:n,s:n<=12?[`Cherche le nombre dont le carré vaut ${n*n}.`,`${n} × ${n} = ${n*n}, donc √${n*n} = <mark>${n}</mark>.`]:[`Encadre par des dizaines : ${t}² = ${t*t} < ${n*n} < ${(t+10)**2} = ${t+10}².`,`La racine est entre ${t} et ${t+10}, et ${n*n} finit par ${(n*n)%10}.`,`${n}² = ${n*n}, donc √${n*n} = <mark>${n}</mark>.`]}},
 rsimp(){const m=P([2,3,5,6,7,10]),k=R(2,9);
  return{q:`√${k*k*m} = ? × √${m}<small>Donne le nombre devant la racine</small>`,a:k,s:[`Cherche le plus grand carré qui divise ${k*k*m} : ${k*k}, car ${k*k} × ${m} = ${k*k*m}.`,`√(${k*k} × ${m}) = √${k*k} × √${m} = ${k}√${m}.`,`Le nombre devant la racine est <mark>${k}</mark>.`]}},
 rapprox(){let n,k;do{n=R(10,199);k=Math.floor(Math.sqrt(n))}while(k*k===n);
  return{q:`Partie entière de √${n}`,a:k,s:[`Cherche deux carrés parfaits qui encadrent ${n} : ${k}² = ${k*k} et ${k+1}² = ${(k+1)**2}.`,`${k*k} ≤ ${n} < ${(k+1)**2}, donc ${k} ≤ √${n} < ${k+1}.`,`La partie entière est <mark>${k}</mark>.`]}},
 rprod2(){if(RNG()<.5){const a=R(2,9),b=P([2,3,5,6,7]);
   return{q:`(${a}√${b})²`,a:a*a*b,s:[`Le carré s’applique à chaque facteur : ${a}² × (√${b})².`,`${a*a} × ${b} = <mark>${a*a*b}</mark>.`]}}
  const n=R(2,60);return{q:`(√${n})²`,a:n,s:[`Le carré et la racine carrée s’annulent : (√${n})² = <mark>${n}</mark>.`]}},
 rquot(){const [a,b]=P([[48,3],[50,2],[72,2],[75,3],[98,2],[180,5],[32,2],[200,2]]),r=Math.sqrt(a/b);
  return{q:`√${a} ÷ √${b}`,a:r,s:[`√a ÷ √b = √(a ÷ b) : on regroupe sous une seule racine.`,`${a} ÷ ${b} = ${a/b}.`,`√${a/b} = <mark>${r}</mark>.`]}},
 rsum(){const m=P([2,3,5,7]),a=R(2,9),b=R(2,9);
  return{q:`${a}√${m} + ${b}√${m} = ? × √${m}<small>Donne le nombre devant la racine</small>`,a:a+b,s:[`Même racine : on additionne les coefficients, comme ${a} pommes + ${b} pommes.`,`${a} + ${b} = <mark>${a+b}</mark>, donc ${a+b}√${m}.`]}},
 pexp(){const t=R(0,2),B=P([2,3,10]);
  if(t===0){const a=R(2,9),b=R(2,9);return{q:`${B}<sup>${a}</sup> × ${B}<sup>${b}</sup> = ${B}<sup>?</sup>`,a:a+b,s:[`Même base : on additionne les exposants.`,`${a} + ${b} = <mark>${a+b}</mark>.`]}}
  if(t===1){let a,b;do{a=R(2,9);b=R(2,9)}while(a===b);return{q:`${B}<sup>${a}</sup> ÷ ${B}<sup>${b}</sup> = ${B}<sup>?</sup>`,a:a-b,s:[`Même base : on soustrait les exposants.`,`${a} − ${b} = <mark>${f(a-b)}</mark>.`]}}
  const a=R(2,5),b=R(2,5);return{q:`(${B}<sup>${a}</sup>)<sup>${b}</sup> = ${B}<sup>?</sup>`,a:a*b,s:[`Puissance d’une puissance : on multiplie les exposants.`,`${a} × ${b} = <mark>${a*b}</mark>.`]}},
 pneg(){const [B,ex]=P([[2,[1,2,3,4]],[3,[1,2,3]],[5,[1,2]],[10,[1,2,3]]]),n=P(ex),v=B**n;
  return{q:`${FQ}${B}<sup>−${n}</sup>`,a:1/v,d:`1/${v}`,s:[`Un exposant négatif donne l’inverse : ${B}<sup>−${n}</sup> = 1 ⁄ ${B}<sup>${n}</sup>.`,`${B}<sup>${n}</sup> = ${v}.`,`Résultat : <mark>1⁄${v}</mark>.`]}},
 sci(){const a=P([2,3]),b=P([2,3]),m=R(2,8),n=R(2,8);
  return{q:`(${a} × 10<sup>${m}</sup>) × (${b} × 10<sup>${n}</sup>) = ${a*b} × 10<sup>?</sup>`,a:m+n,s:[`On multiplie d’abord les nombres : ${a} × ${b} = ${a*b}.`,`Puis on additionne les exposants de 10 : ${m} + ${n} = <mark>${m+n}</mark>.`]}},
 tmul(){const a=R(1,20),b=R(1,20);return{q:`${a} × ${b}`,a:a*b,s:mulS(a,b)}},
 tdiv(){const a=R(1,20),q=R(1,20),p=a*q;return{q:`${p} ÷ ${a}`,a:q,s:divS(p,a,q)}},
 ttrou(){const a=R(2,20),q=R(2,20),p=a*q;return{q:`${a} × ? = ${p}`,a:q,s:[`Le nombre manquant se trouve par la division ${p} ÷ ${a}.`,...divS(p,a,q)]}}
});

const LV=[
{id:7,n:'Tables de 1 à 20',d:'Multiplications, divisions et nombre manquant (7 × ? = 56), avec une astuce pour chaque cas',g:['tmul','tmul','tdiv','tdiv','ttrou']},
{id:1,n:'Les bases',d:'Tables, compléments à 100 et 1000, doubles et moitiés, additions malignes',g:['table','c100','c1000','moitie','double','add']},
{id:2,n:'Les stratégies',d:'× 5, × 9, × 11, × 25, distributivité, soustraction par compensation',g:['x5','x9','x11','x25','distrib','comp']},
{id:3,n:'Pourcentages et fractions',d:'10 %, 15 %, 25 %, soldes, hausses, fractions d’un nombre',g:['pct','pct','frac','solde','hausse','fpc']},
{id:4,n:'Carrés et identités remarquables',d:'Carrés jusqu’à 29, nombres finissant par 5, (a−b)(a+b)',g:['carre','cinq','conj','proche']},
{id:8,n:'Fractions',d:'Simplifier, additionner, soustraire, multiplier et diviser des fractions',g:['fsimp','fadd2','fadd2','fsub2','fsub2','fmul','fdiv']},
{id:9,n:'Racines carrées',d:'Racines exactes, simplification (√72 = 6√2), encadrement, produits, quotients et sommes de racines',g:['rcarre','rsimp','rapprox','rprod2','rquot','rsum']},
{id:10,n:'Puissances',d:'Règles sur les exposants, puissances de 10, exposants négatifs et notation scientifique',g:['pexp','pneg','sci','puiss']},
{id:5,n:'Niveau Première',d:'Racines d’un trinôme, discriminant, f(x), dérivées, trigonométrie, racines, puissances, fractions',g:['racines','delta','eval','deriv','trig','racine','puiss','fadd']}
];

/* Les niveaux de la page deviennent les thèmes. « Mélange complet » disparaît :
   tout cocher revient au même. */
const THEME_IDS = { 7: 'tables', 1: 'bases', 2: 'strategies', 3: 'pourcentages', 4: 'carres', 8: 'fractions', 9: 'racines', 10: 'puissances', 5: 'premiere' };
const THEMES = LV.filter(l => THEME_IDS[l.id]).map(l => ({ id: THEME_IDS[l.id], label: l.n, hint: l.d, gens: l.g }));

export function parseAnswer(s) {
  s = String(s).trim().replace(/\s/g, '').replace(/−/g, '-').replace(/,/g, '.');
  if (!s) return NaN;
  if (s.includes('/')) { const [p, d] = s.split('/'); return p === '' || d === '' ? NaN : Number(p) / Number(d); }
  return Number(s);
}

/* Même tolérance que la page d'origine : exact pour les entiers et fractions, 0,6 % sinon. */
export function isRight(q, raw) {
  const v = parseAnswer(raw);
  if (!Number.isFinite(v)) return null;
  return Math.abs(v - q.a) < (Number.isInteger(q.a) || String(raw).includes('/') ? 1e-9 : Math.abs(q.a) * 0.006);
}

export default {
  id: 'math',
  name: 'Calcul mental',
  short: 'Math',
  themes: THEMES.map(({ id, label, hint }) => ({ id, label, hint })),
  defaults: { themes: ['tables', 'bases'], count: 2 },
  generate({ themes } = {}, rng = Math.random) {
    RNG = rng;
    try {
      const pool = THEMES.filter(t => !themes || !themes.length || themes.includes(t.id));
      const th = pool[Math.floor(rng() * pool.length)];
      const name = th.gens[Math.floor(rng() * th.gens.length)];
      const q = G[name]();
      const shown = q.d || f(q.a);
      return {
        module: 'math', theme: th.id, generator: name, key: 'math:' + q.q, raw: q,
        prompt: `<div class="q-math">${q.q}</div>`,
        input: 'keypad',
        reveal: () => ({ status: 'ko', title: `Réponse : ${esc(shown)}`, feedback: `<h3>Comment le faire de tête</h3><ol class="how">${q.s.map(x => `<li>${x}</li>`).join('')}</ol>`, answer: shown }),
        check(answer) {
          const ok = isRight(q, answer);
          if (ok === null) return { status: 'retry', message: 'Écris un nombre (ex. 42, −3, 0,5 ou 5/6).' };
          return {
            status: ok ? 'ok' : 'ko',
            title: ok ? 'Juste !' : `Pas tout à fait. Réponse : ${esc(shown)}`,
            feedback: `<h3>Comment le faire de tête</h3><ol class="how">${q.s.map(x => `<li>${x}</li>`).join('')}</ol>`,
            answer: shown
          };
        }
      };
    } finally { RNG = Math.random; }
  }
};

export { G as GENERATORS, THEMES as MATH_THEMES };
