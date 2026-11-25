import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Car, QrCode, ScanLine, RefreshCw, ShieldCheck, Wind, HeartHandshake, Wallet, MapPin, Phone, User, Clock, Bell, Check, X, Play, Pause, ChevronRight, Sparkles, Zap, Package, Compass, Music, Info, Home, Users, TrendingUp, Download, CircleCheck, Timer, Search, Navigation, Star, ArrowRight, Trash2, MoonStar, Route, Gauge, LogIn, UserPlus, FileCheck, ClipboardCheck, AlertTriangle, BadgeCheck, FileText, IdCard, CarFront, Camera, Lock, Mail, Eye, EyeOff, LocateFixed, Repeat, Tablet as TabletIcon } from 'lucide-react';
import logoUrl from "container:///mnt/data/src/assets/e1038468df166f45-img-u7531222977551289791-1.jpg";

type Driver = { id:string; name:string; car:string; plate:string; rating:number; trips:number };
type Status = 'Esperando' | 'Pool General' | 'Aceptado' | 'En camino' | 'En viaje' | 'Terminado' | 'Rechazada';
type ResValue = { nombre:string; telefono:string; origen:string; destino:string; notas:string; driver:string; driverId:string; status:Status; createdAt:number; deadline:number; price:number; km:number; minutes:number };
type ResRecord = { id:string; value:ResValue; created_at?:string; updated_at?:string };
type View = 'gate'|'tablet'|'usuario'|'conductor'|'login'|'registro-usuario'|'registro-conductor'|'validacion';
type Role = 'usuario'|'conductor'|'tablet'|null;
type ValidationStatus = 'PENDIENTE' | 'EN REVISIÓN' | 'APROBADO' | 'RECHAZADO';
type UserValue = { nombre:string; telefono:string; correo:string; password:string; role:'usuario'|'conductor'; createdAt:number };
type UserRecord = { id:string; value:UserValue };
type DriverDocs = { ine:boolean; licencia:boolean; circulacion:boolean; seguro:boolean; fotoAuto:boolean; selfie:boolean };
type DriverAppValue = { driverId:string; nombre:string; telefono:string; correo:string; ciudad:string; licenciaNumero:string; licenciaVigencia:string; circulacion:string; aseguradora:string; seguroVigencia:string; marca:string; modelo:string; anio:string; color:string; placa:string; docs:DriverDocs; status:ValidationStatus; createdAt:number; motivo?:string };
type DriverAppRecord = { id:string; value:DriverAppValue };
type CurrentUser = { id?:string; nombre:string; telefono:string; correo:string; role:'usuario'|'conductor' };

