"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Kanit } from "next/font/google";
import { ModeToggle } from "./ui/dark-mode-toggle";

const kanit = Kanit({ subsets: ["latin"], weight: ["600"] });

export const Appbar = () => {
  const session = useSession();
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-11/12 md:max-w-xl max-w-3xl p-3 font-semibold rounded-full backdrop-blur-2xl bg-white/70 dark:bg-black/10 z-50">
      <div className="flex gap-4 justify-between items-center p-2">
        <div>
          <Link href="/" className={`text-2xl ${kanit.className}`}>
            Musly
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {session.data ? (
            <Button onClick={() => signOut()}>Logout</Button>
          ) : (
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          )}

          <Link href="http://github.com/DeepanshuMishraa/musly">
            <Button>Github</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
