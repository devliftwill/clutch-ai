"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    marketingEmails: false,
    darkMode: false,
  });

  const handleSave = async () => {
    setLoading(true);
    // Here you would typically save the settings to your backend
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-semibold text-gray-900">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notifications" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-gray-900">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive email notifications about your account</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-gray-900">Job Alerts</Label>
                  <p className="text-sm text-gray-500">Get notified about new job matches</p>
                </div>
                <Switch
                  checked={settings.jobAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, jobAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-gray-900">Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Receive updates about new features and promotions</p>
                </div>
                <Switch
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 mt-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-gray-900">Dark Mode</Label>
                <p className="text-sm text-gray-500">Toggle dark mode theme</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#87B440] hover:bg-[#759C37]"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}