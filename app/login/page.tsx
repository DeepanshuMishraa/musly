'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBrandGoogle } from "@tabler/icons-react";
import { signIn } from "next-auth/react"

const page = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Login through google</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={()=>signIn("google")}>
           <IconBrandGoogle className="mr-2" /> Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default page
