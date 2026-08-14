'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';
export default function Reveal({children, className='', delay=0}:{children:ReactNode;className?:string;delay?:number}){
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce?false:{opacity:0,y:28}} whileInView={reduce?{}:{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:.75,delay,ease:[.22,1,.36,1]}}>{children}</motion.div>
}
