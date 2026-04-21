#!/usr/bin/env python3
import json, os, argparse
from datetime import datetime
from pathlib import Path
 
HTML = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>🛡️ Security Dashboard — E-Learning</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
:root{--bg:#0d1117;--s:#161b22;--b:#30363d;--t:#e6edf3;--mu:#8b949e;
  --cr:#f85149;--hi:#e3b341;--me:#d29922;--lo:#3fb950;--in:#58a6ff}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--t);font-family:system-ui,sans-serif;padding:28px}
h1{font-size:1.9rem;margin-bottom:6px}
.sub{color:var(--mu);font-size:.9rem;margin-bottom:28px}
.meta{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px}
.mc{background:var(--s);border:1px solid var(--b);border-radius:8px;padding:12px 20px}
.mc label{display:block;font-size:.72rem;color:var(--mu);text-transform:uppercase;letter-spacing:.06em}
.mc span{font-size:.95rem;font-weight:600}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:32px}
.card{background:var(--s);border:1px solid var(--b);border-top:3px solid var(--c);
  border-radius:12px;padding:20px;text-align:center}
.card .n{font-size:2.6rem;font-weight:700;color:var(--c)}
.card .l{font-size:.82rem;color:var(--mu);margin-top:4px}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
.cc{background:var(--s);border:1px solid var(--b);border-radius:12px;padding:20px}
.cc h3{margin-bottom:14px;font-size:.95rem}
.cw{height:260px;position:relative}
.sec{background:var(--s);border:1px solid var(--b);border-radius:12px;padding:20px;margin-bottom:20px}
.sec h2{font-size:1rem;margin-bottom:16px;display:flex;align-items:center;gap:8px}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th{padding:10px 14px;text-align:left;color:var(--mu);font-size:.75rem;text-transform:uppercase;
  letter-spacing:.05em;border-bottom:2px solid var(--b);background:var(--s)}
td{padding:9px 14px;border-bottom:1px solid var(--b);vertical-align:middle}
tr:hover td{background:rgba(255,255,255,.03)}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 10px;
  border-radius:20px;font-size:.76rem;font-weight:600}
.bc{background:rgba(248,81,73,.15);color:var(--cr);border:1px solid rgba(248,81,73,.3)}
.bh{background:rgba(227,179,65,.15);color:var(--hi);border:1px solid rgba(227,179,65,.3)}
.bm{background:rgba(210,153,34,.15);color:var(--me);border:1px solid rgba(210,153,34,.3)}
.bl{background:rgba(63,185,80,.15);color:var(--lo);border:1px solid rgba(63,185,80,.3)}
.bo{background:rgba(63,185,80,.1);color:var(--lo);border:1px solid rgba(63,185,80,.2)}
details summary{cursor:pointer;padding:8px 0;font-weight:600;color:var(--in)}
details[open] summary{margin-bottom:12px}
.pr{height:5px;background:var(--b);border-radius:3px;margin-top:5px}
.pf{height:100%;border-radius:3px}
@media(max-width:680px){.charts{grid-template-columns:1fr}}
</style>
</head>
<body>
<h1>🛡️ Security Dashboard — E-Learning Platform</h1>
<div class="sub">Trivy Vulnerability Scan — rapport consolidé tous services</div>
<div class="meta">
  <div class="mc"><label>Date</label><span>DATE_PH</span></div>
  <div class="mc"><label>Commit</label><span style="font-family:monospace;font-size:.82rem">COMMIT_PH</span></div>
  <div class="mc"><label>Branche</label><span>BRANCH_PH</span></div>
  <div class="mc"><label>Services</label><span>SVCS_PH</span></div>
</div>
<div class="cards">
  <div class="card" style="--c:var(--cr)"><div class="n">CR_PH</div><div class="l">🔴 Critical</div></div>
  <div class="card" style="--c:var(--hi)"><div class="n">HI_PH</div><div class="l">🟠 High</div></div>
  <div class="card" style="--c:var(--me)"><div class="n">ME_PH</div><div class="l">🟡 Medium</div></div>
  <div class="card" style="--c:var(--lo)"><div class="n">LO_PH</div><div class="l">🟢 Low</div></div>
</div>
<div class="charts">
  <div class="cc"><h3>Répartition par sévérité</h3><div class="cw"><canvas id="doughnut"></canvas></div></div>
  <div class="cc"><h3>Vulnérabilités par service</h3><div class="cw"><canvas id="bar"></canvas></div></div>
</div>
<div class="sec">
  <h2>🔎 Vue par service</h2>
  <table>
    <thead><tr><th>Service</th><th>Statut</th><th>🔴</th><th>🟠</th><th>🟡</th><th>🟢</th><th>Total</th><th>Risque</th></tr></thead>
    <tbody>ROWS_PH</tbody>
  </table>
</div>
<div class="sec">
  <h2>🚨 Détail CVE Critical</h2>
  CRIT_PH
</div>
<script>
new Chart(document.getElementById('doughnut'),{type:'doughnut',
  data:{labels:['Critical','High','Medium','Low'],
    datasets:[{data:SEV_DATA,backgroundColor:['#f85149','#e3b341','#d29922','#3fb950'],
      borderColor:'#161b22',borderWidth:3}]},
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{position:'bottom',labels:{color:'#e6edf3'}}}}});
new Chart(document.getElementById('bar'),{type:'bar',
  data:{labels:SVC_LABELS,
    datasets:[
      {label:'Critical',data:SVC_CR,backgroundColor:'rgba(248,81,73,.8)'},
      {label:'High',data:SVC_HI,backgroundColor:'rgba(227,179,65,.8)'},
      {label:'Medium',data:SVC_ME,backgroundColor:'rgba(210,153,34,.8)'}]},
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#e6edf3'}}},
    scales:{x:{stacked:true,ticks:{color:'#8b949e'},grid:{color:'#30363d'}},
            y:{stacked:true,ticks:{color:'#8b949e'},grid:{color:'#30363d'}}}}});
