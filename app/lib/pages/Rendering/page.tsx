'use client'
import dynamic from "next/dynamic";
const Map=dynamic(()=> import('../MapPage/page'), {
  ssr:false
});

export default Map;