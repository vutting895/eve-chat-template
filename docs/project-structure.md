# Project Structure and File Placement

เอกสารนี้เป็นแผนที่การวางไฟล์สำหรับ VOOM AI Chat แยกจาก source of truth ของ NOVA โดยอ้างอิงโครงสร้างที่มีอยู่ใน repository ปัจจุบัน เป้าหมายคือทำให้ค้นหาและบำรุงรักษาโค้ดได้ง่ายขึ้น โดยไม่ย้ายไฟล์ที่อาจทำให้ import paths หรือ deployment configuration เปลี่ยนโดยไม่ตั้งใจ

## แผนผังระดับบน

```text
/
├── app/
│   ├── (chat)/             # หน้าหลักและเส้นทางบทสนทนา
│   ├── _components/        # shell และ components ที่ใช้เฉพาะ app routes
│   ├── actions/            # server actions
│   └── api/                # API route handlers
├── agent/
│   ├── agent.ts            # agent definition/model
│   ├── instructions.md     # behavior, safety และ communication rules
│   ├── channels/           # ช่องทาง/transport ของ agent
│   ├── connections/        # integrations ที่เลือกใช้
│   └── tools/              # tools สำหรับ agent
├── components/
│   ├── auth/               # UI สำหรับ sign-in/auth
│   ├── chat/               # composer, messages, sidebar และ chat UI
│   └── ui/                 # shared UI primitives
├── lib/
│   ├── chat/               # chat types/state helpers
│   └── db/
│       ├── schema.ts       # Drizzle schema
│       └── migrations/     # database migrations
├── docs/
│   ├── project-structure.md
│   ├── how-the-chatbot-works.md
│   └── setup-and-deploy.md
├── scripts/                # setup และ maintenance scripts
├── evals/                  # agent evaluations
├── package.json            # scripts/dependencies
├── pnpm-lock.yaml          # dependency lockfile — สร้าง/แก้ผ่าน pnpm
├── next.config.ts          # Next.js + eve integration
├── drizzle.config.ts       # schema/migration configuration
└── tsconfig.json           # TypeScript aliases/compiler settings
```

รายการในแผนผังนี้เป็นหมวดหมู่หลัก ไม่ใช่รายการไฟล์ทั้งหมดใน repository

## กติกาวางไฟล์

- **Route และ HTTP boundary:** วางหน้า, server actions และ API handlers ไว้ใต้ `app/` ตาม convention ของ Next.js
- **Agent behavior:** เก็บคำสั่งและนิยาม agent ไว้ใน `agent/`; อย่าใส่ secrets หรือ logic สำหรับส่งคำสั่งซื้อขายที่ยังไม่ได้รับอนุมัติ
- **Reusable UI:** component ที่ใช้ได้หลายหน้าวางใน `components/`; component ที่ผูกกับ route/shell เฉพาะวางใน `app/_components/`
- **Shared business logic:** helpers และ types ที่ใช้ร่วมกันวางใน `lib/`; อย่าทำให้ component ฝั่ง browser import server-only modules
- **Database:** schema อยู่ที่ `lib/db/schema.ts`; migrations อยู่ที่ `lib/db/migrations/`; ห้ามแก้ฐานข้อมูล production โดยอัตโนมัติเพียงเพราะปรับ UI
- **Documentation:** คู่มือและบันทึกการตัดสินใจอยู่ใน `docs/`; README เป็น entry point สรุปภาพรวมและลิงก์ไปยังเอกสารละเอียด
- **Dependencies:** แก้ dependencies ผ่าน package manager และอัปเดต `pnpm-lock.yaml` ตามกัน ห้ามแก้ lockfile ด้วยมือหากไม่จำเป็น
- **Secrets/environment:** ห้าม commit `.env.local`, access tokens, account credentials หรือค่าจริงของ secrets

## กติกาเปลี่ยนโครงสร้าง

1. สร้าง branch แยกจาก `main`
2. ทำการย้ายทีละกลุ่ม และอัปเดต imports/configs ใน commit เดียวกัน
3. ตรวจ `pnpm typecheck` และ `pnpm build` ใน environment ที่มี dependencies/config ครบ
4. เปิด Preview แยกและทดสอบเส้นทางหลัก/auth/error handling ก่อนรวม PR
5. ห้ามแก้หรือย้าย source files ของ NOVA หลักจาก repository แชทนี้; ต้องนำการเชื่อมต่อผ่าน API contract ที่ระบุชัดเจนเท่านั้น

## ขอบเขตการทำงานของระบบ

โครงการนี้ใช้ read-only เป็นค่าเริ่มต้น ไม่ส่ง แก้ไข หรือปิดคำสั่งซื้อขาย และไม่เปิด Live Trading ผ่านแชท เอกสารนี้ไม่ได้แทนการบังคับใช้สิทธิ์ทางเทคนิคที่ API/server หากเพิ่มการเชื่อมต่อ MT5 ในอนาคต ต้องตรวจ authentication, tenant isolation, server-side authorization และการปิดกั้น execution ที่ backend แยกต่างหาก
