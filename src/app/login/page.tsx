"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const formSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const passwordValidation = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordValidation.test(data.password)) {
      toast.error(
        "Kata sandi harus terdiri dari minimal 8 karakter, dimulai dengan huruf kapital, dan mengandung angka."
      );
      return;
    }

    const signInResponse = await signIn("credentials", {
      username: data.username,
      password: data.password,
      redirect: false,
    });
    if (signInResponse?.ok) {
      toast.success("Login berhasil!");
      const session = await getSession();
      if (session?.user.role === "USER_SUPERADMIN") {
        router.replace("/super-admin");
      } else if (session?.user.role === "USER_KWARCAB") {
        router.replace("/kwartir-cabang/dashboard");
      } else if (session?.user.role === "USER_KWARAN") {
        router.replace("/kwartir-ranting/dashboard");
      } else {
        router.replace("/gugus-depan/dashboard");
      }
    } else {
      toast.error("Login gagal. Silakan periksa Username dan Password Anda.");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url("/Wallpaper.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-sm">
        <Card className="bg-amber-950">
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <Image
                className="dark:invert"
                src="/KwarcabMataram.png"
                alt="Logo"
                width={200}
                height={200}
              />
            </div>
            <hr className="border-t border-white mb-4" />
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-white">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    {...form.register("username")}
                    required
                    className="bg-white text-black placeholder:text-gray-500 focus-visible:ring-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    {...form.register("password")}
                    required
                    className="bg-white text-black placeholder:text-gray-500 focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
