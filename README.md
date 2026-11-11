# MOM Writer

ระบบเขียนบันทึกการประชุม (Minutes of Meeting) สำหรับทีม: เขียน MOM บันทึกลงฐานข้อมูลอัตโนมัติ
Export เป็น PDF สำหรับลงนาม และร่างอีเมลส่งผู้เข้าร่วมประชุม (Gmail draft หรือไฟล์ .eml)

Laravel 12 + Vue 3 + Vite บน Docker (โครงจาก laravel-vue-docker-starter) ฐานข้อมูลหลักคือ SQL Server

## ความสามารถ

- **เขียน MOM:** แม่แบบ 4 แบบ (ประชุมทีม, หัวข้อ + Next Step, แบบราชการ, หน้าว่าง)
  เพิ่ม ลบ เปลี่ยนชื่อ และสลับลำดับหัวข้อได้อิสระ ตั้งคำนำหน้าแต่ละข้อเองได้ (วาระที่, หัวข้อที่ …)
- **รายการ bullet / ลำดับเลข:** ปุ่ม **• รายการ** / **1. ลำดับ** หรือพิมพ์ `• ` `- ` `1. ` นำหน้าบรรทัด
  Enter ขึ้นข้อใหม่, Enter ที่ข้อว่างเพื่อจบรายการ, Tab / Shift+Tab เพื่อย่อหรือถอยระดับ
- **บันทึกอัตโนมัติ** ลงฐานข้อมูล ทุกคนที่ login เห็นทะเบียนการประชุมเดียวกัน
  ถ้ามีคนแก้ MOM เดียวกันพร้อมกัน ระบบจะเตือนแทนการเขียนทับ ลบแล้วกู้คืนได้
- **ลงนาม:** ช่องชื่อ ตำแหน่ง วันที่ และลายเซ็น (วาดหรืออัปโหลดรูป หรือเว้นไว้เซ็นด้วยปากกา)
- **Export PDF** ขนาด A4 หัวกระดาษสีกรมท่า–ทอง ตัดหน้าไม่ให้ขาดกลางบรรทัดหรือกล่อง
  และย่อตัวอักษรเล็กน้อยเมื่อหน้าสุดท้ายจะมีแค่ไม่กี่บรรทัด
- **ร่างอีเมล** ถึงผู้เข้าร่วมประชุม แนบ PDF ได้: สร้างเป็นร่างใน Gmail หรือดาวน์โหลดไฟล์ .eml
- **สมุดรายชื่อ** เก็บชื่อ อีเมล ตำแหน่ง ใช้เลือกผู้เข้าร่วมได้เร็ว

## เริ่มใช้งานบนเครื่องตัวเอง

ต้องมี Docker Desktop เปิดอยู่

```powershell
# Windows
.\scripts\start.ps1 -Project mom-writer
```

```bash
# macOS / Linux
./scripts/start.sh mom-writer
```

สคริปต์จะสร้าง `.env` เลือก port ว่าง build และ start ให้ จากนั้นตั้งฐานข้อมูลและผู้ใช้:

**ไม่มี SQL Server ในเครื่อง** ใช้ SQLite แทน แก้ `.env`:

```
DB_CONNECTION=sqlite
DB_DATABASE=/var/www/html/database/database.sqlite
BACKOFFICE_AUTH_CONNECTION=sqlite
```

แล้วรัน:

```bash
docker compose up -d                                   # โหลด .env ใหม่
docker compose exec app touch database/database.sqlite   # สร้างไฟล์ฐานข้อมูลว่าง
docker compose exec app php artisan mom:create-tables  # สร้างตาราง moms, mom_contacts
docker compose exec app php artisan mom:user EMP001 --name="ชื่อ นามสกุล"   # ระบบจะถามรหัสผ่าน
```

เปิด URL ที่สคริปต์พิมพ์ให้ (เช่น `http://localhost:8080/mom-writer/`) แล้ว login ด้วย EMP001

## ฐานข้อมูล (SQL Server)

แอปนี้ **ไม่ใช้ Laravel migration** และไม่ต้องรัน `php artisan migrate` ทั้งตอนติดตั้งและตอน deploy

1. ให้ DBA (หรือผู้ดูแลฐานข้อมูล) รัน `database/schema.mssql.sql` ครั้งเดียวบนฐานข้อมูลของแอป
   ผ่าน SQL Server Management Studio หรือ `sqlcmd` สคริปต์จะสร้างเฉพาะตารางที่ยังไม่มี
   ไม่ลบหรือแก้ตารางที่มีอยู่แล้ว รันซ้ำได้ (ถ้ายังไม่มีฐานข้อมูล ในไฟล์มีคำสั่งสร้างให้ด้วย collation ภาษาไทย)
2. ใส่ค่าใน `.env`: `DB_CONNECTION=sqlsrv`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   (`DB_TRUST_SERVER_CERTIFICATE=true` ถ้าเซิร์ฟเวอร์ใช้ certificate ที่ออกเอง)
3. แนะนำให้แอปใช้ login ที่มีแค่สิทธิ์อ่าน/เขียนข้อมูล (`db_datareader` + `db_datawriter`)
   ไม่มีสิทธิ์สร้างหรือลบตาราง ตัวอย่างอยู่ท้ายไฟล์ SQL

**กันฐานข้อมูลหาย:**

- คำสั่ง artisan ที่ลบตารางหรือข้อมูล (`db:wipe`, `migrate:fresh`, `migrate:refresh`, `migrate:reset`,
  `migrate:rollback`) ถูกปิดไว้ในทุก environment รันแล้วจะไม่ทำอะไร
