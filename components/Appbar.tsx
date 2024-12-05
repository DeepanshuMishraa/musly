"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Kanit } from "next/font/google";
import { ModeToggle } from "./ui/dark-mode-toggle";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

const kanit = Kanit({ subsets: ["latin"], weight: ["600"] });

export const Appbar = () => {
  const { data: session } = useSession();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-5xl p-2 font-semibold rounded-full backdrop-blur-md bg-white/80 dark:bg-gray-800/80 shadow-lg z-50"
    >
      <div className="flex justify-between items-center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/"
            className={`text-2xl ${kanit.className} text-primary dark:text-primary-foreground`}
          >
            Musly
          </Link>
        </motion.div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          {session ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => signOut()} variant="outline">
                Logout
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="http://github.com/DeepanshuMishraa/musly"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="icon">
                <Github className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};
