"use client";
import { useState } from "react";
import { User, Key, Bell, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("sk-tinyfish-••••••••••••••••");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Settings" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace and integration configuration.</p>
          </div>

          {/* Profile */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Full name</label>
                <Input defaultValue="Scout User" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Email</label>
                <Input type="email" defaultValue="user@example.com" />
              </div>
              <Button size="sm">Save changes</Button>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" /> TinyFish Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "TinySearch", status: "connected" },
                  { name: "TinyFetch", status: "connected" },
                  { name: "TinyAgent", status: "connected" },
                  { name: "TinyBrowser", status: "connected" },
                  { name: "TinyMonitor", status: "connected" },
                ].map(({ name, status }) => (
                  <div key={name} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/40">
                    <span className="text-sm font-medium">{name}</span>
                    <Badge variant="success" className="text-[10px]">{status}</Badge>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="sm">Update</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  API keys are stored server-side and never exposed to the browser.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { label: "Monitor change alerts", desc: "Email when a monitor detects a change" },
                { label: "Mission completion", desc: "Email when a mission finishes" },
                { label: "Action approval requests", desc: "Email when a browser action needs approval" },
              ].map(({ label, desc }) => (
                <label key={label} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-border" />
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Current password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">New password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button size="sm" variant="outline">Update password</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