- `php artisan test` รันได้เฉพาะกับ SQLite ในหน่วยความจำ ถ้า config ชี้ไปฐานจริง
  (เช่นเคยรัน `config:cache` ไว้) test จะหยุดทันทีก่อนแตะฐานข้อมูล
  กรณีนี้คือสาเหตุที่พบบ่อยที่ทำให้ฐานจริงถูกล้าง: test ที่ใช้ `RefreshDatabase` จะรัน `migrate:fresh`
  บนฐานที่ config ชี้อยู่

ตารางของ MOM Writer:

| ตาราง | เก็บอะไร |
|---|---|
| `moms` | 1 แถวต่อ 1 การประชุม เนื้อหาทั้งหมดอยู่ในคอลัมน์ `data` (JSON) ส่วน `title`, `meeting_date`, `location`, `recorder`, `open_actions`, `search_text` เป็นสำเนาไว้แสดงรายการและค้นหา มี `version` กันการเขียนทับ, `created_by`/`updated_by` (รหัสพนักงาน) และ `deleted_at` สำหรับลบแบบกู้คืนได้ |
| `mom_contacts` | สมุดรายชื่อ: ชื่อ อีเมล (ไม่ซ้ำ) ตำแหน่ง |

## การ login

login ด้วยรหัสพนักงานจากตาราง `data_log_userv2` ในฐาน UserData ของบริษัท (ค่า `USERDATA_*` ใน `.env`)
token เป็น JWT ที่ sign ด้วย `APP_KEY` ไม่ต้องมีตารางเก็บ token

ถ้าเข้าถึงฐาน UserData ไม่ได้ (เครื่อง local, เดโม) ให้ตั้ง `BACKOFFICE_AUTH_CONNECTION` เป็น connection
ของแอปเอง (`sqlite` หรือ `sqlsrv`) แล้วจัดการผู้ใช้ด้วยคำสั่ง:

```bash
php artisan mom:user EMP001 --name="ชื่อ" --email=a@example.com   # เพิ่ม / เปลี่ยนรหัสผ่าน (ถามรหัสผ่าน)
php artisan mom:user EMP001 --password=newpass                     # เปลี่ยนรหัสผ่าน
php artisan mom:user EMP001 --disable                              # ปิดการใช้งาน
```

คำสั่งนี้จะไม่ยอมเขียนลงฐาน UserData ของบริษัท

## ตัวแปรใน `.env` ของ MOM Writer (ไม่บังคับ)

| ตัวแปร | ความหมาย |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID (Web application) สำหรับปุ่ม "สร้างร่างใน Gmail" ต้องเพิ่มโดเมนของเว็บใน Authorized JavaScript origins ถ้าว่าง ปุ่มนี้จะซ่อน (ยังดาวน์โหลด .eml ได้) |
| `VITE_MOM_SENDER_NAME` | ชื่อลงท้ายเอกสารและอีเมล ว่าง = ชื่อผู้ใช้ที่ login |
| `VITE_MOM_BRAND` | ตัวอักษรในโลโก้หัวกระดาษ PDF (ค่าเริ่มต้น `TG`) ว่าง = ไม่แสดง |

ตัวแปร `VITE_*` ถูกฝังตอน build ต้อง build asset ใหม่หลังแก้

## API

ทุกเส้นอยู่ใต้ `/<project>/api/backoffice/` และต้องมี `Authorization: Bearer <access token>`

| Method | Path | |
|---|---|---|
| GET | `moms?q=&limit=&offset=` | รายการ (ประชุมล่าสุดก่อน) ค้นจากชื่อ ผู้เข้าร่วม หัวข้อ งาน |
| GET | `moms/{id}` | MOM หนึ่งรายการพร้อมเนื้อหา |
| POST | `moms` | สร้าง `{data}` |
| PUT | `moms/{id}` | แก้ไข `{data, version}` ได้ 409 ถ้า version เก่า (`force: true` เพื่อเขียนทับ) |
| DELETE | `moms/{id}` | ลบ (soft delete) |
| POST | `moms/{id}/restore` | กู้คืน |
| GET / POST | `mom-contacts` | ดู / เพิ่ม (อีเมลซ้ำ = อัปเดตรายชื่อเดิม, ส่ง `{items:[…]}` เพื่อเพิ่มหลายรายการ) |
| PUT / DELETE | `mom-contacts/{id}` | แก้ / ลบ |

## โค้ดของ MOM Writer อยู่ที่ไหน

| ไฟล์ | หน้าที่ |
|---|---|
| `resources/js/backoffice/mom/momWriter.js` | หน้าเขียน MOM ทั้งหมด (editor, PDF, อีเมล, สมุดรายชื่อ) |
| `resources/js/backoffice/mom/assets/` | ฟอนต์ Sarabun / Anuphan (OFL) และ html2pdf.js (MIT) |
| `resources/js/backoffice/pages/MomWriter.vue` | หน้า Vue ที่ mount editor และเตือนก่อนออกถ้ายังบันทึกไม่ได้ |
| `app/Http/Controllers/Api/Mom/` | API ของ MOM และสมุดรายชื่อ |
| `app/Services/MomDocument.php` | ตรวจเนื้อหาและสร้างคอลัมน์สำหรับค้นหา |
| `app/Console/Commands/MomLocalUser.php` | คำสั่ง `mom:user` |
| `database/schema.mssql.sql` | สร้างตาราง `moms`, `mom_contacts` บน SQL Server |
| `app/Support/MomSchema.php` | สร้างตารางเดียวกันสำหรับ SQLite (`php artisan mom:create-tables`) |
| `tests/Feature/Mom*Test.php` | test ของ API, คำสั่ง `mom:user` / `mom:create-tables` และการกันคำสั่งลบตาราง (`make test`) |

---

# โครงพื้นฐาน (จาก laravel-vue-docker-starter)

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
make artisan c="mom:create-tables"
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
