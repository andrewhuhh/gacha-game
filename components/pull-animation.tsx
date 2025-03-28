"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import Image from "next/image"

export default function PullAnimation({ currentPull = 1, totalPulls = 1 }) {
  return (
    <div className="relative h-64 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-pink-100 to-purple-100 mb-4">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-32 h-32 rounded-full bg-pink-200 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 1, times: [0, 0.8, 1] }}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-pink-300 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 1, delay: 0.2, times: [0, 0.8, 1] }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-pink-400 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.4, times: [0, 0.8, 1] }}
            >
              <motion.div
                className="text-white"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.5, 1], rotate: 360 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Sanrio silhouettes */}
      <motion.div
        className="absolute"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0, 0.3, 0] }}
        transition={{ duration: 2, repeat: 1 }}
      >
        <div className="relative w-16 h-16 opacity-30">
          <Image
            src="/images/hello-kitty.webp"
            alt="Character silhouette"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
      </motion.div>

      <motion.div
        className="absolute -translate-x-20 translate-y-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0, 0.3, 0] }}
        transition={{ duration: 2, delay: 0.3, repeat: 1 }}
      >
        <div className="relative w-16 h-16 opacity-30">
          <Image
            src="/images/kuromi.webp"
            alt="Character silhouette"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
      </motion.div>

      <motion.div
        className="absolute translate-x-20 translate-y-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0, 0.3, 0] }}
        transition={{ duration: 2, delay: 0.6, repeat: 1 }}
      >
        <div className="relative w-16 h-16 opacity-30">
          <Image
            src="/images/cinnamaroll.webp"
            alt="Character silhouette"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-pink-300"
          initial={{
            x: Math.random() * 300 - 150,
            y: Math.random() * 300 - 150,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div
        className="absolute bottom-4 left-0 right-0 text-center text-pink-600 font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {totalPulls > 1 ? (
          <>Pulling character {currentPull} of {totalPulls}...</>
        ) : (
          <>Pulling your character...</>
        )}
      </motion.div>
    </div>
  )
}

