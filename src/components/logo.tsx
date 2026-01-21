import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>جمعية ابناء ضيف الله الخيرية Logo</title>
      <path d="M 50, 95 C 20, 95, 20, 50, 20, 50 C 20, 20, 50, 20, 50, 20" fill="none" stroke="#A98B71" strokeWidth="16" strokeLinecap="round" transform="translate(0, -10)" />
      <path d="M 50, 95 C 80, 95, 80, 50, 80, 50 C 80, 20, 50, 20, 50, 20" fill="none" stroke="#A98B71" strokeWidth="16" strokeLinecap="round" transform="translate(0, -10)" />

      <circle cx="50" cy="42" r="30" fill="#A5A38D"/>

      <path d="M60 22 L60 32 L78 32 L78 50 L60 50 L60 62 L70 62" stroke="#E3B74A" strokeWidth="5" fill="none" />
      <path d="M64 41 L78 41" stroke="#D1A45A" strokeWidth="5" fill="none" />
      <path d="M70 22 L70 32" stroke="#D1A45A" strokeWidth="5" fill="none" />
      <path d="M60 55 L50 65" stroke="#D1A45A" strokeWidth="5" fill="none" />
      <path d="M50 22 L60 32" stroke="#C2926B" strokeWidth="5" fill="none" />

      <path d="M 48,60 A 20,20 0,0,0 22,60 L 22,50 L 48,50 Z" fill="#B5654D"/>
      <path d="M 35,32 L 22,50 L 48,50 L 35,32 Z" fill="none" stroke="#B5654D" strokeWidth="2"/>
      <path d="M 35,32 L 28,50" fill="none" stroke="#B5654D" strokeWidth="1.5"/>
      <path d="M 35,32 L 42,50" fill="none" stroke="#B5654D" strokeWidth="1.5"/>
      <path d="M 35,28 l -2,4 l 4,0 Z" fill="#B5654D"/>
      <rect x="32" y="50" width="6" height="10" fill="#3D383A" rx="2"/>
    </svg>
  );
}

export const logoBase64 = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPHRpdGxlPuimgeinpuinmueJiOCdmeKYjSDgpqwg4Ka/4Ka44KeN4Ka5IOCmguCmsOCnh+CmsuCnhzwvdGl0bGU+CiAgICAgIDxwYXRoIGQ9Ik0gNTAsIDk1IEMgMjAsIDk1LCAyMCwgNTAsIDIwLCA1MCBDIDIwLCAyMCwgNTAsIDIwLCA1MCwgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0E5OEI3MSIgc3Ryb2tlV2lkdGg9IjE2IiBzdHJva2VMaW5lY2FwPSJyb3VuZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwgLTEwKSIgLz4KICAgICAgPHBhdGggZD0iTSA1MCwgOTUgQyA4MCwgOTUsIDgwLCA1MCwgODAsIDUwIEMgODAsIDIwLCA1MCwgMjAsIDUwLCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQTk4QjcxIiBzdHJva2VXaWR0aD0iMTYiIHN0cm9rZUxpbmVjYXA9InJvdW5kIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLCAtMTApIiAvPgoKICAgICAgPGNpcmNsZSBjeD0iNTAiIGN5PSI0MiIgcj0iMzAiIGZpbGw9IiNBNEE0OEIiLz4KICAgICAgPGNpcmNsZSBjeD0iNTAiIGN5PSI0MiIgcj0iMzAiIGZpbGw9IiNBNUEzOEQiLz4KCiAgICAgIDxwYXRoIGQ9Ik02MCAyMiBMNjAgMzIgTDc4IDMyIEw3OCA1MCBMNjAgNTAgTDYwIDYyIEw3MCA2MiIgc3Ryb2tlPSIjRTNCNzRBIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz4KICAgICAgPHBhdGggZD0iTTY0IDQxIEw3OCA0MSIgc3Ryb2tlPSIjRDFFNEFBIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz4KICAgICAgPHBhdGggZD0iTTcwIDIyIEw3MCAzMiIgc3Ryb2tlPSIjRDFFNEFBIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz4KICAgICAgPHBhdGggZD0iTTYwIDU1IEw1MCA2NSIgc3Ryb2tlPSIjRDFFNEFBIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz4KICAgICAgPHBhdGggZD0iTTUwIDIyIEw2MCAzMiIgc3Ryb2tlPSIjQzI5MjZCIiBzdHJva2VXaWR0aD0iNSIgZmlsbD0ibm9uZSIgLz4KCiAgICAgIDxwYXRoIGQ9Ik0gNDgsNjAgQSAyMCwyMCAwLDAsMCAyMiw2MCBMIDIyLDUwIEwgNDgsNTAgWiIgZmlsbD0iI0I1NjU0RCIvPgogICAgICA8cGF0aCBkPSJNIDM1LDMyIEwgMjIsNTAgTCA0OCw1MCBMIDM1LDMyIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0I1NjU0RCIgc3Ryb2tlV2lkdGg9IjIiLz4KICAgICAgPHBhdGggZD0iTSAzNSwzMiBMIDI4LDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiNCNTY1NDQiIHN0cm9rZVdpZHRoPSIxLjUiLz4KICAgICAgPHBhdGggZD0iTSAzNSwzMiBMIDQyLDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiNCNTY1NEQiIHN0cm9rZVdpZHRoPSIxLjUiLz4KICAgICAgPHBhdGggZD0iTSAzNSwyOCBsIC0yLDQgbCA0LDAgWiIgZmlsbD0iI0I1NjU0RCIvPgogICAgICA8cmVjdCB4PSIzMiIgeT0iNTAiIHdpZHRoPSI2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjM0QzODNBIiByeD0iMiIvPgoKICAgIDwvc3ZnPg==";

