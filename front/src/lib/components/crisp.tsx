"use client"

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("73ae046e-c7d8-4a6e-8498-ad022bc4d78c"); 
  });

  return null;
}

export default CrispChat;