const DRIVERS: Driver[] = [
  { id:'DRV-042', name:'Carlos M.', car:'Versa Blanco', plate:'ABC-123', rating:4.9, trips:1284 },
  { id:'DRV-017', name:'Ana R.', car:'March Gris', plate:'XYZ-789', rating:4.8, trips:961 },
  { id:'DRV-089', name:'Luis P.', car:'Sentra Negro', plate:'LMN-456', rating:4.7, trips:743 },
];
const RULES = [
  { icon: ShieldCheck, title:'Cinturón', desc:'Úsalo todo el viaje, por tu seguridad.' },
  { icon: Wind, title:'No fumar', desc:'El auto es espacio libre de humo.' },
  { icon: HeartHandshake, title:'Respeto', desc:'Trato amable para todos a bordo.' },
  { icon: Wallet, title:'Pago en app', desc:'Sin efectivo. Todo queda registrado.' },
];
const PLAYLIST = [
  { id:1, title:'Banda Hits en Vivo — Volumen 1', artist:'Conecta Live', time:'3:12' },
  { id:2, title:'Noche de Banda en la Ciudad', artist:'Conecta Live', time:'2:48' },
  { id:3, title:'Energía de Viernes', artist:'Conecta Party', time:'3:41' },
  { id:4, title:'Ruta al Amanecer', artist:'Conecta Chill', time:'3:04' },
];
const SERVICES = [
  { icon:Zap, name:'Viaje Express', desc:'Directo, sin paradas', tag:'El más rápido' },
  { icon:Users, name:'Viaje Compartido', desc:'Comparte y ahorra', tag:'Ahorra 30%' },
  { icon:Package, name:'Envíos', desc:'Manda paquetes en la ciudad', tag:'Hoy mismo' },
  { icon:MoonStar, name:'Tour Nocturno', desc:'Recorre la ciudad de noche', tag:'2 horas' },
];
const DOC_LABELS: {key:keyof DriverDocs; label:string; hint:string}[] = [
  { key:'ine', label:'INE', hint:'Identificación oficial' },
  { key:'licencia', label:'Licencia de conducir', hint:'Número + vigencia' },
  { key:'circulacion', label:'Tarjeta de circulación', hint:'Vigente' },
  { key:'seguro', label:'Seguro del auto', hint:'Aseguradora + vigencia' },
  { key:'fotoAuto', label:'Foto del auto', hint:'Frente y costado' },
  { key:'selfie', label:'Selfie de verificación', hint:'Rostro visible' },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACA_RE = /^[A-Z]{3}-?\d{3,4}$/;
const PLACES = [
  'Av. Insurgentes Sur, Ciudad de México',
  'Insurgentes Sur 1234, Del Valle',
  'Insurgentes Sur 123, Ciudad de México',
  'Centro Histórico, Ciudad de México',
  'Colonia Roma Norte, Ciudad de México',
  'Colonia Condesa, Ciudad de México',
  'Aeropuerto Internacional, Ciudad de México',
  'Ciudad Universitaria, Ciudad de México',
  'Parque Chapultepec, Ciudad de México',
  'Polanco, Ciudad de México',
  'Coyoacán, Ciudad de México',
  'Santa Fe, Ciudad de México',
  'Av. Reforma, Ciudad de México',
  'Colonia Del Valle, Ciudad de México',
];

function digitsOnly(v:string){ return v.replace(/\D/g,''); }
function isFutureDate(v:string){ if(!v) return false; const d=new Date(v+'T23:59:59'); return !isNaN(d.getTime()) && d.getTime() > Date.now(); }
function isValidYear(v:string){ if(!/^\d{4}$/.test(v)) return false; const y=Number(v); return y>=1995 && y<=2027; }
function initialRole(): {role:Role; view:View; driverIdx:number}{
  try{
    const p = new URLSearchParams(window.location.search);
    const rol = (p.get('rol')||'').toLowerCase();
    const cond = p.get('conductor')||'';
    const idx = cond ? DRIVERS.findIndex(d=>d.id===cond) : -1;
    if(rol==='tablet') return {role:'tablet', view:'tablet', driverIdx:0};
    if(rol==='usuario') return {role:'usuario', view:'usuario', driverIdx: idx>=0?idx:0};
    if(rol==='conductor') return {role:'conductor', view:'conductor', driverIdx:0};
  }catch{}
  return {role:null, view:'gate', driverIdx:0};
}

async function callApi(action:string, args:any){
  const res = await fetch("actions", { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(()=>({}));
  if(!res.ok || json.error) throw new Error(json.error || `Error ${res.status}`);
  return json.data;
}

function PlaceSearch({label, value, onChange, placeholder}:{label:string; value:string; onChange:(v:string)=>void; placeholder:string}){
  const [open,setOpen]=useState(false);
  const [gpsActive,setGpsActive]=useState(false);
  const [selected,setSelected]=useState(false);
  const [gpsBusy,setGpsBusy]=useState(false);
  const suggestions = useMemo(()=>{
    const q = value.trim().toLowerCase();
    if(q.length<3) return [];
    const filtered = PLACES.filter(p=>p.toLowerCase().includes(q));
    const list = filtered.length ? filtered : [`${value.trim()}, Ciudad de México`, `Av. ${value.trim()}, Ciudad de México`, `${value.trim()}, Colonia Roma Norte`, `${value.trim()}, Centro Histórico`];
    return list.slice(0,5);
  },[value]);
  function pick(s:string){ onChange(s); setSelected(true); setOpen(false); }
  function useGps(){
    setGpsBusy(true);
    const fill = ()=>{
      onChange('Av. Insurgentes Sur 123, CDMX');
      setSelected(true); setGpsActive(true); setGpsBusy(false); setOpen(false);
    };
    try{
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(()=>fill(), ()=>fill(), {timeout:4000});
      } else fill();
    }catch{ fill(); }
  }
  return (
    <div>
      <span className="text-xs font-bold text-[var(--muted)]">{label}</span>
      <div className="relative mt-1">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00d4ff]" />
        <input value={value} onChange={e=>{onChange(e.target.value); setSelected(false); setGpsActive(false); setOpen(true);}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),180)} placeholder={placeholder} className="w-full rounded-2xl border border-white/15 bg-[#020617]/70 py-3 pl-10 pr-3 text-sm" />
        {open && value.trim().length>=3 && suggestions.length>0 && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-[#00d4ff]/40 bg-[#061226] shadow-[0_18px_50px_rgba(0,0,0,.6)]">
            <p className="px-3 pt-2 text-[11px] font-bold tracking-widest text-[#7beaff]">SUGERENCIAS · BÚSQUEDA LOCAL</p>
            {suggestions.map(s=>(
              <button key={s} type="button" onMouseDown={e=>{e.preventDefault(); pick(s);}} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#00d4ff]/15">
                <MapPin className="h-4 w-4 shrink-0 text-[#00d4ff]" /><span className="[overflow-wrap:anywhere]">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={useGps} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${gpsActive?'bg-emerald-400 text-[#020617]':'bg-white/10 text-white border border-white/15'}`}>
          <LocateFixed className="h-4 w-4" />{gpsBusy?'Buscando GPS…': gpsActive ? 'GPS activado ✓' : <span><span className="sm:hidden">GPS</span><span className="hidden sm:inline">GPS · Usar mi ubicación</span></span>}
        </button>
        {selected && <span className="inline-flex items-center gap-1 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/40 px-2.5 py-1.5 text-[11px] font-bold text-[#7beaff]"><MapPin className="h-3 w-3" /> Ubicación lista para la ruta</span>}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">Escribe 3 o más letras para ver sugerencias. Un mapa no está disponible.</p>
    </div>
  );
}

function KioscoExit({onExit}:{onExit:()=>void}){
  const [holding,setHolding]=useState(false);
  const [progress,setProgress]=useState(0);
  const timerRef = useRef<number|null>(null);
  const startRef = useRef(0);
  function start(){
    setHolding(true); startRef.current = Date.now();
    if(timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(()=>{
      const p = Math.min(100, ((Date.now()-startRef.current)/3000)*100);
      setProgress(p);
      if(p>=100){ if(timerRef.current) window.clearInterval(timerRef.current); setHolding(false); setProgress(0); onExit(); }
    },60);
  }
  function cancel(){ if(timerRef.current) window.clearInterval(timerRef.current); setHolding(false); setProgress(0); }
  return (
    <div className="mt-2">
      <button type="button" onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} className="w-full rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[11px] font-bold text-[var(--muted)]">
        {holding ? `Sostén para salir de kiosco… ${Math.round(progress)}%` : 'Salir de Kiosco · mantén 3 s'}
      </button>
      {holding && <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#00d4ff]" style={{width:`${progress}%`}} /></div>}
      <p className="mt-1 text-center text-[10px] text-[var(--muted)]">Mantén presionado 3 segundos para volver a “¿Quién eres?”.</p>
    </div>
  );
}

export default function App(){
  const init = useMemo(()=>initialRole(),[]);
  const [role, setRole] = useState<Role>(init.role);
  const [view, setView] = useState<View>(init.view);
  const [tabletDriverIdx, setTabletDriverIdx] = useState(0);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState(init.driverIdx);
  const [conductorIdx, setConductorIdx] = useState(0);
  const [online, setOnline] = useState(true);
  const [fromQR, setFromQR] = useState(false);
  const [tabletTab, setTabletTab] = useState<'promos'|'servicios'|'musica'|'quienes'>('promos');
  const [playingId, setPlayingId] = useState<number|null>(null);
  const [installed, setInstalled] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [records, setRecords] = useState<ResRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiNote, setApiNote] = useState('');
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const processingRef = useRef<Set<string>>(new Set());

  const [currentUser, setCurrentUser] = useState<CurrentUser|null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [driverApps, setDriverApps] = useState<DriverAppRecord[]>([]);
  const [loginTab, setLoginTab] = useState<'usuario'|'conductor'>('usuario');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);

  const [ruNombre, setRuNombre] = useState('');
  const [ruTelefono, setRuTelefono] = useState('');
  const [ruCorreo, setRuCorreo] = useState('');
  const [ruPass, setRuPass] = useState('');
  const [ruPass2, setRuPass2] = useState('');
  const [ruTerms, setRuTerms] = useState(false);
  const [ruTouched, setRuTouched] = useState<Record<string,boolean>>({});
  const [ruBusy, setRuBusy] = useState(false);
  const [showRuPass, setShowRuPass] = useState(false);

  const [dcStep, setDcStep] = useState(1);
  const [dc, setDc] = useState({ nombre:'', telefono:'', correo:'', password:'', ciudad:'', licenciaNumero:'', licenciaVigencia:'', circulacion:'', aseguradora:'', seguroVigencia:'', marca:'', modelo:'', anio:'', color:'', placa:'' });
  const [dcTouched, setDcTouched] = useState<Record<string,boolean>>({});
  const [dcDocs, setDcDocs] = useState<DriverDocs>({ ine:false, licencia:false, circulacion:false, seguro:false, fotoAuto:false, selfie:false });
  const [dcBusy, setDcBusy] = useState(false);
  const [showDcPass, setShowDcPass] = useState(false);
  const [validationFilter, setValidationFilter] = useState<'todos'|'PENDIENTE'|'EN REVISIÓN'|'APROBADO'|'RECHAZADO'>('todos');

  const [nombre, setNombre] = useState('Alex');
  const [telefono, setTelefono] = useState('555 012 3456');
  const [origen, setOrigen] = useState('Ubicación actual - Tablet');
  const [destino, setDestino] = useState('Centro Histórico');
  const [notas, setNotas] = useState('Llevo una maleta pequeña');
  const [km, setKm] = useState(5);
  const [minutes, setMinutes] = useState(12);

  const tabletDriver = DRIVERS[tabletDriverIdx];
  const selectedDriver = DRIVERS[selectedDriverIdx];
  const conductor = DRIVERS[conductorIdx];
  const price = Math.round(18 + km * 7.5 + minutes * 1.8);

  function defaultViewFor(r:Role): View { if(r==='usuario') return 'usuario'; if(r==='conductor') return 'conductor'; if(r==='tablet') return 'tablet'; return 'gate'; }
  function allowedViews(r:Role): View[] {
    if(r==='usuario') return ['usuario','login','registro-usuario'];
    if(r==='conductor') return ['conductor','login','registro-conductor','validacion'];
    if(r==='tablet') return ['tablet'];
    return ['gate'];
  }
  useEffect(()=>{
    if(!allowedViews(role).includes(view)){ setView(defaultViewFor(role)); }
  },[role, view]);

  function selectRole(r:Exclude<Role,null>){
    setRole(r);
    setView(defaultViewFor(r));
    setNotice(r==='usuario' ? 'Modo Pasajero activado. Solo ves tu interfaz.' : r==='conductor' ? 'Modo Conductor activado. Solo ves tu interfaz.' : 'Modo Kiosco activado. La tablet queda fija en su pantalla.');
    window.scrollTo({top:0, behavior:'smooth'});
  }
  function exitToGate(){
    setRole(null); setView('gate'); setCurrentUser(null);
    setNotice('Volviste a “¿Quién eres?”. Elige tu rol para continuar.');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  async function reloadRecords(){
    const data = await callApi("records.list", { collection:'reservations' });
    const list = (data?.records || []) as ResRecord[];
    setRecords(list.sort((a,b)=> (b.value.createdAt||0)-(a.value.createdAt||0)));
  }
  async function reloadUsers(){
    try{ const data = await callApi("records.list", { collection:'users' }); setUsers((data?.records||[]) as UserRecord[]); }catch{}
  }
  async function reloadDriverApps(){
    try{ const data = await callApi("records.list", { collection:'driver_applications' }); setDriverApps((data?.records||[]) as DriverAppRecord[]); }catch{}
  }
  useEffect(()=>{ (async()=>{ try{ await reloadRecords(); await reloadUsers(); await reloadDriverApps(); }catch(e){ setApiNote('Modo vista previa: el registro no está disponible aquí. Los cambios se muestran en esta sesión.'); } finally{ setLoading(false); } })(); },[]);
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()), 500); return ()=>clearInterval(t); },[]);

  function appForDriver(driverId:string){ return driverApps.find(a=>a.value.driverId===driverId); }
  function statusForDriver(driverId:string): ValidationStatus{ return appForDriver(driverId)?.value.status || 'PENDIENTE'; }
  function docsForDriver(driverId:string): DriverDocs{
    const a = appForDriver(driverId);
    if(!a) return { ine:false, licencia:false, circulacion:false, seguro:false, fotoAuto:false, selfie:false };
    return a.value.docs;
  }
  function docsCountForDriver(driverId:string){ const d = docsForDriver(driverId); return Object.values(d).filter(Boolean).length; }
  function missingForDriver(driverId:string){ const d = docsForDriver(driverId); return DOC_LABELS.filter(x=>!d[x.key]); }
  const conductorStatus = statusForDriver(conductor.id);
  const conductorApproved = conductorStatus==='APROBADO';
  const conductorDocsCount = docsCountForDriver(conductor.id);
  const conductorMissing = missingForDriver(conductor.id);

  function statusStyle(s:ValidationStatus){
    if(s==='APROBADO') return 'bg-emerald-400 text-[#020617]';
    if(s==='EN REVISIÓN') return 'bg-amber-300 text-[#020617]';
    if(s==='RECHAZADO') return 'bg-red-500 text-white';
    return 'bg-zinc-500 text-white';
  }
  function statusLabel(s:ValidationStatus){ return s==='EN REVISIÓN'?'EN REVISIÓN':s; }

  async function handleLogin(){
    setLoginError('');
    if(!loginId.trim()){ setLoginError('Escribe tu teléfono o correo.'); return; }
    if(!loginPass){ setLoginError('Escribe tu contraseña.'); return; }
    setLoginBusy(true);
    const id = loginId.trim();
    if(loginPass==='1234'){
      const demo: CurrentUser = { nombre: id.includes('@') ? 'Usuario Demo' : `Usuario ${digitsOnly(id).slice(-4)||'Demo'}`, telefono: id.includes('@')?'':id, correo: id.includes('@')?id:'', role: loginTab==='conductor'?'conductor':'usuario' };
      setCurrentUser(demo);
      setNotice(`✓ Sesión iniciada como ${loginTab==='conductor'?'conductor':'usuario'} (demo con 1234). Bienvenido, ${demo.nombre}.`);
      setLoginPass('');
      setView(loginTab==='conductor'?'conductor':'usuario');
      setLoginBusy(false);
      window.scrollTo({top:0, behavior:'smooth'});
      return;
    }
    const found = users.find(u=> (u.value.telefono===id || u.value.correo.toLowerCase()===id.toLowerCase()) && u.value.password===loginPass);
    if(found){
      setCurrentUser({ id:found.id, nombre:found.value.nombre, telefono:found.value.telefono, correo:found.value.correo, role:found.value.role });
      setNotice(`✓ Sesión iniciada. Bienvenido de nuevo, ${found.value.nombre}.`);
      setLoginPass('');
      setView(found.value.role==='conductor'?'conductor':'usuario');
      setLoginBusy(false);
      return;
    }
    setLoginError('Teléfono/correo o contraseña incorrectos. Consejo demo: usa cualquier teléfono y contraseña 1234.');
    setLoginBusy(false);
  }
  function logout(){ setCurrentUser(null); setNotice('Sesión cerrada. Puedes ingresar de nuevo cuando quieras.'); setView(defaultViewFor(role)); }

  const ruErr = {
    nombre: ruNombre.trim().length<3 ? 'Escribe tu nombre completo.' : (!ruNombre.trim().includes(' ') ? 'Incluye nombre y apellido.' : ''),
    telefono: digitsOnly(ruTelefono).length!==10 ? 'El teléfono debe tener 10 dígitos.' : '',
    correo: !EMAIL_RE.test(ruCorreo.trim()) ? 'Escribe un correo válido, ej. nombre@correo.com' : '',
    password: ruPass.length<8 ? 'La contraseña debe tener mínimo 8 caracteres.' : '',
    confirm: ruPass2!==ruPass || !ruPass2 ? 'Las contraseñas no coinciden.' : '',
    terms: !ruTerms ? 'Debes aceptar los Términos y Aviso de Privacidad.' : '',
  };
  const ruValid = { nombre:!ruErr.nombre, telefono:!ruErr.telefono, correo:!ruErr.correo, password:!ruErr.password, confirm:!ruErr.confirm, terms:!ruErr.terms };
  const ruAllValid = Object.values(ruValid).every(Boolean);

  async function handleRegisterUser(){
    if(!ruAllValid) { setRuTouched({nombre:true,telefono:true,correo:true,password:true,confirm:true,terms:true}); return; }
    setRuBusy(true);
    const value: UserValue = { nombre:ruNombre.trim(), telefono:digitsOnly(ruTelefono), correo:ruCorreo.trim().toLowerCase(), password:ruPass, role:'usuario', createdAt:Date.now() };
    const idempotency_key = `user-${value.createdAt}-${Math.random().toString(36).slice(2,8)}`;
    try{
      const created = await callApi("records.create", { collection:'users', value, idempotency_key });
      const rec = created as UserRecord;
      setUsers(prev=>[rec, ...prev]);
      setCurrentUser({ id:rec.id, nombre:value.nombre, telefono:value.telefono, correo:value.correo, role:'usuario' });
      setNotice(`✓ Cuenta creada. Bienvenido a Conecta, ${value.nombre}. Ya puedes pedir tu viaje.`);
    }catch(e:any){
      const temp: UserRecord = { id:`local-${value.createdAt}`, value };
      setUsers(prev=>[temp, ...prev]);
      setCurrentUser({ id:temp.id, nombre:value.nombre, telefono:value.telefono, correo:value.correo, role:'usuario' });
      setNotice(`✓ Cuenta creada en esta sesión. Bienvenido, ${value.nombre}.`);
      if(String(e?.message||'').includes('limit')) setApiNote('Se alcanzó el límite de registros guardados (1,000). Esta cuenta solo se muestra en esta sesión.');
    }
    setRuBusy(false);
    setView('usuario');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  const dcErr = {
    nombre: dc.nombre.trim().length<3 ? 'Escribe tu nombre completo.' : (!dc.nombre.trim().includes(' ') ? 'Incluye nombre y apellido.' : ''),
    telefono: digitsOnly(dc.telefono).length!==10 ? 'El teléfono debe tener 10 dígitos.' : '',
    correo: !EMAIL_RE.test(dc.correo.trim()) ? 'Escribe un correo válido.' : '',
    password: dc.password.length<8 ? 'Mínimo 8 caracteres.' : '',
    ciudad: !dc.ciudad.trim() ? 'Escribe tu ciudad.' : '',
    licenciaNumero: dc.licenciaNumero.trim().length<5 ? 'Escribe el número de tu licencia.' : '',
    licenciaVigencia: !dc.licenciaVigencia ? 'Elige la vigencia.' : (!isFutureDate(dc.licenciaVigencia) ? 'La vigencia debe ser una fecha futura.' : ''),
    circulacion: dc.circulacion.trim().length<4 ? 'Escribe el folio o número de tu tarjeta de circulación.' : '',
    aseguradora: !dc.aseguradora.trim() ? 'Escribe tu aseguradora.' : '',
    seguroVigencia: !dc.seguroVigencia ? 'Elige la vigencia del seguro.' : (!isFutureDate(dc.seguroVigencia) ? 'La vigencia del seguro debe ser futura.' : ''),
    marca: !dc.marca.trim() ? 'Escribe la marca.' : '',
    modelo: !dc.modelo.trim() ? 'Escribe el modelo.' : '',
    anio: !isValidYear(dc.anio) ? 'Año válido 1995–2027 (4 dígitos).' : '',
    color: !dc.color.trim() ? 'Escribe el color.' : '',
    placa: !PLACA_RE.test(dc.placa.trim().toUpperCase()) ? 'Formato de placa: ABC-123 o ABC-1234.' : '',
  };
  const dcStep1Valid = !dcErr.nombre && !dcErr.telefono && !dcErr.correo && !dcErr.password && !dcErr.ciudad;
  const dcStep2Valid = !dcErr.licenciaNumero && !dcErr.licenciaVigencia && !dcErr.circulacion && !dcErr.aseguradora && !dcErr.seguroVigencia && dcDocs.ine;
  const dcStep3Valid = !dcErr.marca && !dcErr.modelo && !dcErr.anio && !dcErr.color && !dcErr.placa && dcDocs.fotoAuto && dcDocs.selfie;
  const dcAllValid = dcStep1Valid && dcStep2Valid && dcStep3Valid;

  function setDcField(k:keyof typeof dc, v:string){ setDc(prev=>({...prev,[k]:v})); setDcTouched(prev=>({...prev,[k]:true})); }
  function markDcTouched(keys:string[]){ setDcTouched(prev=>{ const n={...prev}; keys.forEach(k=>n[k]=true); return n; }); }

  async function handleRegisterDriver(){
    if(!dcAllValid){ setDcTouched({nombre:true,telefono:true,correo:true,password:true,ciudad:true,licenciaNumero:true,licenciaVigencia:true,circulacion:true,aseguradora:true,seguroVigencia:true,marca:true,modelo:true,anio:true,color:true,placa:true}); setDcStep(dcStep1Valid ? (dcStep2Valid?3:2) : 1); return; }
    setDcBusy(true);
    const driverId = `DRV-APP-${Date.now().toString().slice(-5)}`;
    const value: DriverAppValue = {
      driverId, nombre:dc.nombre.trim(), telefono:digitsOnly(dc.telefono), correo:dc.correo.trim().toLowerCase(), ciudad:dc.ciudad.trim(),
      licenciaNumero:dc.licenciaNumero.trim(), licenciaVigencia:dc.licenciaVigencia, circulacion:dc.circulacion.trim(), aseguradora:dc.aseguradora.trim(), seguroVigencia:dc.seguroVigencia,
      marca:dc.marca.trim(), modelo:dc.modelo.trim(), anio:dc.anio.trim(), color:dc.color.trim(), placa:dc.placa.trim().toUpperCase(),
      docs:{ ine:true, licencia:true, circulacion:true, seguro:true, fotoAuto:true, selfie:true },
      status:'EN REVISIÓN', createdAt:Date.now()
    };
    const idempotency_key = `driver-${value.createdAt}-${Math.random().toString(36).slice(2,8)}`;
    try{
      const created = await callApi("records.create", { collection:'driver_applications', value, idempotency_key });
      setDriverApps(prev=>[created as DriverAppRecord, ...prev]);
      try{ const u = await callApi("records.create", { collection:'users', value:{ nombre:value.nombre, telefono:value.telefono, correo:value.correo, password:dc.password, role:'conductor', createdAt:value.createdAt }, idempotency_key:`user-${value.createdAt}` }); setUsers(prev=>[u as UserRecord, ...prev]); }catch{}
      setCurrentUser({ nombre:value.nombre, telefono:value.telefono, correo:value.correo, role:'conductor' });
      setNotice(`✓ Registro de conductor enviado. Estado: EN REVISIÓN · ${value.nombre} · ${value.marca} ${value.modelo} · Placa ${value.placa}. Te avisaremos cuando seas validado.`);
    }catch(e:any){
      const temp: DriverAppRecord = { id:`local-${value.createdAt}`, value };
      setDriverApps(prev=>[temp, ...prev]);
      setCurrentUser({ nombre:value.nombre, telefono:value.telefono, correo:value.correo, role:'conductor' });
      setNotice(`✓ Registro enviado en esta sesión. Estado: EN REVISIÓN.`);
      if(String(e?.message||'').includes('limit')) setApiNote('Se alcanzó el límite de registros (1,000). Este registro solo se muestra en esta sesión.');
    }
    setDcBusy(false);
    setView('validacion');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  async function setDriverAppStatus(rec:DriverAppRecord|null, driverId:string, driverName:string, status:ValidationStatus){
    const docsAll: DriverDocs = { ine:true, licencia:true, circulacion:true, seguro:true, fotoAuto:true, selfie:true };
    if(rec){
      const next: DriverAppValue = { ...rec.value, status, docs: status==='APROBADO' ? docsAll : rec.value.docs, motivo: status==='RECHAZADO' ? 'Revisión simulada: falta verificar un documento.' : '' };
      setDriverApps(prev=>prev.map(r=>r.id===rec.id?{...r, value:next}:r));
      try{ await callApi("records.replace", { collection:'driver_applications', id:rec.id, value:next }); setNotice(status==='APROBADO' ? `✓ ${driverName} APROBADO. Ya puede aceptar viajes y aparecer en el Pool.` : `⚠ ${driverName} RECHAZADO. No puede aceptar viajes hasta corregir sus documentos.`); }
      catch{ setNotice(status==='APROBADO' ? `✓ ${driverName} APROBADO en esta sesión.` : `⚠ ${driverName} RECHAZADO en esta sesión.`); }
    } else {
      const value: DriverAppValue = { driverId, nombre:driverName, telefono:'', correo:'', ciudad:'', licenciaNumero:'', licenciaVigencia:'', circulacion:'', aseguradora:'', seguroVigencia:'', marca:'', modelo:'', anio:'', color:'', placa:'', docs: status==='APROBADO' ? docsAll : { ine:false, licencia:false, circulacion:false, seguro:false, fotoAuto:false, selfie:false }, status, createdAt:Date.now(), motivo: status==='RECHAZADO' ? 'Revisión simulada.' : '' };
      const idempotency_key = `driver-${value.createdAt}-${Math.random().toString(36).slice(2,8)}`;
      try{ const created = await callApi("records.create", { collection:'driver_applications', value, idempotency_key }); setDriverApps(prev=>[created as DriverAppRecord, ...prev]); }
      catch{ setDriverApps(prev=>[{ id:`local-${value.createdAt}`, value }, ...prev]); }
      setNotice(status==='APROBADO' ? `✓ ${driverName} APROBADO (simulado). Ya puede aceptar viajes.` : `⚠ ${driverName} RECHAZADO (simulado).`);
    }
  }

  async function updateReservation(rec:ResRecord, patch:Partial<ResValue>, msg:string){
    if(patch.status==='Aceptado' && !conductorApproved){
      setNotice('⛔ No puedes aceptar viajes hasta ser validado. Estado actual: '+conductorStatus+'. Completa tu registro y espera aprobación.');
      setView('validacion');
      return;
    }
    const next = { ...rec.value, ...patch };
    setRecords(prev=>prev.map(r=>r.id===rec.id?{...r, value:next}:r));
    try{ await callApi("records.replace", { collection:'reservations', id:rec.id, value:next }); setNotice(msg); }
    catch(e){ setApiNote('Sin conexión al registro: cambio solo en esta sesión.'); setNotice(msg); }
  }
  async function moveToPool(rec:ResRecord){
    if(processingRef.current.has(rec.id)) return;
    processingRef.current.add(rec.id);
    await updateReservation(rec, { status:'Pool General' }, '⏱ Tiempo agotado — la reserva pasó al Pool General');
    setTimeout(()=>processingRef.current.delete(rec.id), 2000);
  }
  useEffect(()=>{
    records.forEach(r=>{
      if(r.value.status==='Esperando' && r.value.deadline && now >= r.value.deadline) moveToPool(r);
    });
  },[now]);

  async function createReservation(){
    if(!currentUser){
      setNotice('Regístrate para pedir tu viaje. Crea tu cuenta Conecta en menos de un minuto.');
      setView('registro-usuario');
      window.scrollTo({top:0, behavior:'smooth'});
      return;
    }
    if(!nombre.trim()){ setFormError('Escribe tu nombre para solicitar el viaje.'); return; }
    if(!destino.trim()){ setFormError('Escribe tu destino para solicitar el viaje.'); return; }
    setFormError(''); setSaving(true);
    const value:ResValue = { nombre:nombre.trim(), telefono:telefono.trim(), origen:origen.trim()||'Ubicación actual - Tablet', destino:destino.trim(), notas:notas.trim(), driver:selectedDriver.name, driverId:selectedDriver.id, status:'Esperando', createdAt:Date.now(), deadline:Date.now()+15000, price, km, minutes };
    const idempotency_key = `res-${value.createdAt}-${Math.random().toString(36).slice(2,8)}`;
    try{
      const created = await callApi("records.create", { collection:'reservations', value, idempotency_key });
      setRecords(prev=>[created as ResRecord, ...prev]);
      setNotice(`✓ Reserva creada — Esperando a ${selectedDriver.name} · 15s para aceptar`);
    }catch(e:any){
      const temp:ResRecord = { id:`local-${value.createdAt}`, value };
      setRecords(prev=>[temp, ...prev]);
      setApiNote('Modo vista previa: el registro no está disponible aquí. La reserva se muestra en esta sesión.');
      setNotice(`✓ Reserva creada en esta sesión — Esperando a ${selectedDriver.name} · 15s`);
      if(String(e?.message||'').includes('limit')) setApiNote('Se alcanzó el límite de registros guardados (1,000). Esta reserva solo se muestra en esta sesión.');
    }
    setSaving(false); setView('usuario');
  }

  function simulateScan(){
    setSelectedDriverIdx(tabletDriverIdx); setFromQR(true); setView('usuario');
    setNotice(`📱 Escaneo simulado — Reservando con ${DRIVERS[tabletDriverIdx].name}`);
    window.scrollTo({top:0, behavior:'smooth'});
  }
  function changeDriver(){ const n=(tabletDriverIdx+1)%DRIVERS.length; setTabletDriverIdx(n); setNotice(`Conductor cambiado a ${DRIVERS[n].name} · QR ${DRIVERS[n].id}`); }

  const myReservations = records;
  const inbox = records.filter(r=> r.value.driverId===conductor.id && r.value.status==='Esperando');
  const pool = records.filter(r=> r.value.status==='Pool General');
  const active = records.find(r=> r.value.driverId===conductor.id && ['Aceptado','En camino','En viaje'].includes(r.value.status));
  const finished = records.filter(r=> r.value.driverId===conductor.id && r.value.status==='Terminado');
  const earnings = finished.reduce((sum,r)=> sum + (r.value.price || 85), 0);
  const visibleReservations = showAll ? myReservations : myReservations.slice(0,4);

  function statusPill(s:Status){
    const map:Record<string,string> = { 'Esperando':'bg-[#00d4ff] text-[#020617]', 'Pool General':'bg-sky-400 text-[#020617]', 'Aceptado':'bg-emerald-400 text-[#020617]', 'En camino':'bg-violet-400 text-white', 'En viaje':'bg-[#0077ff] text-white', 'Terminado':'bg-zinc-600 text-white', 'Rechazada':'bg-red-500 text-white' };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-[0_0_18px_rgba(0,212,255,.35)] ${map[s]}`}>{s}</span>;
  }
  function remaining(rec:ResRecord){ return Math.max(0, Math.ceil((rec.value.deadline - now)/1000)); }
  async function cancelRes(rec:ResRecord){
    setRecords(prev=>prev.filter(r=>r.id!==rec.id));
    try{ await callApi("records.delete", { collection:'reservations', id:rec.id }); setNotice('Reserva cancelada.'); }catch{ setNotice('Reserva cancelada en esta sesión.'); }
  }
  function advanceTrip(rec:ResRecord){
    const order:Status[] = ['Aceptado','En camino','En viaje','Terminado'];
    const idx = order.indexOf(rec.value.status as Status);
    if(idx>=0 && idx<3) updateReservation(rec, { status: order[idx+1] }, `Viaje avanzó a ${order[idx+1]}`);
  }

  const shellStyle = { boxSizing:'border-box' as const, paddingTop:'var(--safe-area-inset-top)' };

  function renderField(opts:{label:string; value:string; onChange:(v:string)=>void; onBlur?:()=>void; error?:string; valid?:boolean; touched?:boolean; placeholder?:string; type?:string; inputMode?:any; maxLength?:number; showPassToggle?:boolean; passVisible?:boolean; onTogglePass?:()=>void; autoComplete?:string}){
    const showError = !!opts.touched && !!opts.error;
    const showOk = !!opts.touched && !opts.error && opts.value.length>0;
    return (
      <label className="block">
        <span className="flex items-center justify-between text-xs font-bold text-[var(--muted)]"><span>{opts.label}</span>{showOk && <span className="flex items-center gap-1 text-emerald-400"><Check className="h-3.5 w-3.5"/> Válido</span>}</span>
        <div className="relative mt-1">
          <input type={opts.type||'text'} value={opts.value} onChange={e=>opts.onChange(e.target.value)} onBlur={opts.onBlur} placeholder={opts.placeholder} inputMode={opts.inputMode} maxLength={opts.maxLength} autoComplete={opts.autoComplete}
            className={`w-full rounded-2xl border bg-[#020617]/70 px-4 py-3 text-sm pr-10 ${showError?'border-red-500 bg-red-500/10':'border-white/15'} ${showOk?'border-emerald-400':''}`} />
          {opts.showPassToggle && <button type="button" onClick={opts.onTogglePass} aria-label={opts.passVisible?'Ocultar contraseña':'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">{opts.passVisible?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>}
          {!opts.showPassToggle && showOk && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400"/>}
          {!opts.showPassToggle && showError && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400"/>}
        </div>
        {showError && <span className="mt-1 block text-xs font-semibold text-red-400">{opts.error}</span>}
      </label>
    );
  }
  function simulatedUpload(label:string, done:boolean, fileName:string, onSimulate:()=>void){
    return (
      <div className={`rounded-2xl border p-3 ${done?'border-emerald-400/60 bg-emerald-400/10':'border-white/15 bg-white/5'}`}>
        <p className="flex items-center justify-between text-sm font-bold"><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#00d4ff]"/>{label}</span>{done && <span className="text-xs text-emerald-400">Subido ✓</span>}</p>
        {done ? <p className="mt-1 text-xs text-[var(--muted)] [overflow-wrap:anywhere]">{fileName} · Simulado — no se envía un archivo real.</p> : <p className="mt-1 text-xs text-[var(--muted)]">Subida simulada — pulsa el botón para marcar el documento como subido.</p>}
        <button type="button" onClick={onSimulate} className={`mt-2 w-full rounded-full py-2 text-xs font-bold ${done?'bg-emerald-400 text-[#020617]':'bg-white/10 text-white'}`}>{done?'Cambiar / Volver a simular':'Simular subida'}</button>
      </div>
    );
  }
  function validationBadge(s:ValidationStatus){ return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${statusStyle(s)}`}>{s==='APROBADO'?<BadgeCheck className="h-4 w-4"/>:s==='EN REVISIÓN'?<Clock className="h-4 w-4"/>:s==='RECHAZADO'?<AlertTriangle className="h-4 w-4"/>:<FileCheck className="h-4 w-4"/>}{statusLabel(s)}</span>; }

  const validationRows: {id:string; rec:DriverAppRecord|null; driverId:string; nombre:string; status:ValidationStatus; count:number; createdAt:number; placa?:string; marca?:string; modelo?:string}[] = [];
  driverApps.forEach(a=> validationRows.push({ id:a.id, rec:a, driverId:a.value.driverId, nombre:a.value.nombre, status:a.value.status, count:Object.values(a.value.docs).filter(Boolean).length, createdAt:a.value.createdAt, placa:a.value.placa, marca:a.value.marca, modelo:a.value.modelo }));
  DRIVERS.forEach(d=>{ if(!driverApps.find(a=>a.value.driverId===d.id)) validationRows.push({ id:`demo-${d.id}`, rec:null, driverId:d.id, nombre:d.name, status:'PENDIENTE', count:0, createdAt:0, placa:d.plate, marca:d.car }); });
  validationRows.sort((a,b)=>b.createdAt-a.createdAt);
  const filteredValidation = validationFilter==='todos' ? validationRows : validationRows.filter(r=>r.status===validationFilter);
  const counts = { total:validationRows.length, PENDIENTE:validationRows.filter(r=>r.status==='PENDIENTE').length, 'EN REVISIÓN':validationRows.filter(r=>r.status==='EN REVISIÓN').length, APROBADO:validationRows.filter(r=>r.status==='APROBADO').length, RECHAZADO:validationRows.filter(r=>r.status==='RECHAZADO').length };

  const roleBanner = role==='usuario' ? 'Estás en modo Pasajero — Solo ves tu interfaz' : role==='conductor' ? 'Estás en modo Conductor — Solo ves tu interfaz' : role==='tablet' ? 'Estás en modo Tablet · Modo Kiosco — Solo ves tu interfaz' : '';
  const navItems: {k:View; label:string}[] = role==='usuario' ? [{k:'usuario',label:'Usuario'},{k:'login',label:'Login'},{k:'registro-usuario',label:'Registro Usuario'}] : role==='conductor' ? [{k:'conductor',label:'Conductor'},{k:'login',label:'Login'},{k:'registro-conductor',label:'Registro Conductor'},{k:'validacion',label:'Validación'}] : role==='tablet' ? [{k:'tablet',label:'Tablet · En el auto'}] : [{k:'gate',label:'¿Quién eres?'}];

  return (
    <div data-safe-area-inset-root style={shellStyle} className="min-h-[100dvh] bg-[#020617] text-[var(--text)] overflow-x-clip">
      <div className="aurora pointer-events-none fixed inset-0" aria-hidden="true" />

      <header data-safe-area-sticky-top style={{ top:'var(--safe-area-inset-top)' }} className="sticky z-30 w-full max-w-[100vw] overflow-x-clip border-b border-[rgba(0,212,255,.25)] bg-[#020617]/90 backdrop-blur-xl">
        <div className="header-row mx-auto max-w-5xl">
          <button onClick={()=>{ if(role) setView(defaultViewFor(role)); else setView('gate'); }} className="header-brand text-left" aria-label="Conecta — ir a inicio según tu rol">
            <img src={logoUrl} alt="Conecta — logotipo neón azul con enchufe" className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-[0_0_24px_rgba(0,212,255,.65)] ring-1 ring-[#00d4ff]/60" />
            <span className="header-brand-word font-display font-extrabold tracking-tight neon-text">Conecta</span>
            <span className="hidden lg:block whitespace-nowrap text-[9px] font-bold tracking-[0.12em] text-[#7beaff] leading-tight">UNA APP · 3 MÓDULOS</span>
          </button>
          <div className="header-actions">
            {role==='tablet' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/40 px-2.5 py-1.5 text-[11px] font-bold text-[#7beaff]"><TabletIcon className="h-3.5 w-3.5" /> Modo Kiosco - Tablet</span>
            ) : role ? (
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2.5 py-1.5 text-[11px] font-bold text-[#7beaff]">{role==='usuario'?'Modo Pasajero':role==='conductor'?'Modo Conductor':'Modo Tablet'}</span>
            ) : null}
            {role && (
              <button onClick={exitToGate} className="header-pill rounded-full border border-[#00d4ff]/50 bg-white/5 font-bold text-[#7beaff]"><Repeat className="h-4 w-4 shrink-0"/><span className="auth-label">Cambiar Rol</span></button>
            )}
            {role!=='tablet' && (currentUser ? (
              <div className="flex flex-nowrap items-center gap-2">
                <div className="hidden md:block text-right leading-tight"><p className="max-w-[110px] truncate text-xs font-bold">{currentUser.nombre}</p><p className="text-[10px] font-bold text-[#7beaff] uppercase">{currentUser.role==='conductor'?'Conductor':'Usuario'}</p></div>
                <button onClick={logout} className="header-pill rounded-full border border-[rgba(0,212,255,.4)] bg-white/5 font-bold">Salir</button>
              </div>
            ) : role ? (
              <>
                <button onClick={()=>{setView('login'); setNotice('');}} className="header-pill rounded-full border border-[#00d4ff]/50 bg-white/5 font-bold text-[#7beaff]"><LogIn className="h-4 w-4 shrink-0"/><span className="auth-label">Ingresar</span></button>
                <button onClick={()=>setView(role==='conductor'?'registro-conductor':'registro-usuario')} className="header-pill rounded-full bg-[#00d4ff] font-bold text-[#020617] shadow-[0_0_20px_rgba(0,212,255,.35)]"><UserPlus className="h-4 w-4 shrink-0"/><span className="auth-label">Registrarme</span></button>
              </>
            ) : null)}
            {role!=='tablet' && <button onClick={()=>{ setInstalled(v=>!v); setNotice(installed?'Instalación simulada desactivada.':'✓ Conecta quedó lista como app — usa el menú del navegador para instalarla.'); }} className="header-pill hidden md:flex rounded-full bg-white font-bold text-[#020617]"><Download className="h-4 w-4 shrink-0" /><span>{installed?'Instalada ✓':'Instalar'}</span></button>}
          </div>
        </div>
        <nav aria-label="Módulos" className="mx-auto flex max-w-5xl flex-nowrap gap-2 overflow-x-auto no-scrollbar px-3 pb-3" style={{gap:'8px'}}>
          {navItems.map(({k,label})=>(
            <button key={k} onClick={()=>setView(k)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[14px] font-bold transition ${view===k?'neon-btn':'bg-white/5 text-[#9cc9dd] border border-[rgba(0,212,255,.25)]'}`} style={{padding:'10px 16px'}}>{label}</button>
          ))}
        </nav>
      </header>

      <main className="relative mx-auto w-full max-w-5xl overflow-x-clip px-4 pb-32 pt-4" style={{width:'100%', maxWidth:'100vw', boxSizing:'border-box'}}>
        {role && roleBanner && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#00d4ff]/40 bg-[#00d4ff]/10 px-4 py-3 text-[13px] font-bold text-[#b9ecff]"><span className="live-dot h-2 w-2 rounded-full bg-[#00d4ff]" /><span>{roleBanner}</span>{role==='tablet' && <span className="text-[11px] font-semibold text-[#7beaff]">La tablet no cambia de pantalla.</span>}</div>
        )}
        {(notice || apiNote) && (
          <div className="mb-4 space-y-2">
            {notice && <div className="glass rounded-2xl px-4 py-3 text-[13px] font-semibold flex gap-2"><CircleCheck className="h-4 w-4 shrink-0 text-[#00d4ff]" /><span className="[overflow-wrap:anywhere]">{notice}</span><button aria-label="Cerrar aviso" onClick={()=>setNotice('')} className="ml-auto text-[var(--muted)]"><X className="h-4 w-4"/></button></div>}
            {apiNote && <div className="rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-4 py-3 text-xs leading-relaxed text-[#b9ecff]">{apiNote}</div>}
          </div>
        )}

        {view==='gate' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">CONECTA · ELIGE TU ROL</p>
            <h1 className="mt-1 font-display text-[clamp(28px,7vw,44px)] font-extrabold leading-tight">¿Quién eres?</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">Cada quien ve solo su interfaz. Elige tu rol para entrar. Enlaces directos: <span className="font-mono text-xs text-[#7beaff]">?rol=tablet</span>, <span className="font-mono text-xs text-[#7beaff]">?rol=usuario&amp;conductor=DRV-042</span>, <span className="font-mono text-xs text-[#7beaff]">?rol=conductor</span>.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button onClick={()=>selectRole('usuario')} className="glass rounded-[28px] p-5 text-left transition hover:shadow-[0_0_30px_rgba(0,212,255,.3)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00d4ff]/15 text-[#00d4ff]"><User className="h-6 w-6" /></span>
                <span className="mt-3 block font-display text-xl font-extrabold">Soy Pasajero</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">Pedir viaje</span>
                <span className="mt-3 block text-sm font-bold text-[#7beaff]">Entrar como pasajero →</span>
                <span className="mt-2 block text-[11px] text-[var(--muted)]">Solo ves Usuario + Login / Registro Usuario.</span>
              </button>
              <button onClick={()=>selectRole('conductor')} className="glass rounded-[28px] p-5 text-left transition hover:shadow-[0_0_30px_rgba(0,212,255,.3)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Car className="h-6 w-6" /></span>
                <span className="mt-3 block font-display text-xl font-extrabold">Soy Conductor</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">Atender viajes</span>
                <span className="mt-3 block text-sm font-bold text-[#7beaff]">Entrar como conductor →</span>
                <span className="mt-2 block text-[11px] text-[var(--muted)]">Solo ves Conductor + Login / Registro Conductor + Validación.</span>
              </button>
              <button onClick={()=>selectRole('tablet')} className="rounded-[28px] bg-gradient-to-br from-[#00d4ff] to-[#0047ff] p-5 text-left text-[#020617] shadow-[0_0_38px_rgba(0,212,255,.35)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-black/20"><TabletIcon className="h-6 w-6" /></span>
                <span className="mt-3 block font-display text-xl font-extrabold">Tablet del Auto</span>
                <span className="mt-1 block text-sm font-medium opacity-90">Modo Kiosco</span>
                <span className="mt-3 block text-sm font-bold">Entrar en modo kiosco →</span>
                <span className="mt-2 block text-[11px] font-medium opacity-80">Solo ves Tablet. No puedes salir sin mantener 3 s el botón de salida.</span>
              </button>
            </div>
            <div className="glass mt-4 rounded-[28px] p-5"><p className="font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#00d4ff]" /> ¿Por qué un rol?</p><p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">El pasajero no debe ver la bandeja del conductor, el conductor no debe ver el formulario del pasajero y la tablet del auto debe quedarse fija. Con “Cambiar Rol” en la parte superior puedes volver aquí en la demo.</p></div>
          </section>
        )}

        {view==='login' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">INGRESAR · CONECTA</p>
            <h1 className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-extrabold">Bienvenido de nuevo</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Ingresa con tu teléfono o correo. Demo: cualquier teléfono + contraseña <b className="text-white">1234</b>.</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="glass rounded-[28px] p-5">
                <div className="grid grid-cols-2 gap-2 rounded-full bg-white/5 p-1">
                  {role==='usuario' ? <span className="rounded-full py-2.5 text-center text-sm font-bold neon-btn">Usuario</span> : role==='conductor' ? <span className="rounded-full py-2.5 text-center text-sm font-bold neon-btn">Conductor</span> : ([['usuario','Usuario'],['conductor','Conductor']] as const).map(([k,l])=>(<button key={k} onClick={()=>setLoginTab(k)} className={`rounded-full py-2.5 text-sm font-bold ${loginTab===k?'neon-btn':'text-[var(--muted)]'}`}>{l}</button>))}
                </div>
                <div className="mt-4 space-y-3">
                  {renderField({ label: (role==='conductor'||loginTab==='conductor') ? 'TELÉFONO O CORREO DEL CONDUCTOR *' : 'TELÉFONO O CORREO *', value:loginId, onChange:v=>{setLoginId(v); setLoginError('');}, placeholder:'Ej. 555 012 3456 o nombre@correo.com', touched:true, valid:loginId.trim().length>0, autoComplete:'username' })}
                  {renderField({ label:'CONTRASEÑA *', value:loginPass, onChange:v=>{setLoginPass(v); setLoginError('');}, placeholder:'Tu contraseña', type: showLoginPass?'text':'password', touched:true, valid:loginPass.length>0, showPassToggle:true, passVisible:showLoginPass, onTogglePass:()=>setShowLoginPass(v=>!v), autoComplete:'current-password' })}
                </div>
                {loginError && <p className="mt-3 rounded-2xl bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300">{loginError}</p>}
                <button disabled={loginBusy || !loginId.trim() || !loginPass} onClick={handleLogin} className="neon-btn mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 font-display font-bold disabled:opacity-60"><LogIn className="h-4 w-4"/>{loginBusy?'Entrando…':'Entrar'}</button>
                <p className="mt-3 text-center text-sm text-[var(--muted)]">¿No tienes cuenta? <button onClick={()=>setView(role==='conductor'?'registro-conductor':'registro-usuario')} className="font-bold text-[#7beaff] underline">Regístrate</button></p>
                <div className="mt-4 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 p-3 text-xs leading-relaxed text-[#b9ecff]"><b>Demo rápida:</b> escribe cualquier teléfono, contraseña <b>1234</b> y pulsa Entrar. Si ya creaste una cuenta, usa esa contraseña.</div>
              </div>
              <div className="space-y-3">
                {role!=='conductor' && <button onClick={()=>setView('registro-usuario')} className="glass w-full rounded-[28px] p-5 text-left"><p className="flex items-center gap-2 font-display font-bold"><UserPlus className="h-5 w-5 text-[#00d4ff]"/> Soy pasajero</p><p className="mt-1 text-sm text-[var(--muted)]">Crea tu cuenta de usuario para pedir viajes, ver tu historial y usar promos.</p><p className="mt-2 text-sm font-bold text-[#7beaff]">Registrarme como usuario →</p></button>}
                {role!=='usuario' && <button onClick={()=>setView('registro-conductor')} className="glass w-full rounded-[28px] p-5 text-left"><p className="flex items-center gap-2 font-display font-bold"><CarFront className="h-5 w-5 text-[#00d4ff]"/> Soy conductor</p><p className="mt-1 text-sm text-[var(--muted)]">Registra tus documentos y tu auto en 3 pasos. Quedas EN REVISIÓN hasta ser aprobado.</p><p className="mt-2 text-sm font-bold text-[#7beaff]">Registrarme como conductor →</p></button>}
                <div className="glass rounded-[28px] p-5"><p className="flex items-center gap-2 font-bold text-sm"><ShieldCheck className="h-5 w-5 text-[#00d4ff]"/> ¿Por qué pedir registro?</p><p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">Solo cuentas verificadas pueden pedir o aceptar viajes. Los conductores deben aprobar la validación de documentos antes de aparecer en el Pool.</p></div>
              </div>
            </div>
          </section>
        )}

        {view==='registro-usuario' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">REGISTRO · USUARIO</p>
            <h1 className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-extrabold">Crea tu cuenta Conecta</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Completa los campos. La validación es en vivo: borde verde = válido, borde rojo = revisa el mensaje.</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="glass rounded-[28px] p-5">
                <div className="space-y-4">
                  {renderField({ label:'NOMBRE COMPLETO *', value:ruNombre, onChange:v=>{setRuNombre(v); setRuTouched(p=>({...p,nombre:true}));}, error:ruErr.nombre, valid:ruValid.nombre, touched:!!ruTouched.nombre, placeholder:'Ej. Alex Ramírez' })}
                  {renderField({ label:'TELÉFONO * — 10 DÍGITOS', value:ruTelefono, onChange:v=>{setRuTelefono(digitsOnly(v).slice(0,10)); setRuTouched(p=>({...p,telefono:true}));}, error:ruErr.telefono, valid:ruValid.telefono, touched:!!ruTouched.telefono, placeholder:'555 012 3456', inputMode:'numeric' })}
                  {renderField({ label:'CORREO *', value:ruCorreo, onChange:v=>{setRuCorreo(v); setRuTouched(p=>({...p,correo:true}));}, error:ruErr.correo, valid:ruValid.correo, touched:!!ruTouched.correo, placeholder:'nombre@correo.com', type:'email', autoComplete:'email' })}
                  {renderField({ label:'CONTRASEÑA * — MÍNIMO 8 CARACTERES', value:ruPass, onChange:v=>{setRuPass(v); setRuTouched(p=>({...p,password:true}));}, error:ruErr.password, valid:ruValid.password, touched:!!ruTouched.password, placeholder:'Mínimo 8 caracteres', type: showRuPass?'text':'password', showPassToggle:true, passVisible:showRuPass, onTogglePass:()=>setShowRuPass(v=>!v), autoComplete:'new-password' })}
                  {renderField({ label:'CONFIRMAR CONTRASEÑA *', value:ruPass2, onChange:v=>{setRuPass2(v); setRuTouched(p=>({...p,confirm:true}));}, error:ruErr.confirm, valid:ruValid.confirm, touched:!!ruTouched.confirm, placeholder:'Repite tu contraseña', type:'password', autoComplete:'new-password' })}
                  <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={ruTerms} onChange={e=>{setRuTerms(e.target.checked); setRuTouched(p=>({...p,terms:true}));}} className="mt-0.5 h-5 w-5 accent-[#00d4ff]" />
                    <span className="text-sm leading-snug">Acepto los <b>Términos</b> y el <b>Aviso de Privacidad</b> de Conecta. *</span>
                  </label>
                  {ruTouched.terms && ruErr.terms && <p className="text-xs font-semibold text-red-400">{ruErr.terms}</p>}
                </div>
                <button disabled={!ruAllValid || ruBusy} onClick={handleRegisterUser} className="neon-btn mt-4 w-full rounded-full py-4 font-display font-bold disabled:opacity-50 disabled:saturate-0">{ruBusy?'Creando cuenta…':'Crear cuenta Conecta'}</button>
                {!ruAllValid && <p className="mt-2 text-center text-xs text-[var(--muted)]">El botón se activa cuando todos los campos sean válidos y aceptes los Términos.</p>}
                <p className="mt-3 text-center text-sm text-[var(--muted)]">¿Ya tienes cuenta? <button onClick={()=>setView('login')} className="font-bold text-[#7beaff] underline">Ingresar</button></p>
              </div>
              <div className="glass rounded-[28px] p-5 h-fit">
                <p className="font-display font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-[#00d4ff]"/> Tu registro, en vivo</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {([['Nombre completo',ruValid.nombre],['Teléfono 10 dígitos',ruValid.telefono],['Correo válido',ruValid.correo],['Contraseña 8+',ruValid.password],['Confirmación igual',ruValid.confirm],['Términos aceptados',ruValid.terms]] as const).map(([l,ok])=>(<li key={l} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"><span>{l}</span><span className={ok?'text-emerald-400 font-bold':'text-[var(--muted)]'}>{ok?'✓':'○'}</span></li>))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">Al crear tu cuenta quedas conectado automáticamente y vas directo a pedir tu viaje. Tu cuenta se guarda en el registro de la app.</p>
              </div>
            </div>
          </section>
        )}

        {view==='registro-conductor' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">REGISTRO · CONDUCTOR · REQUISITOS</p>
            <h1 className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-extrabold">Únete como conductor</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">3 pasos. Al enviar quedas <b className="text-amber-300">EN REVISIÓN</b>. Sin aprobación no puedes aceptar viajes.</p>
            <div className="mt-4 flex items-center gap-1">
              {([1,2,3] as const).map(n=>(
                <React.Fragment key={n}>
                  <button onClick={()=>setDcStep(n)} className={`flex-1 rounded-full px-2 py-2.5 text-[12px] sm:text-sm font-bold ${dcStep===n?'neon-btn': n<dcStep ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40':'bg-white/5 text-[var(--muted)] border border-white/10'}`}>{n===1?'1 · Datos':n===2?'2 · Documentos':'3 · Vehículo'}</button>
                  {n<3 && <span className="h-px w-2 bg-white/20"/>}
                </React.Fragment>
              ))}
            </div>
            <div className="glass mt-4 rounded-[28px] p-5">
              {dcStep===1 && (
                <div>
                  <p className="font-display font-bold flex items-center gap-2"><User className="h-5 w-5 text-[#00d4ff]"/> Paso 1 · Datos del conductor</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {renderField({ label:'NOMBRE COMPLETO *', value:dc.nombre, onChange:v=>setDcField('nombre',v), error:dcErr.nombre, valid:!dcErr.nombre, touched:!!dcTouched.nombre, placeholder:'Ej. Carlos Méndez' })}
                    {renderField({ label:'TELÉFONO * — 10 DÍGITOS', value:dc.telefono, onChange:v=>setDcField('telefono', digitsOnly(v).slice(0,10)), error:dcErr.telefono, valid:!dcErr.telefono, touched:!!dcTouched.telefono, placeholder:'555 012 3456', inputMode:'numeric' })}
                    {renderField({ label:'CORREO *', value:dc.correo, onChange:v=>setDcField('correo',v), error:dcErr.correo, valid:!dcErr.correo, touched:!!dcTouched.correo, placeholder:'nombre@correo.com', type:'email' })}
                    {renderField({ label:'CONTRASEÑA * — MÍN 8', value:dc.password, onChange:v=>setDcField('password',v), error:dcErr.password, valid:!dcErr.password, touched:!!dcTouched.password, placeholder:'Mínimo 8 caracteres', type: showDcPass?'text':'password', showPassToggle:true, passVisible:showDcPass, onTogglePass:()=>setShowDcPass(v=>!v) })}
                    <div className="sm:col-span-2">{renderField({ label:'CIUDAD *', value:dc.ciudad, onChange:v=>setDcField('ciudad',v), error:dcErr.ciudad, valid:!dcErr.ciudad, touched:!!dcTouched.ciudad, placeholder:'Ej. Ciudad de México' })}</div>
                  </div>
                  <button disabled={!dcStep1Valid} onClick={()=>{markDcTouched(['licenciaNumero','licenciaVigencia']); setDcStep(2);}} className="neon-btn mt-4 w-full rounded-full py-3.5 font-bold disabled:opacity-50">Continuar a Documentos →</button>
                  {!dcStep1Valid && <p className="mt-2 text-center text-xs text-[var(--muted)]">Completa los 5 campos para continuar.</p>}
                </div>
              )}
              {dcStep===2 && (
                <div>
                  <p className="font-display font-bold flex items-center gap-2"><IdCard className="h-5 w-5 text-[#00d4ff]"/> Paso 2 · Documentos y requisitos</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">{simulatedUpload('INE', dcDocs.ine, 'INE-frente.jpg (simulado)', ()=>setDcDocs(p=>({...p, ine:!p.ine})))}</div>
                    {renderField({ label:'LICENCIA DE CONDUCIR · NÚMERO *', value:dc.licenciaNumero, onChange:v=>setDcField('licenciaNumero',v), error:dcErr.licenciaNumero, valid:!dcErr.licenciaNumero, touched:!!dcTouched.licenciaNumero, placeholder:'Ej. LIC-12345678' })}
                    <label className="block"><span className="flex justify-between text-xs font-bold text-[var(--muted)]"><span>VIGENCIA DE LICENCIA *</span>{!!dcTouched.licenciaVigencia && !dcErr.licenciaVigencia && <span className="text-emerald-400">✓ Válida</span>}</span><input type="date" value={dc.licenciaVigencia} onChange={e=>setDcField('licenciaVigencia', e.target.value)} className={`mt-1 w-full rounded-2xl border bg-[#020617]/70 px-4 py-3 text-sm ${!!dcTouched.licenciaVigencia && dcErr.licenciaVigencia?'border-red-500':'border-white/15'} ${!!dcTouched.licenciaVigencia && !dcErr.licenciaVigencia?'border-emerald-400':''}`}/>{!!dcTouched.licenciaVigencia && dcErr.licenciaVigencia && <span className="mt-1 block text-xs font-semibold text-red-400">{dcErr.licenciaVigencia}</span>}</label>
                    {renderField({ label:'TARJETA DE CIRCULACIÓN *', value:dc.circulacion, onChange:v=>setDcField('circulacion',v), error:dcErr.circulacion, valid:!dcErr.circulacion, touched:!!dcTouched.circulacion, placeholder:'Folio o número' })}
                    {renderField({ label:'SEGURO · ASEGURADORA *', value:dc.aseguradora, onChange:v=>setDcField('aseguradora',v), error:dcErr.aseguradora, valid:!dcErr.aseguradora, touched:!!dcTouched.aseguradora, placeholder:'Ej. Aseguradora Conecta' })}
                    <label className="block sm:col-span-2"><span className="flex justify-between text-xs font-bold text-[var(--muted)]"><span>VIGENCIA DEL SEGURO *</span>{!!dcTouched.seguroVigencia && !dcErr.seguroVigencia && <span className="text-emerald-400">✓ Válida</span>}</span><input type="date" value={dc.seguroVigencia} onChange={e=>setDcField('seguroVigencia', e.target.value)} className={`mt-1 w-full rounded-2xl border bg-[#020617]/70 px-4 py-3 text-sm ${!!dcTouched.seguroVigencia && dcErr.seguroVigencia?'border-red-500':'border-white/15'} ${!!dcTouched.seguroVigencia && !dcErr.seguroVigencia?'border-emerald-400':''}`}/>{!!dcTouched.seguroVigencia && dcErr.seguroVigencia && <span className="mt-1 block text-xs font-semibold text-red-400">{dcErr.seguroVigencia}</span>}</label>
                  </div>
                  <div className="mt-4 flex gap-2"><button onClick={()=>setDcStep(1)} className="flex-1 rounded-full border border-white/20 py-3 font-bold">← Datos</button><button disabled={!dcStep2Valid} onClick={()=>setDcStep(3)} className="neon-btn flex-[2] rounded-full py-3 font-bold disabled:opacity-50">Continuar a Vehículo →</button></div>
                  {!dcStep2Valid && <p className="mt-2 text-center text-xs text-[var(--muted)]">Sube tu INE (simulado), completa licencia, circulación y seguro con vigencias futuras.</p>}
                </div>
              )}
              {dcStep===3 && (
                <div>
                  <p className="font-display font-bold flex items-center gap-2"><CarFront className="h-5 w-5 text-[#00d4ff]"/> Paso 3 · Vehículo + verificación</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {renderField({ label:'MARCA *', value:dc.marca, onChange:v=>setDcField('marca',v), error:dcErr.marca, valid:!dcErr.marca, touched:!!dcTouched.marca, placeholder:'Ej. Nissan' })}
                    {renderField({ label:'MODELO *', value:dc.modelo, onChange:v=>setDcField('modelo',v), error:dcErr.modelo, valid:!dcErr.modelo, touched:!!dcTouched.modelo, placeholder:'Ej. Versa' })}
                    {renderField({ label:'AÑO *', value:dc.anio, onChange:v=>setDcField('anio', digitsOnly(v).slice(0,4)), error:dcErr.anio, valid:!dcErr.anio, touched:!!dcTouched.anio, placeholder:'Ej. 2022', inputMode:'numeric' })}
                    {renderField({ label:'COLOR *', value:dc.color, onChange:v=>setDcField('color',v), error:dcErr.color, valid:!dcErr.color, touched:!!dcTouched.color, placeholder:'Ej. Blanco' })}
                    <div className="sm:col-span-2">{renderField({ label:'PLACA * — FORMATO ABC-123', value:dc.placa, onChange:v=>setDcField('placa', v.toUpperCase()), error:dcErr.placa, valid:!dcErr.placa, touched:!!dcTouched.placa, placeholder:'ABC-123', maxLength:8 })}</div>
                    {simulatedUpload('Foto del auto', dcDocs.fotoAuto, 'foto-auto.jpg (simulado)', ()=>setDcDocs(p=>({...p, fotoAuto:!p.fotoAuto})))}
                    {simulatedUpload('Selfie de verificación', dcDocs.selfie, 'selfie-verificacion.jpg (simulado)', ()=>setDcDocs(p=>({...p, selfie:!p.selfie})))}
                  </div>
                  <p className="mt-3 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 p-3 text-xs leading-relaxed text-[#b9ecff] flex gap-2"><Camera className="h-4 w-4 shrink-0"/> Las fotos son simuladas en esta demo: no se sube ningún archivo real. Pulsa “Simular subida” para marcar cada verificación como lista.</p>
                  <div className="mt-4 flex gap-2"><button onClick={()=>setDcStep(2)} className="flex-1 rounded-full border border-white/20 py-3 font-bold">← Documentos</button><button disabled={!dcAllValid || dcBusy} onClick={handleRegisterDriver} className="neon-btn flex-[2] rounded-full py-3 font-bold disabled:opacity-50">{dcBusy?'Enviando…':'Enviar a revisión · Quedo EN REVISIÓN'}</button></div>
                  {!dcAllValid && <p className="mt-2 text-center text-xs text-[var(--muted)]">Completa vehículo, placa válida y las dos verificaciones simuladas para enviar.</p>}
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-[var(--muted)]">¿Ya tienes cuenta? <button onClick={()=>setView('login')} className="font-bold text-[#7beaff] underline">Ingresar</button> · Ver estado en <button onClick={()=>setView('validacion')} className="font-bold text-[#7beaff] underline">Validación</button></p>
          </section>
        )}

        {view==='validacion' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">VALIDACIÓN · CONDUCTORES</p>
            <h1 className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-extrabold">¿Quién puede aceptar viajes?</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Solo conductores <b className="text-emerald-300">APROBADOS</b> aparecen en el Pool y pueden aceptar. Los demás ven un bloqueo hasta ser validados.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([['todos',`Todos · ${counts.total}`],['PENDIENTE',`Pendiente · ${counts.PENDIENTE}`],['EN REVISIÓN',`En revisión · ${counts['EN REVISIÓN']}`],['APROBADO',`Aprobado · ${counts.APROBADO}`]] as const).map(([k,l])=>(<button key={k} onClick={()=>setValidationFilter(k as any)} className={`rounded-full px-3 py-2.5 text-xs font-bold ${validationFilter===k?'neon-btn':'glass text-[var(--muted)]'}`}>{l}</button>))}
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button onClick={()=>setValidationFilter('RECHAZADO')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${validationFilter==='RECHAZADO'?'bg-red-500 text-white':'glass text-[var(--muted)]'}`}>Rechazados · {counts.RECHAZADO}</button>
              <button onClick={()=>setView('registro-conductor')} className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#020617]">+ Registrar conductor</button>
              <button onClick={()=>setView('conductor')} className="shrink-0 rounded-full glass px-4 py-2 text-xs font-bold">Ir a Conductor →</button>
            </div>
            {filteredValidation.length===0 ? <div className="glass mt-4 rounded-[28px] p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[var(--muted)]"/><p className="mt-2 font-bold">Sin conductores en este filtro</p><p className="text-sm text-[var(--muted)]">Registra un conductor para verlo aquí en revisión.</p></div> : (
              <div className="mt-3 space-y-3">{filteredValidation.map(row=>{
                const missing = row.rec ? DOC_LABELS.filter(d=>!row.rec!.value.docs[d.key]) : DOC_LABELS;
                return (
                  <article key={row.id} className="glass rounded-[28px] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-display text-lg font-bold [overflow-wrap:anywhere]">{row.nombre}</p><p className="text-xs text-[var(--muted)]">{row.marca ? `${row.marca} ${row.modelo||''}` : 'Sin vehículo registrado'} {row.placa?`· Placa ${row.placa}`:''} · ID {row.driverId}</p></div>{validationBadge(row.status)}</div>
                    <div className="mt-3"><div className="flex justify-between text-xs font-bold"><span>Documentos</span><span>{row.count}/6 completos</span></div><div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${row.count===6?'bg-emerald-400':'bg-[#00d4ff]'}`} style={{width:`${(row.count/6)*100}%`}}/></div></div>
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">{DOC_LABELS.map(d=>{ const done = row.rec ? row.rec.value.docs[d.key] : false; return <p key={d.key} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${done?'bg-emerald-400/10 text-emerald-300':'bg-white/5 text-[var(--muted)]'}`}>{done?<Check className="h-4 w-4"/>:<X className="h-4 w-4 text-red-400"/>}{d.label} {done?'· Listo':'· Falta'}</p>; })}</div>
                    {row.status==='RECHAZADO' && <p className="mt-2 text-xs text-red-300">Motivo simulado: falta verificar un documento. El conductor puede corregir y volver a enviar.</p>}
                    {missing.length>0 && row.status!=='APROBADO' && <p className="mt-2 text-xs text-amber-300">Faltan: {missing.map(m=>m.label).join(', ')}</p>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={()=>setDriverAppStatus(row.rec, row.driverId, row.nombre, 'APROBADO')} className="flex items-center justify-center gap-1 rounded-full bg-emerald-500 py-2.5 text-sm font-bold text-white"><BadgeCheck className="h-4 w-4"/> Simular Aprobar</button>
                      <button onClick={()=>setDriverAppStatus(row.rec, row.driverId, row.nombre, 'RECHAZADO')} className="flex items-center justify-center gap-1 rounded-full border border-red-500/50 py-2.5 text-sm font-bold text-red-400"><AlertTriangle className="h-4 w-4"/> Simular Rechazar</button>
                    </div>
                    {row.rec && <p className="mt-2 text-[11px] text-[var(--muted)]">Ciudad: {row.rec.value.ciudad||'—'} · Licencia: {row.rec.value.licenciaNumero||'—'} · Vigencia licencia: {row.rec.value.licenciaVigencia||'—'} · Seguro: {row.rec.value.aseguradora||'—'} · Vigencia seguro: {row.rec.value.seguroVigencia||'—'}</p>}
                  </article>
                );
              })}</div>
            )}
          </section>
        )}

        {view==='tablet' && (
          <section>
            <div className="glass neon w-full overflow-hidden rounded-[32px] p-4 text-center sm:px-8 sm:py-8" style={{width:'100%', maxWidth:'100%', boxSizing:'border-box', borderRadius:'16px'}}>
              <img src={logoUrl} alt="Conecta — logotipo neón azul con enchufe" className="logo-float mx-auto h-32 w-32 max-w-full rounded-[36px] object-cover shadow-[0_0_60px_rgba(0,212,255,.75)] ring-2 ring-[#00d4ff] sm:h-48 sm:w-48" />
              <p className="mt-6 whitespace-normal text-[11px] font-extrabold tracking-[0.14em] text-[#7beaff] leading-[1.5]" style={{wordBreak:'normal', overflowWrap:'break-word'}}>TABLET · EN EL AUTO · EN VIVO</p>
              <h1 className="font-display mt-2 whitespace-normal text-[clamp(30px,8vw,58px)] font-extrabold leading-[1.15]" style={{wordBreak:'normal', overflowWrap:'break-word'}}>BIENVENIDO<br/><span className="neon-text">A BORDO</span></h1>
              <p className="mx-auto mt-3 w-full max-w-md whitespace-normal text-[15px] font-semibold leading-[1.5] text-[#c8ecf9]" style={{wordBreak:'normal', overflowWrap:'break-word'}}>VIAJA CON ESTILO, VIAJA CONECTA.<br/><span className="text-sm text-[var(--muted)]">Escanea, pide y viaja. Todo desde esta misma app.</span></p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/40 px-3 py-2 text-xs font-bold text-[#7beaff]"><span className="live-dot h-2 w-2 rounded-full bg-[#00d4ff]"/> En vivo · {new Date(now).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})} · 24° · Noche despejada</div>
              {role==='tablet' && <div className="mx-auto mt-3 max-w-md"><span className="inline-flex items-center gap-1 rounded-full bg-[#00d4ff] px-3 py-1.5 text-xs font-extrabold text-[#020617]"><TabletIcon className="h-4 w-4" /> Modo Kiosco - Tablet · Esta pantalla está fija</span><KioscoExit onExit={exitToGate} /></div>}
              {!currentUser && role!=='tablet' && <div className="mt-4 flex flex-wrap justify-center gap-2"><button onClick={()=>setView('login')} className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#020617]">Ingresar / Registrarme</button><button onClick={()=>setView('registro-usuario')} className="rounded-full border border-[#00d4ff]/50 px-4 py-2.5 text-sm font-bold text-[#7beaff]">Crear cuenta para pedir viaje</button></div>}
              {currentUser && <p className="mt-4 text-sm font-bold text-[#7beaff]">Sesión activa: {currentUser.nombre} · {currentUser.role==='conductor'?'Conductor':'Usuario'}</p>}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="glass neon rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold tracking-widest text-[#7beaff]">TU CONDUCTOR HOY</p><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-[#00d4ff]/15 px-2 py-1 text-[11px] font-bold text-[#7beaff]"><Star className="h-3 w-3 fill-[#00d4ff] text-[#00d4ff]"/> {tabletDriver.rating}</span>{validationBadge(statusForDriver(tabletDriver.id))}</div></div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#0077ff] font-display text-2xl font-extrabold text-[#020617] shadow-[0_0_28px_rgba(0,212,255,.6)]">{tabletDriver.name[0]}</div>
                  <div className="min-w-0"><p className="font-display text-2xl font-bold [overflow-wrap:anywhere]">{tabletDriver.name}</p><p className="text-sm text-[var(--muted)]">{tabletDriver.car} · Placa {tabletDriver.plate}</p><p className="mt-1 text-sm font-bold text-[#7beaff]">{tabletDriver.rating} estrellas · {tabletDriver.trips} viajes · {docsCountForDriver(tabletDriver.id)}/6 docs</p></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><p className="text-[11px] text-[var(--muted)]">Tiempo</p><p className="font-bold">3 min</p></div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><p className="text-[11px] text-[var(--muted)]">Clima</p><p className="font-bold">24° ☀️</p></div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><p className="text-[11px] text-[var(--muted)]">Auto</p><p className="font-bold">Limpio ✓</p></div>
                </div>
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-[#00d4ff] via-[#00aaff] to-[#0047ff] p-5 text-[#020617] shadow-[0_0_45px_rgba(0,212,255,.45)]">
                <div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-extrabold leading-tight">Escanea y Conecta<br/>con {tabletDriver.name}</p><p className="mt-1 text-xs font-bold opacity-80">ID del conductor · {tabletDriver.id}</p></div><QrCode className="h-8 w-8 shrink-0"/></div>
                <div className="mt-4 flex gap-3">
                  <div className="relative grid h-[118px] w-[118px] shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-[0_0_28px_rgba(255,255,255,.45)]">
                    <div className="grid h-full w-full grid-cols-5 gap-1">{Array.from({length:25}).map((_,i)=>(<span key={i} className={`rounded-[2px] ${[0,1,2,5,6,10,2,4,9,14,20,22].includes(i)?'bg-black':'bg-zinc-200'}`}/>))}</div>
                    <span className="scan-line absolute left-2 right-2 h-[3px] rounded-full bg-[#00bfff] shadow-[0_0_12px_#00d4ff]" />
                    <span className="absolute rounded-full bg-[#020617] px-2 py-0.5 text-[10px] font-extrabold text-[#7beaff]">{tabletDriver.id}</span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <button onClick={()=>{ if(role==='tablet'){ setNotice(`📱 Escaneo en kiosco — Conductor ${tabletDriver.name} (${tabletDriver.id}). En modo kiosco el viaje se pide desde el teléfono del pasajero.`); } else simulateScan(); }} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#020617] px-3 py-3 text-sm font-bold text-white shadow-lg"><ScanLine className="h-4 w-4"/> Simular Escaneo</button>
                    <button onClick={changeDriver} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#020617]/80 px-3 py-3 text-sm font-bold"><RefreshCw className="h-4 w-4"/> Cambiar Conductor</button>
                    <p className="text-[11px] font-semibold opacity-80">{role==='tablet' ? 'En kiosco, el escaneo muestra al conductor sin salir de la tablet.' : 'El escaneo te lleva a Usuario con tu conductor preseleccionado.'}</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="mt-7 font-display text-lg font-bold">Reglas a bordo</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">{RULES.map(r=>(<div key={r.title} className="glass rounded-3xl p-4"><r.icon className="h-6 w-6 text-[#00d4ff]"/><p className="mt-2 font-bold">{r.title}</p><p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">{r.desc}</p></div>))}</div>

            <div className="mt-7 flex gap-2 overflow-x-auto no-scrollbar pb-1">{([['promos','Promos'],['servicios','Servicios'],['musica','Música'],['quienes','Quiénes somos']] as const).map(([k,l])=>(<button key={k} onClick={()=>setTabletTab(k)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${tabletTab===k?'neon-btn':'glass text-[var(--muted)]'}`}>{l}</button>))}</div>

            {tabletTab==='promos' && <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-[28px] bg-gradient-to-br from-[#00d4ff] to-[#0047ff] p-5 text-[#020617] shadow-[0_0_38px_rgba(0,212,255,.35)]"><p className="text-xs font-extrabold tracking-widest">PRIMER VIAJE · FLYER NEÓN</p><p className="mt-2 font-display text-3xl font-extrabold leading-none">20% de<br/>descuento</p><p className="mt-2 text-sm font-medium opacity-90">En tu primer viaje con Conecta. Se aplica al pedir desde la tablet.</p><button onClick={()=>{ if(role==='tablet'){ setNotice('Promo 20% lista — pídele al pasajero que la use desde su teléfono.'); } else { setView('usuario'); setNotice('Promo 20% activada — se aplicará a tu próximo viaje.'); } }} className="mt-4 rounded-full bg-[#020617] px-4 py-2.5 text-sm font-bold text-white">Usar promo →</button></div>
              <div className="glass neon rounded-[28px] p-5"><p className="text-xs font-bold tracking-widest text-[#7beaff]">NOCHE BANDA · 2X1</p><p className="mt-2 font-display text-3xl font-extrabold">Noche Banda<br/>2x1</p><p className="mt-2 text-sm text-[var(--muted)]">Viernes y sábado: invita a un amigo y el segundo viaje va por nuestra cuenta. La noche suena mejor en Conecta.</p><button onClick={()=>{ if(role==='tablet'){ setNotice('Promo Noche Banda 2x1 lista para el fin de semana.'); } else { setView('usuario'); setNotice('Promo Noche Banda 2x1 guardada para el fin de semana.'); } }} className="mt-4 rounded-full bg-[#00d4ff] px-4 py-2.5 text-sm font-bold text-[#020617]">Usar promo →</button></div>
            </div>}
            {tabletTab==='servicios' && <div className="mt-3 grid gap-3 sm:grid-cols-2">{SERVICES.map(s=>(<button key={s.name} onClick={()=>{ if(role==='tablet'){ setNotice(`Servicio ${s.name} — el pasajero lo pide desde su teléfono.`); } else { setView('usuario'); setDestino(s.name); setNotice(`Servicio ${s.name} seleccionado — completa tu destino y pide tu viaje.`); } }} className="glass rounded-[28px] p-5 text-left transition hover:shadow-[0_0_30px_rgba(0,212,255,.25)]"><span className="inline-flex rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/30 px-2.5 py-1 text-[11px] font-bold text-[#7beaff]">{s.tag}</span><p className="mt-3 flex items-center gap-2 font-display text-lg font-bold"><s.icon className="h-5 w-5 text-[#00d4ff]"/>{s.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{s.desc}</p><p className="mt-3 text-sm font-bold text-[#7beaff]">Pedir este servicio <ArrowRight className="inline h-4 w-4"/></p></button>))}</div>}
            {tabletTab==='musica' && <div className="glass mt-3 rounded-[28px] p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-display font-bold flex items-center gap-2"><Music className="h-5 w-5 text-[#00d4ff]"/> Banda Hits en Vivo</p><span className="text-xs text-[var(--muted)]">{playingId?`Sonando: ${PLAYLIST.find(p=>p.id===playingId)?.title}`:'Pulsa ▶ para sonar'}</span></div>
              <div className="mt-3 space-y-2">{PLAYLIST.map(p=>(
                <div key={p.id} className={`flex items-center gap-3 rounded-2xl p-3 ${playingId===p.id?'bg-[#00d4ff]/15 border border-[#00d4ff]/40':'bg-white/5 border border-white/10'}`}>
                  <button aria-label={playingId===p.id?`Pausar ${p.title}`:`Reproducir ${p.title}`} onClick={()=>setPlayingId(playingId===p.id?null:p.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0077ff] text-[#020617] shadow-[0_0_18px_rgba(0,212,255,.55)]">{playingId===p.id?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4 ml-0.5"/>}</button>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold text-sm [overflow-wrap:anywhere]">{p.title}</p><p className="text-xs text-[var(--muted)]">{p.artist}</p></div>
                  {playingId===p.id && <span className="flex h-6 items-end gap-[3px]" aria-hidden="true">{[0,1,2,3].map(i=>(<span key={i} className="viz-bar w-[4px] rounded-full bg-[#00d4ff]" style={{height:'100%', animationDelay:`${i*0.12}s`}}/>))}</span>}
                  <span className="text-xs text-[var(--muted)]">{p.time}</span>
                </div>))}</div>
            </div>}
            {tabletTab==='quienes' && <div className="glass mt-3 rounded-[28px] p-5"><div className="flex items-center gap-3"><img src={logoUrl} alt="Conecta" className="h-12 w-12 rounded-2xl object-cover shadow-[0_0_20px_rgba(0,212,255,.6)]"/><div><p className="font-display text-xl font-bold">Quiénes somos</p><p className="text-xs text-[#7beaff] font-bold tracking-widest">VIAJA CON ESTILO, VIAJA CONECTA</p></div></div><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">Conecta nació para que pedir un viaje se sienta como salir de noche: luz, música, buena energía y cero fricción. Un solo equipo, un solo código y tres pantallas que hablan entre sí: la tablet te recibe, la app del usuario pide y la del conductor responde. Sin tres apps separadas, sin duplicar trabajo.</p><p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/30 px-3 py-1.5 text-xs font-bold text-[#7beaff]"><Info className="h-4 w-4"/> Hecho con un solo código base</p></div>}
          </section>
        )}

        {view==='usuario' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">USUARIO · PIDE TU VIAJE</p>
            <h1 className="mt-1 font-display text-[clamp(26px,6vw,38px)] font-extrabold">¿A dónde vamos hoy?</h1>
            {!currentUser ? (
              <div className="mt-3 flex flex-col gap-2 rounded-3xl border border-amber-300/50 bg-amber-300/10 p-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-bold flex items-center gap-2"><Lock className="h-4 w-4 text-amber-300"/> Regístrate para pedir tu viaje</p><p className="mt-1 text-sm text-[var(--muted)]">Si pulsas “Solicitar Viaje” sin sesión, te llevamos al registro. Demo: entra con cualquier teléfono + 1234.</p></div><div className="flex gap-2 shrink-0"><button onClick={()=>setView('login')} className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#020617]">Ingresar</button><button onClick={()=>setView('registro-usuario')} className="rounded-full bg-[#00d4ff] px-4 py-2.5 text-sm font-bold text-[#020617]">Registrarme</button></div></div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-400/10 border border-emerald-400/40 px-4 py-3 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0"/><span>Sesión activa como <b>{currentUser.nombre}</b> · {currentUser.role==='conductor'?'Conductor':'Usuario'}</span><button onClick={logout} className="ml-auto shrink-0 font-bold text-[#7beaff]">Salir</button></div>
            )}
            <div className="glass neon mt-4 flex items-center gap-3 rounded-3xl p-4"><img src={logoUrl} alt="Conecta" className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-[0_0_18px_rgba(0,212,255,.6)]"/><div className="min-w-0"><p className="font-bold [overflow-wrap:anywhere]">Conectando con {selectedDriver.name}</p><p className="text-xs text-[var(--muted)]">{selectedDriver.id} · {selectedDriver.car} · ⭐ {selectedDriver.rating} · En línea</p></div><span className="ml-auto hidden shrink-0">{validationBadge(statusForDriver(selectedDriver.id))}</span></div>
            {fromQR && <div className="mt-3 flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#00d4ff] to-[#0077ff] p-4 text-[#020617]"><Bell className="h-5 w-5 shrink-0"/><div className="min-w-0"><p className="font-bold [overflow-wrap:anywhere]">Reservando con {selectedDriver.name} (tu conductor)</p><p className="text-xs opacity-90">Llegaste desde el QR de la tablet · {selectedDriver.id}</p></div><button onClick={()=>setFromQR(false)} className="ml-auto shrink-0 rounded-full bg-black/25 px-3 py-1.5 text-xs font-bold text-white">Quitar</button></div>}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="glass rounded-[28px] p-5">
                <p className="font-display font-bold">Tu viaje</p>
                <label className="mt-4 block text-xs font-bold text-[var(--muted)]">CONDUCTOR</label>
                <div className="mt-1 grid grid-cols-3 gap-2">{DRIVERS.map((d,i)=>(<button key={d.id} onClick={()=>{setSelectedDriverIdx(i); setFromQR(false);}} className={`rounded-2xl border p-3 text-left ${i===selectedDriverIdx?'border-[#00d4ff] bg-[#00d4ff]/15 shadow-[0_0_18px_rgba(0,212,255,.25)]':'border-white/10 bg-white/5'}`}><p className="font-bold text-sm">{d.name}</p><p className="text-[11px] text-[var(--muted)]">{d.id} · ⭐ {d.rating}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(statusForDriver(d.id))}`}>{statusLabel(statusForDriver(d.id))}</span></button>))}</div>
                {statusForDriver(selectedDriver.id)!=='APROBADO' && <p className="mt-2 rounded-xl bg-amber-300/10 border border-amber-300/40 px-3 py-2 text-xs text-amber-200">Este conductor está {statusLabel(statusForDriver(selectedDriver.id))} ({docsCountForDriver(selectedDriver.id)}/6 docs). Si no acepta, tu viaje puede pasar al Pool de conductores aprobados.</p>}
                <div className="mt-4 space-y-4">
                  <label className="block"><span className="text-xs font-bold text-[var(--muted)]">NOMBRE</span><input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Tu nombre" className="mt-1 w-full rounded-2xl border border-white/15 bg-[#020617]/70 px-4 py-3 text-sm"/></label>
                  <label className="block"><span className="text-xs font-bold text-[var(--muted)]">TELÉFONO</span><input value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="Teléfono" className="mt-1 w-full rounded-2xl border border-white/15 bg-[#020617]/70 px-4 py-3 text-sm"/></label>
                  <PlaceSearch label="ORIGEN" value={origen} onChange={setOrigen} placeholder="¿Dónde te recogemos? Escribe calle, colonia..." />
                  <PlaceSearch label="DESTINO" value={destino} onChange={setDestino} placeholder="¿A dónde vas? Escribe calle, colonia..." />
                  <label className="block"><span className="text-xs font-bold text-[var(--muted)]">NOTAS</span><textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={2} placeholder="Ej. Llevo maleta, voy con amigos…" className="mt-1 w-full resize-none rounded-2xl border border-white/15 bg-[#020617]/70 px-4 py-3 text-sm"/></label>
                </div>

                <div className="mt-4 rounded-2xl border border-[#00d4ff]/30 bg-[#020617]/80 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#7beaff]"><Route className="h-4 w-4"/> RESUMEN DE RUTA</p>
                  <p className="mt-3 text-sm font-bold [overflow-wrap:anywhere]">{origen || 'Origen por elegir'} <span className="text-[#00d4ff]">→</span> {destino || 'Destino por elegir'}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Un mapa no está disponible.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/30 px-3 py-1.5 text-xs font-bold text-[#7beaff]">{km} km · {minutes} min</span>
                    <span className="rounded-full bg-white/5 border border-white/15 px-3 py-1.5 text-xs font-bold">Distancia de ejemplo: 5.2 km - 12 min</span>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">La tarifa se recalcula en vivo con los controles de abajo: Base $18 + Km × $7.50 + Min × $1.80.</p>
                </div>

                <div className="mt-4 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/10 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#7beaff]"><Gauge className="h-4 w-4"/> TARIFA ESTIMADA EN VIVO</p>
                  <label className="mt-3 block"><span className="flex justify-between text-xs font-bold"><span className="flex items-center gap-1"><Route className="h-3 w-3"/> Distancia</span><span>{km} km</span></span><input aria-label="Distancia en kilómetros" type="range" min={1} max={30} value={km} onChange={e=>setKm(Number(e.target.value))} className="mt-1 w-full"/></label>
                  <label className="mt-2 block"><span className="flex justify-between text-xs font-bold"><span className="flex items-center gap-1"><Clock className="h-3 w-3"/> Tiempo estimado</span><span>{minutes} min</span></span><input aria-label="Tiempo estimado en minutos" type="range" min={3} max={60} value={minutes} onChange={e=>setMinutes(Number(e.target.value))} className="mt-1 w-full"/></label>
                  <div className="mt-3 space-y-1 text-[13px] text-[var(--muted)]"><p className="flex justify-between"><span>Base</span><span>$18</span></p><p className="flex justify-between"><span>{km} km × $7.50</span><span>${(km*7.5).toFixed(2)}</span></p><p className="flex justify-between"><span>{minutes} min × $1.80</span><span>${(minutes*1.8).toFixed(2)}</span></p></div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#00d4ff]/25 pt-3"><span className="text-sm font-bold">Total estimado</span><b className="font-display text-2xl neon-text">${price} MXN</b></div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/15 bg-[#020617]/70 p-4">
                  <p className="text-xs font-bold tracking-widest text-[#7beaff]">CÓMO FUNCIONA LA BÚSQUEDA</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed text-[#b9ecff] [overflow-wrap:anywhere]">{`// Búsqueda local de demostración
const sugerencias = LUGARES.filter(lugar =>
  lugar.toLowerCase().includes(busqueda.toLowerCase())
).slice(0, 5);
// Al elegir: llenar Origen / Destino y recalcular tarifa.
// Un proveedor real debe configurarse en el servidor,
// nunca con una clave en el código de la app.`}</pre>
                  <p className="mt-2 text-[11px] text-[var(--muted)]">La lista de sugerencias es local. Un mapa no está disponible.</p>
                </div>

                {formError && <p className="mt-3 text-sm font-semibold text-red-400">{formError}</p>}
                <button disabled={saving} onClick={createReservation} className="neon-btn mt-3 flex w-full items-center justify-center gap-2 rounded-full py-4 font-display font-bold disabled:opacity-60"><Navigation className="h-4 w-4"/> {saving?'Creando reserva…': currentUser ? `Solicitar Viaje - Conecta · $${price}` : `Solicitar Viaje · Regístrate primero · $${price}`}</button>
                <p className="mt-2 text-center text-[11px] text-[var(--muted)]">El conductor tiene 15 segundos para aceptar. Si no, tu viaje pasa al Pool General. Solo conductores APROBADOS pueden aceptar.</p>
              </div>

              <div>
                <div className="flex items-center justify-between"><h2 className="font-display font-bold">Mis reservas</h2><span className="text-xs font-bold text-[var(--muted)]">{myReservations.length} en total</span></div>
                {loading ? <p className="glass mt-3 rounded-3xl p-5 text-sm text-[var(--muted)]">Cargando reservas guardadas…</p> : myReservations.length===0 ? <div className="glass mt-3 rounded-[28px] p-6 text-center"><Car className="mx-auto h-8 w-8 text-[var(--muted)]"/><p className="mt-2 font-bold">Aún no tienes reservas</p><p className="text-sm text-[var(--muted)]">Pide tu primer viaje y aparecerá aquí con su estado en vivo.</p></div> : (
                  <div className="mt-3 space-y-3">{visibleReservations.map(r=>{
                    const rem = remaining(r);
                    const pct = Math.max(0, rem/15);
                    const circ = 2*Math.PI*26;
                    return <article key={r.id} className="glass rounded-[28px] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="font-bold [overflow-wrap:anywhere]">{r.value.origen} → {r.value.destino}</p><p className="text-xs text-[var(--muted)]">{r.value.nombre} · Con {r.value.driver} · ${r.value.price} MXN · {(r.value.km ?? 0)} km</p></div>{statusPill(r.value.status)}</div>
                      {r.value.status==='Esperando' && <div className="mt-3 flex items-center gap-3"><div className="relative h-16 w-16 shrink-0"><svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90"><circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6"/><circle cx="32" cy="32" r="26" fill="none" stroke="#00d4ff" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} /></svg><span className="absolute inset-0 grid place-items-center text-sm font-extrabold">{rem}s</span></div><div><p className="flex items-center gap-1 text-xs font-bold text-[#7beaff]"><Timer className="h-4 w-4"/> Esperando a {r.value.driver}</p><p className="mt-1 text-[11px] text-[var(--muted)]">Si no acepta, pasará automáticamente al Pool General.</p></div></div>}
                      {r.value.status==='Pool General' && <p className="mt-3 flex items-center gap-1 text-xs font-bold text-sky-300"><Search className="h-4 w-4"/> Buscando conductor disponible… cualquier conductor aprobado puede aceptarlo.</p>}
                      {r.value.notas && <p className="mt-2 text-xs text-[var(--muted)] [overflow-wrap:anywhere]">Nota: {r.value.notas}</p>}
                      <div className="mt-3 flex gap-2">{role==='conductor' && <button onClick={()=>setView('conductor')} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold">Ver en Conductor →</button>}{['Esperando','Pool General'].includes(r.value.status) && <button onClick={()=>cancelRes(r)} className="flex items-center gap-1 rounded-full border border-red-500/40 px-3 py-2 text-xs font-bold text-red-400"><Trash2 className="h-3 w-3"/> Cancelar</button>}</div>
                    </article>;
                  })}
                  {myReservations.length>4 && <button onClick={()=>setShowAll(v=>!v)} className="w-full rounded-full border border-[rgba(0,212,255,.3)] py-2.5 text-sm font-bold">{showAll?'Ver menos':'Ver todas las reservas'}</button>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {view==='conductor' && (
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#7beaff]">CONDUCTOR · TURNO ACTIVO</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-[clamp(26px,6vw,38px)] font-extrabold">Hola, {conductor.name}</h1>
              <div className="flex items-center gap-2">{validationBadge(conductorStatus)}
              <label className="glass flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-bold"><span className={`h-2.5 w-2.5 rounded-full ${online?'bg-[#00d4ff] live-dot':'bg-zinc-500'}`}/>{online?'En línea':'Fuera de línea'}<input type="checkbox" checked={online} onChange={e=>{setOnline(e.target.checked); setNotice(e.target.checked?`${conductor.name} está en línea y recibirá viajes.`:`${conductor.name} está fuera de línea.`);}} className="sr-only"/><span className={`ml-1 inline-flex h-5 w-9 items-center rounded-full px-0.5 ${online?'bg-[#00d4ff] justify-end shadow-[0_0_16px_rgba(0,212,255,.7)]':'bg-zinc-600 justify-start'}`}><span className="h-4 w-4 rounded-full bg-white"/></span></label>
              </div>
            </div>

            {!conductorApproved && (
              <div className="mt-4 rounded-[28px] border-2 border-amber-300/60 bg-amber-300/10 p-5">
                <p className="flex items-center gap-2 font-display font-bold text-amber-200"><AlertTriangle className="h-5 w-5"/> No puedes aceptar viajes hasta ser validado</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Estado actual: <b className="text-white">{statusLabel(conductorStatus)}</b> · Solo conductores APROBADOS aparecen en el Pool y pueden aceptar viajes.</p>
                <div className="mt-3"><div className="flex justify-between text-xs font-bold"><span>Progreso de documentos</span><span>{conductorDocsCount}/6 documentos</span></div><div className="mt-1 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300" style={{width:`${(conductorDocsCount/6)*100}%`}}/></div><p className="mt-1 text-xs text-[var(--muted)]">Ejemplo: 4/6 documentos = aún faltan 2 para completar la revisión.</p></div>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">{DOC_LABELS.map(d=>{ const done = docsForDriver(conductor.id)[d.key]; return <p key={d.key} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${done?'bg-emerald-400/10 text-emerald-300':'bg-white/5 text-[var(--muted)]'}`}>{done?<Check className="h-4 w-4"/>:<X className="h-4 w-4 text-red-400"/>}{d.label} {done?'· Listo':'· Falta'}</p>; })}</div>
                {conductorMissing.length>0 && <p className="mt-2 text-xs text-amber-200">Faltan: {conductorMissing.map(m=>m.label).join(', ')}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={()=>setView('registro-conductor')} className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#020617]">Completar registro conductor →</button>
                  <button onClick={()=>setView('validacion')} className="rounded-full border border-white/30 px-4 py-2.5 text-sm font-bold">Ver en Validación</button>
                  <button onClick={()=>setDriverAppStatus(appForDriver(conductor.id)||null, conductor.id, conductor.name, 'APROBADO')} className="rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white">Simular Aprobar</button>
                  <button onClick={()=>setDriverAppStatus(appForDriver(conductor.id)||null, conductor.id, conductor.name, 'RECHAZADO')} className="rounded-full border border-red-500/60 px-4 py-2.5 text-sm font-bold text-red-300">Simular Rechazar</button>
                </div>
              </div>
            )}
            {conductorApproved && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[28px] border border-emerald-400/50 bg-emerald-400/10 p-4"><BadgeCheck className="h-5 w-5 text-emerald-400"/><p className="text-sm font-bold">Validado · Puedes aceptar viajes y aparecer en el Pool.</p><div className="ml-auto flex gap-2"><button onClick={()=>setDriverAppStatus(appForDriver(conductor.id)||null, conductor.id, conductor.name, 'RECHAZADO')} className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-bold text-red-300">Simular Rechazar</button><button onClick={()=>setView('validacion')} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">Ver validación</button></div></div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">{DRIVERS.map((d,i)=>(<button key={d.id} onClick={()=>{setConductorIdx(i); setNotice(`Viendo la bandeja de ${d.name}.`);}} className={`rounded-3xl border p-4 text-left ${i===conductorIdx?'border-[#00d4ff] bg-[#00d4ff]/15 shadow-[0_0_22px_rgba(0,212,255,.25)]':'glass'}`}><p className="font-bold">{d.name}</p><p className="text-xs text-[var(--muted)]">{d.car} · {d.plate}</p><p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-bold text-[#7beaff]">⭐ {d.rating} <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusStyle(statusForDriver(d.id))}`}>{statusLabel(statusForDriver(d.id))}</span></p><p className="mt-1 text-[11px] text-[var(--muted)]">{docsCountForDriver(d.id)}/6 docs</p></button>))}</div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="glass rounded-[28px] p-5"><p className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"><TrendingUp className="h-4 w-4 text-[#00d4ff]"/> VIAJES HOY</p><p className="mt-1 font-display text-3xl font-extrabold">{finished.length} terminados</p><p className="text-xs text-[var(--muted)]">+ {records.filter(r=>r.value.driverId===conductor.id && ['Aceptado','En camino','En viaje'].includes(r.value.status)).length} en curso</p></div>
              <div className="rounded-[28px] bg-gradient-to-br from-[#00d4ff] to-[#0047ff] p-5 text-[#020617] shadow-[0_0_38px_rgba(0,212,255,.35)]"><p className="text-xs font-bold">GANANCIAS HOY</p><p className="mt-1 font-display text-3xl font-extrabold">${earnings} MXN</p><p className="text-xs font-semibold opacity-75">Según la tarifa de cada viaje terminado</p></div>
            </div>

            {active && <div className="mt-4 rounded-[28px] border-2 border-[#00d4ff] bg-[#00d4ff]/10 p-5 shadow-[0_0_30px_rgba(0,212,255,.22)]"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-xs font-bold tracking-widest text-[#7beaff]">VIAJE ACTIVO</p><p className="mt-1 font-display text-xl font-bold [overflow-wrap:anywhere]">{active.value.origen} → {active.value.destino}</p><p className="text-sm text-[var(--muted)]">Pasajero: {active.value.nombre} · {active.value.telefono}</p></div>{statusPill(active.value.status)}</div>
              <div className="mt-4 flex items-center gap-1">{['Aceptado','En camino','En viaje','Terminado'].map((s,i)=>{ const cur=['Aceptado','En camino','En viaje','Terminado'].indexOf(active.value.status); return <React.Fragment key={s}><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${i<=cur?'bg-[#00d4ff] text-[#020617]':'bg-white/10 text-[var(--muted)]'}`}>{s}</span>{i<3 && <span className="h-px flex-1 bg-white/15"/>}</React.Fragment>; })}</div>
              <button onClick={()=>advanceTrip(active)} className="neon-btn mt-4 w-full rounded-full py-3 font-bold">Avanzar: {active.value.status==='Aceptado'?'Ir en camino →':active.value.status==='En camino'?'Iniciar viaje →':active.value.status==='En viaje'?'Terminar viaje ✓':'Terminado'}</button>
              {active.value.notas && <p className="mt-2 text-xs text-[var(--muted)] [overflow-wrap:anywhere]">Nota: {active.value.notas}</p>}
            </div>}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div><h2 className="flex items-center gap-2 font-display font-bold"><Bell className="h-5 w-5 text-[#00d4ff]"/> Bandeja directa · {conductor.name}</h2><p className="text-xs text-[var(--muted)]">Solo reservas dirigidas a ti. Tienes 15s antes de que vayan al pool.</p>
                <div className="mt-3 space-y-3">{!online ? <p className="glass rounded-3xl p-4 text-sm text-[var(--muted)]">Estás fuera de línea. Activa “En línea” para recibir solicitudes.</p> : !conductorApproved ? <p className="glass rounded-3xl p-4 text-sm text-[var(--muted)]">Bandeja bloqueada: completa tu validación para aceptar viajes. Estado: {statusLabel(conductorStatus)} · {conductorDocsCount}/6 documentos.</p> : inbox.length===0 ? <p className="glass rounded-3xl p-5 text-center text-sm text-[var(--muted)]">Sin solicitudes directas. Pide un viaje desde Usuario para verlo aquí.</p> : inbox.map(r=>(<article key={r.id} className="glass rounded-3xl p-4"><div className="flex justify-between gap-2"><div><p className="font-bold [overflow-wrap:anywhere]">{r.value.nombre} → {r.value.destino}</p><p className="text-xs text-[var(--muted)]">Desde: {r.value.origen} · ${r.value.price}</p></div><span className="rounded-full bg-[#00d4ff] px-2 py-1 text-xs font-extrabold text-[#020617]">{remaining(r)}s</span></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={()=>updateReservation(r,{status:'Aceptado'},`✓ ${conductor.name} aceptó el viaje de ${r.value.nombre}.`)} className="flex items-center justify-center gap-1 rounded-full bg-emerald-500 py-2.5 text-sm font-bold text-white"><Check className="h-4 w-4"/> Aceptar</button><button onClick={()=>updateReservation(r,{status:'Pool General'},`La reserva de ${r.value.nombre} pasó al Pool General.`)} className="flex items-center justify-center gap-1 rounded-full border border-red-500/50 py-2.5 text-sm font-bold text-red-400"><X className="h-4 w-4"/> Rechazar</button></div></article>))}</div>
              </div>
              <div><h2 className="flex items-center gap-2 font-display font-bold"><Users className="h-5 w-5 text-sky-400"/> Pool General</h2><p className="text-xs text-[var(--muted)]">Reservas liberadas: cualquier conductor APROBADO en línea puede tomarlas.</p>
                <div className="mt-3 space-y-3">{!conductorApproved ? <div className="glass rounded-3xl p-5 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-300"/><p className="mt-2 text-sm font-bold">Pool bloqueado hasta ser APROBADO</p><p className="mt-1 text-sm text-[var(--muted)]">Estado: {statusLabel(conductorStatus)} · {conductorDocsCount}/6 documentos. Usa “Simular Aprobar” para probar el flujo.</p><button onClick={()=>setDriverAppStatus(appForDriver(conductor.id)||null, conductor.id, conductor.name, 'APROBADO')} className="mt-3 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white">Simular Aprobar</button></div> : pool.length===0 ? <p className="glass rounded-3xl p-5 text-center text-sm text-[var(--muted)]">Pool vacío. Cuando un conductor no responde en 15s, la reserva aparecerá aquí.</p> : pool.map(r=>(<article key={r.id} className="rounded-3xl border border-sky-500/30 bg-sky-500/5 p-4"><div className="flex justify-between gap-2"><div><p className="font-bold [overflow-wrap:anywhere]">{r.value.nombre} → {r.value.destino}</p><p className="text-xs text-[var(--muted)]">Pedía a {r.value.driver} · ${r.value.price} · Buscando conductor aprobado</p></div>{statusPill(r.value.status)}</div><button onClick={()=>updateReservation(r,{status:'Aceptado', driver:conductor.name, driverId:conductor.id},`✓ ${conductor.name} tomó la reserva del Pool de ${r.value.nombre}.`)} className="mt-3 w-full rounded-full bg-sky-500 py-2.5 text-sm font-bold text-white">Tomar este viaje como {conductor.name}</button></article>))}</div>
              </div>
            </div>
            {role!=='conductor' && <button onClick={()=>{ setView('usuario'); setNotice('Vuelve a Usuario para crear una reserva de prueba.'); }} className="glass mt-5 w-full rounded-full py-3 text-sm font-bold">+ Crear una reserva de prueba desde Usuario</button>}
          </section>
        )}

        {role && <footer className="glass mt-10 rounded-[28px] p-5">
          <div className="flex items-center gap-3"><img src={logoUrl} alt="Conecta" className="h-10 w-10 rounded-xl object-cover shadow-[0_0_18px_rgba(0,212,255,.6)]"/><p className="flex items-center gap-2 font-display font-bold"><Sparkles className="h-5 w-5 text-[#00d4ff]"/> Arquitectura — una sola app, no tres</p></div>
          <p className="mt-2 w-full whitespace-normal text-sm leading-[1.5] text-[var(--muted)]" style={{wordBreak:'normal', overflowWrap:'break-word'}}>Una sola app, no tres. Antes: tres interfaces por separado que al unirlas se hacían bolas. Ahora: <b className="text-[var(--text)]">un solo código base</b> con estado, estilos y componentes compartidos. Cambias algo una vez y se refleja en Tablet, Usuario y Conductor.</p>
          <div className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
            {[['/shared','Estado, conductores, estilos y componentes'],['/tablet','Bienvenida, QR, reglas y tabs'],['/usuario','Formulario y reservas en vivo'],['/conductor','Bandeja, pool y viaje activo'],['/auth','Login · Registro usuario · Registro conductor'],['/validacion','PENDIENTE · EN REVISIÓN · APROBADO · RECHAZADO'],['backend','crearReserva · aceptarReserva · liberarAlPool'],['Estado compartido','reservations · users · driver_applications · currentUser']].map(([k,v])=>(<div key={k} className="rounded-2xl bg-white/5 border border-white/10 p-3"><p className="font-mono text-xs font-bold text-[#7beaff]">{k}</p><p className="mt-1 text-[var(--muted)]">{v}</p></div>))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">Las cuentas, solicitudes de conductor y reservas se guardan en el registro de la app (crear / listar / actualizar / eliminar). El temporizador de 15s es compartido: si el conductor no acepta, la reserva se libera sola al Pool General. Solo conductores APROBADOS pueden aceptar. Capacidad del registro: 1,000 registros en total. Las subidas de documentos son simuladas en esta demo y no envían archivos reales. Un mapa no está disponible.</p>
        </footer>}
      </main>

      {role && <nav className="fixed inset-x-0 bottom-0 z-30 w-full max-w-[100vw] overflow-x-clip border-t border-[rgba(0,212,255,.3)] bg-[#020617]/95 backdrop-blur-xl" style={{paddingBottom:'max(env(safe-area-inset-bottom, 0px), 0px)', boxSizing:'border-box'}}>
        <div className="mx-auto grid w-full max-w-5xl px-2 py-2" style={{boxSizing:'border-box', gridTemplateColumns:`repeat(${Math.max(1, navItems.filter(n=>['tablet','usuario','conductor','validacion'].includes(n.k)).length || 1)}, minmax(0,1fr))`}}>
          {navItems.filter(n=>['tablet','usuario','conductor','validacion'].includes(n.k)).map(({k,label})=>{
            const Icon = k==='tablet'?Home:k==='usuario'?User:k==='conductor'?Car:ShieldCheck;
            return <button key={k} onClick={()=>setView(k)} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-center font-bold ${view===k?'text-[#7beaff] bg-[#00d4ff]/15 shadow-[0_0_22px_rgba(0,212,255,.35)]':'text-[var(--muted)]'}`}><Icon className="h-[22px] w-[22px] shrink-0"/><span className="whitespace-nowrap text-[11px] leading-none">{label}</span></button>;
          })}
        </div>
      </nav>}
    </div>
  );
}
