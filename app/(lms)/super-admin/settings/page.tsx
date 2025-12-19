import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Mail, CreditCard, Database, Shield, Bell, Wrench } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7" />
          System Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Configure system-wide settings and preferences</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Email/SMS Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">Configure email and SMS gateway settings</p>
            <Button size="sm" variant="outline" className="gap-2">
              <Wrench className="w-3 h-3" />
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Payment Gateway Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">Manage payment gateway integration</p>
            <Button size="sm" variant="outline" className="gap-2">
              <Wrench className="w-3 h-3" />
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Backup Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-muted/50 p-3 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Last backup: <span className="font-medium text-foreground">2024-01-15 02:00</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Database className="w-3 h-3" />
                Backup Now
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Wrench className="w-3 h-3" />
                Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">Manage security and access control</p>
            <Button size="sm" variant="outline" className="gap-2">
              <Wrench className="w-3 h-3" />
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Notification Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">Manage email and SMS templates</p>
            <Button size="sm" variant="outline" className="gap-2">
              <Wrench className="w-3 h-3" />
              Manage Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
