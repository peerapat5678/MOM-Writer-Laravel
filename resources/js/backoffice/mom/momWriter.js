// MOM Writer (meeting minutes) for the backoffice.
// Ported from the standalone MOM Writer page: the UI is plain DOM rendered into
// `root`, styles are scoped under .mom-app, and data goes through the
// /api/backoffice/moms and /api/backoffice/mom-contacts endpoints with the
// backoffice access token (window.axios interceptors from utils/auth.js).

import sarabun400 from './assets/Sarabun-Regular.ttf?url';
import sarabun600 from './assets/Sarabun-SemiBold.ttf?url';
import sarabun700 from './assets/Sarabun-Bold.ttf?url';
import anuphan from './assets/Anuphan.ttf?url';
import html2pdfUrl from './assets/html2pdf.bundle.min.js?url';

const MODULE_CSS = ".mom-app{\n  --bg:#f8fafc;--paper:#ffffff;--raise:#f8fafc;--ink:#020617;--muted:#64748b;--line:#e2e8f0;--line2:#cbd5e1;\n  --accent:#0284c7;--accent-ink:#ffffff;--accent-soft:#e0f2fe;\n  --gold:#b45309;--gold-soft:#fffbeb;--ok:#047857;--ok-soft:#ecfdf5;--bad:#be123c;--bad-soft:#fff1f2;\n  --shadow:0 1px 2px rgba(15,23,42,.04),0 6px 20px rgba(15,23,42,.05);\n  --f-ui:\"Anuphan\",ui-sans-serif,system-ui,-apple-system,\"Segoe UI\",Tahoma,sans-serif;\n  --f-doc:\"Sarabun\",\"TH Sarabun New\",Tahoma,sans-serif;\n  --f-mono:ui-monospace,Consolas,monospace;\n  --r:24px;\n  color:var(--ink);font:15px/1.6 var(--f-ui);display:flex;flex-direction:column;gap:18px}\n.mom-app *{box-sizing:border-box}\n.mom-app [hidden]{display:none!important}\n.mom-app{background:var(--bg);color:var(--ink);font:15px/1.6 var(--f-ui);min-height:100vh}\n.mom-app button,.mom-app input,.mom-app textarea,.mom-app select{font:inherit;color:inherit}\n.mom-app :focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n.mom-app .mbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:var(--mast-ink);border-radius:9px;padding:7px 12px;cursor:pointer;font-weight:500;font-size:14px;display:inline-flex;align-items:center;gap:6px}\n.mom-app .mbtn:hover{background:rgba(255,255,255,.16)}\n.mom-app .mbtn.pri{background:#fff;color:#10294d;border-color:#fff;font-weight:600}\n.mom-app .mbtn.pri:hover{background:#e8efff}\n.mom-app .shell{max-width:1340px;margin:0 auto;display:grid;grid-template-columns:280px minmax(0,1fr);gap:22px;padding:22px max(20px,env(safe-area-inset-right,0px)) 60px max(20px,env(safe-area-inset-left,0px));align-items:start}\n.mom-app .shell.noside{grid-template-columns:minmax(0,1fr);max-width:1180px}\n.mom-app .shell.noside .side{display:none}\n@media (max-width:920px){.mom-app .shell{grid-template-columns:minmax(0,1fr)}}\n.mom-app .wrap{display:flex;flex-direction:column;gap:16px;min-width:0}\n.mom-app .side{position:sticky;top:16px;display:flex;flex-direction:column;gap:10px;min-width:0}\n@media (max-width:920px){.mom-app .side{position:static}}\n.mom-app .search{position:relative}\n.mom-app .search input{width:100%;padding:9px 12px 9px 34px;border-radius:10px;border:1px solid var(--line);background:var(--paper)}\n.mom-app .search svg{position:absolute;left:11px;top:50%;translate:0 -50%;width:16px;height:16px;color:var(--muted)}\n.mom-app .side h3{font:600 12px var(--f-ui);letter-spacing:.08em;color:var(--muted);margin:6px 2px 0;display:flex;justify-content:space-between}\n.mom-app .list{display:flex;flex-direction:column;gap:6px;max-height:calc(100vh - 200px);overflow:auto;padding:2px}\n@media (max-width:920px){.mom-app .list{max-height:240px}}\n.mom-app .mi{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;padding:10px 12px;border-radius:10px;background:var(--paper);border:1px solid var(--line)}\n.mom-app .mi:hover{border-color:var(--line2)}\n.mom-app .mi.on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}\n.mom-app .mi .t{font-weight:600;font-size:14.5px;overflow-wrap:anywhere;line-height:1.35}\n.mom-app .mi .m{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--muted)}\n.mom-app .mi .date{font-variant-numeric:tabular-nums}\n.mom-app .tag{font-size:11px;font-weight:600;padding:1px 7px;border-radius:99px;background:var(--raise);border:1px solid var(--line);color:var(--muted)}\n.mom-app .tag.gold{background:var(--gold-soft);color:var(--gold);border-color:transparent}\n.mom-app .empty{padding:16px 12px;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:10px;text-align:center}\n.mom-app .status{font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.mom-app .status i{width:7px;height:7px;border-radius:50%;background:var(--ok);display:inline-block}\n.mom-app .status.warn i{background:var(--gold)}\n.mom-app .status.err{color:var(--bad)}\n.mom-app .status.err i{background:var(--bad)}\n.mom-app .att-tools{display:flex;gap:4px;flex-wrap:wrap}\n.mom-app .ctl{display:flex;flex-direction:column;gap:6px;max-height:48vh;overflow:auto;padding:2px}\n.mom-app .ctr{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1fr) 30px;gap:6px;align-items:center}\n.mom-app .ctr.ctnew{grid-template-columns:minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1fr) auto}\n@media (max-width:600px){.mom-app .ctr,.mom-app .ctr.ctnew{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}\n.mom-app .ctr input,.mom-app .modal .inp{width:100%;min-width:0;border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:7px 9px;font-size:14px}\n.mom-app .pick{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:9px;cursor:pointer;font-size:14px}\n.mom-app .pick:hover{border-color:var(--line2)}\n.mom-app .pick input{margin-top:4px}\n.mom-app .pick small{color:var(--muted)}\n.mom-app .pick.dis{opacity:.5;cursor:default}\n.mom-app .toprow{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}\n.mom-app .steps{display:flex;gap:6px;background:var(--paper);border:1px solid var(--line);padding:5px;border-radius:12px;flex-wrap:wrap}\n.mom-app .step{all:unset;cursor:pointer;padding:7px 14px;border-radius:8px;font-weight:600;font-size:14px;color:var(--muted);display:flex;gap:8px;align-items:center}\n.mom-app .step .n{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;background:var(--raise);border:1px solid var(--line)}\n.mom-app .step.on{background:var(--accent-soft);color:var(--accent)}\n.mom-app .step.on .n{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}\n.mom-app .volatile{font-size:12.5px;color:var(--gold);background:var(--gold-soft);padding:4px 10px;border-radius:99px}\n.mom-app .paper{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow)}\n.mom-app .doc-head{padding:26px 28px 18px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:12px;background:linear-gradient(180deg,var(--raise),var(--paper));border-radius:var(--r) var(--r) 0 0}\n.mom-app .eyebrow{font:600 11.5px var(--f-ui);letter-spacing:.12em;color:var(--gold);text-transform:uppercase}\n.mom-app .title-in{all:unset;box-sizing:border-box;width:100%;font:700 26px/1.3 var(--f-doc);color:var(--ink);border-bottom:2px dashed transparent;padding:2px 0}\n.mom-app .title-in:focus{border-bottom-color:var(--accent-soft)}\n.mom-app .title-in::placeholder{color:var(--line2)}\n.mom-app .meta{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px 14px}\n.mom-app .fld{display:flex;flex-direction:column;gap:4px;min-width:0}\n.mom-app .fld>span{font-size:12px;color:var(--muted);display:flex;justify-content:space-between;align-items:center;gap:6px}\n.mom-app .fld input,.mom-app .fld textarea,.mom-app .fld select{width:100%;min-width:0;border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:8px 10px}\n.mom-app .fld input:hover,.mom-app .fld textarea:hover{border-color:var(--line2)}\n.mom-app textarea{resize:vertical;min-height:72px;line-height:1.6}\n.mom-app .timepair{display:flex;gap:6px;align-items:center}\n.mom-app .timepair input{flex:1;min-width:0}\n.mom-app .fld.time{grid-column:span 2}\n@media (max-width:520px){.mom-app .fld.time{grid-column:auto}}\n.mom-app .mini-x{all:unset;cursor:pointer;color:var(--muted);font-size:12px;padding:0 4px;border-radius:5px;line-height:18px}\n.mom-app .mini-x:hover{color:var(--bad);background:var(--bad-soft)}\n.mom-app .addchips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--muted)}\n.mom-app .chipbtn{all:unset;cursor:pointer;font-size:12.5px;padding:3px 10px;border-radius:99px;border:1px dashed var(--line2);color:var(--muted)}\n.mom-app .chipbtn:hover{color:var(--accent);border-color:var(--accent)}\n.mom-app .secs{padding:8px 28px 26px;display:flex;flex-direction:column}\n@media (max-width:640px){.mom-app .doc-head{padding:20px 16px 14px}.mom-app .secs{padding:6px 16px 20px}}\n.mom-app .sec{border-bottom:1px solid var(--line);padding:18px 0}\n.mom-app .sec:last-of-type{border-bottom:0}\n.mom-app .sec-h{display:flex;align-items:center;gap:8px}\n.mom-app .sec-n{font:600 13px var(--f-mono);color:var(--accent);min-width:26px}\n.mom-app .sec-t{all:unset;flex:1;min-width:0;font:700 18px/1.35 var(--f-doc);padding:2px 4px;border-radius:6px}\n.mom-app .sec-t:hover{background:var(--raise)}\n.mom-app .sec-t:focus{background:var(--accent-soft)}\n.mom-app .tools{display:flex;gap:2px;opacity:.55;transition:opacity .15s}\n.mom-app .sec:hover .tools,.mom-app .sec:focus-within .tools{opacity:1}\n.mom-app .ib{all:unset;cursor:pointer;width:30px;height:30px;border-radius:7px;display:grid;place-items:center;color:var(--muted)}\n.mom-app .ib:hover{background:var(--raise);color:var(--ink)}\n.mom-app .ib.del:hover{background:var(--bad-soft);color:var(--bad)}\n.mom-app .ib svg{width:16px;height:16px}\n.mom-app .ib[disabled]{opacity:.3;pointer-events:none}\n.mom-app .sec-b{padding:12px 0 0 34px;display:flex;flex-direction:column;gap:10px}\n@media (max-width:640px){.mom-app .sec-b{padding-left:0}}\n.mom-app .sec.collapsed .sec-b{display:none}\n.mom-app .sec.collapsed .rot svg{rotate:-90deg}\n.mom-app .hint{font-size:12.5px;color:var(--muted)}\n.mom-app .tbl{display:flex;flex-direction:column;gap:6px}\n.mom-app .tr{display:grid;gap:6px;align-items:center}\n.mom-app .tr.att{grid-template-columns:minmax(0,1.3fr) minmax(0,1.5fr) minmax(0,1fr) 128px 30px}\n.mom-app .tr.act{grid-template-columns:minmax(0,2.2fr) minmax(0,1fr) 148px 140px 30px}\n.mom-app .tr.th{font-size:11.5px;color:var(--muted);letter-spacing:.03em;padding:0 2px}\n@media (max-width:760px){.mom-app .tr.att,.mom-app .tr.act{grid-template-columns:minmax(0,1fr) minmax(0,1fr);padding:8px;border:1px solid var(--line);border-radius:9px}.mom-app .tr.th{display:none}.mom-app .tr .ib{justify-self:end}}\n.mom-app .tr input,.mom-app .tr select{width:100%;min-width:0;border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:7px 9px;font-size:14px}\n.mom-app .tr input.badmail{border-color:var(--bad);background:var(--bad-soft)}\n.mom-app select.st-0{color:var(--muted)}\n.mom-app select.st-1{color:var(--gold)}\n.mom-app select.st-2{color:var(--ok)}\n.mom-app .labels{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:flex-end;padding:10px 12px;border:1px dashed var(--line2);border-radius:10px}\n.mom-app .labels .fld{width:190px}\n.mom-app .labels .fld input{padding:6px 9px;font-size:14px}\n.mom-app .labels .eg{font-size:12.5px;color:var(--muted);padding-bottom:7px}\n.mom-app .labels .eg b{color:var(--ink);font-weight:600}\n.mom-app .ag{border:1px solid var(--line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--raise)}\n.mom-app .ag-h{display:flex;gap:8px;align-items:center}\n.mom-app .ag-n{font:600 12.5px var(--f-ui);color:var(--accent);white-space:nowrap}\n.mom-app .ag-h input{flex:1;min-width:0;border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:7px 10px;font-weight:600}\n.mom-app .ag textarea{border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:8px 10px;width:100%}\n.mom-app .res{border-left:3px solid var(--gold);padding-left:10px}\n.mom-app .res>span{color:var(--gold)!important;font-weight:600}\n.mom-app .addrow{all:unset;cursor:pointer;font-size:13.5px;font-weight:500;color:var(--accent);padding:6px 10px;border-radius:8px;width:max-content}\n.mom-app .addrow:hover{background:var(--accent-soft)}\n.mom-app .sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}\n.mom-app .sgc{border:1px solid var(--line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--raise)}\n.mom-app .sgc-h{display:flex;gap:6px;align-items:center}\n.mom-app .sgc input{border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:7px 9px;width:100%;min-width:0}\n.mom-app .sgc-h input{font-weight:600}\n.mom-app .sgbox{all:unset;box-sizing:border-box;cursor:pointer;height:100px;border:1.5px dashed var(--line2);border-radius:8px;background:#fff;display:grid;place-items:center;color:#7d879a;font-size:13.5px;overflow:hidden;text-align:center;padding:6px}\n.mom-app .sgbox:hover{border-color:var(--accent);color:var(--accent)}\n.mom-app .sgbox img{max-height:86px;max-width:100%;display:block}\n.mom-app .sgrow{display:flex;gap:4px;flex-wrap:wrap;min-height:22px}\n.mom-app .lnk{all:unset;cursor:pointer;font-size:12.5px;color:var(--accent);padding:2px 7px;border-radius:6px}\n.mom-app .lnk:hover{background:var(--accent-soft)}\n.mom-app .lnk.danger{color:var(--bad)}\n.mom-app .pad{width:100%;height:230px;background:#fff;border:1px solid var(--line2);border-radius:10px;touch-action:none;cursor:crosshair;display:block}\n.mom-app .padwrap{position:relative}\n.mom-app .padline{position:absolute;left:8%;right:8%;bottom:52px;border-top:1px dashed #c3cad6;pointer-events:none}\n.mom-app .padhint{position:absolute;left:0;right:0;bottom:24px;text-align:center;color:#9aa3b2;font-size:12.5px;pointer-events:none}\n.mom-app .addsec{margin:6px 28px 26px;border:1.5px dashed var(--line2);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}\n@media (max-width:640px){.mom-app .addsec{margin:6px 16px 20px}}\n.mom-app .addsec .lbl{font-weight:600;font-size:14px}\n.mom-app .opts{display:flex;flex-wrap:wrap;gap:8px}\n.mom-app .opt{all:unset;cursor:pointer;font-size:13.5px;padding:6px 12px;border-radius:9px;background:var(--raise);border:1px solid var(--line)}\n.mom-app .opt:hover{border-color:var(--accent);color:var(--accent)}\n.mom-app .foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}\n.mom-app .foot .grp{display:flex;gap:8px;flex-wrap:wrap}\n.mom-app .btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;font-weight:600;font-size:14px;border:1px solid var(--line2);background:var(--paper);white-space:nowrap}\n.mom-app .btn:hover{border-color:var(--accent);color:var(--accent)}\n.mom-app .btn.pri{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}\n.mom-app .btn.pri:hover{filter:brightness(1.08);color:var(--accent-ink)}\n.mom-app .btn.danger:hover{border-color:var(--bad);color:var(--bad)}\n.mom-app .btn[disabled],.mom-app .btn.busy{opacity:.55;pointer-events:none}\n.mom-app .btn svg{width:16px;height:16px}\n.mom-app .send{display:grid;grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:18px;align-items:start}\n@media (max-width:1040px){.mom-app .send{grid-template-columns:minmax(0,1fr)}}\n.mom-app .card{padding:18px;display:flex;flex-direction:column;gap:12px}\n.mom-app .card h4{margin:0;font:700 15px var(--f-ui)}\n.mom-app .rcpt{display:flex;flex-wrap:wrap;gap:6px}\n.mom-app .rc{font:12.5px var(--f-mono);padding:3px 9px;border-radius:7px;background:var(--accent-soft);color:var(--accent);overflow-wrap:anywhere}\n.mom-app .rc.bad{background:var(--bad-soft);color:var(--bad)}\n.mom-app .chk{display:flex;gap:8px;align-items:flex-start;font-size:14px;cursor:pointer}\n.mom-app .chk input{margin-top:4px}\n.mom-app .methods{display:flex;flex-direction:column;gap:10px}\n.mom-app .mth{border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;background:var(--paper)}\n.mom-app .mth.rec{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}\n.mom-app .mth-h{display:flex;align-items:center;gap:10px}\n.mom-app .mth-h .ic{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);flex:none}\n.mom-app .mth-h .ic svg{width:18px;height:18px}\n.mom-app .mth-h b{font-size:14.5px;display:block;line-height:1.3}\n.mom-app .mth-h small{color:var(--muted);font-size:12.5px;line-height:1.4;display:block}\n.mom-app .mth .row{display:flex;gap:8px;flex-wrap:wrap}\n.mom-app .note{border-radius:10px;padding:10px 12px;font-size:13.5px;background:var(--accent-soft);color:var(--ink)}\n.mom-app .note.ok{background:var(--ok-soft);color:var(--ok)}\n.mom-app .note.bad{background:var(--bad-soft);color:var(--bad)}\n.mom-app .note.gold{background:var(--gold-soft);color:var(--gold)}\n.mom-app .note a{color:inherit;font-weight:700}\n.mom-app .prev-wrap{padding:0;overflow:hidden}\n.mom-app .prev-tabs{display:flex;gap:4px;padding:8px 10px 0;border-bottom:1px solid var(--line);background:var(--raise)}\n.mom-app .ptab{all:unset;cursor:pointer;padding:7px 12px;font-size:13.5px;font-weight:600;color:var(--muted);border-bottom:2px solid transparent}\n.mom-app .ptab.on{color:var(--accent);border-bottom-color:var(--accent)}\n.mom-app .prev-bar{padding:10px 18px;border-bottom:1px solid var(--line);font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:3px}\n.mom-app .prev-bar b{color:var(--ink);font-weight:600}\n.mom-app .prev{background:#fff;color:#152036;padding:26px;overflow-x:auto}\n.mom-app .prev.sheet{background:#e9ecf1;padding:22px}\n.mom-app .prev.sheet .pdfdoc{max-width:720px;margin:0 auto;padding:44px 48px;box-shadow:0 1px 4px rgba(0,0,0,.15)}\n.mom-app .scrim{position:fixed;inset:0;background:rgba(8,16,30,.45);display:grid;place-items:center;padding:16px;z-index:50}\n.mom-app .modal{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:22px;display:flex;flex-direction:column;gap:14px}\n.mom-app .modal h2{margin:0;font:700 19px var(--f-ui)}\n.mom-app .modal ol{margin:0;padding-left:20px;font-size:13.5px;color:var(--muted);display:flex;flex-direction:column;gap:4px}\n.mom-app .modal code{font-family:var(--f-mono);font-size:12px;background:var(--raise);padding:1px 5px;border-radius:5px;color:var(--ink)}\n.mom-app .toast{position:fixed;left:50%;bottom:22px;translate:-50% 0;background:var(--ink);color:var(--paper);padding:10px 14px;border-radius:10px;display:flex;gap:14px;align-items:center;font-size:14px;box-shadow:var(--shadow);z-index:60;max-width:calc(100vw - 32px)}\n.mom-app .toast button{all:unset;cursor:pointer;font-weight:700;color:var(--accent-soft);text-decoration:underline}\n.mom-app .tpl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}\n.mom-app .tplc{all:unset;cursor:pointer;border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:4px;background:var(--raise)}\n.mom-app .tplc:hover{border-color:var(--accent)}\n.mom-app .tplc b{font-size:15px}\n.mom-app .tplc small{color:var(--muted);font-size:12.5px;line-height:1.45}\n@media (prefers-reduced-motion:reduce){.mom-app *{transition:none!important}}\n.mom-app .mom-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px}\n.mom-app .mom-top .eyebrow{color:#0369a1}\n.mom-app .mom-top h1{margin:6px 0 0;font:700 30px/1.2 var(--f-ui);letter-spacing:-.01em}\n.mom-app .mom-top p.hint{margin:6px 0 0;max-width:640px}\n.mom-app .mom-actions{display:flex;gap:8px;flex-wrap:wrap}\n.mom-app .mbtn{all:unset;box-sizing:border-box;cursor:pointer;border:1px solid var(--line);background:#fff;color:#334155;border-radius:16px;padding:8px 16px;font-weight:600;font-size:14px;box-shadow:0 1px 2px rgba(15,23,42,.05)}\n.mom-app .mbtn:hover{border-color:var(--line2);background:var(--raise)}\n.mom-app .mbtn.pri{background:#020617;border-color:#020617;color:#fff}\n.mom-app .mbtn.pri:hover{background:#1e293b}\n.mom-app .shell{padding:0;max-width:none;margin:0}\n.mom-app .shell.noside{max-width:none}\n.mom-app .side{top:84px}\n.mom-app .btn{border-radius:16px}\n.mom-app .btn.pri{background:#020617;border-color:#020617;color:#fff}\n.mom-app .btn.pri:hover{background:#1e293b;filter:none;color:#fff}\n.mom-app .mi,.mom-app .paper{border-radius:20px}\n.mom-app .scrim{z-index:60}\n.mom-app .toast{z-index:70}\n.mom-app .mi .by{font-size:11.5px;color:var(--muted)}\n.mom-app .ltools{display:inline-flex;gap:4px;margin-left:auto}\n.mom-app .lt{all:unset;cursor:pointer;font-size:12px;line-height:20px;padding:0 8px;border-radius:6px;border:1px solid var(--line);color:var(--muted);background:var(--paper);white-space:nowrap}\n.mom-app .lt:hover{color:var(--accent);border-color:var(--accent)}\n.mom-app .txtwrap{display:flex;flex-direction:column;gap:6px}\n.mom-app .txtwrap .ltools{align-self:flex-end}\n";

