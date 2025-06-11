import { motion } from "framer-motion";

export function WelcomeAnimation() {
  return (
    <motion.div
      className="flex justify-start items-start h-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
          delay: 0.2
        }}
      >
        <motion.img
          src="/trekzaa-machajacy.png"
          alt="Trekzaa Welcome"
          className="h-48 w-auto"
          initial={{ rotate: -5 }}
          animate={{ rotate: 5 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.5,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  );
}