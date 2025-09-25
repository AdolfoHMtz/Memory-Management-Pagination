// =============================
// App.jsx (UN SOLO ARCHIVO) – MVP Paginación: Ejercicio 1 (depurado + fix TSX)
// Parámetros fijos del ejercicio: MP=700KB, página=100KB.
// Secuencia compacta (5 pasos):
//  1) T1(225) llega y se traduce (DV=125)
//  2) T2(100) llega y se traduce (DV=55)
//  3) Sale T1
//  4) T3(500) llega y se traduce (DV=425)
//  5) T4(50)  llega y se traduce (DV=25)
// Artefactos mostrados: (1) Secundario (tabla del trabajo activo), (2) Memoria principal,
// (3) TMP del trabajo activo, (4) Tabla global de marcos,
// (5) Cálculo DV→DF paso a paso, (6) Línea roja Secundario↔Principal,
// (7) Ficha del trabajo actual con selector DV.
// Cambios: corrige SyntaxError por paréntesis extra en ternario del inciso (7),
// define statPill y agrega smoke tests adicionales.
// =============================

import React, { useMemo, useState, useRef, useLayoutEffect } from "react";

// ------------------- Constantes del ejercicio -------------------
const TAM_MEMORIA_KB = 700; // 7 marcos
const TAM_PAGINA_KB  = 100; // 100KB
const NUM_MARCOS     = TAM_MEMORIA_KB / TAM_PAGINA_KB; // 7

// ------------------- Utilidades de paginación -------------------
function partirEnPaginas(tamanoKB){
  const numPag = Math.ceil(tamanoKB / TAM_PAGINA_KB);
  const paginas = [];
  for(let i=0;i<numPag;i++){
    const inicio = i * TAM_PAGINA_KB;
    const fin    = Math.min((i+1)*TAM_PAGINA_KB - 1, tamanoKB - 1);
    paginas.push({ indice:i, inicio, fin });
  }
  const fragInterna = numPag * TAM_PAGINA_KB - tamanoKB;
  return { paginas, fragInterna };
}

function crearEstadoInicial(){
  return {
    marcos: Array.from({length: NUM_MARCOS}, (_,i)=>({ marco:i, trabajo:null, pagina:null })),
    tablaMapas: {},          // { T1: {0:marco,...} }
    tablaMarcos: Array.from({length: NUM_MARCOS}, (_,i)=>({ marco:i, estado:'Libre', contiene:null })),
    secundario: {},          // { T1: [P0..Pn] }
    metaTrabajos: {},        // { T1: { tamKB, numPag, fragInterna } }
    historial: [],           // snaps por paso (5 pasos totales)
    marcadores: {},          // índices de pasos clave
  };
}

function clonarEstado(e){
  return {
    marcos: e.marcos.map(x=>({...x})),
    tablaMapas: Object.fromEntries(Object.entries(e.tablaMapas).map(([k,v])=>[k,{...v}])) ,
    tablaMarcos: e.tablaMarcos.map(x=>({...x})),
    secundario: Object.fromEntries(Object.entries(e.secundario).map(([k,arr])=>[k,arr.map(y=>({...y}))])) ,
    metaTrabajos: Object.fromEntries(Object.entries(e.metaTrabajos).map(([k,v])=>[k,{...v}])),
    historial: [...e.historial],
    marcadores: {...e.marcadores},
  };
}

function fotografiar(e, etiqueta, ligadura=null){
  const copia = clonarEstado(e); copia.etiqueta = etiqueta; copia.ligadura = ligadura; e.historial.push(copia);
}

function marcoLibre(e){ return e.marcos.findIndex(m=>m.trabajo===null); }

function cargarTrabajo(e, nombre, tamKB, granular=false){
  // (1) Secundario + meta
  const { paginas, fragInterna } = partirEnPaginas(tamKB);
  e.secundario[nombre] = paginas; e.tablaMapas[nombre] = {};
  e.metaTrabajos[nombre] = { tamKB, numPag: paginas.length, fragInterna };
  if (granular) fotografiar(e, `Secundario listo: ${nombre} (${tamKB}KB) – Pags ${paginas.length} (FI ${fragInterna}KB)`);
  // (2) Asignación secuencial (un solo paso final por trabajo)
  paginas.forEach(p=>{
    const m = marcoLibre(e); if (m===-1) throw new Error('Sin marcos libres (inconsistente)');
    e.marcos[m] = { marco:m, trabajo:nombre, pagina:p.indice };
    e.tablaMapas[nombre][p.indice] = m;
    e.tablaMarcos[m] = { marco:m, estado:'Ocupado', contiene:`${nombre}, P${p.indice}` };
  });
}