const GLOBAL_CSS = ".pdfdoc{--u:1px;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:\"Sarabun\",\"TH Sarabun New\",Tahoma,sans-serif;font-size:calc(15*var(--u));line-height:1.62;color:#1f2933;background:#fff}\n.pdfdoc p{margin:0 0 calc(5*var(--u))}\n.pdfdoc .ind{text-indent:2em}\n.pdfdoc .d-band{background:#13294b;color:#fff;border-radius:calc(10*var(--u)) calc(10*var(--u)) 0 0;padding:calc(16*var(--u)) calc(20*var(--u)) calc(14*var(--u));display:flex;justify-content:space-between;align-items:center;gap:calc(16*var(--u))}\n.pdfdoc .d-logo{display:flex;align-items:center;gap:calc(12*var(--u))}\n.pdfdoc .d-mk{width:calc(40*var(--u));height:calc(40*var(--u));border-radius:calc(10*var(--u));background:#fff;color:#13294b;display:flex;align-items:center;justify-content:center;font:700 calc(17*var(--u)) \"Anuphan\",\"Sarabun\",sans-serif;flex:none}\n.pdfdoc .d-k{font:600 calc(11*var(--u)) \"Anuphan\",\"Sarabun\",sans-serif;letter-spacing:.16em;color:#b9c3d3}\n.pdfdoc .d-d{font:700 calc(19*var(--u))/1.3 \"Anuphan\",\"Sarabun\",sans-serif}\n.pdfdoc .d-r{text-align:right;font:500 calc(12*var(--u))/1.5 \"Anuphan\",\"Sarabun\",sans-serif;color:#c8d0dc}\n.pdfdoc .d-r b{display:block;font-size:calc(15*var(--u));color:#fff}\n.pdfdoc .d-acc{height:calc(3*var(--u));background:#c9932a;margin-bottom:calc(18*var(--u))}\n.pdfdoc .d-t{margin:0;font:700 calc(23*var(--u))/1.35 \"Anuphan\",\"Sarabun\",sans-serif;color:#13294b}\n.pdfdoc .d-meta{display:flex;flex-wrap:wrap;gap:calc(6*var(--u)) calc(30*var(--u));margin:calc(10*var(--u)) 0 calc(16*var(--u));padding-bottom:calc(12*var(--u));border-bottom:1px solid #d9dee5;font-size:calc(14*var(--u))}\n.pdfdoc .d-meta small{display:block;font:500 calc(11*var(--u)) \"Anuphan\",\"Sarabun\",sans-serif;color:#6b7785}\n.pdfdoc .d-g{color:#3e4c59}\n.pdfdoc .d-h{display:flex;align-items:center;gap:calc(10*var(--u));font:700 calc(15*var(--u)) \"Anuphan\",\"Sarabun\",sans-serif;color:#13294b;margin:calc(20*var(--u)) 0 calc(9*var(--u))}\n.pdfdoc .d-h .bar{width:calc(4*var(--u));height:calc(17*var(--u));border-radius:calc(2*var(--u));background:#c9932a;flex:none}\n.pdfdoc .d-h .ln{flex:1;height:calc(1*var(--u));background:#d9dee5}\n.pdfdoc .d-cnt{margin:0 0 calc(4*var(--u)) 2em}\n.pdfdoc .d-att{margin:0 0 calc(8*var(--u)) 2em}\n.pdfdoc .d-att div{display:flex;gap:calc(12*var(--u));margin:0 0 calc(3*var(--u))}\n.pdfdoc .d-att b{font-weight:600;color:#13294b;flex:0 0 calc(150*var(--u))}\n.pdfdoc .d-topic{margin:0 0 calc(16*var(--u))}\n.pdfdoc .d-topic h3{margin:0 0 calc(5*var(--u));font:600 calc(16*var(--u))/1.45 \"Anuphan\",\"Sarabun\",sans-serif;color:#13294b}\n.pdfdoc .d-topic h3 .no{color:#c9932a}\n.pdfdoc .d-ns{margin-top:calc(7*var(--u));background:#f3f5f9;border-left:3px solid #13294b;border-radius:0 calc(7*var(--u)) calc(7*var(--u)) 0;padding:calc(8*var(--u)) calc(14*var(--u))}\n.pdfdoc .d-ns .lb{font:700 calc(12*var(--u)) \"Anuphan\",\"Sarabun\",sans-serif;color:#13294b;display:block;margin-bottom:calc(1*var(--u))}\n.pdfdoc .d-ns p:last-child,.pdfdoc .d-ns .li:last-child{margin-bottom:0}\n.pdfdoc .li{padding-left:3.4em;text-indent:-1.4em;margin:0 0 calc(4*var(--u))}\n.pdfdoc .li.l1{padding-left:4.8em}\n.pdfdoc .li.l2{padding-left:6.2em}\n.pdfdoc .d-ns .li{padding-left:1.4em}\n.pdfdoc .d-ns .li.l1{padding-left:2.8em}\n.pdfdoc .d-ns .li.l2{padding-left:4.2em}\n.pdfdoc .li .mk{display:inline-block;min-width:1.4em;text-indent:0;color:#13294b;font-weight:600}\n.pdfdoc table.d-tb{border-collapse:collapse;width:100%;table-layout:fixed;margin:calc(4*var(--u)) 0 calc(8*var(--u));font-size:calc(14*var(--u))}\n.pdfdoc .d-tb th{background:#f3f5f9;color:#13294b;font:600 calc(13*var(--u)) \"Anuphan\",\"Sarabun\",sans-serif;text-align:left;padding:calc(6*var(--u)) calc(10*var(--u));border-bottom:2px solid #13294b}\n.pdfdoc .d-tb td{padding:calc(6*var(--u)) calc(10*var(--u));border-bottom:1px solid #d9dee5;vertical-align:top}\n.pdfdoc .d-tb .s2{color:#047857}\n.pdfdoc .d-tb .s1{color:#a5741c}\n.pdfdoc .d-sg{display:grid;grid-template-columns:1fr 1fr;gap:calc(16*var(--u));margin-top:calc(6*var(--u));text-align:center;font-size:calc(14*var(--u))}\n.pdfdoc .d-sg.three{grid-template-columns:1fr 1fr 1fr}\n.pdfdoc .d-sg>div{border:1px solid #d9dee5;border-radius:calc(9*var(--u));padding:calc(10*var(--u)) calc(12*var(--u))}\n.pdfdoc .d-sg p{margin:0}\n.pdfdoc .d-sg small{color:#6b7785;font-size:calc(13*var(--u))}\n.pdfdoc .d-sg .img{height:calc(58*var(--u));display:flex;align-items:flex-end;justify-content:center}\n.pdfdoc .d-sg .img img{max-height:calc(56*var(--u));max-width:calc(200*var(--u))}\n.pdfdoc .d-sg .dot{border-bottom:1px solid #9aa5b1;margin:0 10% calc(6*var(--u))}\n.pdfdoc .d-end{margin-top:calc(22*var(--u));padding-top:calc(10*var(--u));border-top:1px solid #d9dee5;color:#3e4c59}\n@media print{.pdfdoc p,.pdfdoc .li,.pdfdoc tr,.pdfdoc .d-ns,.pdfdoc .d-meta,.pdfdoc .avoid{break-inside:avoid}.pdfdoc h2,.pdfdoc h3,.pdfdoc .d-cnt{break-after:avoid}}\n.mom-print{display:none}\n@media print{\n  @page{size:A4;margin:10mm 11mm 14mm 11mm}\n  body.mom-printing>*:not(.mom-print){display:none!important}\n  body.mom-printing .mom-print{display:block}\n}";

function fontCss() {
    return [
        ['Sarabun', 400, sarabun400],
        ['Sarabun', 600, sarabun600],
        ['Sarabun', 700, sarabun700],
        ['Anuphan', '100 700', anuphan],
    ].map(([family, weight, url]) => `@font-face{font-family:"${family}";font-weight:${weight};src:url("${url}") format("truetype");font-display:swap}`).join('\n');
}

function ensureStyles() {
    if (document.getElementById('mom-writer-styles')) return;
    const style = document.createElement('style');
    style.id = 'mom-writer-styles';
    style.textContent = `${fontCss()}\n${GLOBAL_CSS}\n${MODULE_CSS}`;
    document.head.appendChild(style);
}

const loadedScripts = {};
function loadScript(src) {
    if (!loadedScripts[src]) {
        loadedScripts[src] = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = () => { delete loadedScripts[src]; reject(new Error('load ' + src)); };
            document.head.appendChild(s);
        });
    }
    return loadedScripts[src];
}