</script>
</body></html>"""
 
def parse(f):
    with open(f) as fp: d=json.load(fp)
    s={"C":0,"H":0,"M":0,"L":0,"v":[]}
    for r in d.get("Results",[]):
        for v in r.get("Vulnerabilities",[]) or []:
            sv=v.get("Severity","")
            if sv=="CRITICAL":s["C"]+=1
            elif sv=="HIGH":s["H"]+=1
            elif sv=="MEDIUM":s["M"]+=1
            elif sv=="LOW":s["L"]+=1
            s["v"].append((sv,v.get("VulnerabilityID",""),v.get("PkgName",""),
                           v.get("InstalledVersion",""),v.get("FixedVersion","—"),
                           v.get("Title","")[:80]))
    return s
 
def risk(c,h,m,l):
    sc=c*10+h*5+m*2+l
    pct=min(100,sc) if sc>=50 else (min(60,sc*2) if sc>=20 else min(30,sc*3))
    col="#f85149" if c else("#e3b341" if h else("#d29922" if m else "#3fb950"))
    return f'<div class="pr"><div class="pf" style="width:{pct}%;background:{col}"></div></div><small style="color:#8b949e">{sc}pts</small>'
 
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--reports-dir",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--commit",default="unknown")
    p.add_argument("--branch",default="unknown")
    a=p.parse_args()
    files=sorted(Path(a.reports_dir).glob("trivy-*.json"))
    svcs={}
    for f in files:
        svc=f.stem.replace("trivy-","")
        try: svcs[svc]=parse(f)
        except Exception as e: print(f"skip {f}: {e}")
    tc=sum(v["C"] for v in svcs.values())
    th=sum(v["H"] for v in svcs.values())
    tm=sum(v["M"] for v in svcs.values())
    tl=sum(v["L"] for v in svcs.values())
    rows=""
    for svc,s in svcs.items():
        c,h,m,l=s["C"],s["H"],s["M"],s["L"]
        st='<span class="badge bc">🔴 BLOQUÉ</span>' if c else('<span class="badge bh">🟠 Attention</span>' if h else('<span class="badge bm">🟡 Surveiller</span>' if m else '<span class="badge bo">🟢 OK</span>'))
        rows+=f'<tr><td><strong>{svc}</strong></td><td>{st}</td><td style="color:{"#f85149" if c else "#8b949e"}">{c}</td><td style="color:{"#e3b341" if h else "#8b949e"}">{h}</td><td style="color:{"#d29922" if m else "#8b949e"}">{m}</td><td style="color:{"#3fb950" if l else "#8b949e"}">{l}</td><td>{c+h+m+l}</td><td style="min-width:130px">{risk(c,h,m,l)}</td></tr>'
    crit=""
    for svc,s in svcs.items():
        cs=[(v,p,i,f,t) for (sv,v,p,i,f,t) in s["v"] if sv=="CRITICAL"]
        if not cs: continue
        inner=""
        for vid,pkg,inst,fix,title in cs:
            fx=f'<span style="color:#3fb950">{fix}</span>' if fix and fix!="—" else '<span style="color:#8b949e">—</span>'
            inner+=f'<tr><td style="font-family:monospace;font-size:.8rem;color:#58a6ff">{vid}</td><td>{pkg}</td><td>{inst}</td><td>{fx}</td><td style="color:#8b949e;font-size:.8rem">{title}</td></tr>'
        crit+=f'<details><summary>🔴 {svc} — {len(cs)} CVE Critical</summary><table><thead><tr><th>CVE</th><th>Package</th><th>Installé</th><th>Fixé</th><th>Description</th></tr></thead><tbody>{inner}</tbody></table></details>'
    if not crit:
        crit='<p style="color:#3fb950;padding:12px">✅ Aucune CVE Critical dans tous les services.</p>'
    html=(HTML
        .replace("DATE_PH",datetime.now().strftime("%d/%m/%Y %H:%M UTC"))
        .replace("COMMIT_PH",a.commit[:12])
        .replace("BRANCH_PH",a.branch)
        .replace("SVCS_PH",str(len(svcs)))
        .replace("CR_PH",str(tc)).replace("HI_PH",str(th))
        .replace("ME_PH",str(tm)).replace("LO_PH",str(tl))
        .replace("ROWS_PH",rows).replace("CRIT_PH",crit)
        .replace("SEV_DATA",json.dumps([tc,th,tm,tl]))
        .replace("SVC_LABELS",json.dumps(list(svcs.keys())))
        .replace("SVC_CR",json.dumps([s["C"] for s in svcs.values()]))
        .replace("SVC_HI",json.dumps([s["H"] for s in svcs.values()]))
        .replace("SVC_ME",json.dumps([s["M"] for s in svcs.values()])))
    with open(a.output,"w") as fp: fp.write(html)
    print(f"✅ Dashboard: {a.output} | CR:{tc} HI:{th} ME:{tm} LO:{tl}")
 
if __name__=="__main__": main()