function descargarTrabajo(e, nombre){
  let liberados = [];
  e.marcos.forEach((m,i)=>{
    if(m.trabajo===nombre){
      e.marcos[i] = { marco:i, trabajo:null, pagina:null };
      e.tablaMarcos[i] = { marco:i, estado:'Libre', contiene:null };
      liberados.push(i);
    }
  });
  fotografiar(e, `Salida de ${nombre}: liberados ${liberados.map(x=>'M'+x).join(', ')}`);
}

function traducir(e, nombre, dvKB){
  const pagina = Math.floor(dvKB / TAM_PAGINA_KB);
  const desp   = dvKB % TAM_PAGINA_KB;
  const marco  = e.tablaMapas[nombre][pagina];
  const df     = marco * TAM_PAGINA_KB + desp;
  return { pagina, desp, marco, df };
}

function ejecutarEjercicio1(){
  const e = crearEstadoInicial();
  // ---- PASO 1: T1 llega y se traduce ----
  cargarTrabajo(e,'T1',225,false);
  const r1 = traducir(e,'T1',125);
  fotografiar(e, `T1 listo (225KB). Traducción 125KB → pág ${r1.pagina}, desp ${r1.desp} → M${r1.marco} → DF ${r1.df}KB`, { trabajo:'T1', dv:125, pagina:r1.pagina, marco:r1.marco, df:r1.df });
  e.marcadores.tradT1 = e.historial.length-1;

  // ---- PASO 2: T2 llega y se traduce ----
  cargarTrabajo(e,'T2',100,false);
  const r2 = traducir(e,'T2',55);
  fotografiar(e, `T2 listo (100KB). Traducción 55KB → pág ${r2.pagina}, desp ${r2.desp} → M${r2.marco} → DF ${r2.df}KB`, { trabajo:'T2', dv:55, pagina:r2.pagina, marco:r2.marco, df:r2.df });
  e.marcadores.tradT2 = e.historial.length-1;

  // ---- PASO 3: Sale T1 ----
  descargarTrabajo(e,'T1');
  e.marcadores.salioT1 = e.historial.length-1;

  // ---- PASO 4: T3 llega y se traduce ----
  cargarTrabajo(e,'T3',500,false);
  const r3 = traducir(e,'T3',425);
  fotografiar(e, `T3 listo (500KB). Traducción 425KB → pág ${r3.pagina}, desp ${r3.desp} → M${r3.marco} → DF ${r3.df}KB`, { trabajo:'T3', dv:425, pagina:r3.pagina, marco:r3.marco, df:r3.df });
  e.marcadores.tradT3 = e.historial.length-1;

  // ---- PASO 5: T4 llega y se traduce ----
  cargarTrabajo(e,'T4',50,false);
  const r4 = traducir(e,'T4',25);
  fotografiar(e, `T4 listo (50KB). Traducción 25KB → pág ${r4.pagina}, desp ${r4.desp} → M${r4.marco} → DF ${r4.df}KB`, { trabajo:'T4', dv:25, pagina:r4.pagina, marco:r4.marco, df:r4.df });
  e.marcadores.tradT4 = e.historial.length-1;

  return e;
}