const SKELETON = `
<div class="mom-top">
  <div>
    <div class="eyebrow">Meeting minutes</div>
    <h1>บันทึกการประชุม</h1>
    <p class="hint">เขียน MOM บันทึกอัตโนมัติ Export PDF และร่างอีเมลส่งผู้เข้าร่วมประชุม</p>
  </div>
  <div class="mom-actions">
    <button class="mbtn" data-act="contacts" id="btnContacts" hidden>สมุดรายชื่อ</button>
    <button class="mbtn" data-act="settings">ตั้งค่า</button>
    <button class="mbtn pri" data-act="new">+ MOM ใหม่</button>
  </div>
</div>
<div class="shell noside" id="shell">
  <aside class="side">
    <label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" type="search" placeholder="ค้นหาการประชุม ผู้เข้าร่วม หัวข้อ" aria-label="ค้นหาการประชุม"></label>
    <h3><span>ทะเบียนการประชุม</span><span id="cnt"></span></h3>
    <div class="list" id="list"></div>
  </aside>
  <div class="wrap" id="main"></div>
</div>
<div id="layer"></div>
<input type="file" id="sigFile" accept="image/png,image/jpeg" hidden>`;

/**
 * Mount MOM Writer into `root`.
 * @param {HTMLElement} root
 * @param {{apiBase?:string, senderName?:string, googleClientId?:string, closing?:string, replyNote?:string, brandMark?:string}} options
 * @returns {{destroy:()=>void, hasUnsaved:()=>boolean, flush:()=>Promise<boolean>}}
 */
export function mountMomWriter(root, options = {}) {
    ensureStyles();
    const opts = { ...options, html2pdfUrl };
    root.classList.add('mom-app');
    root.innerHTML = SKELETON;
    const printArea = document.createElement('div');
    printArea.className = 'mom-print pdfdoc';
    document.body.appendChild(printArea);
    const onAfterPrint = () => document.body.classList.remove('mom-printing');
    window.addEventListener('afterprint', onAfterPrint);

    const CONFIG = {
        GMAIL_CLIENT_ID: opts.googleClientId || '',
        SENDER_NAME: opts.senderName || '',
        CLOSING: opts.closing || 'ขอแสดงความนับถือ',
        REPLY_NOTE: opts.replyNote || 'หากมีข้อแก้ไขหรือข้อเพิ่มเติม กรุณาแจ้งกลับภายใน 2 วันทำการ',
        PDF_GREETING: true,
        BRAND_MARK: opts.brandMark ?? 'TG',
    };

"use strict";
/* ============ helpers ============ */
const $=s=>root.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* ============ lists inside text boxes ============
   A line starting with "• ", "- ", "* " or "1. " / "1) " is a list item; two leading
   spaces per level indent it (up to 3 levels). Everything is still plain text. */
const LI=/^([ \t]*)(?:([•\-*])|(\d{1,3})[.)])[ \t]+(.*)$/;
const BUL=['•','–','•'];
function blocks(t){return String(t??'').split('\n').map(l=>{const m=l.match(LI);
  return m?{li:true,lv:Math.min(2,Math.floor(m[1].replace(/\t/g,'  ').length/2)),mk:m[2]!=null?null:m[3]+'.',t:m[4].trim()}:{li:false,t:l.trim()}}).filter(b=>b.t)}
const mkOf=b=>b.mk||BUL[b.lv];
function rich(t,ind=true){return blocks(t).map(b=>b.li?`<div class="li l${b.lv}"><span class="mk">${esc(mkOf(b))}</span>${esc(b.t)}</div>`:`<p${ind?' class="ind"':''}>${esc(b.t)}</p>`).join('')}
function richMail(t){return blocks(t).map(b=>b.li?`<div style="padding-left:${1.6+1.4*b.lv}em;text-indent:-1.4em;margin:0 0 3px"><span style="display:inline-block;min-width:1.4em;text-indent:0">${esc(mkOf(b))}</span>${esc(b.t)}</div>`:`<div style="margin:0 0 4px">${esc(b.t)}</div>`).join('')}
const LTOOLS='<span class="ltools"><button type="button" class="lt" data-act="list" data-m="ul" title="ทำเป็นรายการแบบจุด (เลือกหลายบรรทัดได้)">• รายการ</button><button type="button" class="lt" data-act="list" data-m="ol" title="ทำเป็นรายการลำดับเลข">1. ลำดับ</button></span>';
function lineSpan(v,s,e){const a=v.lastIndexOf('\n',s-1)+1;let z=v.indexOf('\n',e>s&&v[e-1]==='\n'?e-1:e);if(z<0)z=v.length;return [a,z]}
function replaceText(ta,a,z,txt){ta.focus();ta.setSelectionRange(a,z);
  let ok=false;try{ok=txt!==''&&document.execCommand('insertText',false,txt)}catch(_){}
  if(!ok){ta.setRangeText(txt,a,z,'end');ta.dispatchEvent(new Event('input',{bubbles:true}))}}
/* Toggle "• " / "1. " on every selected line (removes it when all lines already have it). */
function toggleList(ta,mode){
  const v=ta.value,[a,z]=lineSpan(v,ta.selectionStart,ta.selectionEnd),lines=v.slice(a,z).split('\n');
  const is=l=>{const m=l.match(LI);return !!m&&(mode==='ul'?m[2]!=null:m[3]!=null)};
  const filled=lines.filter(l=>l.trim()),off=filled.length>0&&filled.every(is);let n=0;
  const prev=v.slice(0,Math.max(0,a-1)).split('\n').pop().match(LI);
  if(mode==='ol'&&prev&&prev[3]!=null)n=+prev[3];
  const out=lines.map(l=>{if(!l.trim()&&lines.length>1)return l;const m=l.match(LI),ind=m?m[1]:'',body=m?m[4]:l.trim();
    if(off)return ind+body;n++;return ind+(mode==='ul'?'• ':n+'. ')+body}).join('\n');
  replaceText(ta,a,z,out);if(lines.length>1)ta.setSelectionRange(a,a+out.length)}
/* Enter continues a list, Enter on an empty item ends it, Tab / Shift+Tab change its level. */
function listKey(e){const ta=e.target;if(ta.tagName!=='TEXTAREA'||e.isComposing||e.altKey||e.ctrlKey||e.metaKey)return;
  const v=ta.value,s=ta.selectionStart,[a,z]=lineSpan(v,s,ta.selectionEnd),m=v.slice(a,v.indexOf('\n',a)<0?v.length:v.indexOf('\n',a)).match(LI);
  if(e.key==='Enter'&&!e.shiftKey&&m&&s===ta.selectionEnd){e.preventDefault();
    if(!m[4].trim()){replaceText(ta,a,a+m[0].length,'');return}
    replaceText(ta,s,s,'\n'+m[1]+(m[2]!=null?m[2]+' ':(+m[3]+1)+(m[0].slice(m[1].length+m[3].length,m[1].length+m[3].length+1))+' '));return}
  if(e.key==='Tab'&&m){e.preventDefault();const lines=v.slice(a,z).split('\n');
    const out=lines.map(l=>!LI.test(l)?l:e.shiftKey?l.replace(/^(  |\t| )/,''):'  '+l).join('\n');
    const ss=ta.selectionStart,multi=lines.length>1;replaceText(ta,a,z,out);
    if(multi)ta.setSelectionRange(a,a+out.length);else{const d=out.length-(z-a);ta.setSelectionRange(Math.max(a,ss+d),Math.max(a,ss+d))}}}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const EMAIL=/^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}$/;
const pad2=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
const thDate=v=>{if(!v)return '';const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
const thLong=v=>{if(!v)return '';const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})};
const thShort=v=>{if(!v)return '';const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})};
const STATUS=['ยังไม่เริ่ม','กำลังดำเนินการ','เสร็จแล้ว'];
const SIG_OK=/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const IS_FILE=false;
const I={
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 15 6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
  file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M12 11v6M9 14l3 3 3-3"/></svg>',
  pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M8.5 13.5h7M8.5 16.5h5"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>'
};

/* ============ state (in memory only — nothing is stored) ============ */
const settings={senderName:CONFIG.SENDER_NAME,closing:CONFIG.CLOSING,replyNote:CONFIG.REPLY_NOTE,clientId:CONFIG.GMAIL_CLIENT_ID,greeting:CONFIG.PDF_GREETING};
let mom=null, view='write', flash=null, dirty=false, prevMode='pdf', toastT;
const clock=ms=>new Date(ms).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});

/* ============ database (PHP API) ============ */
const API=(opts.apiBase||'/api/backoffice/').replace(/\/?$/,'/');
let dbOn=null, list=[], listQ='', listTotal=0, curId=null, curVer=0, contacts=[];
let saveState='new', savedAt=0, saveErr='', saveTimer=null, saving=false, again=false, editSeq=0, conflict=false, leaveFn=null;
async function req(path,opt={}){
  try{const r=await window.axios.request({url:API+path,method:opt.method||'GET',data:opt.body,timeout:30000,headers:{Accept:'application/json'}});return r.data}
  catch(err){const r=err.response,j=r&&r.data;const e=new Error((j&&(j.message||j.error))||(err.code==='ECONNABORTED'?'หมดเวลาเชื่อมต่อเซิร์ฟเวอร์':err.message));e.status=r&&r.status;e.code=j&&j.error;throw e}}
async function boot(){
  render();
  try{const j=await req('moms?limit=300');list=j.items;listTotal=j.total;dbOn=true}
  catch(e){dbOn=false;console.warn('MOM Writer: API unavailable —',e.message)}
  if(dbOn)await loadContacts();
  render()}
async function loadList(){if(!dbOn)return;
  try{const j=await req('moms?limit=300'+(listQ?'&q='+encodeURIComponent(listQ):''));list=j.items;listTotal=j.total}catch(e){toast('โหลดทะเบียนการประชุมไม่สำเร็จ: '+e.message)}
  renderList()}
async function loadContacts(){try{contacts=(await req('mom-contacts')).items}catch(_){contacts=[]}}
function touch(){dirty=true;editSeq++;
  if(!dbOn||!mom)return;
  clearTimeout(saveTimer);
  if(conflict)return updStatus();
  if(!mom.title.trim()){saveState='notitle';return updStatus()}
  saveState='pending';updStatus();saveTimer=setTimeout(()=>saveNow(),1200)}
async function saveNow(force){
  clearTimeout(saveTimer);saveTimer=null;
  if(!dbOn||!mom||!mom.title.trim())return false;
  if(conflict&&!force)return false;
  if(saving){again=true;return false}
  saving=true;saveState='saving';updStatus();
  const seq=editSeq,target=mom,data=JSON.parse(JSON.stringify(mom));
  try{
    const j=curId?await req('moms/'+curId,{method:'PUT',body:{data,version:curVer,force:!!force}}):await req('moms',{method:'POST',body:{data}});
    if(target!==mom)return true;
    curId=j.id;curVer=j.version;savedAt=Date.now();conflict=false;
    if(editSeq===seq){dirty=false;saveState='saved'}else{saveState='pending';again=true}
    loadList();return true;
  }catch(e){
    if(target!==mom)return false;
    if(e.status===409){conflict=true;saveState='conflict';setFlash('gold','MOM นี้ถูกแก้ไขจากเครื่องอื่นหลังจากที่คุณเปิด การแก้ไขของคุณยังไม่ถูกบันทึก &nbsp;<button class="lnk" data-act="reload-mom">โหลดฉบับล่าสุด (ทิ้งการแก้ไขของฉัน)</button> <button class="lnk" data-act="force-save">บันทึกทับด้วยฉบับของฉัน</button>')}
    else if(e.status===404&&curId){curId=null;curVer=0;saveState='pending';again=true}
    else{saveState='error';saveErr=e.message}
    return false;
  }finally{saving=false;updStatus();if(again&&target===mom){again=false;saveTimer=setTimeout(()=>saveNow(),800)}else again=false}}
function updStatus(){const el=$('#status');if(!el)return;
  if(dbOn===null){el.className='status warn';el.innerHTML='<i></i>กำลังเชื่อมต่อฐานข้อมูล…';return}
  if(!dbOn){el.className='volatile';el.textContent=IS_FILE?'ระบบไม่บันทึกข้อมูล · Export PDF ก่อนปิดหน้า':'เชื่อมต่อฐานข้อมูลไม่ได้ · ข้อมูลไม่ถูกบันทึก Export PDF ก่อนปิดหน้า';return}
  const map={new:['warn','ใส่ชื่อการประชุมแล้วระบบจะบันทึกอัตโนมัติ'],notitle:['warn','ใส่ชื่อการประชุมเพื่อบันทึก'],pending:['warn','รอบันทึก…'],saving:['warn','กำลังบันทึก…'],
    saved:['',`บันทึกแล้ว ${clock(savedAt)} น.`],loaded:['','บันทึกอยู่ในฐานข้อมูล · แก้ไขแล้วบันทึกอัตโนมัติ'],conflict:['err','ยังไม่ได้บันทึก มีการแก้ไขจากเครื่องอื่น'],error:['err','บันทึกไม่สำเร็จ: '+saveErr]};
  const [k,t]=map[saveState]||map.new;el.className='status '+k;
  el.innerHTML='<i></i>'+esc(t)+(saveState==='error'?' <button class="lnk" data-act="retry-save">ลองอีกครั้ง</button>':'')}
