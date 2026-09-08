import { useState } from "react"
import {
  Accordion,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Dialog,
  Field,
  Input,
  Link,
  Select,
  Table,
  Tabs,
  Tag,
  Toast,
} from "@coseeing/ui"

// Stands in for this app's router. A Next app would use next/link and
// usePathname(); the library neither knows nor cares which.
const pathname = "/settings"

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container className="grid gap-24 py-48">
      {/* Brand tokens and typography classes are available to app markup too,
          because index.css imported the theme into this app's Tailwind pass. */}
      <h1 className="typography-headline2 m-0 text-teal-PRIMARY">
        @coseeing/ui consumed from an app
      </h1>

      <Card title="Actions" description="Button renders an <a> when given href." padded>
        <div className="flex flex-wrap items-center gap-12">
          <Button onClick={() => setDialogOpen(true)}>開啟對話框</Button>
          <Button variant="small" theme="greenStroke" href="/settings">
            Settings
          </Button>
          <Button variant="small" theme="danger" isLoading>
            Signing out
          </Button>
          <Badge>帳號身分</Badge>
          <Tag>新手友善</Tag>
        </div>
      </Card>

      <Card title="Form primitives" padded>
        <div className="grid max-w-[40rem] gap-16">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Plan" htmlFor="plan" error="請選擇一個方案">
            <Select id="plan" invalid defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Field>
          <Checkbox id="tos" label="我同意服務條款" />
        </div>
      </Card>

      <Card title="Data & disclosure" padded>
        <div className="grid gap-24">
          <Table
            columns={[
              { key: "date", label: "日期", width: "12rem" },
              { key: "event", label: "活動" },
            ]}
            rows={[
              { date: "2026-09-20", event: "無障礙網頁工作坊" },
              { date: "2026-10-04", event: "志工培訓" },
            ]}
          />
          <Tabs
            label="Example tabs"
            items={[
              { label: "說明", content: <p className="typography-body1">Tab one.</p> },
              { label: "常見問題", content: <p className="typography-body1">Tab two.</p> },
            ]}
          />
          <Accordion
            items={[{ question: "如何捐款？", answer: "透過線上表單即可完成。" }]}
          />
        </div>
      </Card>

      <Toast tone="success" title="已儲存" message="設定已更新。" />

      {/* The app owns the route comparison — Link just renders what it's told. */}
      <nav className="flex gap-16">
        {[
          { href: "/settings", label: "Settings" },
          { href: "/welcome", label: "Welcome" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            current={item.href === pathname}
            className="typography-strong1"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="確認登出"
        description="登出後需要重新輸入密碼。"
        closeLabel="關閉"
        actions={
          <>
            <Button variant="small" theme="greenStroke" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button variant="small" theme="danger" onClick={() => setDialogOpen(false)}>
              登出
            </Button>
          </>
        }
      />
    </Container>
  )
}
