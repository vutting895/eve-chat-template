# VOOM AI Chat — NOVA

แอปแชท AI แยกสำหรับ VOOM_SYSTEM ใช้เป็นพื้นที่ทำงานสำหรับการสนทนา วิเคราะห์ และเชื่อมต่อบริการผ่าน API ที่ผ่านการยืนยันสิทธิ์ โดยแยกวงจรพัฒนาออกจากโปรเจกต์หลัก NOVA

> **สถานะความปลอดภัย:** Read-only by default. โปรเจกต์นี้ไม่ได้รับอนุญาตให้ส่ง แก้ไข หรือปิดคำสั่งซื้อขาย และห้ามเปิด Live Trading ผ่านแชท การเพิ่มการเชื่อมต่อ MT5 หรือ API ใหม่ต้องผ่านการออกแบบสิทธิ์และตรวจสอบความปลอดภัยแยกต่างหาก

## ขอบเขตของโปรเจกต์

- แอปแชท Next.js ที่แยกจากเว็บแดชบอร์ดหลัก
- Agent instructions สำหรับผู้ช่วยภาษาไทย และชุดเครื่องมือ/การเชื่อมต่อที่กำหนดไว้
- ประวัติการสนทนาและสถานะ session ตามสถาปัตยกรรมปัจจุบัน
- UI สำหรับข้อความ การแสดงผล Markdown, tools, sidebar และการเข้าสู่ระบบ
- เอกสารสำหรับติดตั้ง ดูแลรักษา และทำความเข้าใจโครงสร้าง

โปรเจกต์นี้ยังไม่ถือว่าเชื่อม MT5 หรือส่งคำสั่งซื้อขายได้ เพียงเพราะมีหน้าจอแชทหรือแสดงสถานะการเชื่อมต่อ

## เทคโนโลยี

- Next.js App Router, React และ TypeScript
- eve สำหรับ agent runtime และ stream handling
- Better Auth สำหรับการยืนยันตัวตน
- Drizzle ORM และ Neon Postgres สำหรับ persistence
- Upstash Redis สำหรับ rate limiting
- Tailwind CSS และ shadcn/ui สำหรับ UI
- Vercel สำหรับการ Deploy; Vercel Connect integrations เป็นตัวเลือกตามการตั้งค่า

## แผนผังไฟล์

ดูรายละเอียดและกติกาการวางไฟล์ที่ [docs/project-structure.md](docs/project-structure.md)

| ตำแหน่ง | หน้าที่ |
| --- | --- |
| `app/` | Routes, pages, server actions, API handlers และส่วนประกอบเฉพาะแอป |
| `agent/` | Agent definition, instructions, channels, connections และ tools |
| `components/` | UI components ที่ใช้ร่วมกัน โดยเฉพาะ chat, auth และ UI primitives |
| `lib/` | Logic ร่วมของ authentication, database, chat และ utilities |
| `lib/db/` | Drizzle schema และ migrations |
| `docs/` | คู่มือติดตั้ง สถาปัตยกรรม และแนวทางดูแลรักษา |
| `scripts/` | สคริปต์ setup/maintenance ที่ใช้โดยโปรเจกต์ |
| `evals/` | ไฟล์สำหรับประเมินพฤติกรรม agent ตามที่ตั้งค่าไว้ |

## เริ่มต้นพัฒนา

ต้องมี Node.js 24+ และ pnpm

```bash
pnpm install
pnpm dev
```

สำหรับระบบที่ต้องใช้ฐานข้อมูลและ authentication ให้ทำตาม [คู่มือติดตั้งและ Deploy](docs/setup-and-deploy.md) ก่อน อย่านำค่า secret หรือไฟล์ `.env.local` ขึ้น GitHub

คำสั่งตรวจสอบที่กำหนดไว้ใน `package.json`:

```bash
pnpm typecheck
pnpm build
```

คำสั่งเหล่านี้ต้องรันใน environment ที่ติดตั้ง dependencies และตั้งค่า environment variables ที่จำเป็นแล้ว ผลลัพธ์จากไฟล์ config เพียงอย่างเดียวไม่ถือเป็นหลักฐานว่า Build ผ่าน

## เอกสารหลัก

- [แผนผังและกติกาการจัดไฟล์](docs/project-structure.md)
- [การทำงานภายในของแชท](docs/how-the-chatbot-works.md)
- [การติดตั้งและ Deploy](docs/setup-and-deploy.md)

## กติกาการพัฒนาอย่างปลอดภัย

1. พัฒนาและตรวจสอบใน branch แยกก่อนเปิด Pull Request; หลีกเลี่ยงการแก้ `main` โดยตรง
2. ไม่ย้ายไฟล์หรือเปลี่ยน import paths โดยไม่มีการตรวจ TypeScript และ Build
3. เก็บ secrets ใน Vercel Environment Variables หรือ secret store ที่อนุมัติ ห้ามใส่ค่าจริงใน source, logs หรือ chat
4. ใช้ข้อมูลทดสอบ/โหมด paper และ read-only ระหว่างพัฒนา ห้ามเพิ่มความสามารถส่งคำสั่งซื้อขายโดยอาศัยเพียง agent prompt
5. ระบุให้ชัดว่าอะไรตรวจแล้ว อะไรเปลี่ยน และอะไรยังไม่ได้ยืนยัน รวมถึง Build/Preview status