const unsaved=()=>!!mom&&dirty&&(dbOn?saveState!=='saved':true);
const onBeforeUnload=e=>{if(unsaved()){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',onBeforeUnload);
function normalize(d){const b=newMom('blank'),m=Object.assign(b,d||{});
  m.show=Object.assign({time:false,location:false,chair:false,recorder:false,reviewer:false},(d&&d.show)||{});
  if(!Array.isArray(m.sections))m.sections=[];
  m.sections.forEach(s=>{if(!s.id)s.id=uid();
    if(s.type==='agenda'){if(s.itemLabel==null)s.itemLabel='วาระที่';if(s.resLabel==null)s.resLabel='มติที่ประชุม'}
    if(s.type==='text'){if(typeof s.text!=='string')s.text=''}else if(!Array.isArray(s.items))s.items=[]});
  return m}
async function leave(fn){
  if(mom&&dbOn&&dirty&&mom.title.trim()&&!conflict)await saveNow();
  if(unsaved()){leaveFn=fn;return confirmLeave()}
  fn()}
async function loadMom(id){
  try{const j=await req('moms/'+id);clearTimeout(saveTimer);
    mom=normalize(j.data);curId=j.id;curVer=j.version;dirty=false;conflict=false;saveState='loaded';view='write';flash=null;render();window.scrollTo({top:0})}
  catch(e){toast('เปิด MOM ไม่สำเร็จ: '+e.message);loadList()}}
function startOver(){clearTimeout(saveTimer);mom=null;curId=null;curVer=0;conflict=false;dirty=false;view='write';flash=null;render()}
async function delMom(){const id=curId,t=mom.title;clearTimeout(saveTimer);
  try{await req('moms/'+id,{method:'DELETE'})}catch(e){return toast('ลบไม่สำเร็จ: '+e.message)}
  startOver();loadList();
  toast(`ลบ "${t}" แล้ว`,async()=>{try{await req('moms/'+id+'/restore',{method:'POST'});await loadList();loadMom(id)}catch(e){toast('กู้คืนไม่สำเร็จ: '+e.message)}})}
async function dupMom(){if(dirty&&mom.title.trim())await saveNow();
  const n=normalize(JSON.parse(JSON.stringify(mom)));
  Object.assign(n,{title:mom.title+' (ครั้งถัดไป)',date:today(),subject:''});
  n.sections.forEach(s=>{s.id=uid();
    if(s.type==='agenda')s.items.forEach(x=>{x.discussion='';x.resolution=''});
    if(s.type==='attendees')s.items.forEach(x=>x.present=true);
    if(s.type==='text')s.text='';
    if(s.type==='signoff')s.items.forEach(x=>{x.sig='';x.date=today()});
    if(s.type==='actions'){const open=s.items.filter(x=>x.task.trim()&&x.status!==STATUS[2]);s.items=open.length?open:[act()]}});
  mom=n;curId=null;curVer=0;conflict=false;view='write';
  flash={kind:'ok',html:'สร้าง MOM ครั้งถัดไปแล้ว ยกรายชื่อผู้เข้าร่วม หัวข้อ และงานที่ยังไม่เสร็จมาให้ แก้ชื่อการประชุมได้ตามต้องการ'};render();touch()}
function renderList(){
  $('#shell').classList.toggle('noside',!dbOn);$('#btnContacts').hidden=!dbOn;if(!dbOn)return;
  $('#cnt').textContent=listTotal?listTotal+' รายการ':'';
  const el=$('#list');
  if(!list.length){el.innerHTML=listQ?'<div class="empty">ไม่พบการประชุมที่ตรงกับคำค้น</div>':'<div class="empty">ยังไม่มีบันทึกการประชุม<br>เลือกแม่แบบเพื่อเริ่ม MOM แรก</div>';return}
  el.innerHTML=list.map(r=>`<button class="mi${r.id===curId?' on':''}" data-open="${r.id}"><span class="t">${esc(r.title)}</span><span class="m"><span class="date">${esc(r.meeting_date?thShort(r.meeting_date):'ไม่ระบุวันที่')}</span>${r.location?`<span>· ${esc(r.location)}</span>`:''}${r.open_actions?`<span class="tag gold">งานค้าง ${r.open_actions}</span>`:''}</span>${r.updated_by?`<span class="by">แก้ไขล่าสุดโดย ${esc(r.updated_by)}</span>`:''}</button>`).join('')}

/* ============ address book ============ */
const ctEmails=()=>new Set(contacts.map(c=>(c.email||'').toLowerCase()).filter(Boolean));
function newContacts(s){const have=ctEmails();return s.items.filter(a=>a.name.trim()&&EMAIL.test(a.email.trim())&&!have.has(a.email.trim().toLowerCase()))}
function updNewCt(si){const b=$('#savect-'+si);if(!b)return;const n=newContacts(mom.sections[si]).length;b.hidden=!n;b.textContent=`บันทึกผู้เข้าร่วมใหม่ลงสมุดรายชื่อ (${n})`}
async function saveNewContacts(si){const l=newContacts(mom.sections[si]);if(!l.length)return;
  try{await req('mom-contacts',{method:'POST',body:{items:l.map(a=>({name:a.name,email:a.email,role:a.role}))}});await loadContacts();render();toast(`บันทึก ${l.length} รายชื่อลงสมุดรายชื่อแล้ว`)}
  catch(e){toast('บันทึกรายชื่อไม่สำเร็จ: '+e.message)}}
let pick=null;
function openPicker(si){pick={si,sel:new Set()};const s=mom.sections[si],have=new Set(s.items.map(a=>a.email.trim().toLowerCase()).filter(Boolean));
  modal(`<h2>เลือกจากสมุดรายชื่อ</h2>
  <input class="inp" id="pick-q" type="search" placeholder="ค้นหาชื่อ อีเมล ตำแหน่ง" aria-label="ค้นหารายชื่อ">
  <div class="ctl">${contacts.length?contacts.map(c=>{const dup=c.email&&have.has(c.email.toLowerCase());
    return `<label class="pick${dup?' dis':''}" data-text="${esc((c.name+' '+(c.email||'')+' '+(c.role||'')).toLowerCase())}"><input type="checkbox" data-pick="${c.id}"${dup?' disabled checked':''}><span><b>${esc(c.name)}</b>${dup?' <small>(อยู่ในรายชื่อแล้ว)</small>':''}<br><small>${esc([c.role,c.email].filter(Boolean).join(' · ')||'ไม่มีอีเมล')}</small></span></label>`}).join(''):'<div class="empty">สมุดรายชื่อยังว่าง เพิ่มได้จากปุ่ม "สมุดรายชื่อ" ด้านบน หรือบันทึกผู้เข้าร่วมใหม่จาก MOM</div>'}</div>
  <div class="foot"><button class="btn" data-act="contacts">จัดการสมุดรายชื่อ</button><div class="grp"><button class="btn" data-act="close">ยกเลิก</button><button class="btn pri" data-act="pick-add" id="pick-btn" disabled>เพิ่ม 0 คน</button></div></div>`);
  setTimeout(()=>$('#pick-q')?.focus(),20)}
function pickAdd(){if(!pick)return;const s=mom.sections[pick.si];
  s.items=s.items.filter(a=>a.name.trim()||a.email.trim());
  contacts.filter(c=>pick.sel.has(c.id)).forEach(c=>s.items.push({name:c.name,email:c.email||'',role:c.role||'',present:true}));
  if(!s.items.length)s.items.push(att());
  const n=pick.sel.size;pick=null;closeLayer();touch();render();toast(`เพิ่มผู้เข้าร่วม ${n} คน`)}
function ctRows(){return contacts.length?contacts.map(c=>`<div class="ctr" data-text="${esc((c.name+' '+(c.email||'')+' '+(c.role||'')).toLowerCase())}">
  <input data-ct="${c.id}" data-k="name" value="${esc(c.name)}" aria-label="ชื่อ"><input data-ct="${c.id}" data-k="email" value="${esc(c.email||'')}" aria-label="อีเมล" placeholder="อีเมล"><input data-ct="${c.id}" data-k="role" value="${esc(c.role||'')}" aria-label="ตำแหน่ง" placeholder="ตำแหน่ง / ทีม">
  <button class="ib del" data-act="ct-del" data-id="${c.id}" title="ลบรายชื่อ" aria-label="ลบรายชื่อ">${I.x}</button></div>`).join(''):'<div class="empty">ยังไม่มีรายชื่อ</div>'}
function openContacts(){pick=null;modal(`<h2>สมุดรายชื่อ</h2><p class="hint" style="margin:0">ใช้เลือกผู้เข้าร่วมประชุมได้เร็วขึ้น แก้ไขในช่องได้เลย ระบบบันทึกเมื่อออกจากช่อง</p>
  <div class="ctr ctnew"><input id="cn-name" placeholder="ชื่อ-สกุล" aria-label="ชื่อใหม่"><input id="cn-email" placeholder="อีเมล" aria-label="อีเมลใหม่"><input id="cn-role" placeholder="ตำแหน่ง / ทีม" aria-label="ตำแหน่งใหม่"><button class="btn pri" data-act="ct-add">เพิ่ม</button></div>
  <input class="inp" id="ct-q" type="search" placeholder="ค้นหา" aria-label="ค้นหารายชื่อ">
  <div class="ctl" id="ct-list">${ctRows()}</div>
  <div class="foot"><span class="hint" id="ct-count">${contacts.length} รายชื่อ</span><button class="btn" data-act="close">ปิด</button></div>`);
  setTimeout(()=>$('#cn-name')?.focus(),20)}
function refreshCt(){const l=$('#ct-list');if(l){l.innerHTML=ctRows();const q=$('#ct-q');if(q&&q.value)filterRows(l,q.value)}const n=$('#ct-count');if(n)n.textContent=contacts.length+' รายชื่อ';render()}
function filterRows(box,q){q=q.trim().toLowerCase();box.querySelectorAll('[data-text]').forEach(r=>r.hidden=!!q&&!r.dataset.text.includes(q))}
async function ctAdd(){const name=$('#cn-name').value.trim(),email=$('#cn-email').value.trim(),role=$('#cn-role').value.trim();
  if(!name)return toast('กรุณาใส่ชื่อ');if(email&&!EMAIL.test(email))return toast('รูปแบบอีเมลไม่ถูกต้อง');
  try{await req('mom-contacts',{method:'POST',body:{name,email,role}});await loadContacts();['cn-name','cn-email','cn-role'].forEach(i=>$('#'+i).value='');refreshCt();$('#cn-name').focus()}
  catch(e){toast('เพิ่มรายชื่อไม่สำเร็จ: '+e.message)}}
async function ctSave(id){const row=[...root.querySelectorAll(`[data-ct="${id}"]`)],v={};row.forEach(i=>v[i.dataset.k]=i.value.trim());
  const c=contacts.find(x=>x.id===id);if(!c)return;
  if(!v.name){row[0].value=c.name;return toast('ชื่อห้ามว่าง')}
  if(v.email&&!EMAIL.test(v.email)){return toast('รูปแบบอีเมลไม่ถูกต้อง')}
  try{const j=await req('mom-contacts/'+id,{method:'PUT',body:v});Object.assign(c,j);render()}
  catch(e){toast('บันทึกรายชื่อไม่สำเร็จ: '+e.message);row.forEach(i=>i.value=c[i.dataset.k]||'')}}
async function ctDel(id){const c=contacts.find(x=>x.id===id);if(!c)return;
  try{await req('mom-contacts/'+id,{method:'DELETE'});contacts=contacts.filter(x=>x.id!==id);refreshCt();
    toast(`ลบ "${c.name}" แล้ว`,async()=>{try{await req('mom-contacts',{method:'POST',body:{name:c.name,email:c.email||'',role:c.role||''}});await loadContacts();refreshCt()}catch(_){}})}
  catch(e){toast('ลบไม่สำเร็จ: '+e.message)}}

/* ============ model ============ */
const att=()=>({name:'',email:'',role:'',present:true});
const agi=(topic='')=>({topic,discussion:'',resolution:''});
const act=()=>({task:'',owner:'',due:'',status:STATUS[0]});
const sgi=(role='')=>({role,name:'',date:today(),sig:''});
const SEC={
  attendees:(t='ผู้เข้าร่วมประชุม')=>({id:uid(),type:'attendees',title:t,items:[att(),att()]}),
  agenda:(t='วาระการประชุมและมติ',topics,itemLabel='วาระที่',resLabel='มติที่ประชุม')=>({id:uid(),type:'agenda',title:t,itemLabel,resLabel,items:(topics||['']).map(agi)}),
  actions:(t='งานที่ต้องดำเนินการ')=>({id:uid(),type:'actions',title:t,items:[act()]}),
  text:(t='หัวข้อใหม่',text='')=>({id:uid(),type:'text',title:t,text}),
  signoff:(t='ลงนาม',roles=['ผู้จดบันทึกการประชุม'])=>({id:uid(),type:'signoff',title:t,items:roles.map(sgi)})
};
const META=[['time','เวลา'],['location','สถานที่'],['chair','ประธานการประชุม'],['recorder','ผู้จดบันทึก'],['reviewer','ผู้ตรวจรายงาน']];
const TEMPLATES={
  team:{name:'ประชุมทีมทั่วไป',desc:'ผู้เข้าร่วม วาระและมติ งานที่ต้องทำ นัดครั้งถัดไป และช่องลงนาม',
    make:()=>({show:{time:true,location:true,chair:true,recorder:true,reviewer:false},sections:[SEC.attendees(),SEC.agenda(),SEC.actions(),SEC.text('นัดประชุมครั้งถัดไป'),SEC.text('หมายเหตุ'),SEC.signoff()]})},
  topics:{name:'หัวข้อ + Next Step',desc:'แต่ละหัวข้อมีรายละเอียดและ Next Step แบบรายงานสรุปการประชุมทั่วไป',
    make:()=>({show:{time:true,location:true,chair:false,recorder:true,reviewer:false},sections:[SEC.attendees(),SEC.agenda('หัวข้อ',null,'หัวข้อที่','Next Step'),SEC.signoff('ลงนาม',['Assistant Manager','Manager'])]})},
  formal:{name:'รายงานการประชุมแบบทางการ',desc:'5 ระเบียบวาระตามแบบราชการ พร้อมผู้ตรวจรายงาน',
    make:()=>({show:{time:true,location:true,chair:true,recorder:true,reviewer:true},sections:[SEC.attendees('ผู้มาประชุม'),SEC.agenda('ระเบียบวาระการประชุม',['เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ','รับรองรายงานการประชุมครั้งที่แล้ว','เรื่องสืบเนื่องจากการประชุมครั้งที่แล้ว','เรื่องเพื่อพิจารณา','เรื่องอื่น ๆ'],'ระเบียบวาระที่','มติที่ประชุม'),SEC.actions('สรุปงานที่มอบหมาย'),SEC.signoff('ลงนามรับรองรายงาน',['ผู้จดรายงานการประชุม','ผู้ตรวจรายงานการประชุม','ประธานการประชุม'])]})},
  blank:{name:'เริ่มจากหน้าว่าง',desc:'มีแค่ชื่อและวันที่ เพิ่มหัวข้อเองทีละส่วน',
    make:()=>({show:{time:false,location:false,chair:false,recorder:false,reviewer:false},sections:[]})}
};
function newMom(tpl){const b=(TEMPLATES[tpl]||TEMPLATES.team).make();
  b.sections.forEach(s=>{if(s.type==='signoff')s.items.forEach(a=>{if(a.role.includes('จด'))a.name=settings.senderName||''})});
  return Object.assign({title:'',date:today(),timeStart:'',timeEnd:'',location:'',chair:'',recorder:settings.senderName||'',reviewer:'',
    extraTo:'',cc:'',subject:'',includeAbsent:true,attachPdf:true},b)}
const people=()=>[...new Set(mom.sections.filter(s=>s.type==='attendees').flatMap(s=>s.items.map(a=>a.name.trim())).filter(Boolean))];
const itemHead=(s,j,topic)=>{const l=(s.itemLabel||'').trim();return l?`${l} ${j+1}${topic?' : '+topic:''}`:(topic||`${j+1}.`)};

/* ============ render ============ */
function render(){
  const el=$('#main');
  if(!mom){el.innerHTML=`<div class="paper card" style="padding:28px;gap:16px"><div><div class="eyebrow">เริ่มต้น</div><h2 style="margin:4px 0 0;font:700 22px var(--f-doc)">เลือกรูปแบบบันทึกการประชุม</h2><p class="hint" style="margin:4px 0 0">ทุกหัวข้อลบ เพิ่ม เปลี่ยนชื่อ หรือสลับลำดับได้ภายหลัง ${dbOn?'MOM จะถูกบันทึกลงฐานข้อมูลอัตโนมัติเมื่อใส่ชื่อการประชุม':'ตอนนี้ระบบไม่บันทึกข้อมูล เมื่อเขียนเสร็จให้ Export PDF หรือร่างอีเมลก่อนปิดหน้า'}</p></div>${tplCards()}</div>`;renderList();return}
  const steps=`<div class="toprow"><div class="steps" role="tablist">
    <button class="step${view==='write'?' on':''}" data-act="view" data-v="write" role="tab"><span class="n">1</span>เขียน MOM</button>
    <button class="step${view==='send'?' on':''}" data-act="view" data-v="send" role="tab"><span class="n">2</span>ตรวจ Export และร่างอีเมล</button></div>
    <span id="status"></span></div>`;
  el.innerHTML=steps+(view==='write'?writeView():sendView());
  updStatus();renderList();
  el.querySelectorAll('textarea').forEach(grow);
  if(view==='send'&&settings.clientId&&!IS_FILE)loadGis().catch(()=>{});
}
function tplCards(){return `<div class="tpl">${Object.entries(TEMPLATES).map(([k,t])=>`<button class="tplc" data-act="create" data-tpl="${k}"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></button>`).join('')}</div>`}
function flashHtml(){return flash?`<div class="note ${flash.kind}">${flash.html}</div>`:''}

function metaField(k,label){
  const m=mom,x=`<button class="mini-x" data-act="hide-meta" data-m="${k}" title="นำช่องนี้ออก">นำออก</button>`;
  if(k==='time')return `<div class="fld time"><span>${label}${x}</span><div class="timepair"><input type="time" data-f="timeStart" value="${esc(m.timeStart)}" aria-label="เวลาเริ่ม"><span class="hint">ถึง</span><input type="time" data-f="timeEnd" value="${esc(m.timeEnd)}" aria-label="เวลาเลิก"></div></div>`;
  const ph={location:'ห้องประชุม 3 / Google Meet',chair:'ชื่อประธาน',recorder:'ชื่อผู้จดบันทึก',reviewer:'ชื่อผู้ตรวจรายงาน'}[k];
  return `<div class="fld"><span>${label}${x}</span><input data-f="${k}" value="${esc(m[k])}" placeholder="${ph}" list="ppl" aria-label="${label}"></div>`;
}
function writeView(){
  const m=mom,hidden=META.filter(([k])=>!m.show[k]);
  const head=`<div class="doc-head">
    <div class="eyebrow">บันทึกการประชุม · Minutes of Meeting</div>
    <input class="title-in" data-f="title" value="${esc(m.title)}" placeholder="ชื่อการประชุม เช่น รายงานการใช้โปรโมชั่น (ISDP+MKT)" aria-label="ชื่อการประชุม">
    <div class="meta"><label class="fld"><span>วันที่ประชุม</span><input type="date" data-f="date" value="${esc(m.date)}"></label>
      ${META.filter(([k])=>m.show[k]).map(([k,l])=>metaField(k,l)).join('')}</div>
    ${hidden.length?`<div class="addchips">เพิ่มช่อง:${hidden.map(([k,l])=>`<button class="chipbtn" data-act="show-meta" data-m="${k}">+ ${l}</button>`).join('')}</div>`:''}
  </div>`;
  const secs=m.sections.map((s,i)=>secHtml(s,i,m.sections.length)).join('');
  const has=t=>m.sections.some(s=>s.type===t);
  const opts=[
    !has('attendees')&&['attendees','ผู้เข้าร่วมประชุม'],
    ['agenda','วาระการประชุมและมติ','วาระ / หัวข้อ'],
    ['actions','งานที่ต้องดำเนินการ'],
    ['text','เรื่องแจ้งเพื่อทราบ'],
    ['text','นัดประชุมครั้งถัดไป'],
    ['text','หมายเหตุ'],
    !has('signoff')&&['signoff','ลงนาม','ช่องลงนาม (ชื่อ ลายเซ็น วันที่)'],
    ['text','หัวข้อใหม่','กำหนดเอง…']
  ].filter(Boolean);
  const add=`<div class="addsec"><div class="lbl">+ เพิ่มหัวข้อ</div><div class="opts">${opts.map(o=>`<button class="opt" data-act="add-sec" data-type="${o[0]}" data-title="${esc(o[1])}">${esc(o[2]||o[1])}</button>`).join('')}</div></div>`;
  const left=dbOn?(curId?`<button class="btn danger" data-act="del-mom">${I.trash}ลบ MOM นี้</button><button class="btn" data-act="dup">ทำสำเนาเป็นการประชุมครั้งถัดไป</button>`:''):`<button class="btn danger" data-act="new">${I.trash}ล้างและเริ่มใหม่</button>`;
  const foot=`<div class="foot"><div class="grp">${left}</div>
    <div class="grp"><button class="btn" data-act="m-pdf">${I.pdf}Export PDF</button><button class="btn pri" data-act="view" data-v="send">ถัดไป: ตรวจและร่างอีเมล →</button></div></div>`;
  return `${flashHtml()}<div class="paper">${head}<div class="secs">${secs||'<div class="hint" style="padding:18px 0">ยังไม่มีหัวข้อ เลือกเพิ่มได้ด้านล่าง</div>'}</div>${add}</div>${foot}
  <datalist id="ppl">${people().map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
  <datalist id="ctl">${contacts.map(c=>`<option value="${esc(c.name)}">${esc([c.role,c.email].filter(Boolean).join(' · '))}</option>`).join('')}</datalist>`;
}
function secHtml(s,i,n){
  const A=j=>`data-s="${i}" data-i="${j}"`;
  let body='';
  if(s.type==='attendees'){
    body=`<div class="tbl"><div class="tr att th"><span>ชื่อ-สกุล</span><span>อีเมล (ใช้ส่ง MOM)</span><span>ตำแหน่ง / หน่วยงาน</span><span>การเข้าร่วม</span><span></span></div>
    ${s.items.map((a,j)=>`<div class="tr att">
      <input ${A(j)} data-k="name" value="${esc(a.name)}" placeholder="ชื่อ-สกุล" aria-label="ชื่อ" list="ctl" autocomplete="off">
      <input ${A(j)} data-k="email" type="email" value="${esc(a.email)}" placeholder="name@tgfone.com" aria-label="อีเมล" class="${a.email&&!EMAIL.test(a.email.trim())?'badmail':''}">
      <input ${A(j)} data-k="role" value="${esc(a.role)}" placeholder="ตำแหน่ง / ทีม" aria-label="ตำแหน่ง">
      <select ${A(j)} data-k="present" aria-label="การเข้าร่วม"><option value="1"${a.present?' selected':''}>เข้าร่วม</option><option value="0"${a.present?'':' selected'}>ไม่ได้เข้าร่วม</option></select>
      <button class="ib del" data-act="item-del" ${A(j)} title="ลบแถว" aria-label="ลบแถว">${I.x}</button></div>`).join('')}</div>
    <div class="att-tools"><button class="addrow" data-act="item-add" data-s="${i}">+ เพิ่มผู้เข้าร่วม</button>${dbOn?(()=>{const n=newContacts(s).length;return `<button class="addrow" data-act="pick-ct" data-s="${i}">+ เลือกจากสมุดรายชื่อ</button><button class="addrow" data-act="save-ct" data-s="${i}" id="savect-${i}"${n?'':' hidden'}>บันทึกผู้เข้าร่วมใหม่ลงสมุดรายชื่อ (${n})</button>`})():''}</div>`;
  }else if(s.type==='agenda'){
    const ex=itemHead(s,0,'…');
    body=`<div class="labels">
      <label class="fld"><span>คำนำหน้าแต่ละข้อ</span><input data-s="${i}" data-k="itemLabel" value="${esc(s.itemLabel)}" placeholder="เว้นว่าง = ไม่มีคำนำหน้า" list="lbl-item"></label>
      <label class="fld"><span>ชื่อช่องผลสรุป</span><input data-s="${i}" data-k="resLabel" value="${esc(s.resLabel)}" placeholder="มติที่ประชุม" list="lbl-res"></label>
      <span class="eg" id="eg-${i}">แสดงเป็น: <b>${esc(ex)}</b></span>
      <datalist id="lbl-item"><option value="วาระที่"><option value="หัวข้อที่"><option value="ระเบียบวาระที่"><option value="เรื่องที่"><option value="ข้อที่"></datalist>
      <datalist id="lbl-res"><option value="มติที่ประชุม"><option value="Next Step"><option value="ข้อสรุป"><option value="สิ่งที่ต้องดำเนินการ"></datalist>
    </div>`+s.items.map((a,j)=>`<div class="ag"><div class="ag-h"><span class="ag-n" data-agn="${i}">${esc((s.itemLabel||'').trim()?s.itemLabel.trim()+' '+(j+1):(j+1)+'.')}</span>
      <input ${A(j)} data-k="topic" value="${esc(a.topic)}" placeholder="ชื่อหัวข้อ" aria-label="ชื่อหัวข้อ">
      <button class="ib del" data-act="item-del" ${A(j)} title="ลบข้อนี้" aria-label="ลบข้อนี้">${I.x}</button></div>
      <label class="fld"><span><span>รายละเอียด / สรุปการหารือ</span>${LTOOLS}</span><textarea ${A(j)} data-k="discussion" placeholder="ประเด็นที่หารือ ข้อมูลที่นำเสนอ">${esc(a.discussion)}</textarea></label>
      <label class="fld res"><span><span data-resl="${i}">${esc(s.resLabel||'ผลสรุป')}</span>${LTOOLS}</span><textarea ${A(j)} data-k="resolution" rows="2" style="min-height:52px" placeholder="ปล่อยว่างได้ จะไม่แสดงในเอกสาร">${esc(a.resolution)}</textarea></label></div>`).join('')
      +`<button class="addrow" data-act="item-add" data-s="${i}">+ เพิ่มข้อ</button>`;
  }else if(s.type==='actions'){
    body=`<div class="tbl"><div class="tr act th"><span>สิ่งที่ต้องทำ</span><span>ผู้รับผิดชอบ</span><span>กำหนดเสร็จ</span><span>สถานะ</span><span></span></div>
    ${s.items.map((a,j)=>`<div class="tr act">
      <input ${A(j)} data-k="task" value="${esc(a.task)}" placeholder="สิ่งที่ต้องทำ" aria-label="งาน">
      <input ${A(j)} data-k="owner" value="${esc(a.owner)}" placeholder="ผู้รับผิดชอบ" list="ppl" aria-label="ผู้รับผิดชอบ">
      <input ${A(j)} data-k="due" type="date" value="${esc(a.due)}" aria-label="กำหนดเสร็จ">
      <select ${A(j)} data-k="status" class="st-${Math.max(0,STATUS.indexOf(a.status))}" aria-label="สถานะ">${STATUS.map(x=>`<option${x===a.status?' selected':''}>${x}</option>`).join('')}</select>
      <button class="ib del" data-act="item-del" ${A(j)} title="ลบงาน" aria-label="ลบงาน">${I.x}</button></div>`).join('')}</div>
    <button class="addrow" data-act="item-add" data-s="${i}">+ เพิ่มงาน</button>`;
  }else if(s.type==='signoff'){
    body=`<div class="sg">${s.items.map((a,j)=>`<div class="sgc">
      <div class="sgc-h"><input ${A(j)} data-k="role" value="${esc(a.role)}" placeholder="ตำแหน่ง เช่น Manager" aria-label="ตำแหน่งผู้ลงนาม">
        <button class="ib del" data-act="item-del" ${A(j)} title="ลบผู้ลงนาม" aria-label="ลบผู้ลงนาม">${I.x}</button></div>
      <button class="sgbox" data-act="sig-open" ${A(j)} aria-label="ลงลายเซ็น">${a.sig?`<img src="${esc(a.sig)}" alt="ลายเซ็น">`:'คลิกเพื่อลงลายเซ็น<br><small>หรือเว้นไว้ให้เซ็นด้วยปากกา</small>'}</button>
      <div class="sgrow">${a.sig?`<button class="lnk" data-act="sig-open" ${A(j)}>เซ็นใหม่</button><button class="lnk danger" data-act="sig-clear" ${A(j)}>ลบลายเซ็น</button>`:''}</div>
      <label class="fld"><span>ชื่อ-สกุล</span><input ${A(j)} data-k="name" value="${esc(a.name)}" placeholder="ชื่อผู้ลงนาม" list="ppl"></label>
      <div class="fld"><span>วันที่ลงนาม ${a.date?`<button class="mini-x" data-act="sig-nodate" ${A(j)} title="เว้นวันที่ให้เขียนเอง">เว้นให้เขียนเอง</button>`:''}</span><input type="date" ${A(j)} data-k="date" value="${esc(a.date)}" aria-label="วันที่ลงนาม"></div>
    </div>`).join('')}</div>
    <button class="addrow" data-act="item-add" data-s="${i}">+ เพิ่มผู้ลงนาม</button>
    <div class="hint">ช่องที่ไม่มีลายเซ็นหรือวันที่ จะเป็นเส้นประให้เซ็นและเขียนด้วยปากกา</div>`;
  }else{
    body=`<div class="txtwrap">${LTOOLS}<textarea data-s="${i}" data-k="text" placeholder="พิมพ์รายละเอียด (หัวข้อที่ว่างจะไม่แสดงในเอกสาร)" aria-label="${esc(s.title)}">${esc(s.text)}</textarea></div>`;
  }
  return `<section class="sec${s.collapsed?' collapsed':''}"><div class="sec-h">
    <span class="sec-n">${pad2(i+1)}</span>
    <input class="sec-t" data-s="${i}" data-k="title" value="${esc(s.title)}" aria-label="ชื่อหัวข้อ" title="คลิกเพื่อเปลี่ยนชื่อหัวข้อ">
    <div class="tools">
      <button class="ib" data-act="sec-up" data-s="${i}" title="เลื่อนขึ้น" aria-label="เลื่อนขึ้น"${i===0?' disabled':''}>${I.up}</button>
      <button class="ib" data-act="sec-down" data-s="${i}" title="เลื่อนลง" aria-label="เลื่อนลง"${i===n-1?' disabled':''}>${I.down}</button>
      <button class="ib rot" data-act="sec-fold" data-s="${i}" title="ย่อ/ขยาย" aria-label="ย่อหรือขยาย">${I.down}</button>
      <button class="ib del" data-act="sec-del" data-s="${i}" title="นำหัวข้อนี้ออก" aria-label="นำหัวข้อนี้ออก">${I.trash}</button>
    </div></div><div class="sec-b">${body}</div></section>`;
}

/* ---- send view ---- */
function recipients(){const m=mom,pool=[];
  m.sections.filter(s=>s.type==='attendees').forEach(s=>s.items.forEach(a=>{if(a.email.trim()&&(m.includeAbsent||a.present))pool.push(a.email.trim())}));
  (m.extraTo||'').split(/[,;\s]+/).filter(Boolean).forEach(e=>pool.push(e));
  const bad=pool.filter(e=>!EMAIL.test(e)),to=[...new Set(pool.filter(e=>EMAIL.test(e)).map(e=>e.toLowerCase()))];
  const ccRaw=(m.cc||'').split(/[,;\s]+/).filter(Boolean);ccRaw.filter(e=>!EMAIL.test(e)).forEach(e=>bad.push(e));
  const cc=[...new Set(ccRaw.filter(e=>EMAIL.test(e)).map(e=>e.toLowerCase()).filter(e=>!to.includes(e)))];
  return{to,cc,bad}}
const autoSubject=()=>`สรุปการประชุม (MOM): ${mom.title||'(ยังไม่ตั้งชื่อ)'}${mom.date?' – '+thShort(mom.date):''}`;
const subjectOf=()=>(mom.subject||'').trim()||autoSubject();
function sendView(){
  const m=mom,r=recipients(),api=!!settings.clientId,hasAtt=m.sections.some(s=>s.type==='attendees');
  const left=`<div style="display:flex;flex-direction:column;gap:16px">
  <div class="paper card"><h4>ผู้รับ</h4>
    <div class="rcpt">${r.to.map(e=>`<span class="rc">${esc(e)}</span>`).join('')}${r.bad.map(e=>`<span class="rc bad" title="รูปแบบอีเมลไม่ถูกต้อง">${esc(e)}</span>`).join('')}${!r.to.length&&!r.bad.length?'<span class="hint">ยังไม่มีผู้รับ ใส่อีเมลในหัวข้อผู้เข้าร่วม หรือพิมพ์เพิ่มด้านล่าง</span>':''}</div>
    ${hasAtt?`<label class="chk"><input type="checkbox" data-f="includeAbsent"${m.includeAbsent?' checked':''}> ส่งถึงผู้ที่ไม่ได้เข้าร่วมด้วย</label>`:''}
    <label class="fld"><span>ถึง (เพิ่มเติม)</span><input data-f="extraTo" value="${esc(m.extraTo)}" placeholder="คั่นหลายอีเมลด้วย ,"></label>
    <label class="fld"><span>สำเนาถึง (CC)</span><input data-f="cc" value="${esc(m.cc)}" placeholder="manager@tgfone.com"></label>
    <label class="fld"><span>หัวเรื่อง</span><input data-f="subject" value="${esc(m.subject)}" placeholder="${esc(autoSubject())}"></label>
  </div>
  <div class="paper card"><h4>Export และร่างอีเมล</h4>${flashHtml()}
    <div class="methods">
      <div class="mth rec"><div class="mth-h"><span class="ic">${I.pdf}</span><div><b>Export PDF</b><small>ดาวน์โหลดสรุปการประชุมเป็นไฟล์ PDF ขนาด A4 รูปแบบเรียบ พร้อมช่องลงนาม</small></div></div>
        <div class="row"><button class="btn pri" data-act="m-pdf">${I.pdf}ดาวน์โหลด PDF</button><button class="btn" data-act="m-print">พิมพ์</button></div></div>
      <div class="mth"><div class="mth-h"><span class="ic">${I.mail}</span><div><b>สร้างร่างอีเมล</b><small>${api?'สร้างร่างในโฟลเดอร์ฉบับร่างของ Gmail หรือดาวน์โหลดเป็นไฟล์ .eml':'ดาวน์โหลดเป็นไฟล์ .eml เปิดเป็นร่างใน Outlook ได้ (สร้างร่างใน Gmail ต้องตั้งค่า Client ID)'}</small></div></div>
        <label class="chk"><input type="checkbox" data-f="attachPdf"${m.attachPdf?' checked':''}> แนบไฟล์ PDF ไปกับอีเมลด้วย</label>
        <div class="row">${api?`<button class="btn" data-act="m-api">${I.mail}สร้างร่างใน Gmail</button>`:`<button class="btn" data-act="settings">ตั้งค่า Gmail</button>`}<button class="btn" data-act="m-eml">${I.file}ดาวน์โหลด .eml</button></div></div>
      <div class="mth"><div class="mth-h"><span class="ic">${I.web}</span><div><b>เปิดหน้าเขียนอีเมลบนเว็บ</b><small>ใส่ผู้รับและหัวเรื่องให้ เนื้อหาถูกคัดลอกไว้ กด Ctrl+V ในช่องข้อความ (แนบ PDF เอง)</small></div></div>
        <div class="row"><button class="btn" data-act="m-web" data-w="gmail">Gmail</button><button class="btn" data-act="m-web" data-w="outlook">Outlook บนเว็บ</button><button class="btn" data-act="m-copy">${I.copy}คัดลอก</button></div></div>
    </div></div></div>`;
  const right=`<div class="paper prev-wrap"><div class="prev-tabs"><button class="ptab${prevMode==='pdf'?' on':''}" data-act="pmode" data-p="pdf">ตัวอย่าง PDF</button><button class="ptab${prevMode==='mail'?' on':''}" data-act="pmode" data-p="mail">ตัวอย่างอีเมล</button></div>
    ${prevMode==='mail'?`<div class="prev-bar"><span>ถึง: <b>${esc(r.to.join(', ')||'–')}</b></span>${r.cc.length?`<span>สำเนา: <b>${esc(r.cc.join(', '))}</b></span>`:''}<span>เรื่อง: <b>${esc(subjectOf())}</b></span></div><div class="prev">${emailHtml({withPdf:m.attachPdf})}</div>`
      :`<div class="prev sheet"><div class="pdfdoc">${docHtml()}</div></div>`}</div>`;
  return `<div class="send">${left}${right}</div><div class="foot"><button class="btn" data-act="view" data-v="write">← กลับไปแก้ไข</button></div>`;
}

/* ============ content builders ============ */
function hasContent(s){if(s.type==='text')return !!s.text.trim();
  if(s.type==='attendees')return s.items.some(a=>a.name.trim());
  if(s.type==='agenda')return s.items.some(a=>a.topic||a.discussion||a.resolution);
  if(s.type==='actions')return s.items.some(a=>a.task.trim());
  if(s.type==='signoff')return s.items.some(a=>a.name.trim()||a.sig||a.role.trim());return false}
function metaRows(){const m=mom,r=[['วันที่',thDate(m.date)]];
  if(m.show.time&&m.timeStart)r.push(['เวลา',m.timeStart+(m.timeEnd?' – '+m.timeEnd:'')+' น.']);
  [['location','สถานที่'],['chair','ประธาน'],['recorder','ผู้จดบันทึก'],['reviewer','ผู้ตรวจรายงาน']].forEach(([k,l])=>{if(m.show[k]&&m[k].trim())r.push([l,m[k]])});
  return r.filter(x=>x[1])}

/* Document used for PDF export, print and the PDF preview */
function docHtml(){
  const m=mom,S=settings,o=[],title=esc(m.title||'(ยังไม่ตั้งชื่อ)'),mark=(CONFIG.BRAND_MARK||'').trim();
  const dt=m.date?thLong(m.date):'',tm=m.show.time&&m.timeStart?m.timeStart+(m.timeEnd?' – '+m.timeEnd:'')+' น.':'';
  const H=t=>`<h2 class="d-h"><span class="bar"></span>${esc(t)}<span class="ln"></span></h2>`;
  o.push(`<div class="d-band"><div class="d-logo">${mark?`<div class="d-mk">${esc(mark)}</div>`:''}<div><div class="d-k">MINUTES OF MEETING</div><div class="d-d">รายงานการประชุม</div></div></div>${dt?`<div class="d-r">วันที่ประชุม<b>${esc(dt)}</b>${esc(tm)}</div>`:''}</div><div class="d-acc"></div>`);
  o.push(`<h1 class="d-t">${title}</h1>`);
  const mr=metaRows();if(mr.length)o.push(`<div class="d-meta">${mr.map(r=>`<div><small>${esc(r[0])}</small>${esc(r[1])}</div>`).join('')}</div>`);
  if(S.greeting)o.push('<p class="d-g">เรียน ผู้เข้าร่วมประชุมทุกท่าน</p>',`<p class="ind d-g">ขอส่งสรุปการประชุม <b>${title}</b> รายละเอียดดังนี้</p>`);
  m.sections.filter(hasContent).forEach(s=>{
    if(s.type==='signoff'){const l=s.items.filter(a=>a.name.trim()||a.sig||a.role.trim());
      o.push(`<div class="avoid">${H(s.title)}<div class="d-sg${l.length%3===0?' three':''}">${l.map(a=>`<div><div class="img">${SIG_OK.test(a.sig||'')?`<img src="${a.sig}" alt="">`:''}</div><div class="dot"></div><p>(${esc(a.name.trim()||' '.repeat(36))})</p>${a.role?`<p><small>${esc(a.role)}</small></p>`:''}<p><small>วันที่ ${a.date?esc(thLong(a.date)):'......../......../........'}</small></p></div>`).join('')}</div></div>`);return}
    o.push(H(s.title));
    if(s.type==='attendees'){const p=s.items.filter(a=>a.name.trim()&&a.present),ab=s.items.filter(a=>a.name.trim()&&!a.present);
      const li=l=>`<div class="d-att">${l.map((a,i)=>a.role?`<div><b>${i+1}. ${esc(a.role)}</b><span>${esc(a.name)}</span></div>`:`<div><span>${i+1}. ${esc(a.name)}</span></div>`).join('')}</div>`;
      if(p.length)o.push(`<p class="d-cnt">ผู้เข้าร่วม (${p.length} คน)</p>${li(p)}`);
      if(ab.length)o.push(`<p class="d-cnt">ผู้ไม่ได้เข้าร่วม (${ab.length} คน)</p>${li(ab)}`);
    }else if(s.type==='agenda'){const lbl=(s.itemLabel||'').trim();
      s.items.filter(a=>a.topic||a.discussion||a.resolution).forEach((a,j)=>{
        const no=lbl?`${lbl} ${j+1}${a.topic?' :':''}`:`${j+1}.`;
        o.push(`<div class="d-topic"><h3><span class="no">${esc(no)}</span>${a.topic?' '+esc(a.topic):''}</h3>${a.discussion?rich(a.discussion):''}${a.resolution?`<div class="d-ns">${s.resLabel?`<span class="lb">${esc(s.resLabel)}</span>`:''}${rich(a.resolution,false)}</div>`:''}</div>`)});
    }else if(s.type==='actions'){
      o.push(`<table class="d-tb"><tr><th style="width:36px">#</th><th>งาน</th><th style="width:24%">ผู้รับผิดชอบ</th><th style="width:96px">กำหนดเสร็จ</th><th style="width:116px">สถานะ</th></tr>${s.items.filter(a=>a.task.trim()).map((a,i)=>`<tr><td>${i+1}</td><td>${esc(a.task)}</td><td>${esc(a.owner||'-')}</td><td>${esc(a.due?thShort(a.due):'-')}</td><td class="s${Math.max(0,STATUS.indexOf(a.status))}">${esc(a.status)}</td></tr>`).join('')}</table>`);
    }else o.push(rich(s.text));
  });
  if(S.greeting){const sig=S.senderName||m.recorder;
    o.push(`<div class="d-end avoid">${S.replyNote?`<p>${esc(S.replyNote)}</p>`:''}<p style="margin-top:6px">${esc(S.closing||'')}${sig?'<br><b>'+esc(sig)+'</b>':''}</p></div>`)}
  return o.join('');
}
function emailHtml(opt={}){
  const m=mom,S=settings,F="font-family:Sarabun,'TH Sarabun New',Tahoma,Arial,sans-serif";
  const H=`${F};font-size:15px;font-weight:700;color:#000;margin:18px 0 6px`;
  const td='padding:5px 10px;border:1px solid #9aa3b2;vertical-align:top;font-size:14px';
  const o=[`<p style="margin:0 0 10px">เรียน ผู้เข้าร่วมประชุมทุกท่าน</p><p style="margin:0 0 14px">ขอส่งสรุปการประชุม <b>${esc(m.title||'(ยังไม่ตั้งชื่อ)')}</b> รายละเอียดดังนี้</p>`];
  o.push(`<table role="presentation" style="border-collapse:collapse;margin:0 0 6px">${metaRows().map(r=>`<tr><td style="${td};font-weight:bold;width:120px">${esc(r[0])}</td><td style="${td}">${esc(r[1])}</td></tr>`).join('')}</table>`);
  m.sections.filter(s=>s.type!=='signoff'&&hasContent(s)).forEach(s=>{
    o.push(`<div style="${H}">${esc(s.title)}</div>`);
    if(s.type==='attendees'){const p=s.items.filter(a=>a.name.trim()&&a.present),ab=s.items.filter(a=>a.name.trim()&&!a.present);
      const li=l=>l.map((a,i)=>`<div>${i+1}. ${a.role?esc(a.role)+' – ':''}${esc(a.name)}</div>`).join('');
      if(p.length)o.push(`<div>ผู้เข้าร่วม (${p.length} คน)</div>${li(p)}`);
      if(ab.length)o.push(`<div style="margin-top:8px">ผู้ไม่ได้เข้าร่วม (${ab.length} คน)</div>${li(ab)}`);
    }else if(s.type==='agenda'){s.items.filter(a=>a.topic||a.discussion||a.resolution).forEach((a,j)=>{
      o.push(`<div style="margin:0 0 12px"><div style="font-weight:bold">${esc(itemHead(s,j,a.topic))}</div>${a.discussion?richMail(a.discussion):''}${a.resolution?`${s.resLabel?`<div style="font-weight:bold;margin-top:6px">${esc(s.resLabel)}</div>`:''}${richMail(a.resolution)}`:''}</div>`)});
    }else if(s.type==='actions'){
      o.push(`<table role="presentation" style="border-collapse:collapse;width:100%"><tr><td style="${td};font-weight:bold">#</td><td style="${td};font-weight:bold">งาน</td><td style="${td};font-weight:bold">ผู้รับผิดชอบ</td><td style="${td};font-weight:bold">กำหนดเสร็จ</td><td style="${td};font-weight:bold">สถานะ</td></tr>${s.items.filter(a=>a.task.trim()).map((a,i)=>`<tr><td style="${td}">${i+1}</td><td style="${td}">${esc(a.task)}</td><td style="${td}">${esc(a.owner||'-')}</td><td style="${td};white-space:nowrap">${esc(a.due?thShort(a.due):'-')}</td><td style="${td}">${esc(a.status)}</td></tr>`).join('')}</table>`);
    }else o.push(richMail(s.text));
  });
  if(opt.withPdf)o.push(`<p style="margin:18px 0 0">รายละเอียดฉบับ PDF สำหรับลงนามตามไฟล์แนบ</p>`);
  if(S.replyNote)o.push(`<p style="margin:16px 0 0">${esc(S.replyNote)}</p>`);
  const sig=S.senderName||m.recorder;o.push(`<p style="margin:12px 0 0">${esc(S.closing||'')}${sig?'<br>'+esc(sig):''}</p>`);
  return `<div style="${F};font-size:14px;line-height:1.6;color:#000;max-width:720px">${o.join('')}</div>`;
}
function emailText(opt={}){
  const m=mom,S=settings,L=['เรียน ผู้เข้าร่วมประชุมทุกท่าน','',`ขอส่งสรุปการประชุม ${m.title||'(ยังไม่ตั้งชื่อ)'} รายละเอียดดังนี้`,''];
  metaRows().forEach(r=>L.push(`${r[0]}: ${r[1]}`));
  m.sections.filter(s=>s.type!=='signoff'&&hasContent(s)).forEach(s=>{L.push('',s.title);
    if(s.type==='attendees'){const p=s.items.filter(a=>a.name.trim()&&a.present),ab=s.items.filter(a=>a.name.trim()&&!a.present);
      if(p.length){L.push(`ผู้เข้าร่วม (${p.length} คน)`);p.forEach((a,i)=>L.push(`${i+1}. ${a.role?a.role+' – ':''}${a.name}`))}
      if(ab.length){L.push(`ผู้ไม่ได้เข้าร่วม (${ab.length} คน)`);ab.forEach((a,i)=>L.push(`${i+1}. ${a.role?a.role+' – ':''}${a.name}`))}}
    else if(s.type==='agenda')s.items.filter(a=>a.topic||a.discussion||a.resolution).forEach((a,j)=>{L.push(itemHead(s,j,a.topic));if(a.discussion)L.push(a.discussion);if(a.resolution){if(s.resLabel)L.push(s.resLabel);L.push(a.resolution)}L.push('')});
    else if(s.type==='actions')s.items.filter(a=>a.task.trim()).forEach((a,i)=>L.push(`${i+1}. ${a.task} | ผู้รับผิดชอบ: ${a.owner||'-'} | กำหนดเสร็จ: ${a.due?thShort(a.due):'-'} | ${a.status}`));
    else L.push(s.text)});
  if(opt.withPdf)L.push('','รายละเอียดฉบับ PDF สำหรับลงนามตามไฟล์แนบ');
  if(S.replyNote)L.push('',S.replyNote);L.push('',S.closing||'');const sig=S.senderName||m.recorder;if(sig)L.push(sig);
  return L.join('\n');
}

/* ============ PDF export (html2pdf, rendered in the browser) ============ */
const PDF_MARGIN=[10,11,14,11];   // mm: top, left, bottom, right
/* Blocks that must not be cut by a page edge, in document order. */
function pageUnits(el,H){const out=[];
  const walk=p=>{for(const c of p.children){
    if(c.matches('.d-band,.d-acc'))continue;
    if(c.matches('.d-topic,.d-att')){walk(c);continue}
    if(c.matches('.d-ns,.avoid')&&c.getBoundingClientRect().height>H*0.5){walk(c);continue}
    if(c.tagName==='TABLE'){c.querySelectorAll('tr').forEach(r=>out.push(r));continue}
    out.push(c)}};
  walk(el);return out}
/* Lay the document out at PDF width, push any block a page edge would cut onto the
   next page (a heading moves together with what follows it), and when the last page
   would hold only a few lines, shrink the type a little so it needs one page fewer. */
function paginate(el){
  const [mt,ml,mb,mr]=PDF_MARGIN,iw=210-ml-mr,ih=297-mt-mb;
  const box=document.createElement('div');box.style.cssText=`position:fixed;left:-10000px;top:0;width:${iw}mm;background:#fff`;
  box.appendChild(el);document.body.appendChild(box);
  const KEEP='h2,h3,.d-cnt,tr:first-child';
  const run=u=>{el.style.setProperty('--u',u+'px');el.querySelectorAll('.pg-sp').forEach(n=>n.remove());
    const W=box.getBoundingClientRect().width,H=W*ih/iw,top0=()=>el.getBoundingClientRect().top;
    const Y=n=>n.getBoundingClientRect().top-top0(),B=n=>n.getBoundingClientRect().bottom-top0();
    const units=pageUnits(el,H);
    units.forEach((n,k)=>{let j=k;while(units[j+1]&&units[j].matches(KEEP))j++;
      const y=Y(n),end=B(units[j]),pg=Math.floor((y+0.5)/H),edge=(pg+1)*H;
      if(end<=edge+0.5||end-y>H*0.9||y<=pg*H+1)return;
      const sp=document.createElement(n.tagName==='TR'?'tr':'div');sp.className='pg-sp';
      const set=h=>{if(n.tagName==='TR')sp.innerHTML=`<td colspan="9" style="border:0;padding:0;height:${h}px;background:#fff"></td>`;else sp.style.height=h+'px'};
      set(edge-y);n.before(sp);const off=edge-Y(n);if(Math.abs(off)>0.5)set(Math.max(0,edge-y+off))});
    const t=el.getBoundingClientRect().height;return {u,pages:Math.max(1,Math.ceil((t-1)/H)),fill:(t%H)/H}};
  try{let best=run(1);
    if(best.pages>1&&best.fill<0.3){for(const u of [0.95,0.9]){const r=run(u);if(r.pages<best.pages){best=r;break}}
      if(best.u===1)run(1)}
  }finally{box.remove()}
  return el}
const pdfName=()=>('สรุปการประชุม_'+(mom.title||'MOM')).replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'_').replace(/\s+/g,'_').slice(0,90)+'_'+(mom.date||today())+'.pdf';
const SEG=(window.Intl&&Intl.Segmenter)?new Intl.Segmenter('th',{granularity:'word'}):null;
function pdfElement(){
  const el=document.createElement('div');el.className='pdfdoc';el.innerHTML=docHtml();
  // html2canvas cannot wrap long Thai runs (no spaces), so mark word boundaries with zero-width spaces
  if(SEG){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(n=>{if(/[฀-๿]/.test(n.nodeValue))n.nodeValue=[...SEG.segment(n.nodeValue)].map(x=>x.segment).join('​')})}
  return el}
async function buildPdf(){
  if(!window.html2pdf){try{await loadScript(opts.html2pdfUrl)}catch(_){}}
  if(!window.html2pdf)throw new Error('nolib');
  if(document.fonts&&document.fonts.load){try{await Promise.all(['400 15px Sarabun','600 15px Sarabun','700 15px Sarabun','700 15px Anuphan'].map(f=>document.fonts.load(f)))}catch(_){}}
  const opt={margin:PDF_MARGIN,image:{type:'jpeg',quality:0.96},html2canvas:{scale:2,backgroundColor:'#ffffff',useCORS:true},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},pagebreak:{mode:['legacy']}};
  // wrapped in an object: the html2pdf worker is a thenable, and awaiting it directly would unwrap it
  return {w:html2pdf().set(opt).from(paginate(pdfElement())).toPdf().get('pdf').then(pdf=>{const n=pdf.internal.getNumberOfPages();
    for(let i=1;i<=n;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(120);pdf.text(i+' / '+n,105,290,{align:'center'})}
    pdf.setProperties({title:'MOM '+(mom.date||''),subject:'Minutes of Meeting',creator:'MOM Writer'})})};
}
async function exportPdf(btn){
  if(!mom)return;
  if(!mom.title.trim()){closeLayer();return setFlash('bad','กรุณาตั้งชื่อการประชุมก่อน Export')}
  btn&&btn.classList.add('busy');
  try{await (await buildPdf()).w.save(pdfName());if(!dbOn)dirty=false;closeLayer();setFlash('ok','ดาวน์โหลด PDF แล้ว: '+esc(pdfName()))}
  catch(e){setFlash('bad',e.message==='nolib'?'โหลดตัวสร้าง PDF ไม่ได้ ลองรีเฟรชหน้า หรือใช้ปุ่ม "พิมพ์" แล้วเลือก Save as PDF แทน':'สร้าง PDF ไม่สำเร็จ: '+esc(e.message))}
  finally{btn&&btn.classList.remove('busy')}}
