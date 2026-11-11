# Laravel 12 + Vue 3 + Vite — Docker starter

โครง (skeleton) แบบ "ก๊อปแล้วรันได้เลย" สำหรับรัน Laravel 12 + Vue 3 (Vite)
ใต้ path `/<project>/` ด้วย Docker — clone มาแล้วรันคำสั่งเดียวใช้ได้ ทั้งบน
Windows / macOS / Linux พร้อม CI/CD ผ่าน self-hosted runner

## เริ่มโปรเจกต์ใหม่จาก template นี้

1. กดปุ่ม **"Use this template"** บน GitHub → สร้าง repo ใหม่ (หรือก๊อปไฟล์พวกนี้ทับโปรเจกต์เดิม)
2. รันคำสั่งเดียว — ใส่ชื่อโปรเจกต์ตอนรันได้เลย (กลายเป็น path `/<project>/`):

```powershell
# Windows
.\scripts\start.ps1 -Project your-project
```

```bash
# macOS / Linux
./scripts/start.sh your-project
```

ถ้าไม่ใส่ชื่อ สคริปต์จะ **ถามให้ตอนรันครั้งแรก** (`Project name / URL sub-path [app]:`)

เปิด `http://localhost:<port>/<project>/` (สคริปต์จะพิมพ์ URL จริงให้)

สคริปต์จะ: เช็ค Docker → สร้าง `.env` → ตั้ง `APP_PROJECT` → **เลือก port ว่างให้อัตโนมัติ**
ถ้า `NGINX_PORT`/`VITE_PORT` ชน → build + start ให้ครบ ส่วน `APP_KEY` generate ให้เองตอน boot ครั้งแรก

## มีอะไรอยู่ในนี้บ้าง

| ไฟล์ | หน้าที่ |
|------|---------|
| `Dockerfile` | multi-stage: build asset Vite (base `/<project>/` ถูกต้อง) + PHP 8.2-fpm พร้อม driver MSSQL/PgSQL/MySQL/SQLite |
| `docker-compose.yml` | dev stack: nginx + app + node (Vite HMR) |
| `docker-compose.prod.yml` | prod stack: nginx + app (bind localhost อยู่หลัง front proxy) |
| `docker/nginx/default.conf.template` | config nginx; `${APP_PROJECT}` เติมด้วย envsubst |
| `docker/php/entrypoint.sh` | self-healing: ล้าง CRLF ใน `.env`, generate `APP_KEY` อัตโนมัติ |
| `scripts/start.ps1` / `start.sh` | bootstrap คำสั่งเดียว + auto เลือก port ว่าง |
| `Makefile` | `make up/down/logs/shell/test/…` (Linux/macOS/WSL) |
| `.github/workflows/ci.yml` | build + test + push image ขึ้น GHCR (self-hosted runner) |
| `.github/workflows/deploy.yml` | deploy แบบ manual ไปยังโฟลเดอร์บน server |
| `.gitattributes` | บังคับ LF กัน script พังจาก CRLF ของ Windows |

## คำสั่ง dev (Makefile)

```
make start   # setup + start คำสั่งเดียว
make up      # build & start        make down   # stop
make logs    # ดู log ของ app        make shell  # เข้า bash ใน container app
make test    # รัน test              make fresh  # ล้าง volume แล้ว build ใหม่
make artisan c="migrate"
make composer c="require foo/bar"
```

## หลังแก้ dependency

`vendor`, `node_modules`, `public/build` อยู่ใน Docker volume (เร็วบน Windows) โดย seed
มาจากอิมเมจ — Docker จะ seed ให้เฉพาะตอน volume ว่าง ดังนั้นหลังแก้
`composer.json` / `package.json`:

```bash
docker compose down -v && docker compose up -d --build   # หรือ: make fresh
```

## CI/CD (self-hosted runner)

