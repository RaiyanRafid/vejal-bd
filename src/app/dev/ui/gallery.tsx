"use client";

import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BarList } from "@/components/charts/BarList";
import { Sparkline } from "@/components/charts/Sparkline";
import { m, fadeUp } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyToaster } from "@/components/ui/lazy-toaster";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const InteractiveChart = dynamic(() => import("@/components/charts/InteractiveChart"), {
  loading: () => <Skeleton className="h-56 w-full" />,
});

const data = [
  { label: "জান", a: 12 },
  { label: "ফেব", a: 19 },
  { label: "মার্চ", a: 8 },
  { label: "এপ্রি", a: 24 },
];

function Section() {
  const form = useForm({ defaultValues: { amount: "" } });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button>রিপোর্ট করুন</Button>
        <Button variant="outline">আউটলাইন</Button>
        <Button variant="secondary">সেকেন্ডারি</Button>
        <Button variant="ghost">ঘোস্ট</Button>
        <Button variant="outline" onClick={() => toast("সংরক্ষিত হয়েছে")}>
          টোস্ট
        </Button>
      </div>
      <Badge variant="secondary">অযাচাইকৃত অভিযোগ</Badge>
      <m.div {...fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>কার্ড</CardTitle>
            <CardDescription>একটি রিপোর্ট একটি অভিযোগ মাত্র, দোষ প্রমাণ নয়।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পরিমাণ (৳)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
            <Textarea placeholder="কারো ব্যক্তিগত নাম লিখবেন না" />
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="বিভাগ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dhaka">ঢাকা</SelectItem>
                <SelectItem value="sylhet">সিলেট</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup type="single" variant="outline" defaultValue="a">
              <ToggleGroupItem value="a">ঘুষ</ToggleGroupItem>
              <ToggleGroupItem value="b">ভেজাল</ToggleGroupItem>
            </ToggleGroup>
            <Progress value={66} />
          </CardContent>
        </Card>
      </m.div>
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">এক</TabsTrigger>
          <TabsTrigger value="two">দুই</TabsTrigger>
        </TabsList>
        <TabsContent value="one">প্রথম ট্যাব</TabsContent>
        <TabsContent value="two">দ্বিতীয় ট্যাব</TabsContent>
      </Tabs>
      <div className="flex gap-2">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">ড্রয়ার</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>জেলা বাছুন</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">শিট</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>শিট</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
      <Skeleton className="h-6 w-40" />
      <BarList rows={[{ label: "ঢাকা", value: 100 }, { label: "সিলেট", value: 50 }, { label: "বান্দরবান", value: null }]} />
      <Sparkline points={[1, 4, 2, 6, 5]} />
      <InteractiveChart type="bar" data={data} config={{ a: { label: "রিপোর্ট", color: "var(--chart-1)" } }} />
    </div>
  );
}

export function Gallery() {
  return (
    <div className="space-y-10">
      <LazyToaster />
      <Section />
      <div className="dark -mx-2 rounded-xl bg-background p-2 text-foreground">
        <Section />
      </div>
    </div>
  );
}