async function pdfBase64(){const {w}=await buildPdf();const ab=await w.outputPdf('arraybuffer');
  let s='';const u=new Uint8Array(ab);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}

/* ============ MIME (.eml + Gmail API) ============ */
const b64=s=>btoa(unescape(encodeURIComponent(s)));
const wrap76=s=>s.replace(/.{1,76}/g,'$&\r\n').trim();
function encHeader(s){if(/^[\x20-\x7e]*$/.test(s))return s;const c=[...s],p=[];for(let i=0;i<c.length;i+=14)p.push('=?UTF-8?B?'+b64(c.slice(i,i+14).join(''))+'?=');return p.join('\r\n ')}
function buildMime({unsent,pdf}={}){
  const r=recipients(),H=[],withPdf=!!pdf;
  if(unsent)H.push('X-Unsent: 1');
  H.push('To: '+r.to.join(', '));if(r.cc.length)H.push('Cc: '+r.cc.join(', '));
  H.push('Subject: '+encHeader(subjectOf()),'MIME-Version: 1.0');
  const alt='alt_'+uid(),html=`<!doctype html><html><head><meta charset="utf-8"></head><body>${emailHtml({withPdf})}</body></html>`;
  const altPart=`Content-Type: multipart/alternative; boundary="${alt}"\r\n\r\n`+
    `--${alt}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(b64(emailText({withPdf})))}\r\n`+
    `--${alt}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(b64(html))}\r\n--${alt}--\r\n`;
  if(!withPdf)return H.join('\r\n')+'\r\n'+altPart;
  const mix='mix_'+uid(),ascii='MOM_'+(mom.date||today())+'.pdf';
  return H.join('\r\n')+`\r\nContent-Type: multipart/mixed; boundary="${mix}"\r\n\r\n--${mix}\r\n${altPart}`+
    `--${mix}\r\nContent-Type: application/pdf; name="${ascii}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(pdfName())}\r\n\r\n${wrap76(pdf)}\r\n--${mix}--\r\n`;
}
const b64url=s=>btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