**CI** (`ci.yml`) รันทุกครั้งที่ push/PR เข้า `main`: build อิมเมจ → รัน test ในอิมเมจ →
(เฉพาะ `main`) push ขึ้น `ghcr.io/<owner>/<repo>`

**Deploy** (`deploy.yml`) เป็น **manual** (Actions → Deploy → Run workflow) —
ตั้ง `DEPLOY_PATH` ใน `deploy.yml` ก่อน แล้วมันจะ sync โค้ดไปโฟลเดอร์นั้น, สร้าง `.env`
+ `APP_KEY`, แล้วรัน prod stack

### ตั้งครั้งเดียว: ลงทะเบียน self-hosted runner บน server

GitHub repo → Settings → Actions → Runners → New self-hosted runner → Linux
ติดตั้งในโฟลเดอร์แยกของมันเอง แล้ว:

```bash
sudo ./svc.sh install && sudo ./svc.sh start   # รันเป็น service
sudo usermod -aG docker $USER                  # ให้ใช้ Docker ได้
sudo systemctl restart actions.runner.*.service
```

### เสิร์ฟใต้ domain แบบ sub-path (front nginx)

คอนเทนเนอร์ prod bind `127.0.0.1:<NGINX_PORT>` ให้ nginx ของ host ชี้เข้ามา:

```nginx
location ^~ /<project>/ {
    proxy_pass http://127.0.0.1:<NGINX_PORT>;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    client_max_body_size 100M;
}
```

`^~` สำคัญ: ทำให้ prefix นี้ชนะ regex `location` ตัวอื่น จากนั้นตั้ง
`APP_URL=https://your-domain/<project>` ใน `.env` บน server

## ⚠️ จุดที่ต้อง wire เพิ่ม: `vite.config.js`

skeleton นี้เป็นชั้น **infra** ไม่ได้ใส่ `vite.config.js` มาให้ (ขึ้นกับ entry point ของแต่ละแอป)
แต่หัวใจของ sub-path คือ `vite.config.js` ต้องอ่าน `APP_PROJECT` แล้วตั้ง base ให้ถูก:

```js
const project = env.APP_PROJECT || '';
const base = `/${project}/`;
// server: { port: env.VITE_PORT, strictPort: true, hmr: { clientPort: <VITE_PORT> } }
// base: isDev ? '/' : `${base}build/`
// define: VITE_ROUTER_BASE / VITE_API_BASE / VITE_ASSET_BASE จาก project
```

ถ้าไม่ตั้งตรงนี้ SPA จะพังใต้ sub-path (เช่น URL เพี้ยนเป็น `/backoffice/<project>/backoffice/...`)

## หมายเหตุ

- ห้าม commit `.env` (มีความลับจริง) — เก็บเป็น placeholder ใน `.env.example`

### ขนาดอิมเมจ (~835MB) และวิธีลด

อิมเมจ default ~835MB (Debian + PHP 8.2 + driver DB ครบ + MSSQL) Dockerfile purge
`-dev` libs หลัง compile ให้แล้ว ลดต่อได้ตามการใช้งานจริง:

- **ตัด driver ที่ไม่ใช้** — ใน `Dockerfile` ลบออกจาก `docker-php-ext-install`
  (`pdo_pgsql pgsql pdo_mysql pdo_sqlite`) เท่าที่ไม่ได้ใช้
- **ไม่ใช้ MSSQL?** ลบ `msodbcsql18`, `pecl install sqlsrv...`, `docker-php-ext-enable sqlsrv...`,
  `unixodbc-dev`, `libsqlite3-dev` (ถ้าไม่ใช้ sqlite) — ประหยัดได้มากสุด (~100MB+)
- **เล็กสุด** — เปลี่ยน base เป็น `php:8.2-fpm-alpine` ได้ (~350–450MB) แต่ MSSQL บน Alpine
  ตั้งค่ายากกว่า (ต้องลง msodbcsql18 ผ่าน repo ของ Microsoft สำหรับ Alpine) — เลือกตาม trade-off
