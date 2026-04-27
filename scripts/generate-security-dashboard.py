#!/usr/bin/env python3
"""Génère un dashboard HTML à partir des rapports Trivy JSON."""
import json, os, argparse
from datetime import datetime
from pathlib import Path

def load_reports(input_dir):
    reports = []
    d = Path(input_dir)
    if not d.exists():
        return reports
    for f in sorted(d.glob("trivy-*.json")):
        try:
            data = json.loads(f.read_text())
            service = f.stem.replace("trivy-", "")
            vulns = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
            details = []
            for result in data.get("Results", []):
                for v in result.get("Vulnerabilities", []):
                    sev = v.get("Severity", "UNKNOWN")
                    if sev in vulns:
                        vulns[sev] += 1
                    details.append({
                        "id": v.get("VulnerabilityID", ""),
                        "pkg": v.get("PkgName", ""),
                        "installed": v.get("InstalledVersion", ""),
                        "fixed": v.get("FixedVersion", "N/A"),
                        "severity": sev,
                        "title": v.get("Title", "")[:80],
                    })
            reports.append({"service": service, "vulns": vulns, "details": details})
        except Exception as e:
            print(f"⚠️  Erreur lecture {f}: {e}")
    return reports

def generate_html(reports, output):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    total_c = sum(r["vulns"]["CRITICAL"] for r in reports)
    total_h = sum(r["vulns"]["HIGH"] for r in reports)
    total_m = sum(r["vulns"]["MEDIUM"] for r in reports)

    rows = ""
    for r in reports:
        v = r["vulns"]
        rows += f"""<tr>
          <td><strong>{r['service']}</strong></td>
          <td style="color:#f85149">{v['CRITICAL']}</td>
          <td style="color:#e3b341">{v['HIGH']}</td>
          <td style="color:#d29922">{v['MEDIUM']}</td>
          <td style="color:#3fb950">{v['LOW']}</td>
        </tr>"""

    detail_sections = ""
    for r in reports:
        if not r["details"]:
            continue
        detail_rows = "".join(
            f"<tr><td>{d['id']}</td><td>{d['pkg']}</td>"
            f"<td>{d['installed']}</td><td>{d['fixed']}</td>"
            f"<td style='color:{'#f85149' if d['severity']=='CRITICAL' else '#e3b341' if d['severity']=='HIGH' else '#d29922'}'>"
            f"{d['severity']}</td><td>{d['title']}</td></tr>"
            for d in r["details"]
        )
        detail_sections += f"""
        <details>
          <summary>🔍 {r['service']} — {len(r['details'])} vulnérabilités</summary>
          <table>
            <tr><th>CVE</th><th>Package</th><th>Installé</th><th>Corrigé</th><th>Sévérité</th><th>Description</th></tr>
            {detail_rows}
          </table>
        </details>"""

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>🛡️ Security Dashboard</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#f8f9fa;color:#333;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0}}
.header{{background:#1E3A5F;color:white;padding:1.5rem 2rem;box-shadow:0 2px 8px rgba(0,0,0,.15)}}
.header h1{{font-size:1.6rem;font-weight:700;margin-bottom:4px}}
.header .sub{{color:rgba(255,255,255,.7);font-size:.9rem}}
.content{{padding:2rem}}
table{{width:100%;border-collapse:collapse;margin-bottom:20px}}
th{{padding:1rem;text-align:left;background:#f0f4f8;color:#1E3A5F;font-weight:600;font-size:.9rem;border-bottom:2px solid #1E3A5F}}
td{{padding:.85rem 1rem;border-bottom:1px solid #f0f4f8;color:#444;font-size:.9rem}}
tr:last-child td{{border-bottom:none}}
tr:hover td{{background:#f0f4f8}}
.summary{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:2rem}}
.card{{background:white;border-radius:12px;padding:1.5rem;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06);border-top:4px solid #1E3A5F}}
.card .n{{font-size:2.4rem;font-weight:700;color:#1E3A5F}} .card .l{{color:#666;font-size:.85rem;margin-top:.25rem}}
.card.critical .n{{color:#e53e3e}} .card.critical{{border-top-color:#e53e3e}}
.card.high .n{{color:#ed8936}} .card.high{{border-top-color:#ed8936}}
.card.medium .n{{color:#d69e2e}} .card.medium{{border-top-color:#d69e2e}}
.table-card{{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;margin-bottom:2rem}}
h2{{color:#1E3A5F;margin-bottom:1rem;font-size:1.1rem;font-weight:600}}
details{{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:1rem;box-shadow:0 2px 8px rgba(0,0,0,.06)}}
summary{{cursor:pointer;font-weight:600;color:#1E3A5F;padding:4px 0;font-size:.95rem}}
summary:hover{{color:#4A90D9}}
.no-vuln{{color:#666;text-align:center;padding:2rem;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)}}
.badge{{background:#e8f0fe;color:#1E3A5F;padding:.2rem .6rem;border-radius:12px;font-weight:600;font-size:.85rem}}
</style></head>
<body>
<div class="header">
<h1>🛡️ Security Dashboard — E-Learning</h1>
<p class="sub">Généré le {now} — {len(reports)} services scannés</p>
</div>
<div class="content">
<div class="summary">
  <div class="card critical"><div class="n">{total_c}</div><div class="l">🔴 Critical</div></div>
  <div class="card high"><div class="n">{total_h}</div><div class="l">🟠 High</div></div>
  <div class="card medium"><div class="n">{total_m}</div><div class="l">🟡 Medium</div></div>
</div>
<h2>Résumé par service</h2>
<div class="table-card"><table>
  <tr><th>Service</th><th>🔴 Critical</th><th>🟠 High</th><th>🟡 Medium</th><th>🟢 Low</th></tr>
  {rows}
</table></div>
<h2>Détails des vulnérabilités</h2>
{detail_sections if detail_sections else '<div class="no-vuln">✅ Aucune vulnérabilité détectée.</div>'}
</div></body></html>"""

    Path(output).write_text(html)
    print(f"✅ Dashboard généré : {output}")
    print(f"   Critical={total_c}  High={total_h}  Medium={total_m}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="trivy-reports/")
    parser.add_argument("--output", default="security-dashboard.html")
    args = parser.parse_args()
    reports = load_reports(args.input_dir)
    generate_html(reports, args.output)