/* ============ draft actions ============ */
function precheck(){const r=recipients();
  if(!mom.title.trim())return 'กรุณาตั้งชื่อการประชุมก่อน';
  if(r.bad.length)return 'มีอีเมลที่รูปแบบไม่ถูกต้อง: '+r.bad.map(esc).join(', ');
  if(!r.to.length)return 'ยังไม่มีผู้รับ ใส่อีเมลผู้เข้าร่วม หรือพิมพ์ในช่อง "ถึง (เพิ่มเติม)"';return ''}
function setFlash(kind,html){flash={kind,html};render()}
function copyRichSync(){const d=document.createElement('div');d.innerHTML=emailHtml();d.style.cssText='position:fixed;left:-10000px;top:0;background:#fff;color:#000';document.body.appendChild(d);
  const sel=getSelection(),rg=document.createRange();rg.selectNodeContents(d);sel.removeAllRanges();sel.addRange(rg);let ok=false;try{ok=document.execCommand('copy')}catch(e){}sel.removeAllRanges();d.remove();return ok}
async function copyRich(){try{if(navigator.clipboard&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([emailHtml()],{type:'text/html'}),'text/plain':new Blob([emailText()],{type:'text/plain'})})]);return true}}catch(e){}return copyRichSync()}
function openWeb(which){const err=precheck();if(err)return setFlash('bad',err);
  const r=recipients(),e=encodeURIComponent,ok=copyRichSync();
  const url=which==='outlook'?`https://outlook.office.com/mail/deeplink/compose?to=${e(r.to.join(';'))}${r.cc.length?'&cc='+e(r.cc.join(';')):''}&subject=${e(subjectOf())}`
    :`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${e(r.to.join(','))}${r.cc.length?'&cc='+e(r.cc.join(',')):''}&su=${e(subjectOf())}`;
  const w=window.open(url,'_blank');
  setFlash(ok?'ok':'gold',(w?'เปิดหน้าเขียนอีเมลในแท็บใหม่แล้ว ':`เบราว์เซอร์บล็อกหน้าต่างใหม่ <a href="${esc(url)}" target="_blank" rel="noopener">คลิกที่นี่เพื่อเปิด</a> `)+(ok?'· เนื้อหาถูกคัดลอกแล้ว <b>คลิกในช่องข้อความแล้วกด Ctrl+V</b>':'· คัดลอกอัตโนมัติไม่ได้ กด "คัดลอก" แล้ววางเอง'))}