// ------------------- UI (todo en un componente) -------------------
export default function App(){
  const sim = useMemo(()=> ejecutarEjercicio1(), []);
  const [i, setI] = useState(0); // iniciar en Paso 1
  const paso = sim.historial[i];

  // --- Estado y derivadas para DV interactiva del trabajo actual ---
  const [dvOverride, setDvOverride] = useState(null);
  const ligBase = paso.ligadura || null;
  let ligUI = ligBase;
  if (ligBase && dvOverride !== null) {
    const t = traducirSnapshot(paso, ligBase.trabajo, Number(dvOverride));
    if (t) ligUI = t;
  }
  const trabajoActual = ligUI?.trabajo || ligBase?.trabajo || null;
  const metaActual = trabajoActual ? paso.metaTrabajos?.[trabajoActual] : null;
  const maxDV = metaActual ? Math.max(0, metaActual.tamKB - 1) : 0;

  // Tests rápidos (consola) para asegurar core estable
  useMemo(()=>{ runSmokeTests(); },[]);

  return (
    <div style={{minHeight:'100vh',background:'#f1f5f9',padding:24,fontFamily:'Inter,system-ui,Arial'}}>
      <nav style={{background:'#1d4ed8',color:'#fff',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:22,fontWeight:600}}>Ejercicio 1 de Memoria Paginada — Equipo 8</div>
            <div style={{opacity:0.9,fontSize:13,marginTop:2}}> Total de Memoria {TAM_MEMORIA_KB} KB · Número de Páginas {TAM_PAGINA_KB} KB</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={()=>setI(sim.marcadores.tradT1)} style={btnNav()}>LLega T1</button>
            <button onClick={()=>setI(sim.marcadores.tradT2)} style={btnNav()}>LLega T2</button>
            <button onClick={()=>setI(sim.marcadores.salioT1)} style={btnNav()}>Salida T1</button>
            <button onClick={()=>setI(sim.marcadores.tradT3)} style={btnNav()}>LLega T3</button>
            <button onClick={()=>setI(sim.marcadores.tradT4)} style={btnNav()}>LLega T4</button>
          </div>
        </div>
      </nav>
      {/* Banner de estado del paso actual */}
<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12,marginBottom:12,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
  <span style={{fontSize:12,letterSpacing:0.4,color:'#1d4ed8',fontWeight:700,textTransform:'uppercase'}}>Estado</span>
  <span style={{fontWeight:600}}>
    {i === sim.marcadores.tradT1 && "Llega T1 (225KB)"}
    {i === sim.marcadores.tradT2 && "Llega T2 (100KB)"}
    {i === sim.marcadores.salioT1 && "Sale T1"}
    {i === sim.marcadores.tradT3 && "Llega T3 (500KB)"}
    {i === sim.marcadores.tradT4 && "Llega T4 (50KB)"}
  </span>
  <span style={{marginLeft:'auto',fontSize:12,color:'#64748b'}}>Paso {i+1} de {sim.historial.length}</span>
</div>

      {/* Forzamos grid responsivo: 1 col en móvil, 2 cols en desktop; y full-row abarca ambas */}
      <style>{`
        .grid-panels { display:grid; gap:16px; grid-template-columns: 1fr; }
        @media (min-width: 1024px) { .grid-panels { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .full-row { grid-column: 1 / -1; } }
      `}</style>
      <div className="grid-panels">
        {/* (1) Secundario en tabla */}
        <Panel titulo="1. Arreglo de almacenamiento secundario">
          {trabajoActual ? (
            <table style={{width:'100%',fontSize:14,border:'1px solid #e5e7eb'}}>
              <thead style={{background:'#f8fafc'}}>
                <tr>
                  <th style={th()}>Trabajo</th>
                  <th style={th()}>Página</th>
                  <th style={th()}>Rango (KB)</th>
                  <th style={th()}>T. Página</th>
                </tr>
              </thead>
              <tbody>
                {(paso.secundario?.[trabajoActual]||[]).map(p=> (
                  <tr key={`${trabajoActual}-${p.indice}`}>
                    <td style={td()}>{trabajoActual}</td>
                    <td style={td()}>P{p.indice}</td>
                    <td style={td()}>{p.inicio} – {p.fin}</td>
                    <td style={td()}>{TAM_PAGINA_KB} KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{fontSize:14,margin:0,color:'#64748b'}}>NO EXISTE EN ESTE PASO</p>
          )}
        </Panel>

        {/* (2) Memoria principal */}
        <Panel titulo="2. Arreglo de Memoria principal (marcos 0..6)">
          <div style={{display:'grid'}}>
            {paso.marcos.map((m,idx)=> (
              <div key={idx} style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',borderBottom:'1px solid #e5e7eb'}}>
                <span style={{fontSize:14}}>Marco {idx}</span>
                <span style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace'}}>{m.trabajo? `${m.trabajo}, P${m.pagina}` : 'Libre'}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* (3) TMP por trabajo */}
        <Panel titulo="3. Tabla de mapa de páginas (TMP)">
          {trabajoActual ? (
            <table style={{width:'100%',fontSize:14,marginBottom:12,border:'1px solid #e5e7eb'}}>
              <thead style={{background:'#f8fafc'}}>
                <tr><th style={th()}>Trabajo {trabajoActual}</th><th style={th()}>Marco</th></tr>
              </thead>
              <tbody>
                {Object.entries(paso.tablaMapas?.[trabajoActual]||{}).map(([pag,marco])=> (
                  <tr key={pag}><td style={td()}>Pág. {pag}</td><td style={td()}>M{marco}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
          <p style={{fontSize:14,margin:0,color:'#64748b'}}>NO EXISTE EN ESTE PASO</p>
          )}
        </Panel>

        {/* (4) Tabla de marcos */}
        <Panel titulo="4.Tabla de marcos de pagina">
          <table style={{width:'100%',fontSize:14,border:'1px solid #e5e7eb'}}>
            <thead style={{background:'#f8fafc'}}>
              <tr><th style={th()}># Marco</th><th style={th()}>Estado</th></tr>
            </thead>
            <tbody>
              {paso.tablaMarcos.map(r=> {
                const esObjetivo = ligUI && ligUI.marco===r.marco;
                return (
                  <tr key={r.marco} style={esObjetivo? {background:'#fff7ed'}:undefined}>
                    <td style={td()}>M{r.marco}</td>
                    <td style={td()}>{r.estado}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {/* (5) Traducción (del paso) */}
        <Panel titulo="5. Cálculo de traducción DV → DF">
          {ligUI ? (
            <PasoAPasoCalculo datos={ligUI} />
          ) : (
            <p style={{fontSize:14,margin:0}}>No hay traducción en este paso.</p>
          )}
        </Panel>

        {/* (6) Línea roja Secundario ↔ Memoria principal */}
        <Panel titulo="6. Relación de la dirección virtual con la física">
          {ligUI ? (
            <LigaduraRelacion paso={paso} datos={ligUI} />
          ) : (
            <p style={{fontSize:14,margin:0}}>No hay traducción en este paso.</p>
          )}
        </Panel>

        {/* (7) Ficha del trabajo (vista completa) */}
        <div className="full-row">
          <Panel titulo="7. Datos del trabajo actual">
            {ligUI ? (
              <>
                {/* Selector de DV para el trabajo activo */}

                <DetalleTrabajo paso={paso} datos={ligUI} />
              </>
            ) : (
              <p style={{fontSize:14,margin:0}}> NO HAY TRADUCCIÓN EN ESTE PASO</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ------------------- Componentes auxiliares -------------------
function PasoAPasoCalculo({ datos }){
  const TP = 100; // tamaño de página fijo del ejercicio
  const pasos = [
    { k:'Dirección virtual', v:`${datos.dv} KB` },
    { k:'Tamaño de página', v:`${TP} KB` },
    { k:'Página', v:`⌊${datos.dv}/${TP}⌋ = ${Math.floor(datos.dv/TP)}` },
    { k:'Desplazamiento', v:`${datos.dv} % ${TP} = ${datos.dv % TP}` },
    { k:'Marco', v:`TMP[${datos.trabajo}][${Math.floor(datos.dv/TP)}] = M${datos.marco}` },
    { k:'Dirección física', v:`M${datos.marco} * ${TP} + ${datos.dv % TP} = ${datos.df} KB` },
  ];
  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:12,padding:12,background:'#fff'}}>
      <div style={{fontWeight:600,marginBottom:8}}>Trabajo {datos.trabajo}</div>
      <ol style={{margin:0,paddingLeft:18}}>
        {pasos.map((p,i)=> (
          <li key={i} style={{margin:'4px 0'}}>
            <span style={{fontWeight:600}}>{p.k}:</span> <span style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\"'}}>{p.v}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function traducirSnapshot(paso, trabajo, dv){
  const TP = 100;
  const pagina = Math.floor(dv / TP);
  const desp   = dv % TP;
  const marco  = (paso.tablaMapas?.[trabajo]?.[pagina]);
  if (marco === undefined) return null;
  const df     = marco * TP + desp;
  return { trabajo, dv, pagina, desp, marco, df };
}

function getDVejemplos(meta){
  if (!meta) return [];
  const dv1 = 0;                 // inicio
  const dv2 = Math.max(0, meta.tamKB - 1); // último byte
  const dv3 = meta.tamKB >= 125 ? 125 : Math.floor(meta.tamKB/2); // una DV didáctica
  const set = Array.from(new Set([dv1, dv2, dv3]));
  return set;
}

function Campo({ klabel, valor, mono }){
  return (
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}>
      <div style={{color:'#64748b'}}>{klabel}</div>
      <div style={mono? {fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\"'} : undefined}>{valor}</div>
    </div>
  );
}

function DetalleTrabajo({ paso, datos }){
  const meta = paso.metaTrabajos?.[datos.trabajo];
  const mapa = paso.tablaMapas?.[datos.trabajo] || {};
  const marcosOcupados = Object.values(mapa).sort((a,b)=>a-b);
  const ocupacionKB = marcosOcupados.length * TAM_PAGINA_KB;
  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
      <div style={{padding:12,background:'#111827',color:'#f9fafb',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <div style={{fontWeight:700,letterSpacing:0.2}}>Ficha del Trabajo {datos.trabajo}</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <span style={statPill('#e0e7ff','#3730a3')}>Tamaño: {meta?.tamKB} KB</span>
          <span style={statPill('#dcfce7','#065f46')}>Páginas: {meta?.numPag}</span>
          <span style={statPill('#fee2e2','#991b1b')}>Frag Interna: {meta?.fragInterna} KB</span>
          <span></span>
        </div>
      </div>

      <div style={{padding:12,display:'grid',gap:16,gridTemplateColumns:'1fr 1fr'}}>
        <div>
          <div style={{fontWeight:600,marginBottom:6}}>Direcciones</div>
          <div style={{display:'grid',rowGap:8}}>
            <Campo klabel="Dirección Virtual" valor={`${datos.dv} KB`} mono/>
            <Campo klabel="Página" valor={`P${datos.pagina}`} />
            <Campo klabel="Marco" valor={`M${datos.marco}`} />
            <Campo klabel="Dirección Física" valor={`${datos.df} KB`} mono/>
          </div>
        </div>
        <div> 
          <div style={{fontWeight:600,marginBottom:6}}>Marcos que ocupa</div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {marcosOcupados.length? marcosOcupados.map(m=> <span key={m} style={pill()}>M{m}</span>) : <span style={{color:'#64748b'}}>—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ titulo, children }){
  return (
    <div style={{background:'#fff',padding:12,border:'1px solid #e5e7eb',borderRadius:12}}>
      <div style={{fontWeight:600,marginBottom:8}}>{titulo}</div>
      {children}
    </div>
  );
}

function LigaduraRelacion({ paso, datos }){
  const contRef = useRef(null);
  const izqRef = useRef(null);   // fila Secundario (página)
  const derRef = useRef(null);   // fila Memoria principal (marco)
  const [coords, setCoords] = useState(null);

  useLayoutEffect(() => {
    if (!contRef.current || !izqRef.current || !derRef.current) return;
    const c = contRef.current.getBoundingClientRect();
    const a = izqRef.current.getBoundingClientRect();
    const b = derRef.current.getBoundingClientRect();
    setCoords({
      x1: a.left - c.left + a.width,
      y1: a.top  - c.top  + a.height/2,
      x2: b.left - c.left,
      y2: b.top  - c.top  + b.height/2,
      w: c.width,
      h: c.height,
    });
  }, [paso, datos]);

  const pags = paso.secundario?.[datos.trabajo] || [];
  const marcoObjetivo = datos.marco;

  return (
    <div ref={contRef} style={{position:'relative'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Secundario izquierda */}
        <div>
          <div style={{fontWeight:600,marginBottom:6}}>Almacenamiento Secundario – {datos.trabajo}</div>
          <table style={{width:'100%',fontSize:14,border:'1px solid #e5e7eb'}}>
            <thead style={{background:'#f8fafc'}}>
              <tr><th style={th()}>Página</th><th style={th()}>Rango (KB)</th></tr>
            </thead>
            <tbody>
              {pags.map(p=>{
                const esRow = (p.indice===datos.pagina);
                return (
                  <tr key={p.indice} ref={esRow? izqRef:null} style={esRow? {background:'#fee2e2'}:undefined}>
                    <td style={td()}>Pág. {p.indice}</td>
                    <td style={td()}>{p.inicio}-{p.fin}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Memoria principal derecha */}
        <div>
          <div style={{fontWeight:600,marginBottom:6}}>Memoria Principal</div>
          <table style={{width:'100%',fontSize:14,border:'1px solid #e5e7eb'}}>
            <thead style={{background:'#f8fafc'}}>
              <tr><th style={th()}># Marco</th><th style={th()}>Contiene</th></tr>
            </thead>
            <tbody>
              {paso.marcos.map((m)=>{
                const esRow = (m.marco===marcoObjetivo);
                return (
                  <tr key={m.marco} ref={esRow? derRef:null} style={esRow? {background:'#fee2e2'}:undefined}>
                    <td style={td()}>M{m.marco}</td>
                    <td style={td()}>{m.trabajo? `${m.trabajo}, P${m.pagina}` : 'Libre'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {coords && (
        <svg width={coords.w} height={coords.h} style={{position:'absolute',left:0,top:0,pointerEvents:'none'}}>
          <defs>
            <marker id="flechaRel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
            </marker>
          </defs>
          <path d={`M ${coords.x1} ${coords.y1} C ${(coords.x1+coords.x2)/2} ${coords.y1}, ${(coords.x1+coords.x2)/2} ${coords.y2}, ${coords.x2} ${coords.y2}`} fill="none" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#flechaRel)"/>
        </svg>
      )}
    </div>
  );
}

// ------------------- UI helpers -------------------
function btn(){ return { padding:'4px 12px', border:'1px solid #e5e7eb', background:'#e2e8f0', borderRadius:8, cursor:'pointer' }; }
function btnSmall(){ return { padding:'2px 8px', border:'1px solid #e5e7eb', background:'#e2e8f0', borderRadius:8, cursor:'pointer', fontSize:12 }; }
function pill(){ return { fontSize:12, padding:'2px 8px', border:'1px solid #e5e7eb', background:'#f8fafc', borderRadius:16 }; }
function pillInfo(){ return { fontSize:12, padding:'2px 8px', border:'1px solid #e5e7eb', background:'#eef2ff', color:'#3730a3', borderRadius:16 }; }
function statPill(bg, fg){ return { fontSize:12, padding:'2px 8px', border:`1px solid ${fg}`, background:bg, color:fg, borderRadius:16 }; }
function th(){ return { textAlign:'left', padding:'6px 8px', borderBottom:'1px solid #e5e7eb' }; }
function td(){ return { padding:'6px 8px', borderBottom:'1px solid #e5e7eb' }; }
function btnNav(){ return { padding:'6px 10px', border:'1px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.12)', color:'#fff', borderRadius:8, cursor:'pointer' }; }
function btnSmallNav(){ return { padding:'4px 8px', border:'1px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.12)', color:'#fff', borderRadius:8, cursor:'pointer', fontSize:12 }; }

// ------------------- Tests rápidos (no interactúan con UI) -------------------
function runSmokeTests(){
  try {
    console.group('%cSMOKE TESTS','color:#2563eb');
    // 1) Helpers existen
    console.assert(typeof statPill === 'function', 'statPill debe existir');
    console.assert(typeof Campo === 'function', 'Campo debe existir');

    // 2) Ejecución del ejercicio
    const s = ejecutarEjercicio1();
    console.assert(Array.isArray(s.historial) && s.historial.length === 5, 'Historial debe tener 5 pasos');
    console.assert(Array.isArray(s.marcos) && s.marcos.length === 7, 'Debe haber 7 marcos');

    // 3) Traducción conocida (fórmula)
    const t1 = traducir(s, 'T1', 125);
    console.assert(t1 && t1.pagina === 1 && typeof t1.marco === 'number' && typeof t1.df === 'number', 'Traducción T1 válida');

    // 4) Snapshot de "Salió T1" debe tener marcos de T1 liberados
    const snapSalioT1 = s.historial[s.marcadores.salioT1];
    const tieneT1 = snapSalioT1.marcos.some(m=> m.trabajo === 'T1');
    console.assert(!tieneT1, 'Tras salir T1, no debe quedar T1 en marcos');

    // 5) Consistencia TMP↔Tabla de marcos para T2 P0
    const marcoT2P0 = s.historial[s.marcadores.tradT2].tablaMapas['T2'][0];
    const contiene = s.historial[s.marcadores.tradT2].tablaMarcos[marcoT2P0].contiene;
    console.assert(contiene && contiene.startsWith('T2'), 'Marco de T2 P0 debe contener T2');

    // 6) traducirSnapshot límite: DV fuera de rango debe dar null
    const snapT4 = s.historial[s.marcadores.tradT4];
    const metaT4 = snapT4.metaTrabajos['T4'];
    const fuera = traducirSnapshot(snapT4,'T4', metaT4.tamKB + 5);
    console.assert(fuera === null, 'DV > tamaño trabajo debe ser null en traducirSnapshot');

    console.log('OK');
    console.groupEnd();
  } catch (err) {
    console.error('Smoke tests fallaron:', err);
  }
}