async function downloadEml(btn){const err=precheck();if(err)return setFlash('bad',err);
  btn&&btn.classList.add('busy');
  try{const pdf=mom.attachPdf?await pdfBase64():null;
    const blob=new Blob([buildMime({unsent:true,pdf})],{type:'message/rfc822'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='MOM_'+(mom.date||today())+'.eml';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
    setFlash('ok','ดาวน์โหลดไฟล์ร่างอีเมลแล้ว'+(pdf?' (แนบ PDF)':'')+' ดับเบิลคลิกไฟล์ .eml เพื่อเปิดเป็นร่างใน Outlook ตรวจทาน แล้วกดส่ง')}
  catch(e){setFlash('bad','สร้างไฟล์ไม่สำเร็จ: '+esc(e.message))}finally{btn&&btn.classList.remove('busy')}}

let gisP=null,gTok=null,gExp=0;
function loadGis(){if(window.google?.accounts?.oauth2)return Promise.resolve();if(gisP)return gisP;
  gisP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=res;s.onerror=()=>{gisP=null;rej(new Error('gis'))};document.head.appendChild(s)});return gisP}
function getToken(){return new Promise((res,rej)=>{
  if(gTok&&Date.now()<gExp-60000)return res(gTok);
  if(!window.google?.accounts?.oauth2)return rej(new Error('notloaded'));
  google.accounts.oauth2.initTokenClient({client_id:settings.clientId.trim(),scope:'https://www.googleapis.com/auth/gmail.compose',
    callback:t=>{if(t.error)return rej(new Error(t.error));gTok=t.access_token;gExp=Date.now()+(+t.expires_in||3600)*1000;res(gTok)},
    error_callback:e=>rej(new Error(e?.type||'popup'))}).requestAccessToken()})}
async function gmailApi(btn){
  const err=precheck();if(err)return setFlash('bad',err);
  if(IS_FILE)return setFlash('gold','การเชื่อมต่อ Gmail ใช้ไม่ได้ในหน้านี้');
  if(!window.google?.accounts?.oauth2){setFlash('','กำลังโหลดระบบเข้าสู่ระบบ Google… กดปุ่มอีกครั้งในไม่กี่วินาที');loadGis().then(()=>setFlash('','พร้อมแล้ว กด "สร้างร่างใน Gmail" อีกครั้ง')).catch(()=>setFlash('bad','โหลดระบบ Google ไม่ได้ ตรวจการเชื่อมต่ออินเทอร์เน็ต'));return}
  let tok;
  try{tok=await getToken()}catch(e){const c=e.message;return setFlash('bad',c==='popup_closed'?'ปิดหน้าต่างเข้าสู่ระบบก่อนเสร็จ กดสร้างร่างอีกครั้ง':c==='popup_failed_to_open'?'เบราว์เซอร์บล็อกป๊อปอัป อนุญาตป๊อปอัปแล้วลองใหม่':c==='access_denied'?'ไม่ได้อนุญาตสิทธิ์ร่างอีเมล':'เข้าสู่ระบบ Google ไม่สำเร็จ ('+esc(c)+') ตรวจ Client ID และ Authorized JavaScript origins')}
  btn&&btn.classList.add('busy');setFlash('',mom.attachPdf?'กำลังสร้าง PDF และร่างใน Gmail…':'กำลังสร้างร่างใน Gmail…');
  try{const pdf=mom.attachPdf?await pdfBase64():null;
    const res=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:JSON.stringify({message:{raw:b64url(buildMime({pdf}))}})});
    const j=await res.json().catch(()=>({}));
    if(!res.ok){if(res.status===401)gTok=null;throw new Error(j?.error?.message||('HTTP '+res.status))}
    const link='https://mail.google.com/mail/u/0/#drafts'+(j?.message?.id?'?compose='+j.message.id:'');
    setFlash('ok',`สร้างร่างใน Gmail แล้ว${pdf?' พร้อมแนบ PDF':''} · <a href="${esc(link)}" target="_blank" rel="noopener">เปิดร่างใน Gmail ↗</a> ตรวจทานแล้วกดส่ง`);
  }catch(e){setFlash('bad','สร้างร่างไม่สำเร็จ: '+esc(e.message))}}
function printMom(){printArea.innerHTML=docHtml();document.body.classList.add('mom-printing');window.print()}

/* ============ events ============ */
const main=$('#main');
function grow(t){t.style.height='auto';t.style.height=Math.min(t.scrollHeight+2,640)+'px'}
main.addEventListener('keydown',listKey);
main.addEventListener('mousedown',e=>{if(e.target.closest('.lt'))e.preventDefault()});
main.addEventListener('input',e=>{
  const t=e.target;if(!mom)return;if(t.tagName==='TEXTAREA')grow(t);
  if(t.dataset.f){mom[t.dataset.f]=t.type==='checkbox'?t.checked:t.value;touch();if(view==='send'){t.type==='checkbox'?render():softSend()}return}
  if(t.dataset.s!=null&&t.dataset.k){const si=+t.dataset.s,s=mom.sections[si];if(!s)return;
    if(t.dataset.i!=null){const it=s.items[+t.dataset.i];it[t.dataset.k]=t.dataset.k==='present'?t.value==='1':t.value;
      if(t.dataset.k==='email')t.classList.toggle('badmail',!!t.value.trim()&&!EMAIL.test(t.value.trim()));
      if(t.dataset.k==='status')t.className='st-'+Math.max(0,STATUS.indexOf(t.value));
      if(t.dataset.k==='name'&&s.type==='attendees'){const dl=$('#ppl');if(dl)dl.innerHTML=people().map(p=>`<option value="${esc(p)}">`).join('')}
      if(s.type==='attendees'&&(t.dataset.k==='name'||t.dataset.k==='email'))updNewCt(si)}
    else{s[t.dataset.k]=t.value;
      if(t.dataset.k==='itemLabel'){const eg=$('#eg-'+si);if(eg)eg.innerHTML='แสดงเป็น: <b>'+esc(itemHead(s,0,'…'))+'</b>';
        main.querySelectorAll(`[data-agn="${si}"]`).forEach((n,j)=>n.textContent=t.value.trim()?t.value.trim()+' '+(j+1):(j+1)+'.')}
      if(t.dataset.k==='resLabel')main.querySelectorAll(`[data-resl="${si}"]`).forEach(n=>n.textContent=t.value||'ผลสรุป')}
    touch()}
});
let sendT;function softSend(){clearTimeout(sendT);sendT=setTimeout(()=>{const a=document.activeElement,f=a?.dataset?.f,pos=a?.selectionStart;render();if(f){const n=main.querySelector(`[data-f="${f}"]`);if(n){n.focus();try{if(pos!=null)n.setSelectionRange(pos,pos)}catch(_){}}}},500)}

root.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,m=mom,si=+b.dataset.s,ii=+b.dataset.i;
  switch(a){
    case 'new':leave(startOver);break;
    case 'list':{const ta=b.closest('.fld,.txtwrap')?.querySelector('textarea');if(ta)toggleList(ta,b.dataset.m);break}
    case 'confirm-leave':{closeLayer();const f=leaveFn;leaveFn=null;dirty=false;f&&f();break}
    case 'create':mom=newMom(b.dataset.tpl);curId=null;curVer=0;conflict=false;dirty=false;saveState='new';view='write';flash=null;render();setTimeout(()=>main.querySelector('.title-in')?.focus(),30);break;
    case 'del-mom':delMom();break;
    case 'dup':dupMom();break;
    case 'retry-save':saveNow();break;
    case 'force-save':flash=null;saveNow(true).then(ok=>{if(ok)render()});break;
    case 'reload-mom':if(curId){conflict=false;loadMom(curId)}break;
    case 'contacts':openContacts();break;
    case 'pick-ct':openPicker(si);break;
    case 'pick-add':pickAdd();break;
    case 'save-ct':saveNewContacts(si);break;
    case 'ct-add':ctAdd();break;
    case 'ct-del':ctDel(+b.dataset.id);break;
    case 'view':if(b.dataset.v==='send'&&!m.title.trim()){flash={kind:'bad',html:'กรุณาตั้งชื่อการประชุมก่อน'};view='write';render();main.querySelector('.title-in')?.focus();break}
      view=b.dataset.v;flash=null;render();window.scrollTo({top:0,behavior:'smooth'});break;
    case 'pmode':prevMode=b.dataset.p;render();break;
    case 'hide-meta':e.preventDefault();m.show[b.dataset.m]=false;touch();render();break;
    case 'show-meta':m.show[b.dataset.m]=true;touch();render();break;
    case 'add-sec':{const s=SEC[b.dataset.type](b.dataset.title);m.sections.push(s);touch();render();
      const secs=main.querySelectorAll('.sec'),last=secs[secs.length-1];last?.scrollIntoView({behavior:'smooth',block:'center'});
      if(b.dataset.title==='หัวข้อใหม่'){const ti=last?.querySelector('.sec-t');ti?.focus();ti?.select()}break}
    case 'sec-up':case 'sec-down':{const j=a==='sec-up'?si-1:si+1;if(j<0||j>=m.sections.length)break;[m.sections[si],m.sections[j]]=[m.sections[j],m.sections[si]];touch();render();break}
    case 'sec-fold':m.sections[si].collapsed=!m.sections[si].collapsed;render();break;
    case 'sec-del':{const [s]=m.sections.splice(si,1);touch();render();toast(`นำหัวข้อ "${s.title}" ออกแล้ว`,()=>{m.sections.splice(si,0,s);render()});break}
    case 'item-add':{const s=m.sections[si];s.items.push(s.type==='attendees'?att():s.type==='agenda'?agi():s.type==='signoff'?sgi():act());touch();render();
      main.querySelectorAll(`[data-s="${si}"][data-i="${s.items.length-1}"]`)[0]?.focus();break}
    case 'item-del':{const s=m.sections[si];const [it]=s.items.splice(ii,1);touch();render();toast('ลบแล้ว',()=>{s.items.splice(ii,0,it);render()});break}
    case 'sig-open':openPad(si,ii);break;
    case 'sig-clear':m.sections[si].items[ii].sig='';render();break;
    case 'sig-nodate':e.preventDefault();m.sections[si].items[ii].date='';render();break;
    case 'pad-clear':padClear();break;
    case 'pad-upload':$('#sigFile').click();break;
    case 'pad-save':padSave();break;
    case 'm-pdf':exportPdf(b);break;
    case 'm-print':printMom();break;
    case 'm-api':gmailApi(b);break;
    case 'm-web':openWeb(b.dataset.w);break;
    case 'm-eml':downloadEml(b);break;
    case 'm-copy':copyRich().then(ok=>setFlash(ok?'ok':'bad',ok?'คัดลอกพร้อมรูปแบบแล้ว วางในอีเมลได้ทันที':'คัดลอกไม่ได้ ลองเลือกข้อความในตัวอย่างแล้วกด Ctrl+C'));break;
    case 'settings':openSettings();break;
    case 'close':closeLayer();break;
    case 'save-set':{settings.senderName=$('#s-name').value.trim();settings.closing=$('#s-close').value;settings.replyNote=$('#s-reply').value;settings.greeting=$('#s-greet').checked;
      const cid=$('#s-cid').value.trim();if(cid!==settings.clientId)gTok=null;settings.clientId=cid;closeLayer();render();toast('ใช้การตั้งค่าแล้ว (จนกว่าจะปิดหน้า)');break}
  }
});

/* ============ layer: modal + toast ============ */
function closeLayer(){$('#layer').innerHTML=''}
function modal(html){$('#layer').innerHTML=`<div class="scrim" data-scrim><div class="paper modal" role="dialog" aria-modal="true">${html}</div></div>`;
  $('#layer .scrim').addEventListener('mousedown',e=>{if(e.target.hasAttribute('data-scrim'))closeLayer()})}
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#layer .scrim'))closeLayer()});
function confirmLeave(){const why=!dbOn?'ระบบไม่ได้บันทึกข้อมูล':!mom.title.trim()?'MOM นี้ยังไม่ได้บันทึก เพราะยังไม่มีชื่อการประชุม':conflict?'MOM นี้ยังไม่ได้บันทึก เพราะมีการแก้ไขจากเครื่องอื่น':'MOM นี้ยังบันทึกไม่สำเร็จ';
  modal(`<h2>ทิ้งการแก้ไขที่ยังไม่บันทึก?</h2><p class="hint" style="margin:0">${esc(why)} ถ้าออกจากหน้านี้การแก้ไขจะหาย</p>
  <div class="foot"><button class="btn" data-act="close">ยกเลิก</button><div class="grp">${mom&&mom.title.trim()?`<button class="btn" data-act="m-pdf">${I.pdf}Export PDF ก่อน</button>`:''}<button class="btn danger" data-act="confirm-leave">ทิ้งการแก้ไข</button></div></div>`)}
$('#list').addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(!b)return;const id=+b.dataset.open;if(id===curId&&mom)return;leave(()=>loadMom(id))});
let qT;$('#q').addEventListener('input',e=>{clearTimeout(qT);qT=setTimeout(()=>{listQ=e.target.value.trim();loadList()},300)});
const layer=$('#layer');
layer.addEventListener('input',e=>{const t=e.target;
  if(t.id==='pick-q'||t.id==='ct-q'){filterRows(t.closest('.modal').querySelector('.ctl'),t.value);return}
  if(t.dataset.pick&&pick){const id=+t.dataset.pick;t.checked?pick.sel.add(id):pick.sel.delete(id);const btn=$('#pick-btn');if(btn){btn.textContent=`เพิ่ม ${pick.sel.size} คน`;btn.disabled=!pick.sel.size}}});
layer.addEventListener('change',e=>{const t=e.target;if(t.dataset.ct)ctSave(+t.dataset.ct)});
layer.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('.ctnew')){e.preventDefault();ctAdd()}});
main.addEventListener('change',e=>{const t=e.target;if(t.dataset.k!=='name'||t.dataset.i==null||!mom)return;
  const s=mom.sections[+t.dataset.s];if(!s||s.type!=='attendees')return;const it=s.items[+t.dataset.i],c=contacts.find(x=>x.name===t.value.trim());
  if(c&&!it.email.trim()){it.email=c.email||'';if(!it.role.trim())it.role=c.role||'';touch();render()}});
function openSettings(){const S=settings,origin=IS_FILE?'http://localhost:8765':location.origin;
  modal(`<h2>ตั้งค่า</h2><div class="note gold">ค่าที่ตั้งจะใช้จนกว่าจะปิดหน้า ค่าเริ่มต้นถาวรตั้งใน .env ของโปรเจกต์ (VITE_MOM_SENDER_NAME, VITE_GOOGLE_CLIENT_ID)</div>
  <label class="fld"><span>ชื่อผู้ส่ง (ลงท้ายเอกสารและอีเมล)</span><input id="s-name" value="${esc(S.senderName)}" placeholder="เช่น พีรภัทร ฟองอ่อน"></label>
  <label class="fld"><span>คำลงท้าย</span><input id="s-close" value="${esc(S.closing)}"></label>
  <label class="fld"><span>ข้อความท้ายเอกสาร</span><input id="s-reply" value="${esc(S.replyNote)}"></label>
  <label class="chk"><input type="checkbox" id="s-greet"${S.greeting?' checked':''}> ใส่คำขึ้นต้นและคำลงท้ายแบบจดหมายใน PDF (ไม่ติ๊ก = ขึ้นต้นด้วยชื่อการประชุม)</label>
  <div style="border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:10px">
    <h4 style="margin:0">เชื่อมต่อ Gmail เพื่อสร้างร่างอัตโนมัติ</h4>
    <label class="fld"><span>Google OAuth Client ID</span><input id="s-cid" value="${esc(S.clientId)}" placeholder="xxxxxxxx.apps.googleusercontent.com"></label>
    <ol><li><code>console.cloud.google.com</code> → APIs &amp; Services → เปิดใช้ <b>Gmail API</b></li>
      <li>OAuth consent screen → User type <b>Internal</b></li>
      <li>Credentials → OAuth client ID → <b>Web application</b> → Authorized JavaScript origins: <code>${esc(origin)}</code></li>
      <li>คัดลอก Client ID มาวางด้านบน</li></ol>
  </div>
  <div class="foot"><button class="btn" data-act="close">ยกเลิก</button><button class="btn pri" data-act="save-set">ใช้ค่านี้</button></div>`)}
function toast(text,onUndo){clearTimeout(toastT);const old=$('.toast');old&&old.remove();const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  t.innerHTML=`<span>${esc(text)}</span>${onUndo?'<button>เลิกทำ</button>':''}`;root.appendChild(t);
  if(onUndo)t.querySelector('button').onclick=()=>{onUndo();t.remove()};toastT=setTimeout(()=>t.remove(),6000)}

/* ============ signature pad ============ */
let padT=null,SP=null;
function openPad(si,ii){padT={si,ii};const it=mom.sections[si].items[ii];
  modal(`<h2>ลงลายเซ็น${it.name?' · '+esc(it.name):''}</h2>
  <p class="hint" style="margin:0">ใช้เมาส์ ปากกา หรือนิ้ววาดในกรอบ หรืออัปโหลดรูปลายเซ็นบนพื้นขาว</p>
  <div class="padwrap"><canvas class="pad" id="pad" aria-label="พื้นที่วาดลายเซ็น"></canvas><div class="padline"></div><div class="padhint" id="padhint">เซ็นเหนือเส้นประ</div></div>
  <div id="padmsg"></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="pad-clear">ล้าง</button><button class="btn" data-act="pad-upload">อัปโหลดรูป…</button></div>
  <div class="foot"><button class="btn" data-act="close">ยกเลิก</button><button class="btn pri" data-act="pad-save">ใช้ลายเซ็นนี้</button></div>`);
  initPad()}
function initPad(){const c=$('#pad'),r=c.getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1);
  c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);const x=c.getContext('2d');
  SP={c,x,dpr,drawn:false,down:false,last:null};
  const pt=e=>{const b=c.getBoundingClientRect();return{x:(e.clientX-b.left)*dpr,y:(e.clientY-b.top)*dpr}};
  const style=()=>{x.lineCap='round';x.lineJoin='round';x.strokeStyle='#10265a';x.fillStyle='#10265a'};
  c.addEventListener('pointerdown',e=>{e.preventDefault();c.setPointerCapture(e.pointerId);SP.down=true;SP.last=pt(e);style();
    x.beginPath();x.arc(SP.last.x,SP.last.y,1.3*dpr,0,Math.PI*2);x.fill();markDrawn()});
  c.addEventListener('pointermove',e=>{if(!SP.down)return;const p=pt(e),l=SP.last;
    x.lineWidth=(e.pressure&&e.pointerType==='pen'?1.2+e.pressure*2.4:2.6)*dpr;
    x.beginPath();x.moveTo(l.x,l.y);x.quadraticCurveTo(l.x,l.y,(l.x+p.x)/2,(l.y+p.y)/2);x.lineTo(p.x,p.y);x.stroke();SP.last=p});
  const up=()=>{SP.down=false};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up)}
function markDrawn(){SP.drawn=true;const h=$('#padhint');if(h)h.hidden=true}
function padClear(){if(!SP)return;SP.x.clearRect(0,0,SP.c.width,SP.c.height);SP.drawn=false;const h=$('#padhint');if(h)h.hidden=false}
$('#sigFile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f||!SP)return;
  const img=new Image();img.onload=()=>{padClear();const {c,x}=SP,s=Math.min(c.width*.92/img.width,c.height*.86/img.height,SP.dpr*2);
    const w=img.width*s,h=img.height*s;x.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);URL.revokeObjectURL(img.src);
    const d=x.getImageData(0,0,c.width,c.height),p=d.data;for(let i=0;i<p.length;i+=4){const v=(p[i]+p[i+1]+p[i+2])/3;if(v>215)p[i+3]=0;else if(v>160)p[i+3]=Math.round(p[i+3]*(215-v)/55)}x.putImageData(d,0,0);markDrawn()};
  img.onerror=()=>{const mm=$('#padmsg');if(mm)mm.innerHTML='<div class="note bad">เปิดรูปนี้ไม่ได้ ใช้ไฟล์ PNG หรือ JPG</div>'};img.src=URL.createObjectURL(f)});
function padExport(){const {c,x}=SP,d=x.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){if(d[(y*c.width+xx)*4+3]>10){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;if(y>y1)y1=y}}
  if(x1<0)return '';const m=6*SP.dpr;x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(c.width-1,x1+m);y1=Math.min(c.height-1,y1+m);
  const w=x1-x0+1,h=y1-y0+1,sc=Math.min(1,160/h,480/w),o=document.createElement('canvas');o.width=Math.max(1,Math.round(w*sc));o.height=Math.max(1,Math.round(h*sc));
  const ox=o.getContext('2d');ox.imageSmoothingQuality='high';ox.drawImage(c,x0,y0,w,h,0,0,o.width,o.height);return o.toDataURL('image/png')}
function padSave(){if(!SP||!padT)return;const url=SP.drawn?padExport():'';
  if(!url){$('#padmsg').innerHTML='<div class="note bad">ยังไม่มีลายเซ็นในกรอบ</div>';return}
  const p=padT;closeLayer();SP=null;padT=null;mom.sections[p.si].items[p.ii].sig=url;touch();render();toast('ใส่ลายเซ็นแล้ว')}


    boot();

    return {
        hasUnsaved: () => unsaved(),
        flush: async () => (mom && dirty && mom.title.trim() && !conflict ? saveNow() : true),
        destroy() {
            clearTimeout(saveTimer);
            clearTimeout(toastT);
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('afterprint', onAfterPrint);
            printArea.remove();
            root.innerHTML = '';
            root.classList.remove('mom-app');
        },
    };
}
